import type { NextFunction, Request, Response } from "express";
import { query } from "../db.js";
import { logger } from "../logger.js";
import { getAdminSettings } from "../services/adminSettingsService.js";
import { getRedisClient, getRedisPrefix } from "../redis.js";

const DEFAULT_WINDOW_SECONDS = normalizeRateSetting(Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? 60), 60);
const DEFAULT_MAX_REQUESTS = normalizeRateSetting(Number(process.env.RATE_LIMIT_MAX ?? 300), 300);
const DEFAULT_GROUP_LIMITS_RAW = process.env.RATE_LIMIT_GROUP_LIMITS ?? "";
// Auto-detect: Use Redis if REDIS_URL is set, otherwise use DB
const DEFAULT_RATE_LIMIT_STORE = process.env.RATE_LIMIT_STORE
  ? process.env.RATE_LIMIT_STORE.toLowerCase() === "redis"
    ? "redis"
    : "db"
  : process.env.REDIS_URL?.trim()
    ? "redis"
    : "db";
const DEFAULT_RATE_LIMIT_ENABLED = !(DEFAULT_WINDOW_SECONDS <= 0 || DEFAULT_MAX_REQUESTS <= 0);
const RATE_LIMIT_SETTINGS_TTL_MS = normalizeRateSetting(Number(process.env.RATE_LIMIT_SETTINGS_TTL_MS ?? 5000), 5000);
let redisFallbackWarned = false;

type RateLimitConfig = {
  windowSeconds: number;
  maxRequests: number;
  groupLimits: Map<string, number>;
  store: "db" | "redis";
  enabled: boolean;
};

let cachedConfig: { value: RateLimitConfig; expiresAt: number } | null = null;

function parseGroupLimits(raw: string) {
  const map = new Map<string, number>();
  const entries = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  for (const entry of entries) {
    const [group, limitRaw] = entry.split(":").map((part) => part.trim());
    const limit = Number(limitRaw);
    if (!group || !Number.isFinite(limit)) {
      continue;
    }
    map.set(group.toLowerCase(), Math.max(0, Math.trunc(limit)));
  }
  return map;
}

function normalizeRateSetting(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.trunc(value));
}

function normalizeStore(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "redis") {
    return "redis";
  }
  return "db";
}

function buildRateLimitConfig(settings?: {
  rateLimitWindowSeconds?: number;
  rateLimitMax?: number;
  rateLimitGroupLimits?: string;
  rateLimitStore?: string;
  rateLimitEnabled?: boolean;
}): RateLimitConfig {
  const windowSeconds = normalizeRateSetting(
    settings?.rateLimitWindowSeconds ?? DEFAULT_WINDOW_SECONDS,
    DEFAULT_WINDOW_SECONDS,
  );
  const maxRequests = normalizeRateSetting(settings?.rateLimitMax ?? DEFAULT_MAX_REQUESTS, DEFAULT_MAX_REQUESTS);
  const hasGroupLimits = typeof settings?.rateLimitGroupLimits === "string";
  const groupRaw = hasGroupLimits ? (settings?.rateLimitGroupLimits ?? "") : DEFAULT_GROUP_LIMITS_RAW;
  const groupLimits = parseGroupLimits(groupRaw ?? "");
  const store = normalizeStore(settings?.rateLimitStore ?? DEFAULT_RATE_LIMIT_STORE);
  const enabled = settings?.rateLimitEnabled ?? DEFAULT_RATE_LIMIT_ENABLED;
  return { windowSeconds, maxRequests, groupLimits, store, enabled };
}

async function getRateLimitConfig() {
  if (cachedConfig && Date.now() < cachedConfig.expiresAt) {
    return cachedConfig.value;
  }
  let settings;
  try {
    settings = await getAdminSettings();
  } catch {
    settings = undefined;
  }
  const config = buildRateLimitConfig(settings);
  cachedConfig = { value: config, expiresAt: Date.now() + RATE_LIMIT_SETTINGS_TTL_MS };
  return config;
}

function getClientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

function getRouteGroup(path: string) {
  const parts = path.split("/").filter(Boolean);
  return parts[0] || "root";
}

async function checkRateLimitRedis(key: string, limit: number, windowSeconds: number) {
  const client = await getRedisClient();
  if (!client) {
    return null;
  }
  const windowKey = Math.floor(Date.now() / 1000 / windowSeconds);
  const redisKey = `${getRedisPrefix()}:rate:${key}:${windowKey}`;
  const count = await client.incr(redisKey);
  if (count === 1) {
    await client.expire(redisKey, windowSeconds);
  }
  const resetAt = (windowKey + 1) * windowSeconds * 1000;
  const remaining = Math.max(0, limit - count);
  return { count, remaining, resetAt };
}

export async function rateLimit(req: Request, res: Response, next: NextFunction) {
  const config = await getRateLimitConfig();
  if (!config.enabled || config.maxRequests <= 0 || config.windowSeconds <= 0) {
    return next();
  }

  const ip = getClientIp(req);
  const group = getRouteGroup(req.path).toLowerCase();
  if (group === "health") {
    return next();
  }
  const limit = config.groupLimits.get(group) ?? config.maxRequests;
  if (limit <= 0) {
    return next();
  }
  const key = `${ip}|${group}`;

  try {
    if (config.store === "redis") {
      const redisResult = await checkRateLimitRedis(key, limit, config.windowSeconds);
      if (redisResult) {
        res.setHeader("x-rate-limit-limit", String(limit));
        res.setHeader("x-rate-limit-remaining", String(redisResult.remaining));
        res.setHeader("x-rate-limit-reset", String(Math.floor(redisResult.resetAt / 1000)));
        if (redisResult.count > limit) {
          return res.status(429).json({ error: "rate_limit_exceeded", retryAfterSeconds: config.windowSeconds });
        }
        return next();
      }
      if (!redisFallbackWarned) {
        redisFallbackWarned = true;
        logger.warn("rate_limit.redis_unavailable");
      }
    }

    await query(
      `INSERT INTO rate_limits (rate_key, window_start, count)
       VALUES (?, NOW(), 1)
       ON DUPLICATE KEY UPDATE
         count = IF(TIMESTAMPDIFF(SECOND, window_start, NOW()) >= ?, 1, count + 1),
         window_start = IF(TIMESTAMPDIFF(SECOND, window_start, NOW()) >= ?, NOW(), window_start)`,
      [key, config.windowSeconds, config.windowSeconds],
    );

    const rows = await query<{ count: number; window_start: string }[]>(
      "SELECT count, window_start FROM rate_limits WHERE rate_key = ?",
      [key],
    );

    const count = rows[0]?.count ?? 0;
    const windowStart = rows[0]?.window_start ? new Date(rows[0].window_start).getTime() : Date.now();
    const resetAt = windowStart + config.windowSeconds * 1000;
    const remaining = Math.max(0, limit - count);

    res.setHeader("x-rate-limit-limit", String(limit));
    res.setHeader("x-rate-limit-remaining", String(remaining));
    res.setHeader("x-rate-limit-reset", String(Math.floor(resetAt / 1000)));

    if (count > limit) {
      return res.status(429).json({ error: "rate_limit_exceeded", retryAfterSeconds: config.windowSeconds });
    }
  } catch (error) {
    logger.warn("rate_limit.check_failed", { requestId: res.locals?.requestId, err: error });
  }

  return next();
}
