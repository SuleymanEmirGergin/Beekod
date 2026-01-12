import { query } from "../db.js";
import { logger } from "../logger.js";
import { z } from "zod";

export interface Campaign {
  id: number;
  name: string;
  type: 'email' | 'sms' | 'push';
  audience: string;
  content: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  stats_sent: number;
  stats_opened: number;
  stats_clicked: number;
  revenue: number;
  scheduled_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export const createCampaignSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['email', 'sms', 'push']),
  audience: z.string().min(1),
  content: z.string().optional(),
  scheduled_at: z.string().optional(), // ISO date string
});

export const updateCampaignSchema = createCampaignSchema.partial().extend({
  status: z.enum(['draft', 'scheduled', 'active', 'completed']).optional(),
});

export async function createCampaign(data: z.infer<typeof createCampaignSchema>) {
  const sql = `
    INSERT INTO campaigns (name, type, audience, content, scheduled_at, status)
    VALUES (?, ?, ?, ?, ?, 'draft')
  `;
  
  const params = [
    data.name, 
    data.type, 
    data.audience, 
    data.content || '', 
    data.scheduled_at ? new Date(data.scheduled_at) : null
  ];

  try {
    const result = await query<any>(sql, params);
    return { id: result.insertId, ...data, status: 'draft' };
  } catch (error) {
    logger.error("campaignService.create_failed", { err: error });
    throw error;
  }
}

export async function getCampaigns(limit = 50, offset = 0) {
  const sql = `SELECT * FROM campaigns ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  return query<Campaign[]>(sql, [limit, offset]);
}

export async function getCampaignById(id: string) {
  const sql = `SELECT * FROM campaigns WHERE id = ?`;
  const rows = await query<Campaign[]>(sql, [id]);
  return rows[0] || null;
}

export async function updateCampaign(id: string, data: z.infer<typeof updateCampaignSchema>) {
  // Dynamic update query builder
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(key === 'scheduled_at' ? new Date(value as string) : value);
    }
  });

  if (fields.length === 0) return null;

  values.push(id);
  const sql = `UPDATE campaigns SET ${fields.join(', ')} WHERE id = ?`;

  await query(sql, values);
  return getCampaignById(id);
}

export async function launchCampaign(id: string) {
  // 1. Get campaign
  const campaign = await getCampaignById(id);
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status !== 'draft') throw new Error("Only draft campaigns can be launched");

  // 2. Mock sending logic (In real app, trigger queue/worker)
  logger.info(`Launching campaign ${id} (${campaign.type}) to ${campaign.audience}`);

  // 3. Update status to active
  const sql = `UPDATE campaigns SET status = 'active', stats_sent = 0 WHERE id = ?`;
  await query(sql, [id]);

  return { ...campaign, status: 'active' };
}

export async function getCampaignStats() {
    const sql = `
        SELECT 
            COUNT(*) as total_campaigns,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_campaigns,
            SUM(stats_sent) as total_sent,
            SUM(revenue) as total_revenue
        FROM campaigns
    `;
    const rows = await query<any[]>(sql);
    return rows[0];
}
