export interface ISocialPost {
  id: number;
  platform: "Instagram" | "TikTok" | "Facebook" | "Twitter" | "LinkedIn";
  content: string;
  mediaUrl?: string;
  scheduledDate: Date;
  status: "Draft" | "Scheduled" | "Posted" | "Failed";
  productId?: string;
  aiGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISocialPostDbRow {
  id: number;
  platform: "Instagram" | "TikTok" | "Facebook" | "Twitter" | "LinkedIn";
  content: string;
  media_url?: string;
  scheduled_date: string | Date;
  status: "Draft" | "Scheduled" | "Posted" | "Failed";
  product_id?: string;
  ai_generated: number | boolean;
  created_at: string | Date;
  updated_at: string | Date;
}

export function mapSocialPostRow(row: ISocialPostDbRow): ISocialPost {
  return {
    id: row.id,
    platform: row.platform,
    content: row.content,
    mediaUrl: row.media_url,
    scheduledDate: new Date(row.scheduled_date),
    status: row.status,
    productId: row.product_id,
    aiGenerated: Boolean(row.ai_generated),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
