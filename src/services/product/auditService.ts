import { query } from "../../db.js";
import { logger } from "../../logger.js";

interface AuditLogParams {
    userId?: number;
    action: string;
    entityType: string;
    entityId?: string | number;
    details?: Record<string, any>;
    ipAddress?: string;
}

export const auditService = {
    /**
     * Record a new audit log entry
     */
    async log(params: AuditLogParams) {
        try {
            await query(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    params.userId || null,
                    params.action,
                    params.entityType,
                    params.entityId || null,
                    params.details ? JSON.stringify(params.details) : null,
                    params.ipAddress || null,
                ]
            );
        } catch (error) {
            // Audit logging should not break the main flow, so we just log the error
            logger.error('Failed to create audit log:', { error, params });
        }
    },

    /**
     * Retrieve recent audit logs
     */
    async getLogs(limit = 50, offset = 0) {
        const logs = await query<any[]>(
            `SELECT a.*, u.name as user_name, u.email as user_email 
       FROM audit_logs a
       LEFT JOIN team_members u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const total = await query<any[]>(`SELECT COUNT(*) as count FROM audit_logs`);

        return {
            items: logs,
            total: total[0].count,
        };
    }
};
