import { Router } from "express";
import { z } from "zod";
import { requireAdminKey } from "../middleware/adminKey.js";
import { getAdminSettings, updateAdminSettings } from "../services/adminSettingsService.js";
import { validateBody } from "../validation/middleware.js";

const router = Router();

const numberLike = z.preprocess((value) => {
  if (value == null) {
    return undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    return Number(trimmed);
  }
  return value;
}, z.number().finite());

const booleanLike = z.preprocess((value) => {
  if (value == null) {
    return undefined;
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
  return value;
}, z.boolean());

const adminSettingsSchema = z.object({
  lowStockThreshold: numberLike.optional(),
  lowStockCriticalThreshold: numberLike.optional(),
  toastDurationMs: numberLike.optional(),
  rateLimitWindowSeconds: numberLike.optional(),
  rateLimitMax: numberLike.optional(),
  rateLimitGroupLimits: z.string().trim().optional(),
  rateLimitStore: z.string().trim().optional(),
  rateLimitEnabled: booleanLike.optional(),
  stockAlertWebhookUrl: z.string().trim().optional(),
  stockAlertEmailEnabled: booleanLike.optional(),
  stockAlertEmailTo: z.string().trim().optional(),
  stockAlertCooldownMinutes: numberLike.optional(),
});

router.get("/admin/settings", requireAdminKey, async (_req, res, next) => {
  try {
    const settings = await getAdminSettings();
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/settings", requireAdminKey, validateBody(adminSettingsSchema), async (req, res, next) => {
  try {
    const payload = req.body ?? {};
    const updates: {
      lowStockThreshold?: number;
      lowStockCriticalThreshold?: number;
      toastDurationMs?: number;
      rateLimitWindowSeconds?: number;
      rateLimitMax?: number;
      rateLimitGroupLimits?: string;
      rateLimitStore?: "db" | "redis";
      rateLimitEnabled?: boolean;
      stockAlertWebhookUrl?: string;
      stockAlertEmailEnabled?: boolean;
      stockAlertEmailTo?: string;
      stockAlertCooldownMinutes?: number;
    } = {};
    if (Object.prototype.hasOwnProperty.call(payload, "lowStockThreshold")) {
      const numeric = Number(payload.lowStockThreshold);
      if (!Number.isFinite(numeric) || numeric < 0) {
        return res.status(400).json({ error: "invalid_low_stock_threshold" });
      }
      updates.lowStockThreshold = Math.floor(numeric);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "lowStockCriticalThreshold")) {
      const numeric = Number(payload.lowStockCriticalThreshold);
      if (!Number.isFinite(numeric) || numeric < 0) {
        return res.status(400).json({ error: "invalid_low_stock_critical_threshold" });
      }
      updates.lowStockCriticalThreshold = Math.floor(numeric);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "toastDurationMs")) {
      const numeric = Number(payload.toastDurationMs);
      if (!Number.isFinite(numeric) || numeric < 500) {
        return res.status(400).json({ error: "invalid_toast_duration" });
      }
      updates.toastDurationMs = Math.floor(numeric);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "rateLimitWindowSeconds")) {
      const numeric = Number(payload.rateLimitWindowSeconds);
      if (!Number.isFinite(numeric) || numeric < 0) {
        return res.status(400).json({ error: "invalid_rate_limit_window" });
      }
      updates.rateLimitWindowSeconds = Math.floor(numeric);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "rateLimitMax")) {
      const numeric = Number(payload.rateLimitMax);
      if (!Number.isFinite(numeric) || numeric < 0) {
        return res.status(400).json({ error: "invalid_rate_limit_max" });
      }
      updates.rateLimitMax = Math.floor(numeric);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "rateLimitGroupLimits")) {
      const raw = String(payload.rateLimitGroupLimits ?? "").trim();
      if (raw) {
        const entries = raw
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean);
        const invalid = entries.some((entry) => {
          const [group, limitRaw] = entry.split(":").map((part) => part.trim());
          const limit = Number(limitRaw);
          return !group || !Number.isFinite(limit) || limit < 0;
        });
        if (invalid) {
          return res.status(400).json({ error: "invalid_rate_limit_group_limits" });
        }
      }
      updates.rateLimitGroupLimits = raw;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "rateLimitStore")) {
      const raw = String(payload.rateLimitStore ?? "")
        .trim()
        .toLowerCase();
      if (raw && raw !== "db" && raw !== "redis") {
        return res.status(400).json({ error: "invalid_rate_limit_store" });
      }
      updates.rateLimitStore = raw === "redis" ? "redis" : "db";
    }
    if (Object.prototype.hasOwnProperty.call(payload, "rateLimitEnabled")) {
      const enabled = payload.rateLimitEnabled;
      if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "invalid_rate_limit_enabled" });
      }
      updates.rateLimitEnabled = enabled;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "stockAlertWebhookUrl")) {
      const raw = String(payload.stockAlertWebhookUrl ?? "").trim();
      if (raw && !/^https?:\/\//i.test(raw)) {
        return res.status(400).json({ error: "invalid_stock_alert_webhook" });
      }
      updates.stockAlertWebhookUrl = raw;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "stockAlertEmailEnabled")) {
      const enabled = payload.stockAlertEmailEnabled;
      if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "invalid_stock_alert_email_enabled" });
      }
      updates.stockAlertEmailEnabled = enabled;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "stockAlertEmailTo")) {
      const raw = String(payload.stockAlertEmailTo ?? "").trim();
      if (raw && !raw.includes("@")) {
        return res.status(400).json({ error: "invalid_stock_alert_email_to" });
      }
      updates.stockAlertEmailTo = raw;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "stockAlertCooldownMinutes")) {
      const numeric = Number(payload.stockAlertCooldownMinutes);
      if (!Number.isFinite(numeric) || numeric < 0) {
        return res.status(400).json({ error: "invalid_stock_alert_cooldown" });
      }
      updates.stockAlertCooldownMinutes = Math.floor(numeric);
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: "no_settings" });
    }
    if (
      updates.lowStockThreshold !== undefined &&
      updates.lowStockCriticalThreshold !== undefined &&
      updates.lowStockCriticalThreshold > updates.lowStockThreshold
    ) {
      return res.status(400).json({ error: "invalid_threshold_order" });
    }
    await updateAdminSettings(updates);
    const settings = await getAdminSettings();
    return res.json({ settings });
  } catch (error) {
    return next(error);
  }
});

export { router as adminSettingsRouter };
