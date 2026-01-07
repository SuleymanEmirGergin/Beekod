import api from './api';

export interface MarketTrend {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface MarketIntelligence {
  trends: MarketTrend[];
  hotKeywords: string[];
  recommendation: string;
}

export interface DashboardSummary {
  title: string;
  subtitle: string;
  metrics: {
    label: string;
    value: string;
    trend?: string;
    trendType?: 'up' | 'down' | 'neutral';
  }[];
  narrative: string;
}

export interface ActionItem {
  id: string;
  type: 'stock' | 'price' | 'review' | 'order';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium';
  actionLabel: string;
  actionTarget: string;
}

export const getMarketTrends = async (category?: string): Promise<MarketIntelligence> => {
  const res = await api.get(`/intelligence/trends${category ? `?category=${category}` : ''}`);
  return res.data.data;
};

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const res = await api.get('/intelligence/summary');
  return res.data;
};

export const getActionItems = async (): Promise<ActionItem[]> => {
  const res = await api.get('/intelligence/actions');
  return res.data;
};

export const getDailyBrief = async (): Promise<DashboardSummary> => {
  const res = await api.get('/intelligence/daily-brief');
  return res.data;
};
