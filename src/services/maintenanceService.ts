import { query } from "../db.js";
import { logger } from "../logger.js";

export const maintenanceService = {
  /**
   * Delete old audit logs
   * @param daysRetention Retention period in days
   */
  async cleanupAuditLogs(daysRetention = 90) {
    logger.info("maintenance.cleanup_audit_logs.start", { daysRetention });

    // Using batch delete to avoid locking the table for too long if huge
    // But for simplicity/maintenance, a direct DELETE with LIMIT is safer if loop needed.
    // Here we do a single query assuming reasonable volume or nightly job.

    try {
        const sql = `DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`;
        const result: any = await query(sql, [daysRetention]);

        logger.info("maintenance.cleanup_audit_logs.done", {
            deletedCount: result.affectedRows
        });
        return { deletedCount: result.affectedRows };
    } catch (error) {
        logger.error("maintenance.cleanup_audit_logs.failed", { error });
        throw error;
    }
  },

  /**
   * Cleanup temporary auth tokens or sessions if stored in DB
   * (Assuming 'sessions' table or similar if exists, otherwise placeholder)
   */
  async cleanupExpiredSessions() {
      // Placeholder if table doesn't exist yet
      // await query("DELETE FROM sessions WHERE expires_at < NOW()");
      return { deletedCount: 0 };
  }
};
