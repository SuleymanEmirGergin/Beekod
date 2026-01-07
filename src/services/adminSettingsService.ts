import { query } from "../db.js";

export type AdminSettings = {
  lowStockThreshold: number;
  lowStockCriticalThreshold: number;
  toastDurationMs: number;
  rateLimitWindowSeconds: number;
  rateLimitMax: number;
  rateLimitGroupLimits: string;
  rateLimitStore: "db" | "redis";
  rateLimitEnabled: boolean;
  stockAlertWebhookUrl: string;
  stockAlertEmailEnabled: boolean;
  stockAlertEmailTo: string;
  stockAlertCooldownMinutes: number;
};

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

function normalizeBoolean(value: string, fallback: boolean) {
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }
  return fallback;
}

const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = normalizeRateSetting(Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? 60), 60);
const DEFAULT_RATE_LIMIT_MAX = normalizeRateSetting(Number(process.env.RATE_LIMIT_MAX ?? 300), 300);
const DEFAULT_RATE_LIMIT_GROUP_LIMITS = (process.env.RATE_LIMIT_GROUP_LIMITS ?? "").trim();
const DEFAULT_RATE_LIMIT_STORE = normalizeStore(process.env.RATE_LIMIT_STORE ?? "db");
const DEFAULT_RATE_LIMIT_ENABLED = !(DEFAULT_RATE_LIMIT_WINDOW_SECONDS <= 0 || DEFAULT_RATE_LIMIT_MAX <= 0);
const DEFAULT_STOCK_ALERT_WEBHOOK_URL = (process.env.STOCK_ALERT_WEBHOOK_URL ?? "").trim();
const DEFAULT_STOCK_ALERT_EMAIL_ENABLED = normalizeBoolean(process.env.STOCK_ALERT_EMAIL_ENABLED ?? "false", false);
const DEFAULT_STOCK_ALERT_EMAIL_TO = (process.env.STOCK_ALERT_EMAIL_TO ?? "").trim();
const DEFAULT_STOCK_ALERT_COOLDOWN_MINUTES = normalizeRateSetting(
  Number(process.env.STOCK_ALERT_COOLDOWN_MINUTES ?? 30),
  30,
);

const DEFAULT_SETTINGS: AdminSettings = {
  lowStockThreshold: 5,
  lowStockCriticalThreshold: 2,
  toastDurationMs: 2000,
  rateLimitWindowSeconds: DEFAULT_RATE_LIMIT_WINDOW_SECONDS,
  rateLimitMax: DEFAULT_RATE_LIMIT_MAX,
  rateLimitGroupLimits: DEFAULT_RATE_LIMIT_GROUP_LIMITS,
  rateLimitStore: DEFAULT_RATE_LIMIT_STORE,
  rateLimitEnabled: DEFAULT_RATE_LIMIT_ENABLED,
  stockAlertWebhookUrl: DEFAULT_STOCK_ALERT_WEBHOOK_URL,
  stockAlertEmailEnabled: DEFAULT_STOCK_ALERT_EMAIL_ENABLED,
  stockAlertEmailTo: DEFAULT_STOCK_ALERT_EMAIL_TO,
  stockAlertCooldownMinutes: DEFAULT_STOCK_ALERT_COOLDOWN_MINUTES,
};

type AdminSettingRow = {
  setting_key: string;
  setting_value: unknown;
};

function parseSettingValue(raw: unknown) {
  if (raw === null || raw === undefined) {
    return undefined;
  }
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

function serializeSettingValue(value: unknown) {
  return JSON.stringify(value);
}

function toNumber(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return undefined;
  }
  return numeric;
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no"].includes(normalized)) {
      return false;
    }
  }
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  return undefined;
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const rows = await query<AdminSettingRow[]>("SELECT setting_key, setting_value FROM admin_settings");
  const settings: AdminSettings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    const value = parseSettingValue(row.setting_value);
    if (row.setting_key === "lowStockThreshold") {
      const numeric = toNumber(value);
      if (numeric !== undefined && numeric >= 0) {
        settings.lowStockThreshold = Math.floor(numeric);
      }
    }
    if (row.setting_key === "lowStockCriticalThreshold") {
      const numeric = toNumber(value);
      if (numeric !== undefined && numeric >= 0) {
        settings.lowStockCriticalThreshold = Math.floor(numeric);
      }
    }
    if (row.setting_key === "toastDurationMs") {
      const numeric = toNumber(value);
      if (numeric !== undefined && numeric >= 500) {
        settings.toastDurationMs = Math.floor(numeric);
      }
    }
    if (row.setting_key === "rateLimitWindowSeconds") {
      const numeric = toNumber(value);
      if (numeric !== undefined && numeric >= 0) {
        settings.rateLimitWindowSeconds = normalizeRateSetting(numeric, DEFAULT_RATE_LIMIT_WINDOW_SECONDS);
      }
    }
    if (row.setting_key === "rateLimitMax") {
      const numeric = toNumber(value);
      if (numeric !== undefined && numeric >= 0) {
        settings.rateLimitMax = normalizeRateSetting(numeric, DEFAULT_RATE_LIMIT_MAX);
      }
    }
    if (row.setting_key === "rateLimitGroupLimits") {
      if (typeof value === "string") {
        settings.rateLimitGroupLimits = value.trim();
      }
    }
    if (row.setting_key === "rateLimitStore") {
      if (typeof value === "string") {
        settings.rateLimitStore = normalizeStore(value);
      }
    }
    if (row.setting_key === "rateLimitEnabled") {
      const parsed = toBoolean(value);
      if (parsed !== undefined) {
        settings.rateLimitEnabled = parsed;
      }
    }
    if (row.setting_key === "stockAlertWebhookUrl") {
      if (typeof value === "string") {
        settings.stockAlertWebhookUrl = value.trim();
      }
    }
    if (row.setting_key === "stockAlertEmailEnabled") {
      const parsed = toBoolean(value);
      if (parsed !== undefined) {
        settings.stockAlertEmailEnabled = parsed;
      }
    }
    if (row.setting_key === "stockAlertEmailTo") {
      if (typeof value === "string") {
        settings.stockAlertEmailTo = value.trim();
      }
    }
    if (row.setting_key === "stockAlertCooldownMinutes") {
      const numeric = toNumber(value);
      if (numeric !== undefined && numeric >= 0) {
        settings.stockAlertCooldownMinutes = Math.floor(numeric);
      }
    }
  }
  return settings;
}

export async function updateAdminSettings(updates: Partial<AdminSettings>) {
  const entries: Array<[string, unknown]> = [];
  if (updates.lowStockThreshold !== undefined) {
    entries.push(["lowStockThreshold", Math.floor(updates.lowStockThreshold)]);
  }
  if (updates.lowStockCriticalThreshold !== undefined) {
    entries.push(["lowStockCriticalThreshold", Math.floor(updates.lowStockCriticalThreshold)]);
  }
  if (updates.toastDurationMs !== undefined) {
    entries.push(["toastDurationMs", Math.floor(updates.toastDurationMs)]);
  }
  if (updates.rateLimitWindowSeconds !== undefined) {
    entries.push(["rateLimitWindowSeconds", Math.floor(updates.rateLimitWindowSeconds)]);
  }
  if (updates.rateLimitMax !== undefined) {
    entries.push(["rateLimitMax", Math.floor(updates.rateLimitMax)]);
  }
  if (updates.rateLimitGroupLimits !== undefined) {
    entries.push(["rateLimitGroupLimits", String(updates.rateLimitGroupLimits)]);
  }
  if (updates.rateLimitStore !== undefined) {
    entries.push(["rateLimitStore", String(updates.rateLimitStore)]);
  }
  if (updates.rateLimitEnabled !== undefined) {
    entries.push(["rateLimitEnabled", Boolean(updates.rateLimitEnabled)]);
  }
  if (updates.stockAlertWebhookUrl !== undefined) {
    entries.push(["stockAlertWebhookUrl", String(updates.stockAlertWebhookUrl)]);
  }
  if (updates.stockAlertEmailEnabled !== undefined) {
    entries.push(["stockAlertEmailEnabled", Boolean(updates.stockAlertEmailEnabled)]);
  }
  if (updates.stockAlertEmailTo !== undefined) {
    entries.push(["stockAlertEmailTo", String(updates.stockAlertEmailTo)]);
  }
  if (updates.stockAlertCooldownMinutes !== undefined) {
    entries.push(["stockAlertCooldownMinutes", Math.floor(updates.stockAlertCooldownMinutes)]);
  }
  for (const [key, value] of entries) {
    await query(
      "INSERT INTO admin_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
      [key, serializeSettingValue(value)],
    );
  }
}
