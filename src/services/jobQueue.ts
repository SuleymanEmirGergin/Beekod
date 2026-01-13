import crypto from "crypto";
import { query } from "../db.js";
import { refreshCaches, syncAllMarketplaceListings } from "./operationsService.js";
import { performLiveUpdate, LiveUpdatePayload } from "./marketplaceLiveRetry.js";
import { performPublish } from "./marketplace/marketplacePublishService.js";

export type JobType = 
  | "cache.refresh" 
  | "marketplace.sync_all" 
  | "marketplace.live_update" 
  | "marketplace.publish" 
  | "ai.inventory_audit" 
  | "ai.auto_pricing"
  | "ai.health_check"
  | "ai.price_comparison";
export type JobStatus = "queued" | "running" | "done" | "failed";

export type JobRecord = {
  id: string;
  type: JobType;
  status: JobStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  attempts: number;
  maxAttempts: number;
  nextRunAt?: string | null;
  result?: unknown;
  error?: string | null;
};

export type DeadLetterRecord = {
  id: number;
  jobId: string;
  type: JobType;
  payload?: unknown;
  error?: string | null;
  attempts: number;
  maxAttempts: number;
  failedAt: string;
};

export type JobStats = {
  byStatus: Record<JobStatus, number>;
  total: number;
  deadLetters: number;
};

type JobRow = {
  id: string;
  type: JobType;
  status: JobStatus;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  attempts: number;
  max_attempts: number;
  next_run_at: string | null;
  payload: unknown;
  result: unknown;
  error: string | null;
};

let runnerActive = false;
let workerStarted = false;
const WORKER_ID = crypto.randomUUID();

const MAX_JOBS = 200;
const MAX_ATTEMPTS = Math.max(1, Number(process.env.JOB_MAX_ATTEMPTS ?? 3));
const RETRY_BASE_SECONDS = Math.max(1, Number(process.env.JOB_RETRY_BASE_SECONDS ?? 10));
const RETRY_FACTOR = Math.max(1, Number(process.env.JOB_RETRY_FACTOR ?? 2));
const RETRY_MAX_SECONDS = Math.max(1, Number(process.env.JOB_RETRY_MAX_SECONDS ?? 300));
const RETRY_JITTER = Math.max(0, Number(process.env.JOB_RETRY_JITTER ?? 0));
const POLL_INTERVAL_MS = Math.max(1000, Number(process.env.JOB_POLL_INTERVAL_MS ?? 5000));
const STUCK_CHECK_INTERVAL_MS = Math.max(10000, Number(process.env.JOB_STUCK_CHECK_INTERVAL_MS ?? 60000));
const rawStuckMinutes = Number(process.env.JOB_STUCK_MINUTES ?? 15);
const STUCK_MINUTES = Number.isFinite(rawStuckMinutes) ? rawStuckMinutes : 15;
const STUCK_ENABLED = STUCK_MINUTES > 0;
const STUCK_RETRY_ENABLED = (process.env.JOB_STUCK_RETRY_ENABLED ?? "true").toLowerCase() !== "false";

type StuckJobRow = {
  id: string;
  type: JobType;
  payload: unknown;
  attempts: number;
  max_attempts: number;
};

type DeadLetterRow = {
  id: number;
  job_id: string;
  type: JobType;
  payload: unknown;
  error: string | null;
  attempts: number;
  max_attempts: number;
  failed_at: string;
};

function computeBackoffSeconds(attempt: number) {
  const normalizedAttempt = Math.max(1, attempt);
  const exp = Math.pow(RETRY_FACTOR, Math.max(0, normalizedAttempt - 1));
  const seconds = RETRY_BASE_SECONDS * exp;
  const capped = Math.min(Math.max(1, Math.trunc(seconds)), RETRY_MAX_SECONDS);
  if (RETRY_JITTER <= 0) {
    return capped;
  }
  const jitter = Math.min(RETRY_JITTER, 1);
  const delta = capped * jitter;
  const adjusted = capped - delta + Math.random() * delta * 2;
  return Math.max(1, Math.trunc(adjusted));
}

function parseJson(value: unknown) {
  if (!value) {
    return undefined;
  }
  if (typeof value !== "string") {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function serializeJson(value: unknown) {
  if (value == null) {
    return null;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ error: "json_serialize_failed" });
  }
}

function mapJob(row: JobRow): JobRecord {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    createdAt: row.created_at,
    startedAt: row.started_at ?? undefined,
    finishedAt: row.finished_at ?? undefined,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    nextRunAt: row.next_run_at,
    result: parseJson(row.result),
    error: row.error,
  };
}

function mapDeadLetter(row: DeadLetterRow): DeadLetterRecord {
  return {
    id: row.id,
    jobId: row.job_id,
    type: row.type,
    payload: parseJson(row.payload),
    error: row.error,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    failedAt: row.failed_at,
  };
}

async function recordDeadLetter(job: JobRow, error: string, attempt: number) {
  await query(
    "INSERT INTO job_dead_letters (job_id, type, payload, error, attempts, max_attempts) VALUES (?, ?, ?, ?, ?, ?)",
    [job.id, job.type, serializeJson(job.payload), error, attempt, job.max_attempts],
  );
}

async function claimNextJob(): Promise<JobRow | null> {
  const result = await query<{ affectedRows?: number }>(
    `UPDATE jobs
     SET status = 'running', started_at = NOW(), updated_at = NOW(), worker_id = ?
     WHERE id = (
       SELECT id FROM (
         SELECT id FROM jobs
         WHERE status = 'queued' AND (next_run_at IS NULL OR next_run_at <= NOW())
         ORDER BY created_at ASC
         LIMIT 1
       ) AS candidate
     ) AND status = 'queued'`,
    [WORKER_ID],
  );
  const affectedRows = result?.affectedRows ?? 0;
  if (affectedRows <= 0) {
    return null;
  }

  const rows = await query<JobRow[]>(
    `SELECT id, type, status, created_at, started_at, finished_at, attempts, max_attempts, next_run_at, payload, result, error
     FROM jobs
     WHERE status = 'running' AND worker_id = ?
     ORDER BY started_at DESC
     LIMIT 1`,
    [WORKER_ID],
  );
  return rows[0] ?? null;
}

async function updateJobSuccess(jobId: string, result: unknown) {
  await query(
    "UPDATE jobs SET status = 'done', result = ?, error = NULL, finished_at = NOW(), updated_at = NOW() WHERE id = ?",
    [serializeJson(result), jobId],
  );
}

async function updateJobFailure(job: JobRow, error: string) {
  const attempt = job.attempts + 1;
  if (attempt >= job.max_attempts) {
    await recordDeadLetter(job, error, attempt);
    await query(
      "UPDATE jobs SET status = 'failed', attempts = ?, error = ?, finished_at = NOW(), updated_at = NOW() WHERE id = ?",
      [attempt, error, job.id],
    );
    return;
  }

  const delaySeconds = computeBackoffSeconds(attempt);
  await query(
    "UPDATE jobs SET status = 'queued', attempts = ?, error = ?, next_run_at = DATE_ADD(NOW(), INTERVAL ? SECOND), updated_at = NOW() WHERE id = ?",
    [attempt, error, delaySeconds, job.id],
  );
}

async function runJob(job: JobRow) {
  try {
    let result: unknown = null;
    if (job.type === "cache.refresh") {
      result = refreshCaches();
    } else if (job.type === "marketplace.sync_all") {
      result = await syncAllMarketplaceListings();
    } else if (job.type === "marketplace.live_update") {
      const payload = parseJson(job.payload) as LiveUpdatePayload | undefined;
      if (!payload || typeof payload !== "object") {
        throw new Error("live_update_payload_required");
      }
      const liveUpdateResult = await performLiveUpdate(payload);
      if (!liveUpdateResult.ok) {
        throw new Error(liveUpdateResult.error.message || "live_update_failed");
      }
      const liveResult = liveUpdateResult.value;
      result = liveResult;
      if (liveResult.status !== "ok") {
        throw new Error(liveResult.message || "live_update_failed");
      }
    } else if (job.type === "marketplace.publish") {
      const payloadRaw = parseJson(job.payload) as { productId: string | number; marketplace: string; userId?: string | number } | undefined;
      if (!payloadRaw || !payloadRaw.productId || !payloadRaw.marketplace) {
        throw new Error("publish_payload_invalid");
      }
      const publishResult = await performPublish({
        productId: Number(payloadRaw.productId),
        marketplace: payloadRaw.marketplace,
        userId: Number(payloadRaw.userId ?? 0)
      });
      result = publishResult;
      if (publishResult.status === "failed") {
        throw new Error(publishResult.message || "publish_failed");
      }
    } else if (job.type === "ai.inventory_audit") {
      const { inventoryAuditService } = await import("./ai/inventoryAuditService.js");
      const { getUserPreferences } = await import("./userPreferenceService.js");
      
      const prefs = getUserPreferences("admin"); // Default to admin for background tasks
      if (prefs.enable_ai_stock_notifications === false) {
        return { skipped: "notifications_disabled" };
      }

      const auditRes = await inventoryAuditService.detectOverSellingRisks();
      if (!auditRes.ok) throw auditRes.error;
      
      // If risks found, they are already logged, but we could notify active users via socket/push here
      result = { riskCount: auditRes.value.length, risks: auditRes.value };
    } else if (job.type === "ai.auto_pricing") {
      const { pricingIntelligenceService } = await import("./ai/pricingIntelligenceService.js");
      const { getUserPreferences } = await import("./userPreferenceService.js");
      const { getMarketplaceProvider } = await import("./marketplace/index.js");
      const { query } = await import("../db.js");

      const prefs = getUserPreferences("admin");
      if (!prefs.enable_ai_auto_pricing) {
        return { skipped: "auto_pricing_disabled" };
      }

      // Process a few high-priority products for background update
      const products = await query<any[]>("SELECT barcode, name FROM products ORDER BY updated_at ASC LIMIT 2");
      const updates = [];

      for (const p of products) {
        const analysisRes = await pricingIntelligenceService.analyzeBuyBoxStatus(p.barcode);
        if (analysisRes.ok) {
          const analysis = analysisRes.value;
          if (analysis.suggestedPrice !== analysis.myPrice && analysis.suggestedPrice > 0) {
             // Perform the update on all configured marketplaces
             // In a real scenario, we might want to be more selective
             const marketplaces = ["Trendyol", "Hepsiburada"]; // Example
             for (const mp of marketplaces) {
               const provider = getMarketplaceProvider(mp);
               if (provider && provider.isConfigured()) {
                 await provider.updateListing({ barcode: p.barcode, price: analysis.suggestedPrice });
                 updates.push({ barcode: p.barcode, marketplace: mp, oldPrice: analysis.myPrice, newPrice: analysis.suggestedPrice });
               }
             }
          }
        }
      }
      result = { updatesProcessed: updates.length, details: updates };
    } else if (job.type === "ai.health_check") {
      const { healthCheckService } = await import("./marketplace/healthCheckService.js");
      const healthResults = await healthCheckService.runAllChecks();
      result = { summary: "Health check completed", results: healthResults };
    } else if (job.type === "ai.price_comparison") {
      const { runPriceComparison } = await import("./marketplace/priceComparisonService.js");
      const comparisonResult = await runPriceComparison();
      result = { summary: "Price comparison completed", ...comparisonResult };
    }
    await updateJobSuccess(job.id, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateJobFailure(job, message);
  }
}

async function processQueue() {
  if (runnerActive) {
    return;
  }
  runnerActive = true;
  try {
    while (true) {
      const next = await claimNextJob();
      if (!next) {
        break;
      }
      await runJob(next);
    }
  } finally {
    runnerActive = false;
  }
}

let cleanupActive = false;
async function cleanupStuckJobs() {
  if (!STUCK_ENABLED || cleanupActive) {
    return;
  }
  cleanupActive = true;
  try {
    const rows = await query<StuckJobRow[]>(
      `SELECT id, type, payload, attempts, max_attempts
       FROM jobs
       WHERE status = 'running'
         AND started_at IS NOT NULL
         AND started_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
      [STUCK_MINUTES],
    );
    for (const job of rows) {
      const attempt = job.attempts + 1;
      const error = "stuck_timeout";
      if (!STUCK_RETRY_ENABLED || attempt >= job.max_attempts) {
        await recordDeadLetter(
          {
            id: job.id,
            type: job.type,
            status: "running",
            created_at: "",
            started_at: null,
            finished_at: null,
            attempts: job.attempts,
            max_attempts: job.max_attempts,
            next_run_at: null,
            payload: job.payload,
            result: null,
            error: null,
          },
          error,
          attempt,
        );
        await query(
          "UPDATE jobs SET status = 'failed', attempts = ?, error = ?, finished_at = NOW(), worker_id = NULL, updated_at = NOW() WHERE id = ?",
          [attempt, error, job.id],
        );
        continue;
      }
      const delaySeconds = computeBackoffSeconds(attempt);
      await query(
        "UPDATE jobs SET status = 'queued', attempts = ?, error = ?, next_run_at = DATE_ADD(NOW(), INTERVAL ? SECOND), started_at = NULL, finished_at = NULL, worker_id = NULL, updated_at = NOW() WHERE id = ?",
        [attempt, error, delaySeconds, job.id],
      );
    }
  } finally {
    cleanupActive = false;
  }
}

export async function enqueueJob(type: JobType, payload?: unknown) {
  const id = crypto.randomUUID();
  const payloadJson = serializeJson(payload);
  await query(
    "INSERT INTO jobs (id, type, status, payload, attempts, max_attempts, next_run_at) VALUES (?, ?, 'queued', ?, 0, ?, NOW())",
    [id, type, payloadJson, MAX_ATTEMPTS],
  );
  void processQueue();
  return getJobById(id);
}

export async function enqueueLiveUpdateRetry(payload: LiveUpdatePayload) {
  return enqueueJob("marketplace.live_update", payload);
}

export async function getJobById(id: string) {
  const rows = await query<JobRow[]>(
    `SELECT id, type, status, created_at, started_at, finished_at, attempts, max_attempts, next_run_at, payload, result, error
     FROM jobs WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ? mapJob(rows[0]) : null;
}

export async function getJobs(limit = 50) {
  const safeLimit = Math.max(1, Math.min(limit, MAX_JOBS));
  const rows = await query<JobRow[]>(
    `SELECT id, type, status, created_at, started_at, finished_at, attempts, max_attempts, next_run_at, payload, result, error
     FROM jobs ORDER BY created_at DESC LIMIT ?`,
    [safeLimit],
  );
  return rows.map(mapJob);
}

export async function getDeadLetters(limit = 50) {
  const safeLimit = Math.max(1, Math.min(limit, MAX_JOBS));
  const rows = await query<DeadLetterRow[]>(
    `SELECT id, job_id, type, payload, error, attempts, max_attempts, failed_at
     FROM job_dead_letters
     ORDER BY failed_at DESC
     LIMIT ?`,
    [safeLimit],
  );
  return rows.map(mapDeadLetter);
}

export async function getJobStats(): Promise<JobStats> {
  const rows = await query<Array<{ status: JobStatus; count: number }>>(
    "SELECT status, COUNT(*) as count FROM jobs GROUP BY status",
  );
  const byStatus: Record<JobStatus, number> = {
    queued: 0,
    running: 0,
    done: 0,
    failed: 0,
  };
  for (const row of rows) {
    if (row.status && row.status in byStatus) {
      byStatus[row.status] = Number(row.count) || 0;
    }
  }
  const deadRows = await query<Array<{ count: number }>>("SELECT COUNT(*) as count FROM job_dead_letters");
  const deadLetters = Number(deadRows[0]?.count ?? 0) || 0;
  const total = Object.values(byStatus).reduce((sum, value) => sum + value, 0);
  return { byStatus, total, deadLetters };
}

function startWorker() {
  if (workerStarted) {
    return;
  }
  workerStarted = true;
  void processQueue();
  setInterval(() => void processQueue(), POLL_INTERVAL_MS);
  if (STUCK_ENABLED) {
    void cleanupStuckJobs();
    setInterval(() => void cleanupStuckJobs(), STUCK_CHECK_INTERVAL_MS);
  }
}

export function startScheduler() {
  startWorker();
  const enabled = (process.env.SCHEDULER_ENABLED ?? "false").toLowerCase() === "true";
  if (!enabled) {
    return;
  }

  const cacheMinutes = Number(process.env.SCHEDULER_CACHE_MINUTES ?? 0);
  const syncMinutes = Number(process.env.SCHEDULER_SYNC_MINUTES ?? 0);
  const aiAuditMinutes = Number(process.env.SCHEDULER_AI_AUDIT_MINUTES ?? 60); // Default 1 hour
  const aiPricingMinutes = Number(process.env.SCHEDULER_AI_PRICING_MINUTES ?? 0);
  const aiHealthMinutes = Number(process.env.SCHEDULER_AI_HEALTH_MINUTES ?? 720); // Default 12 hours

  if (Number.isFinite(cacheMinutes) && cacheMinutes > 0) {
    const ms = cacheMinutes * 60 * 1000;
    setInterval(() => void enqueueJob("cache.refresh"), ms);
  }

  if (Number.isFinite(syncMinutes) && syncMinutes > 0) {
    const ms = syncMinutes * 60 * 1000;
    setInterval(() => void enqueueJob("marketplace.sync_all"), ms);
  }

  if (Number.isFinite(aiAuditMinutes) && aiAuditMinutes > 0) {
    const ms = aiAuditMinutes * 60 * 1000;
    setInterval(() => void enqueueJob("ai.inventory_audit"), ms);
  }

  if (Number.isFinite(aiPricingMinutes) && aiPricingMinutes > 0) {
    const ms = aiPricingMinutes * 60 * 1000;
    setInterval(() => void enqueueJob("ai.auto_pricing"), ms);
  }

  if (Number.isFinite(aiHealthMinutes) && aiHealthMinutes > 0) {
    const ms = aiHealthMinutes * 60 * 1000;
    setInterval(() => void enqueueJob("ai.health_check"), ms);
  }

  // Price comparison job - every 6 hours by default
  const aiPriceComparisonMinutes = Number(process.env.SCHEDULER_PRICE_COMPARISON_MINUTES ?? 360);
  if (Number.isFinite(aiPriceComparisonMinutes) && aiPriceComparisonMinutes > 0) {
    const ms = aiPriceComparisonMinutes * 60 * 1000;
    setInterval(() => void enqueueJob("ai.price_comparison"), ms);
  }
}
