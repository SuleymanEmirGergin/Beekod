import { pool, query } from "../db.js";
import { logger } from "../logger.js";
import { saveMessage } from "./chatSessionService.js";
import { notificationService } from "./notificationService.js";

const ALERT_THRESHOLD = 5; // Critical level
const CHECK_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // Don't alert same product for 24h unless stock changes

// Memory to track last alerts: barcode -> last_alert_time
const lastAlerts: Map<string, number> = new Map();

async function broadcastAlert(message: string) {
  try {
    // Find sessions active in last 24 hours
    const sessions = await query<{ id: string }[]>(
      `SELECT id FROM chat_sessions WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );

    for (const session of sessions) {
      await saveMessage(session.id, "ai", message, { isSystemAlert: true });
    }

    if (sessions.length > 0) {
      logger.info("alerts.broadcast_sent", { count: sessions.length });
    }
  } catch (error) {
    logger.error("alerts.broadcast_failed", { err: error });
  }
}

export async function checkLowStock() {
  logger.debug("alerts.stock_check_started");

  try {
    const rows = await query<{ barcode: string; name: string; stock: number }[]>(
      "SELECT barcode, name, stock FROM products WHERE stock <= ?",
      [ALERT_THRESHOLD]
    );

    const alerts: string[] = [];

    for (const p of rows) {
      const lastTime = lastAlerts.get(p.barcode) || 0;
      const now = Date.now();

      // If alerted recently, skip
      if (now - lastTime < ALERT_COOLDOWN_MS) continue;

      alerts.push(`- ${p.name} (${p.stock} adet)`);
      lastAlerts.set(p.barcode, now);
    }

    if (alerts.length > 0) {
      const msg = `⚠️ **Kritik Stok Uyarısı!**\n\nAşağıdaki ürünler tükenmek üzere:\n${alerts.join("\n")}\n\nSipariş geçmeyi unutma kanka! 🚨`;
      await broadcastAlert(msg);

      await notificationService.notify({
        title: 'Kritik Stok Uyarısı',
        message: `${alerts.length} ürün için stok kritik seviyenin altında.`,
        type: 'low_stock',
        metadata: { alerts }
      });
    }

  } catch (error) {
    logger.error("alerts.stock_check_failed", { err: error });
  }
}

let intervalId: NodeJS.Timeout | null = null;

export function startStockAlertJob() {
  if (intervalId) return;

  // Run immediately on start (with slight delay to let DB connect)
  setTimeout(checkLowStock, 5000);

  intervalId = setInterval(checkLowStock, CHECK_INTERVAL_MS);
  logger.info("alerts.job_started", { intervalMs: CHECK_INTERVAL_MS });
}

export function stopStockAlertJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info("alerts.job_stopped");
  }
}
