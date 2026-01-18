import { queue, addJob, initRepeatedJobs } from "./queue/index.js";
import { JobType, JobStatus } from "./queue/jobProcessor.js";

// Re-export types
export type { JobType, JobStatus };

export async function enqueueJob(type: JobType, payload?: unknown) {
  return addJob(type, payload);
}

export async function enqueueLiveUpdateRetry(payload: any) {
  return addJob("marketplace.live_update", payload, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 }
  });
}

// Map BullMQ Job to legacy JobRecord format if needed
function mapBullJob(job: any) {
  if (!job) return null;
  return {
    id: job.id,
    type: job.data.type,
    status: job.isCompleted() ? 'done' : job.isFailed() ? 'failed' : 'queued',
    createdAt: new Date(job.timestamp).toISOString(),
    startedAt: job.processedOn ? new Date(job.processedOn).toISOString() : undefined,
    finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
    result: job.returnvalue,
    error: job.failedReason,
    attempts: job.attemptsMade,
  };
}

export async function getJobById(id: string) {
  const job = await queue.getJob(id);
  return mapBullJob(job);
}

export async function getJobs(limit = 50) {
  const jobs = await queue.getJobs(['active', 'wait', 'completed', 'failed'], 0, limit - 1);
  return jobs.map(mapBullJob);
}

export async function getDeadLetters(limit = 50) {
  const jobs = await queue.getJobs(['failed'], 0, limit - 1);
  return jobs.map(mapBullJob);
}

export async function getJobStats() {
  const counts = await queue.getJobCounts();
  return {
    byStatus: {
      queued: counts.wait + counts.paused,
      running: counts.active,
      done: counts.completed,
      failed: counts.failed,
    },
    total: counts.wait + counts.active + counts.completed + counts.failed,
    deadLetters: counts.failed,
  };
}

export function startScheduler() {
  // Initialize repeated jobs on startup
  initRepeatedJobs().catch(err => console.error("Scheduler init failed", err));
}

// Deprecated functions (No-ops to prevent crash if still called)
export async function claimNextJob() { return null; }
export async function processQueue() {}
export async function cleanupStuckJobs() {}
