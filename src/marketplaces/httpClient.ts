import { logger } from "../logger.js";
import { recordOutboundRequest } from "../metrics.js";
import { getRequestId } from "../middleware/requestContext.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpResponse<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  raw: string;
  headers: Record<string, string>;
};

export type RateLimitOptions = {
  key: string;
  maxRequests: number;
  windowMs: number;
};

export type CircuitBreakerOptions = {
  key: string;
  failureThreshold?: number;
  openMs?: number;
  failureStatuses?: number[];
};

export type RequestMetricsOptions = {
  target?: string;
  provider?: string;
  operation?: string;
};

export type HttpRequestOptions = {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retry?: RetryOptions;
  rateLimit?: RateLimitOptions;
  circuitBreaker?: CircuitBreakerOptions;
  metrics?: RequestMetricsOptions;
  traceId?: string;
};

export type RetryOptions = {
  attempts?: number;
  delayMs?: number;
  backoffFactor?: number;
  retryOnStatuses?: number[];
};

export function basicAuthHeader(key: string, secret: string) {
  const token = Buffer.from(`${key}:${secret}`).toString("base64");
  return `Basic ${token}`;
}

export function bearerAuthHeader(token: string) {
  return `Bearer ${token}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(status: number, retryOn: number[]) {
  return retryOn.includes(status);
}

type CircuitState = {
  state: "closed" | "open" | "half";
  failures: number;
  openedAt?: number;
};

const rateBuckets = new Map<string, number[]>();
const circuitBreakers = new Map<string, CircuitState>();

function normalizeHeaderKey(key: string) {
  return key.trim().toLowerCase();
}

function hasHeader(headers: Record<string, string>, key: string) {
  const target = normalizeHeaderKey(key);
  return Object.keys(headers).some((header) => normalizeHeaderKey(header) === target);
}

async function applyRateLimit(rate?: RateLimitOptions) {
  if (!rate || rate.maxRequests <= 0 || rate.windowMs <= 0) {
    return;
  }
  const now = Date.now();
  const bucket = rateBuckets.get(rate.key) ?? [];
  const windowStart = now - rate.windowMs;
  while (bucket.length && bucket[0] < windowStart) {
    bucket.shift();
  }
  if (bucket.length >= rate.maxRequests) {
    const waitMs = bucket[0] + rate.windowMs - now;
    if (waitMs > 0) {
      await sleep(waitMs);
    }
  }
  bucket.push(Date.now());
  rateBuckets.set(rate.key, bucket);
}

function getCircuitState(key: string): CircuitState {
  const existing = circuitBreakers.get(key);
  if (existing) {
    return existing;
  }
  const fresh: CircuitState = { state: "closed", failures: 0 };
  circuitBreakers.set(key, fresh);
  return fresh;
}

function canAttemptCircuit(options?: CircuitBreakerOptions) {
  if (!options) {
    return true;
  }
  const state = getCircuitState(options.key);
  if (state.state !== "open") {
    return true;
  }
  const openMs = Math.max(1000, options.openMs ?? 30000);
  const openedAt = state.openedAt ?? 0;
  if (Date.now() - openedAt < openMs) {
    return false;
  }
  state.state = "half";
  return true;
}

function recordCircuitSuccess(options?: CircuitBreakerOptions) {
  if (!options) {
    return;
  }
  const state = getCircuitState(options.key);
  state.failures = 0;
  state.state = "closed";
  state.openedAt = undefined;
}

function recordCircuitFailure(status: number, options?: CircuitBreakerOptions) {
  if (!options) {
    return;
  }
  const failureStatuses = options.failureStatuses ?? [0, 408, 425, 429, 500, 502, 503, 504];
  if (!failureStatuses.includes(status)) {
    return;
  }
  const threshold = Math.max(1, options.failureThreshold ?? 3);
  const state = getCircuitState(options.key);
  state.failures += 1;
  if (state.failures >= threshold) {
    state.state = "open";
    state.openedAt = Date.now();
  }
}

function resolveMetricsTarget(options: HttpRequestOptions) {
  if (options.metrics?.target) {
    return options.metrics.target;
  }
  try {
    return new URL(options.url).host;
  } catch {
    return "unknown";
  }
}

async function requestJsonOnce<T>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
  const traceId = options.traceId ?? getRequestId();
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 15000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    };
    if (traceId && !hasHeader(headers, "x-request-id")) {
      headers["x-request-id"] = traceId;
    }
    const response = await fetch(options.url, {
      method: options.method,
      headers,
      body: options.body != null ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key.toLowerCase()] = value;
    });

    const raw = await response.text();
    let data: T | null = null;
    if (raw) {
      try {
        data = JSON.parse(raw) as T;
      } catch {
        data = null;
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      raw,
      headers: responseHeaders,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestJson<T>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
  const retry = options.retry ?? {};
  const attempts = Math.max(1, retry.attempts ?? 1);
  const retryOnStatuses = retry.retryOnStatuses ?? [408, 425, 429, 500, 502, 503, 504];
  const backoffFactor = retry.backoffFactor ?? 2;
  let delayMs = retry.delayMs ?? 300;
  const startedAt = Date.now();
  let lastStatus = 0;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      if (!canAttemptCircuit(options.circuitBreaker)) {
        logger.warn("http.circuit.open", {
          url: options.url,
          key: options.circuitBreaker?.key,
        });
        recordOutboundRequest({
          target: resolveMetricsTarget(options),
          statusCode: 0,
          durationMs: Date.now() - startedAt,
        });
        return { ok: false, status: 0, data: null, raw: "circuit_open", headers: {} };
      }
      await applyRateLimit(options.rateLimit);
      const response = await requestJsonOnce<T>(options);
      lastStatus = response.status;
      if (response.ok) {
        recordCircuitSuccess(options.circuitBreaker);
      } else {
        recordCircuitFailure(response.status, options.circuitBreaker);
      }
      if (response.ok || attempt >= attempts || !shouldRetry(response.status, retryOnStatuses)) {
        recordOutboundRequest({
          target: resolveMetricsTarget(options),
          statusCode: response.status,
          durationMs: Date.now() - startedAt,
        });
        return response;
      }
    } catch (error) {
      if (attempt >= attempts) {
        const message = error instanceof Error ? error.message : String(error);
        recordCircuitFailure(0, options.circuitBreaker);
        recordOutboundRequest({
          target: resolveMetricsTarget(options),
          statusCode: 0,
          durationMs: Date.now() - startedAt,
        });
        return { ok: false, status: 0, data: null, raw: message, headers: {} };
      }
    }

    await sleep(delayMs);
    delayMs = Math.floor(delayMs * backoffFactor);
  }

  recordCircuitFailure(lastStatus || 0, options.circuitBreaker);
  recordOutboundRequest({
    target: resolveMetricsTarget(options),
    statusCode: lastStatus || 0,
    durationMs: Date.now() - startedAt,
  });
  return { ok: false, status: 0, data: null, raw: "request_failed", headers: {} };
}
