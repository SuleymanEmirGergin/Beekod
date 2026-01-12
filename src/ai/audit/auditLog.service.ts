import { query } from "../../db.js";
import { logger } from "../../logger.js";
import { safeStringify } from "./redact.js";

export interface AuditLogEntry {
  tenantId: string;
  userId: string;
  requestText: string;
  intent: string;
  toolCalls: unknown;
  toolResults: unknown;
}

export class AuditLogService {
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const sql =
        "INSERT INTO ai_audit_logs (tenant_id, user_id, request_text, intent, tool_calls_json, tool_results_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
      await query(sql, [
        entry.tenantId,
        entry.userId,
        entry.requestText,
        entry.intent,
        safeStringify(entry.toolCalls),
        safeStringify(entry.toolResults),
        new Date(),
      ]);
    } catch (error) {
      logger.error("ai.audit_log.failed", { error: String(error) });
    }
  }
}
