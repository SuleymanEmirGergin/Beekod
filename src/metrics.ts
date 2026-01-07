type RequestRecord = {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  at: string;
};

type OutboundRecord = {
  target: string;
  statusCode: number;
  durationMs: number;
  at: string;
};

type MetricsSnapshot = {
  startedAt: string;
  uptimeSec: number;
  requests: {
    total: number;
    byMethod: Record<string, number>;
    byStatus: Record<string, number>;
    avgMs: number;
    maxMs: number;
  };
  errors: RequestRecord[];
  outbound: {
    total: number;
    byTarget: Record<string, number>;
    byStatus: Record<string, number>;
    avgMs: number;
    maxMs: number;
    errors: OutboundRecord[];
  };
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  processIssues: {
    total: number;
    recent: ProcessIssueRecord[];
  };
};

type ProcessIssueRecord = {
  type: string;
  name?: string;
  message: string;
  stack?: string;
  requestId?: string;
  at: string;
};

const startedAt = new Date();
let totalRequests = 0;
let totalDurationMs = 0;
let maxDurationMs = 0;
const byMethod: Record<string, number> = {};
const byStatus: Record<string, number> = {};
const errorWindow: RequestRecord[] = [];
const MAX_ERRORS = 20;

let outboundTotal = 0;
let outboundDurationMs = 0;
let outboundMaxMs = 0;
const outboundByTarget: Record<string, number> = {};
const outboundByStatus: Record<string, number> = {};
const outboundErrors: OutboundRecord[] = [];
const MAX_OUTBOUND_ERRORS = 20;

const processIssues: ProcessIssueRecord[] = [];
const MAX_PROCESS_ISSUES = 20;

export function recordRequest(input: { method: string; path: string; statusCode: number; durationMs: number }) {
  totalRequests += 1;
  totalDurationMs += input.durationMs;
  if (input.durationMs > maxDurationMs) {
    maxDurationMs = input.durationMs;
  }

  const methodKey = input.method.toUpperCase();
  byMethod[methodKey] = (byMethod[methodKey] ?? 0) + 1;

  const statusKey = String(input.statusCode);
  byStatus[statusKey] = (byStatus[statusKey] ?? 0) + 1;

  if (input.statusCode >= 500) {
    errorWindow.unshift({
      method: methodKey,
      path: input.path,
      statusCode: input.statusCode,
      durationMs: input.durationMs,
      at: new Date().toISOString(),
    });
    if (errorWindow.length > MAX_ERRORS) {
      errorWindow.pop();
    }
  }
}

export function recordOutboundRequest(input: { target: string; statusCode: number; durationMs: number }) {
  outboundTotal += 1;
  outboundDurationMs += input.durationMs;
  if (input.durationMs > outboundMaxMs) {
    outboundMaxMs = input.durationMs;
  }

  const targetKey = input.target || "unknown";
  outboundByTarget[targetKey] = (outboundByTarget[targetKey] ?? 0) + 1;

  const statusKey = String(input.statusCode);
  outboundByStatus[statusKey] = (outboundByStatus[statusKey] ?? 0) + 1;

  if (input.statusCode === 0 || input.statusCode >= 500) {
    outboundErrors.unshift({
      target: targetKey,
      statusCode: input.statusCode,
      durationMs: input.durationMs,
      at: new Date().toISOString(),
    });
    if (outboundErrors.length > MAX_OUTBOUND_ERRORS) {
      outboundErrors.pop();
    }
  }
}

export function recordProcessIssue(input: Omit<ProcessIssueRecord, "at">) {
  processIssues.unshift({ ...input, at: new Date().toISOString() });
  if (processIssues.length > MAX_PROCESS_ISSUES) {
    processIssues.pop();
  }
}

export function getMetricsSnapshot(): MetricsSnapshot {
  const mem = process.memoryUsage();
  const avgMs = totalRequests ? Math.round((totalDurationMs / totalRequests) * 100) / 100 : 0;
  const outboundAvgMs = outboundTotal ? Math.round((outboundDurationMs / outboundTotal) * 100) / 100 : 0;
  return {
    startedAt: startedAt.toISOString(),
    uptimeSec: Math.round(process.uptime()),
    requests: {
      total: totalRequests,
      byMethod: { ...byMethod },
      byStatus: { ...byStatus },
      avgMs,
      maxMs: Math.round(maxDurationMs),
    },
    errors: [...errorWindow],
    outbound: {
      total: outboundTotal,
      byTarget: { ...outboundByTarget },
      byStatus: { ...outboundByStatus },
      avgMs: outboundAvgMs,
      maxMs: Math.round(outboundMaxMs),
      errors: [...outboundErrors],
    },
    memory: {
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
    },
    processIssues: {
      total: processIssues.length,
      recent: [...processIssues],
    },
  };
}
