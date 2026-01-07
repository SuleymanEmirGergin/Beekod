import { query } from '../db.js';
import { logger } from '../logger.js';

export interface NotificationPayload {
  title: string;
  message: string;
  type: 'stock_alert' | 'order_update' | 'price_change' | 'sync_status' | 'ai_recommendation' | 'system';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  metadata?: any;
}

export const notificationService = {
  /**
   * Phase 10: Send a notification based on user preferences
   */
  async notify(payload: { title: string; message: string; type: string; metadata?: any }): Promise<void> {
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
    const preferences = await query<any[]>('SELECT * FROM notification_settings WHERE event_type = ? AND enabled = 1', [payload.type]);

    for (const pref of preferences) {
      await this.dispatch(pref.channel, payload, pref.config_json);
    }
  },

  mapType(type: string): any {
    const allowed = ['stock_alert', 'order_update', 'price_change', 'sync_status', 'ai_recommendation', 'system'];
    if (type === 'low_stock') return 'stock_alert';
    if (type === 'shipping_update') return 'order_update';
    return allowed.includes(type) ? type : 'system';
  },

  /**
   * Phase 10: Dispatch to external channels (now with real email)
   */
  async dispatch(channel: string, payload: any, config: any): Promise<void> {
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
  async saveSettings(channel: string, eventType: string, enabled: boolean, config: any): Promise<void> {
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
  async createNotification(data: NotificationPayload): Promise<any> {
    const result = await query<any>(
      `INSERT INTO notifications (type, priority, title, message, metadata) VALUES (?, ?, ?, ?, ?)`,
      [data.type, data.priority || 'medium', data.title, data.message, JSON.stringify(data.metadata || {})]
    );
    return { id: result.insertId, ...data };
  },

  /**
   * Existing logic for routes: getNotifications
   */
  async getNotifications(limit: number = 20, includeRead: boolean = false): Promise<any[]> {
    const where = includeRead ? "" : "WHERE is_read = 0";
    return await query(`SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ?`, [limit]);
  },

  /**
   * Existing logic for routes: markAsRead
   */
  async markAsRead(id: string): Promise<boolean> {
    const result = await query<any>("UPDATE notifications SET is_read = 1 WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },

  /**
   * Existing logic for routes: markAllAsRead
   */
  async markAllAsRead(): Promise<number> {
    const result = await query<any>("UPDATE notifications SET is_read = 1 WHERE is_read = 0");
    return result.affectedRows;
  },

  /**
   * Existing logic for routes: getUnreadCount
   */
  async getUnreadCount(): Promise<number> {
    const rows = await query<any[]>("SELECT COUNT(*) as count FROM notifications WHERE is_read = 0");
    return rows[0]?.count || 0;
  },

  /**
   * Existing logic for routes: generateAIRecommendations
   */
  async generateAIRecommendations(context: any): Promise<any[]> {
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
