import api from './api';

export interface ProfitableProduct {
  barcode: string;
  name: string;
  category: string;
  totalSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
}

export interface ProfitSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
}

export interface SalesTrend {
  date: string;
  orderCount: number;
  revenue: number;
}

export interface TopSeller {
  barcode: string;
  name: string;
  totalSales: number;
  revenue: number;
  stock?: number;
}

export const getTopProfitable = async (limit: number = 10, days: number = 30): Promise<ProfitableProduct[]> => {
  try {
    const { data } = await api.get(`/analytics/top-profitable?limit=${limit}&days=${days}`);
    return data.products || [];
  } catch (error) {
    console.error('API getTopProfitable failed', error);
    return [];
  }
};

export const getProfitSummary = async (days: number = 30): Promise<ProfitSummary> => {
  try {
    const { data } = await api.get(`/analytics/profit-summary?days=${days}`);
    return data.summary || { totalRevenue: 0, totalCost: 0, totalProfit: 0, profitMargin: 0 };
  } catch (error) {
    console.error('API getProfitSummary failed', error);
    return { totalRevenue: 0, totalCost: 0, totalProfit: 0, profitMargin: 0 };
  }
};

export const getSalesTrends = async (days: number = 30): Promise<SalesTrend[]> => {
  try {
    const { data } = await api.get(`/analytics/sales-trends?days=${days}`);
    return data.trends || [];
  } catch (error) {
    console.error('API getSalesTrends failed', error);
    return [];
  }
};

export const getTopSellers = async (limit: number = 10): Promise<TopSeller[]> => {
  try {
    const { data } = await api.get(`/analytics/top-sellers?limit=${limit}`);
    return data.products || [];
  } catch (error) {
    console.error('API getTopSellers failed', error);
    return [];
  }
};

export const getMarketplacePerformance = async (): Promise<any[]> => {
  try {
    const { data } = await api.get('/analytics/marketplace-performance');
    return data.performance || [];
  } catch (error) {
    console.error('API getMarketplacePerformance failed', error);
    return [];
  }
};

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  lowStockCount: number;
  revenueChange?: number;
  ordersChange?: number;
}

export interface SalesReport {
  chartData: Array<{ label: string; value: number }>;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const { data } = await api.get('/analytics/dashboard-stats');
    return data || { totalRevenue: 0, totalOrders: 0, lowStockCount: 0 };
  } catch (error) {
    console.error('API getDashboardStats failed', error);
    return { totalRevenue: 0, totalOrders: 0, lowStockCount: 0 };
  }
};

export const getSalesReport = async (period: string): Promise<SalesReport> => {
  try {
    const { data } = await api.get(`/analytics/sales-report?period=${period}`);
    return data || { chartData: [] };
  } catch (error) {
    console.error('API getSalesReport failed', error);
    return { chartData: [] };
  }
};

export interface FinancialInsight {
  type: 'warning' | 'opportunity' | 'info';
  title: string;
  description: string;
  actionText?: string;
}

export interface StockForecast {
  prediction: string;
  expenseDistribution?: Array<{
    name: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
}

export const getFinancialInsights = async (): Promise<FinancialInsight[]> => {
  try {
    const { data } = await api.get('/analytics/ai-insights');
    return data.insights || [];
  } catch (error) {
    console.error('API getFinancialInsights failed', error);
    return [];
  }
};

export const getStockForecasting = async (): Promise<StockForecast> => {
  try {
    const { data } = await api.get('/analytics/forecasting');
    return data.forecast || { prediction: 'Veri yükleniyor...' };
  } catch (error) {
    console.error('API getStockForecasting failed', error);
    return { prediction: 'Veri yüklenemedi.' };
  }
};

export interface ProfitMarginData {
  barcode: string;
  name: string;
  category: string;
  total_sold: number;
  profit_margin_percent: number;
  profit: number;
}

export const getProfitMargins = async (): Promise<ProfitMarginData[]> => {
  try {
    const { data } = await api.get('/analytics/profit-margins');
    return data.margins || [];
  } catch (error) {
    console.error('API getProfitMargins failed', error);
    return [];
  }
};

export interface RevenueData {
  date: string;
  revenue: number;
  orderCount: number;
}

export const getRevenueTimeline = async (days: number = 30): Promise<RevenueData[]> => {
  try {
    const { data } = await api.get(`/analytics/revenue-timeline?days=${days}`);
    return data.timeline || [];
  } catch (error) {
    console.error('API getRevenueTimeline failed', error);
    return [];
  }
};

export interface InventoryHealth {
  critical: number;
  outOfStock: number;
  low: number;
  normal: number;
  overstocked: number;
}

export const getInventoryHealth = async (): Promise<InventoryHealth> => {
  try {
    const { data } = await api.get('/analytics/inventory-health');
    return data.health || { critical: 0, outOfStock: 0, low: 0, normal: 0, overstocked: 0 };
  } catch (error) {
    console.error('API getInventoryHealth failed', error);
    return { critical: 0, outOfStock: 0, low: 0, normal: 0, overstocked: 0 };
  }
};
