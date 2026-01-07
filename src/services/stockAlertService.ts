import { query } from "../db.js";
import { Product } from "../types.js";
import { getAdminSettings } from "./adminSettingsService.js";
import { createLog } from "./logService.js";

type ChannelResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  status?: number;
};

type StockAlertResult = {
  skipped: boolean;
  reason?: string;
  webhook?: ChannelResult;
  email?: ChannelResult;
};

const DEFAULT_COOLDOWN_MINUTES = Number(process.env.STOCK_ALERT_COOLDOWN_MINUTES ?? 30);
const ENV_WEBHOOK_URL = (process.env.STOCK_ALERT_WEBHOOK_URL ?? "").trim();
const ENV_EMAIL_ENABLED = (process.env.STOCK_ALERT_EMAIL_ENABLED ?? "false").toLowerCase() === "true";
const ENV_EMAIL_TO = (process.env.STOCK_ALERT_EMAIL_TO ?? "").trim();
const SMTP_HOST = (process.env.SMTP_HOST ?? "").trim();
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = (process.env.SMTP_USER ?? "").trim();
const SMTP_PASSWORD = process.env.SMTP_PASSWORD ?? "";
const SMTP_SECURE = (process.env.SMTP_SECURE ?? "").toLowerCase() === "true" || SMTP_PORT === 465;
const ALERT_EMAIL_FROM = (process.env.ALERT_EMAIL_FROM ?? SMTP_USER).trim();

function resolveCooldownMinutes(value: number | undefined) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return Number.isFinite(DEFAULT_COOLDOWN_MINUTES) ? Math.max(0, DEFAULT_COOLDOWN_MINUTES) : 30;
  }
  return Math.floor(numeric);
}

async function getLastAlertTime(barcode: string) {
  const rows = await query<{ last_alerted_at: string }[]>(
    "SELECT last_alerted_at FROM stock_alerts WHERE barcode = ? LIMIT 1",
    [barcode],
  );
  return rows[0]?.last_alerted_at ?? null;
}

async function recordAlert(barcode: string) {
  await query(
    "INSERT INTO stock_alerts (barcode, last_alerted_at) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE last_alerted_at = VALUES(last_alerted_at)",
    [barcode],
  );
}

async function sendWebhook(url: string, payload: Record<string, unknown>): Promise<ChannelResult> {
  if (!url) {
    return { ok: false, skipped: true, reason: "webhook_not_configured" };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { ok: false, status: res.status, reason: "webhook_failed" };
    }
    return { ok: true, status: res.status };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "webhook_error" };
  }
}

async function sendEmail(to: string, payload: Record<string, unknown>): Promise<ChannelResult> {
  if (!to) {
    return { ok: false, skipped: true, reason: "email_recipient_missing" };
  }
  if (!SMTP_HOST || !ALERT_EMAIL_FROM) {
    return { ok: false, skipped: true, reason: "smtp_not_configured" };
  }
  let nodemailer: typeof import("nodemailer");
  try {
    nodemailer = await import("nodemailer");
  } catch {
    return { ok: false, skipped: true, reason: "nodemailer_missing" };
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number.isFinite(SMTP_PORT) ? SMTP_PORT : 587,
    secure: SMTP_SECURE,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
  });
  const subject = `Beekod: Kritik stok (${payload.barcode ?? "-"})`;
  const lines = [
    `Urun: ${payload.name ?? "-"}`,
    `Barkod: ${payload.barcode ?? "-"}`,
    `Stok: ${payload.stock ?? "-"}`,
    `Fiyat: ${payload.price ?? "-"} ${payload.currency ?? ""}`.trim(),
    `Kritik esik: ${payload.criticalThreshold ?? "-"}`,
    `Zaman: ${payload.timestamp ?? "-"}`,
  ];
  try {
    await transporter.sendMail({
      from: ALERT_EMAIL_FROM,
      to,
      subject,
      text: lines.join("\n"),
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "email_send_failed" };
  }
}

function buildPayload(product: Product, criticalThreshold: number, source?: string) {
  return {
    barcode: product.barcode,
    name: product.name,
    stock: product.stock,
    price: product.price,
    currency: product.currency,
    criticalThreshold,
    source: source || "unknown",
    timestamp: new Date().toISOString(),
  };
}

export async function handleStockAlert(product: Product, source?: string): Promise<StockAlertResult> {
  const stockValue = Number(product.stock);
  if (!Number.isFinite(stockValue)) {
    return { skipped: true, reason: "invalid_stock" };
  }
  const settings = await getAdminSettings();
  const criticalThreshold = Math.max(0, Number(settings.lowStockCriticalThreshold ?? 0));
  if (stockValue > criticalThreshold) {
    return { skipped: true, reason: "not_critical" };
  }
  const cooldownMinutes = resolveCooldownMinutes(settings.stockAlertCooldownMinutes);
  if (cooldownMinutes > 0) {
    const lastAlert = await getLastAlertTime(product.barcode);
    if (lastAlert) {
      const lastTime = new Date(lastAlert).getTime();
      if (Number.isFinite(lastTime)) {
        const diffMinutes = (Date.now() - lastTime) / 60000;
        if (diffMinutes < cooldownMinutes) {
          return { skipped: true, reason: "cooldown_active" };
        }
      }
    }
  }
  const payload = buildPayload(product, criticalThreshold, source);
  const webhookUrl = settings.stockAlertWebhookUrl || ENV_WEBHOOK_URL;
  const emailEnabled = settings.stockAlertEmailEnabled ?? ENV_EMAIL_ENABLED;
  const emailTo = settings.stockAlertEmailTo || ENV_EMAIL_TO;

  const webhookResult = await sendWebhook(webhookUrl, payload);
  let emailResult: ChannelResult | undefined = undefined;
  if (emailEnabled) {
    emailResult = await sendEmail(emailTo, payload);
  } else {
    emailResult = { ok: false, skipped: true, reason: "email_disabled" };
  }

  const success = Boolean(webhookResult.ok || emailResult.ok);
  if (success) {
    await recordAlert(product.barcode);
  }

  await createLog({
    intent: "stock.alert",
    locale: "tr",
    message: `Kritik stok uyarisi: ${product.barcode}`,
    barcode: product.barcode,
    amount: product.stock,
    response: JSON.stringify({
      webhook: webhookResult,
      email: emailResult,
      cooldownMinutes,
    }),
    success,
    error: success ? undefined : "stock_alert_failed",
  });

  return {
    skipped: false,
    webhook: webhookResult,
    email: emailResult,
  };
}
