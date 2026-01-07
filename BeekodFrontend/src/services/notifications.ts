import api from './api';

export interface Notification {
  _id: string | number;
  type:
  | 'stock_alert'
  | 'order_update'
  | 'price_change'
  | 'sync_status'
  | 'ai_recommendation'
  | 'system';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
}

export async function getNotifications(limit = 20, includeRead = false): Promise<Notification[]> {
  const response = await api.get(`/notifications?limit=${limit}&includeRead=${includeRead}`);
  const items = response.data?.notifications;
  return Array.isArray(items) ? items : [];
}

export async function getUnreadCount(): Promise<number> {
  const response = await api.get(`/notifications/unread-count`);
  const count = response.data?.count;
  return Number.isFinite(count) ? count : 0;
}

export async function markAsRead(id: string | number): Promise<boolean> {
  const response = await api.post(`/notifications/${id}/mark-read`);
  return response.data.success;
}

export async function markAllAsRead(): Promise<boolean> {
  const response = await api.post(`/notifications/mark-all-read`);
  return response.data.success;
}

export async function generateAIRecommendations(): Promise<Notification[]> {
  const response = await api.post(`/notifications/generate-recommendations`);
  return response.data.recommendations;
}

export const markNotificationAsRead = markAsRead;
export const markAllNotificationsAsRead = markAllAsRead;
