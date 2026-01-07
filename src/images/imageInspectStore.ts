import { query } from "../db.js";
import { logger } from "../logger.js";
import type { InspectReport } from "./imageInspect.js";

type InspectInsert = {
  imageId?: number | null;
  barcode?: string | null;
  marketplace?: string | null;
  profile?: string | null;
  source?: string | null;
  report: InspectReport;
  requestId?: string;
};

export async function insertImageInspectReport(input: InspectInsert) {
  try {
    const report = input.report;
    const profile = input.profile ?? report.profile ?? null;
    const marketplace = input.marketplace ?? report.marketplace ?? null;
    const barcode = input.barcode ?? null;
    const source = input.source ?? null;
    const score = Number.isFinite(report.score) ? Math.trunc(report.score) : null;
    const issueCount = Array.isArray(report.issues) ? report.issues.length : 0;
    const warnCount = Number.isFinite(report.warnCount) ? report.warnCount : 0;
    const failCount = Number.isFinite(report.failCount) ? report.failCount : 0;
    const summaryEn = report.summaryEn ?? null;
    const summaryTr = report.summaryTr ?? null;
    const reportJson = JSON.stringify(report);

    await query(
      `INSERT INTO image_inspects (
        image_id,
        barcode,
        marketplace,
        profile,
        source,
        score,
        issue_count,
        warn_count,
        fail_count,
        summary_en,
        summary_tr,
        report_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.imageId ?? null,
        barcode,
        marketplace,
        profile,
        source,
        score,
        issueCount,
        warnCount,
        failCount,
        summaryEn,
        summaryTr,
        reportJson,
      ],
    );
  } catch (error) {
    logger.warn("image.inspect_store_failed", { requestId: input.requestId, err: error });
  }
}

type InspectRow = {
  id: number;
  image_id: number | null;
  barcode: string | null;
  marketplace: string | null;
  profile: string | null;
  source: string | null;
  score: number | null;
  issue_count: number | null;
  warn_count: number | null;
  fail_count: number | null;
  summary_en: string | null;
  summary_tr: string | null;
  report_json: string | null;
  created_at: string;
};

export type ImageInspectRecord = {
  id: number;
  imageId: number | null;
  barcode: string | null;
  marketplace: string | null;
  profile: string | null;
  source: string | null;
  score: number | null;
  issueCount: number | null;
  warnCount: number | null;
  failCount: number | null;
  summaryEn: string | null;
  summaryTr: string | null;
  report?: InspectReport | null;
  createdAt: string;
};

function parseReportJson(value: string | null) {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as InspectReport;
  } catch {
    return null;
  }
}

function clampLimit(value: number | undefined | null, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  const safe = Math.max(1, Math.trunc(value as number));
  return Math.min(safe, 100);
}

export async function listImageInspectReports(input: {
  barcode?: string | null;
  profile?: string | null;
  marketplace?: string | null;
  source?: string | null;
  limit?: number;
  includeReport?: boolean;
}): Promise<ImageInspectRecord[]> {
  const conditions: string[] = [];
  const params: Array<string | number> = [];
  if (input.barcode) {
    conditions.push("barcode = ?");
    params.push(input.barcode);
  }
  if (input.profile) {
    conditions.push("profile = ?");
    params.push(input.profile);
  }
  if (input.marketplace) {
    conditions.push("marketplace = ?");
    params.push(input.marketplace);
  }
  if (input.source) {
    conditions.push("source = ?");
    params.push(input.source);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = clampLimit(input.limit, 20);
  params.push(limit);

  const rows = await query<InspectRow[]>(
    `SELECT id, image_id, barcode, marketplace, profile, source, score, issue_count, warn_count, fail_count, summary_en, summary_tr, report_json, created_at
     FROM image_inspects ${where}
     ORDER BY created_at DESC, id DESC
     LIMIT ?`,
    params,
  );

  return rows.map((row) => ({
    id: row.id,
    imageId: row.image_id,
    barcode: row.barcode,
    marketplace: row.marketplace,
    profile: row.profile,
    source: row.source,
    score: row.score,
    issueCount: row.issue_count,
    warnCount: row.warn_count,
    failCount: row.fail_count,
    summaryEn: row.summary_en,
    summaryTr: row.summary_tr,
    report: input.includeReport ? parseReportJson(row.report_json) : undefined,
    createdAt: row.created_at,
  }));
}

export type ImageInspectSummary = {
  total: number;
  avgScore: number;
  failTotal: number;
  warnTotal: number;
  failRate: number;
  warnRate: number;
  lastIssueDay: string | null;
  lastOkDay: string | null;
  days: number | null;
};

function formatDay(value: string) {
  if (!value) {
    return value;
  }
  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : value;
}

export type ImageInspectTrend = {
  day: string;
  total: number;
  avgScore: number;
  failTotal: number;
  warnTotal: number;
  failRate: number;
  warnRate: number;
};

function clampDays(value: number | undefined | null, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  const safe = Math.max(1, Math.trunc(value as number));
  return Math.min(safe, 31);
}

function buildInspectWhere(input: {
  barcode?: string | null;
  profile?: string | null;
  marketplace?: string | null;
  source?: string | null;
  days?: number | null;
}) {
  const conditions: string[] = [];
  const params: Array<string | number> = [];
  if (input.barcode) {
    conditions.push("barcode = ?");
    params.push(input.barcode);
  }
  if (input.profile) {
    conditions.push("profile = ?");
    params.push(input.profile);
  }
  if (input.marketplace) {
    conditions.push("marketplace = ?");
    params.push(input.marketplace);
  }
  if (input.source) {
    conditions.push("source = ?");
    params.push(input.source);
  }
  if (input.days) {
    conditions.push("created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)");
    params.push(input.days);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return { where, params };
}

export async function getImageInspectSummary(input: {
  barcode?: string | null;
  profile?: string | null;
  marketplace?: string | null;
  source?: string | null;
  days?: number | null;
}): Promise<ImageInspectSummary> {
  const days = input.days ? clampDays(input.days, 7) : null;
  const { where, params } = buildInspectWhere({ ...input, days });
  const rows = await query<
    Array<{
      total: number;
      avg_score: number | null;
      fail_total: number;
      warn_total: number;
      last_issue_day: string | null;
      last_ok_day: string | null;
    }>
  >(
    `SELECT COUNT(*) as total,
            AVG(score) as avg_score,
            SUM(CASE WHEN fail_count > 0 THEN 1 ELSE 0 END) as fail_total,
            SUM(CASE WHEN warn_count > 0 THEN 1 ELSE 0 END) as warn_total,
            MAX(CASE WHEN COALESCE(issue_count, 0) > 0 THEN DATE(created_at) ELSE NULL END) as last_issue_day,
            MAX(CASE WHEN COALESCE(issue_count, 0) = 0 THEN DATE(created_at) ELSE NULL END) as last_ok_day
     FROM image_inspects ${where}`,
    params,
  );
  const row = rows[0] ?? {
    total: 0,
    avg_score: 0,
    fail_total: 0,
    warn_total: 0,
    last_issue_day: null,
    last_ok_day: null,
  };
  const total = Number(row.total ?? 0) || 0;
  const avgScore = row.avg_score == null ? 0 : Math.round(Number(row.avg_score));
  const failTotal = Number(row.fail_total ?? 0) || 0;
  const warnTotal = Number(row.warn_total ?? 0) || 0;
  const failRate = total ? Math.round((failTotal / total) * 100) : 0;
  const warnRate = total ? Math.round((warnTotal / total) * 100) : 0;
  const lastIssueDay = row.last_issue_day ? formatDay(String(row.last_issue_day)) : null;
  const lastOkDay = row.last_ok_day ? formatDay(String(row.last_ok_day)) : null;
  return { total, avgScore, failTotal, warnTotal, failRate, warnRate, lastIssueDay, lastOkDay, days };
}

export async function getImageInspectTrends(input: {
  barcode?: string | null;
  profile?: string | null;
  marketplace?: string | null;
  source?: string | null;
  days?: number | null;
  fillDays?: boolean;
}): Promise<ImageInspectTrend[]> {
  const days = clampDays(input.days, 7);
  const fillDays = input.fillDays === true;
  const { where, params } = buildInspectWhere({ ...input, days });
  const rows = await query<
    Array<{ day: string; total: number; avg_score: number | null; fail_total: number; warn_total: number }>
  >(
    `SELECT DATE(created_at) as day,
            COUNT(*) as total,
            AVG(score) as avg_score,
            SUM(CASE WHEN fail_count > 0 THEN 1 ELSE 0 END) as fail_total,
            SUM(CASE WHEN warn_count > 0 THEN 1 ELSE 0 END) as warn_total
     FROM image_inspects ${where}
     GROUP BY DATE(created_at)
     ORDER BY day ASC`,
    params,
  );
  const mapped = rows.map((row) => {
    const total = Number(row.total ?? 0) || 0;
    const avgScore = row.avg_score == null ? 0 : Math.round(Number(row.avg_score));
    const failTotal = Number(row.fail_total ?? 0) || 0;
    const warnTotal = Number(row.warn_total ?? 0) || 0;
    const failRate = total ? Math.round((failTotal / total) * 100) : 0;
    const warnRate = total ? Math.round((warnTotal / total) * 100) : 0;
    return {
      day: formatDay(String(row.day)),
      total,
      avgScore,
      failTotal,
      warnTotal,
      failRate,
      warnRate,
    };
  });

  if (!fillDays || days <= 1) {
    return mapped;
  }

  const byDay = new Map(mapped.map((entry) => [entry.day, entry]));
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (days - 1));
  const filled: ImageInspectTrend[] = [];
  for (let i = 0; i < days; i += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const iso = date.toISOString().slice(0, 10);
    const existing = byDay.get(iso);
    if (existing) {
      filled.push(existing);
    } else {
      filled.push({
        day: iso,
        total: 0,
        avgScore: 0,
        failTotal: 0,
        warnTotal: 0,
        failRate: 0,
        warnRate: 0,
      });
    }
  }

  return filled;
}
