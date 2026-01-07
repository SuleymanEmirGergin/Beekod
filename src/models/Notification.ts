export interface INotification {
  id?: number;
  type: "stock_alert" | "order_update" | "price_change" | "sync_status" | "ai_recommendation" | "system";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  metadata?: any;
  is_read: boolean;
  expires_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

// Map database row to INotification object
export function mapNotification(row: any): INotification {
  return {
    id: row.id,
    type: row.type,
    priority: row.priority,
    title: row.title,
    message: row.message,
    action_url: row.action_url,
    action_label: row.action_label,
    metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata,
    is_read: Boolean(row.is_read),
    expires_at: row.expires_at ? new Date(row.expires_at) : undefined,
    created_at: row.created_at ? new Date(row.created_at) : undefined,
    updated_at: row.updated_at ? new Date(row.updated_at) : undefined,
  };
}
