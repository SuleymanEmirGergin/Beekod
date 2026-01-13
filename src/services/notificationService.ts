import { query } from '../db.js';
import { logger } from '../logger.js';
import { ResultSetHeader } from 'mysql2';

interface NotificationMetadata {
  [key: string]: unknown;
}

export interface NotificationPayload {
  title: string;
  message: string;
  type: 'stock_alert' | 'order_update' | 'price_change' | 'sync_status' | 'ai_recommendation' | 'system';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  metadata?: NotificationMetadata;
}

interface NotificationSetting {
  channel: string;
  event_type: string;
  enabled: number;
  config_json: string;
}

interface NotificationConfig {
  to?: string;
  url?: string;
  [key: string]: unknown;
}

interface DispatchPayload {
  title: string;
  message: string;
  type: string;
  metadata?: NotificationMetadata;
}

interface NotificationRow {
  id: number;
  type: string;
  priority: string;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
  metadata: string;
}

interface CountRow {
  count: number;
}

interface AIRecommendationContext {
  lowStockProducts?: number;
  pendingOrders?: number;
  [key: string]: unknown;
}

export const notificationService = {
  /**
   * Phase 10: Send a notification based on user preferences
   */
  async notify(payload: DispatchPayload): Promise<void> {
    logger.info('notificationService.notify', { type: payload.type, title: payload.title });

    // Step 1: Create in-app notification by default
    await this.createNotification({
      title: payload.title,
      message: payload.message,
      type: this.mapType(payload.type),
      priority: 'medium',
      metadata: payload.metadata
    });

    // Step 2: Check preferences for external channels
    const preferences = await query<NotificationSetting[]>('SELECT * FROM notification_settings WHERE event_type = ? AND enabled = 1', [payload.type]);

    for (const pref of preferences) {
      const config = JSON.parse(pref.config_json || '{}') as NotificationConfig;
      await this.dispatch(pref.channel, payload, config);
    }
  },

  mapType(type: string): NotificationPayload['type'] {
    const allowed: NotificationPayload['type'][] = ['stock_alert', 'order_update', 'price_change', 'sync_status', 'ai_recommendation', 'system'];
    if (type === 'low_stock') return 'stock_alert';
    if (type === 'shipping_update') return 'order_update';
    return allowed.includes(type as NotificationPayload['type']) ? (type as NotificationPayload['type']) : 'system';
  },

  /**
   * Phase 10: Dispatch to external channels (now with real email)
   */
  async dispatch(channel: string, payload: DispatchPayload, config: NotificationConfig): Promise<void> {
    logger.info('notificationService.dispatching', { channel, type: payload.type });

    switch (channel) {
      case 'email':
        const { sendEmail } = await import('./emailClient.js');
        await sendEmail({
          to: config?.to || process.env.ADMIN_EMAIL || 'admin@beekod.com',
          subject: payload.title,
          html: `<h2>${payload.title}</h2><p>${payload.message}</p>`
        });
        break;
      case 'webhook':
        // Real HTTP request
        if (config?.url) {
          try {
            const response = await fetch(config.url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            logger.info('notification.webhook_sent', { url: config.url, status: response.status });
          } catch (error) {
            logger.error('notification.webhook_failed', { url: config.url, error });
          }
        }
        break;
    }
  },

  /**
   * Save settings
   */
  async saveSettings(channel: string, eventType: string, enabled: boolean, config: NotificationConfig): Promise<void> {
    await query(
      `INSERT INTO notification_settings (channel, event_type, enabled, config_json) 
             VALUES (?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), config_json = VALUES(config_json)`,
      [channel, eventType, enabled ? 1 : 0, JSON.stringify(config)]
    );
  },

  /**
   * Existing logic for routes: createNotification
   */
  async createNotification(data: NotificationPayload): Promise<{ id: number } & NotificationPayload> {
    const result = await query<ResultSetHeader>(
      `INSERT INTO notifications (type, priority, title, message, metadata) VALUES (?, ?, ?, ?, ?)`,
      [data.type, data.priority || 'medium', data.title, data.message, JSON.stringify(data.metadata || {})]
    );
    return { id: result.insertId, ...data };
  },

  /**
   * Existing logic for routes: getNotifications
   */
  async getNotifications(limit: number = 20, includeRead: boolean = false): Promise<NotificationRow[]> {
    const where = includeRead ? "" : "WHERE is_read = 0";
    return await query<NotificationRow[]>(`SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ?`, [limit]);
  },

  /**
   * Existing logic for routes: markAsRead
   */
  async markAsRead(id: string): Promise<boolean> {
    const result = await query<ResultSetHeader>("UPDATE notifications SET is_read = 1 WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },

  /**
   * Existing logic for routes: markAllAsRead
   */
  async markAllAsRead(): Promise<number> {
    const result = await query<ResultSetHeader>("UPDATE notifications SET is_read = 1 WHERE is_read = 0");
    return result.affectedRows;
  },

  /**
   * Existing logic for routes: getUnreadCount
   */
  async getUnreadCount(): Promise<number> {
    const rows = await query<CountRow[]>("SELECT COUNT(*) as count FROM notifications WHERE is_read = 0");
    return rows[0]?.count || 0;
  },

  /**
   * Existing logic for routes: generateAIRecommendations
   */
  async generateAIRecommendations(context: AIRecommendationContext): Promise<{ type: string; priority: string; title: string; message: string }[]> {
    // Simulated AI recommendations logic
    return [
      {
        type: 'ai_recommendation',
        priority: 'medium',
        title: 'Stok Optimizasyonu',
        message: `${context.lowStockProducts} ürün için stok seviyeleri düşük. Sipariş vermenizi öneririm.`
      },
      {
        type: 'ai_recommendation',
        priority: 'high',
        title: 'Fiyat Fırsatı',
        message: `${context.pendingOrders} adet bekleyen siparişiniz var. Karlılığı artırmak için fiyatları %2 güncelleyebilirsiniz.`
      }
    ];
  }
};

// Export individual functions for route support
export const createNotification = notificationService.createNotification.bind(notificationService);
export const getNotifications = notificationService.getNotifications.bind(notificationService);
export const markAsRead = notificationService.markAsRead.bind(notificationService);
export const markAllAsRead = notificationService.markAllAsRead.bind(notificationService);
export const getUnreadCount = notificationService.getUnreadCount.bind(notificationService);
export const generateAIRecommendations = notificationService.generateAIRecommendations.bind(notificationService);
