import "dotenv/config";
import { logger } from "./logger.js";

const env = process.env;
const warnings: string[] = [];
const errors: string[] = [];

function normalizeBoolean(value: string | undefined) {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }
  return null;
}

const strictRaw = env.ENV_STRICT;
const strictParsed = normalizeBoolean(strictRaw);
const strictEnv = strictParsed ?? false;
if (strictRaw && strictParsed == null) {
  warnings.push("ENV_STRICT must be a boolean");
}

function requireEnv(name: string) {
  const value = env[name];
  if (!value) {
    const message = `${name} is required`;
    if (strictEnv) {
      errors.push(message);
    } else {
      warnings.push(message);
    }
  }
  return value;
}

function parseNumber(name: string, fallback: number, options: { min?: number; max?: number; integer?: boolean } = {}) {
  const raw = env[name];
  if (!raw || !raw.trim()) {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    errors.push(`${name} must be a number`);
    return fallback;
  }
  if (options.integer && !Number.isInteger(value)) {
    errors.push(`${name} must be an integer`);
    return fallback;
  }
  if (options.min != null && value < options.min) {
    errors.push(`${name} must be >= ${options.min}`);
    return fallback;
  }
  if (options.max != null && value > options.max) {
    errors.push(`${name} must be <= ${options.max}`);
    return fallback;
  }
  return value;
}

function parseBoolean(name: string, fallback: boolean) {
  const raw = env[name];
  if (!raw || !raw.trim()) {
    return fallback;
  }
  const parsed = normalizeBoolean(raw);
  if (parsed == null) {
    errors.push(`${name} must be a boolean`);
    return fallback;
  }
  return parsed;
}

function parseCsv(name: string) {
  const raw = env[name];
  if (!raw || !raw.trim()) {
    return [];
  }
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseStore(name: string, fallback: "db" | "mock") {
  const raw = env[name];
  if (!raw || !raw.trim()) {
    return fallback;
  }
  const normalized = raw.trim().toLowerCase();
  if (normalized === "db" || normalized === "mock") {
    return normalized;
  }
  warnings.push(`${name} must be "db" or "mock"`);
  return fallback;
}

function parseReadSource(name: string, fallback: "db" | "live") {
  const raw = env[name];
  if (!raw || !raw.trim()) {
    return fallback;
  }
  const normalized = raw.trim().toLowerCase();
  if (normalized === "db" || normalized === "live") {
    return normalized;
  }
  warnings.push(`${name} must be "db" or "live"`);
  return fallback;
}

requireEnv("DB_HOST");
requireEnv("DB_USER");
requireEnv("DB_NAME");

export const config = {
  port: parseNumber("PORT", 3000, { min: 1, max: 65535, integer: true }),
  server: {
    jsonBodyLimit: env.JSON_BODY_LIMIT ?? "10mb",
    urlEncodedBodyLimit: env.URL_ENCODED_BODY_LIMIT ?? env.JSON_BODY_LIMIT ?? "10mb",
    jwtSecret: env.JWT_SECRET ?? "dev-secret-do-not-use-in-prod",
  },
  db: {
    host: env.DB_HOST ?? "localhost",
    port: parseNumber("DB_PORT", 3306, { min: 1, max: 65535, integer: true }),
    user: env.DB_USER ?? "root",
    password: env.DB_PASSWORD ?? "",
    database: env.DB_NAME ?? "beekod",
    pool: {
      connectionLimit: parseNumber("DB_POOL_SIZE", 10, { min: 1, integer: true }),
      waitForConnections: true,
      queueLimit: parseNumber("DB_QUEUE_LIMIT", 0, { min: 0, integer: true }),
      connectTimeout: parseNumber("DB_CONNECT_TIMEOUT_MS", 10000, { min: 1000, integer: true }),
      enableKeepAlive: parseBoolean("DB_ENABLE_KEEP_ALIVE", true),
      keepAliveInitialDelay: parseNumber("DB_KEEP_ALIVE_DELAY_MS", 0, { min: 0, integer: true }),
    },
  },
  data: {
    marketplacePath: env.MARKETPLACE_DATA_PATH ?? "data/mock_marketplace.csv",
    productPath: env.PRODUCT_DATA_PATH ?? "data/mock_products.csv",
    salesPath: env.SALES_DATA_PATH ?? "data/mock_sales.csv",
    contentConfigPath: env.CONTENT_CONFIG_PATH ?? "data/content-config.json",
    contentConfigDefaultPath: env.CONTENT_CONFIG_DEFAULT_PATH ?? "data/content-config.default.json",
    marketplaceMappingPath: env.MARKETPLACE_MAPPING_PATH ?? "data/marketplace-mappings.json",
    marketplaceMappingDefaultPath: env.MARKETPLACE_MAPPING_DEFAULT_PATH ?? "data/marketplace-mappings.default.json",
    templates: {
      mappings: "data/templates/content_mappings.json",
      seo: "data/templates/seo_templates.json",
      social: "data/templates/social_templates.json",
    },
  },
  images: {
    storagePath: env.IMAGE_STORAGE_PATH ?? "storage/images",
    publicBase: env.IMAGE_PUBLIC_BASE ?? "/static/images",
    defaultProfile: env.IMAGE_DEFAULT_PROFILE ?? "trendyol_square",
    maxUploadBytes: parseNumber("IMAGE_MAX_BYTES", 8 * 1024 * 1024, { min: 1, integer: true }),
    requireAdmin: parseBoolean("IMAGE_REQUIRE_ADMIN", false),
    profilesPath: env.IMAGE_PROFILES_PATH ?? "data/image-profiles.json",
    profilesDefaultPath: env.IMAGE_PROFILES_DEFAULT_PATH ?? "data/image-profiles.default.json",
    profileSetsPath: env.IMAGE_PROFILE_SETS_PATH ?? "data/marketplace-image-sets.json",
    profileSetsDefaultPath: env.IMAGE_PROFILE_SETS_DEFAULT_PATH ?? "data/marketplace-image-sets.default.json",
    barcodeScanEnabled: parseBoolean("BARCODE_SCAN_ENABLED", false),
  },
  google: {
    cseApiKey: (env.GOOGLE_CSE_API_KEY ?? "").trim(),
    cseCx: (env.GOOGLE_CSE_CX ?? "").trim(),
  },
  search: {
    defaultNum: parseNumber("SEARCH_DEFAULT_NUM", 5, { min: 1, max: 10, integer: true }),
    imageDefaultNum: parseNumber("IMAGE_SEARCH_DEFAULT_NUM", 3, { min: 1, max: 10, integer: true }),
    gl: env.SEARCH_GL ?? "",
    hl: env.SEARCH_HL ?? "",
    siteDefault: env.SEARCH_SITE_DEFAULT ?? "",
  },
  stores: {
    marketplace: parseStore("MARKETPLACE_STORE", "db"),
    sales: parseStore("SALES_STORE", "mock"),
  },
  marketplace: {
    readSource: parseReadSource("MARKETPLACE_READ_SOURCE", "db"),
    liveRetryEnabled: parseBoolean("MARKETPLACE_LIVE_RETRY_ENABLED", false),
    mode: (process.env.MARKETPLACE_MODE?.trim().toLowerCase() === "mock" ? "mock" : "live") as "mock" | "live",
  },
  security: {
    cors: {
      origins: env.CORS_ORIGINS ? parseCsv("CORS_ORIGINS") : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:3000", "http://localhost:5175", "http://127.0.0.1:5175"],
      methods: parseCsv("CORS_ALLOW_METHODS"),
      headers: parseCsv("CORS_ALLOW_HEADERS"),
      allowCredentials: parseBoolean("CORS_ALLOW_CREDENTIALS", false),
    },
    hsts: {
      enabled: parseBoolean("SECURITY_HSTS_ENABLED", false),
      maxAge: parseNumber("SECURITY_HSTS_MAX_AGE", 15552000, { min: 0, integer: true }),
    },
  },
  admin: {
    apiKey: env.ADMIN_KEY ?? env.ADMIN_API_KEY ?? "",
  },
};

// Log API key status (without exposing keys)
if (config.google.cseApiKey) {
  logger.info("config.google_cse.configured", { hasKey: true, hasCx: Boolean(config.google.cseCx) });
} else {
  logger.debug("config.google_cse.not_configured", {
    missing: config.google.cseCx ? ["GOOGLE_CSE_API_KEY"] : ["GOOGLE_CSE_API_KEY", "GOOGLE_CSE_CX"],
  });
}

const geminiApiKey = (process.env.GEMINI_API_KEY ?? "").trim();
if (geminiApiKey) {
  logger.info("config.gemini.configured", { hasKey: true });
} else {
  logger.debug("config.gemini.not_configured");
}

// Log marketplace mode
const marketplaceMode = process.env.MARKETPLACE_MODE?.trim().toLowerCase() === "mock" ? "mock" : "live";
logger.info("config.marketplace_mode", { mode: marketplaceMode });

// Log rate limit store
const rateLimitStore = process.env.RATE_LIMIT_STORE
  ? process.env.RATE_LIMIT_STORE.toLowerCase() === "redis"
    ? "redis"
    : "db"
  : process.env.REDIS_URL?.trim()
    ? "redis"
    : "db";
logger.info("config.rate_limit_store", { store: rateLimitStore, hasRedisUrl: Boolean(process.env.REDIS_URL?.trim()) });

if (warnings.length) {
  logger.warn("config.env_warning", { warnings });
}

if (errors.length) {
  const message = `[config] env errors:\n- ${errors.join("\n- ")}`;
  if (strictEnv) {
    throw new Error(message);
  }
  logger.error("config.env_error", { errors, message });
}
