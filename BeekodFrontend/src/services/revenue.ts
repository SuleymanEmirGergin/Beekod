import api from './api';

export interface PriceRecommendation {
  barcode: string;
  name: string;
  stock: number;
  currentPrice: number;
  suggestedPrice: number;
  currency: string;
  reason: string;
  aiInsight?: string;
  competitors: Array<{
    platform: string;
    price: number;
    currency: string;
  }>;
}

export interface CustomerLTV {
  customerEmail: string;
  totalSpent: number;
  orderCount: number;
  avgOrderValue: number;
  predictedLTV: number;
  segment: 'VIP' | 'Loyal' | 'Regular' | 'At Risk';
}

export interface BundleSuggestion {
  products: string[];
  occurrenceCount: number;
  recommendedPrice: number;
  savingsPercent: number;
}

export interface RevenueInsight {
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  actionLabel?: string;
}

export const getPriceRecommendations = async (): Promise<PriceRecommendation[]> => {
  const response = await api.get('/revenue/dynamic-pricing');
  return response.data.recommendations;
};

export const getCustomerLTV = async (): Promise<CustomerLTV[]> => {
  const response = await api.get('/revenue/ltv');
  return response.data.customers;
};

export const getBundleSuggestions = async (): Promise<BundleSuggestion[]> => {
  const response = await api.get('/revenue/bundles');
  return response.data.bundles;
};

export const getRevenueInsights = async (locale: string = 'tr'): Promise<RevenueInsight[]> => {
  const response = await api.get(`/revenue/insights?locale=${locale}`);
  return response.data.insights;
};

export const applyPriceRecommendation = async (
  barcode: string,
  suggestedPrice: number,
): Promise<any> => {
  // 1. Update price in local DB
  const updateRes = await api.put(`/products/${barcode}/price`, {
    value: suggestedPrice,
    action: 'set',
  });

  // 2. Sync to marketplaces
  const syncRes = await api.post(`/${barcode}/sync`);

  return { update: updateRes.data, sync: syncRes.data };
};
