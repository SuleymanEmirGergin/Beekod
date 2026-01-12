import { pool } from "../db.js";
import { logger } from "../logger.js";
import { AuditLog } from "./types.js";

/**
 * Audit Service
 * 
 * PROMPTtaki kural: Write (değişiklik) işlemleri zorunlu audit/log.
 * Format: kim, ne, nerede, eski->yeni, zaman (Europe/Istanbul)
 */
export class AuditService {
    /**
     * Audit log kaydı oluştur
     */
    async log(logData: Omit<AuditLog, "timestamp">): Promise<void> {
        try {
            const timestamp = new Date();

            const fullLog: AuditLog = {
                ...logData,
                timestamp,
            };

            // Database'e kaydet
            await this.saveToDatabase(fullLog);

            // Logger'a da kaydet
            logger.info("audit.logged", {
                userId: logData.userId,
                action: logData.action,
                entity: logData.entity,
                entityId: logData.entityId,
            });
        } catch (error) {
            logger.error("audit.log_failed", { error, logData });
            // Audit log fail etse bile ana işlemi engelleme
        }
    }

    /**
     * Database'e audit log kaydet
     */
    private async saveToDatabase(log: AuditLog): Promise<void> {
        const query = `
      INSERT INTO chat_audit_logs (
        user_id,
        session_id,
        action,
        entity,
        entity_id,
        old_value,
        new_value,
        metadata,
        ip_address,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const values = [
            log.userId || null,
            log.sessionId,
            log.action,
            log.entity,
            log.entityId || null,
            log.oldValue ? JSON.stringify(log.oldValue) : null,
            log.newValue ? JSON.stringify(log.newValue) : null,
            log.metadata ? JSON.stringify(log.metadata) : null,
            log.ipAddress || null,
            this.toIstanbulTime(log.timestamp),
        ];

        await pool.execute(query, values);
    }

    /**
     * Audit log sorgula
     */
    async queryLogs(filters: {
        userId?: string;
        sessionId?: string;
        entity?: string;
        action?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<AuditLog[]> {
        let query = `
      SELECT 
        user_id,
        session_id,
        action,
        entity,
        entity_id,
        old_value,
        new_value,
        metadata,
        ip_address,
        created_at as timestamp
      FROM chat_audit_logs
      WHERE 1=1
    `;

        const values: any[] = [];

        if (filters.userId) {
            query += " AND user_id = ?";
            values.push(filters.userId);
        }

        if (filters.sessionId) {
            query += " AND session_id = ?";
            values.push(filters.sessionId);
        }

        if (filters.entity) {
            query += " AND entity = ?";
            values.push(filters.entity);
        }

        if (filters.action) {
            query += " AND action = ?";
            values.push(filters.action);
        }

        if (filters.startDate) {
            query += " AND created_at >= ?";
            values.push(this.toIstanbulTime(filters.startDate));
        }

        if (filters.endDate) {
            query += " AND created_at <= ?";
            values.push(this.toIstanbulTime(filters.endDate));
        }

        query += " ORDER BY created_at DESC";

        if (filters.limit) {
            query += " LIMIT ?";
            values.push(filters.limit);
        }

        const [rows] = await pool.execute(query, values);

        return (rows as any[]).map((row) => ({
            userId: row.user_id,
            sessionId: row.session_id,
            action: row.action,
            entity: row.entity,
            entityId: row.entity_id,
            oldValue: row.old_value ? JSON.parse(row.old_value) : undefined,
            newValue: row.new_value ? JSON.parse(row.new_value) : undefined,
            metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
            ipAddress: row.ip_address,
            timestamp: new Date(row.timestamp),
        }));
    }

    /**
     * Specific entity için audit trail
     */
    async getEntityAuditTrail(entity: string, entityId: string, limit = 50): Promise<AuditLog[]> {
        return this.queryLogs({ entity, limit });
    }

    /**
     * User activity logs
     */
    async getUserActivity(userId: string, limit = 100): Promise<AuditLog[]> {
        return this.queryLogs({ userId, limit });
    }

    /**
     * Convert to Europe/Istanbul timezone
     */
    private toIstanbulTime(date: Date): string {
        // MySQL DATETIME formatı için: YYYY-MM-DD HH:MM:SS
        return date.toLocaleString("en-CA", {
            timeZone: "Europe/Istanbul",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        }).replace(",", "");
    }

    /**
     * Helper: Price update audit
     */
    async logPriceUpdate(data: {
        userId?: string;
        sessionId: string;
        barcode: string;
        oldPrice: number;
        newPrice: number;
        marketplace?: string;
    }): Promise<void> {
        await this.log({
            userId: data.userId,
            sessionId: data.sessionId,
            action: "price_update",
            entity: "product",
            entityId: data.barcode,
            oldValue: { price: data.oldPrice },
            newValue: { price: data.newPrice },
            metadata: { marketplace: data.marketplace },
        });
    }

    /**
     * Helper: Stock update audit
     */
    async logStockUpdate(data: {
        userId?: string;
        sessionId: string;
        barcode: string;
        oldStock: number;
        newStock: number;
        marketplace?: string;
    }): Promise<void> {
        await this.log({
            userId: data.userId,
            sessionId: data.sessionId,
            action: "stock_update",
            entity: "product",
            entityId: data.barcode,
            oldValue: { stock: data.oldStock },
            newValue: { stock: data.newStock },
            metadata: { marketplace: data.marketplace },
        });
    }

    /**
     * Helper: Message send audit
     */
    async logMessageSend(data: {
        userId?: string;
        sessionId: string;
        fromWholesalerId: number;
        toWholesalerId: number;
        barcode?: string;
        includePhone: boolean;
        phone?: string;
    }): Promise<void> {
        await this.log({
            userId: data.userId,
            sessionId: data.sessionId,
            action: "message_send",
            entity: "wholesaler_message",
            entityId: `${data.fromWholesalerId}->${data.toWholesalerId}`,
            newValue: {
                barcode: data.barcode,
                includePhone: data.includePhone,
                phoneShared: data.includePhone ? "***" + (data.phone?.slice(-4) || "") : false,
            },
        });
    }

    /**
     * Helper: Batch operation audit
     */
    async logBatchOperation(data: {
        userId?: string;
        sessionId: string;
        action: string;
        affectedCount: number;
        details?: any;
    }): Promise<void> {
        await this.log({
            userId: data.userId,
            sessionId: data.sessionId,
            action: data.action,
            entity: "batch_operation",
            newValue: {
                affectedCount: data.affectedCount,
                details: data.details,
            },
        });
    }
}

// Singleton instance
export const auditService = new AuditService();
