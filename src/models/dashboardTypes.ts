export interface DashboardStats {
  orders: number;
  revenue: number;
  returns: number;
  profit: number;
  currency: string;
}

export interface ChartDataPoint {
  label: string; // e.g. "January", "Week 1"
  orders: number;
  revenue: number;
}

export interface TopSellingProduct {
  id: string;
  name: string;
  image: string;
  orders: number;
  quantity: number;
  revenue: number;
}

export interface MarketplaceOrder {
  id: string;
  orderNumber: string;
  marketplace: {
    name: string;
    icon?: string; // URL or base64
  };
  productName: string; // Simplification: First product name or summary
  date: string; // ISO format
  price: number;
  currency: string;
  status: string; // "YENİ", "HAZIRLANIYOR", etc.
}

export interface DashboardData {
  stats: DashboardStats;
  chartData: ChartDataPoint[]; // For the main graph
  topProducts: TopSellingProduct[];
  marketplaceOrders: MarketplaceOrder[];
}
