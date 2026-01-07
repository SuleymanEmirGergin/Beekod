import { query } from "../db.js";
import { logger } from "../logger.js";

export type ActionLogInput = {
  intent: string;
  locale: string;
  message: string;
  barcode?: string;
  amount?: number;
  response?: string;
  success?: boolean;
  error?: string;
};

export type ActionLog = ActionLogInput & {
  id: number;
  created_at: string;
  success: boolean;
};

export async function createLog(entry: ActionLogInput) {
  try {
    await query(
      "INSERT INTO action_logs (intent, locale, message, barcode, amount, response, success, error) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        entry.intent,
        entry.locale,
        entry.message,
        entry.barcode ?? null,
        entry.amount ?? null,
        entry.response ?? null,
        entry.success === false ? 0 : 1,
        entry.error ?? null,
      ],
    );
  } catch (error) {
    logger.warn("log.insert_failed", { err: error });
  }
}

export async function getLogs(limit = 50): Promise<ActionLog[]> {
  const rows = await query<ActionLog[]>(
    "SELECT id, intent, locale, message, barcode, amount, response, success, error, created_at FROM action_logs ORDER BY id DESC LIMIT ?",
    [limit],
  );
  return rows;
}
