import api from './api';

export interface Campaign {
  id: number;
  name: string;
  type: 'email' | 'sms' | 'push';
  audience: string;
  content?: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  stats_sent: number;
  stats_opened: number;
  stats_clicked: number;
  revenue: number;
  scheduled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignData {
  name: string;
  type: 'email' | 'sms' | 'push';
  audience: string;
  content?: string;
  scheduled_at?: string;
}

export type UpdateCampaignData = Partial<CreateCampaignData> & { status?: string };

export async function getCampaigns(limit = 20, offset = 0): Promise<Campaign[]> {
  const response = await api.get(`/campaigns?limit=${limit}&offset=${offset}`);
  return response.data;
}

export async function getCampaignStats(): Promise<any> {
    const response = await api.get('/campaigns/stats-summary');
    return response.data;
}

export async function getCampaignById(id: string): Promise<Campaign> {
  const response = await api.get(`/campaigns/${id}`);
  return response.data;
}

export async function createCampaign(data: CreateCampaignData): Promise<Campaign> {
  const response = await api.post('/campaigns', data);
  return response.data;
}

export async function updateCampaign(id: string, data: UpdateCampaignData): Promise<Campaign> {
  const response = await api.put(`/campaigns/${id}`, data);
  return response.data;
}

export async function launchCampaign(id: string): Promise<Campaign> {
  const response = await api.post(`/campaigns/${id}/launch`);
  return response.data.campaign;
}
