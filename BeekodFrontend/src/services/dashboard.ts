import api from './api';

export interface DashboardMetrics {
  todaysOrders: {
    value: string;
    trend: string;
    trendDirection: 'up' | 'down';
  };
  lowStockAlerts: {
    value: string;
    count: number;
    status: string;
  };
  priceChanges: {
    value: string;
    status: string;
  };
  syncStatus: {
    value: string;
    status: string;
  };
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'sync' | 'price' | 'alert';
  title: string;
  description: string;
  time: string;
  details?: any;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentActivity: RecentActivity[];
}

export const getDashboardData = async (): Promise<DashboardData> => {
  // Legacy endpoint support or placeholder
  const response = await api.get<DashboardData>('/dashboard/summary');
  return response.data;
};

// Mock data provider for legacy dashboard
export const getMockDashboardData = async (): Promise<DashboardData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        metrics: {
          todaysOrders: { value: '142', trend: '12%', trendDirection: 'up' },
          lowStockAlerts: { value: '8 Items', count: 8, status: 'Needs Action' },
          priceChanges: { value: '15', status: 'Pending' },
          syncStatus: { value: 'All Synced', status: 'Connected' },
        },
        recentActivity: [
          {
            id: '1',
            type: 'order',
            title: 'Order #8821 shipped via FedEx',
            description: 'Processed by Warehouse Team',
            time: '2 mins ago',
            details: {
              orderId: '8821',
              customer: 'John Smith',
              amount: '€1,234.50',
              status: 'Shipped',
            },
          },
          {
            id: '2',
            type: 'alert',
            title: 'Stock alert: SKU-201 fell below threshold',
            description: 'Inventory Monitoring',
            time: '3 hours ago',
          },
        ],
      });
    }, 1000);
  });
};

// --- NEW DASHBOARD TYPES ---

export interface DashboardStats {
  orders: number;
  revenue: number;
  returns: number;
  profit: number;
  currency: string;
}

export interface ChartDataPoint {
  label: string;
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
    icon?: string;
  };
  productName: string;
  date: string;
  price: number;
  currency: string;
  status: string;
}

export interface NewDashboardData {
  stats: DashboardStats;
  chartData: ChartDataPoint[];
  topProducts: TopSellingProduct[];
  marketplaceOrders: MarketplaceOrder[];
}

export const getNewDashboardData = async (): Promise<NewDashboardData> => {
  try {
    const response = await api.get<NewDashboardData>('/dashboard');
    return response.data;
  } catch (error) {
    // Fallback to mock data if API fails
    console.warn('Dashboard API failed, using mock data:', error);
    return {
      stats: {
        orders: 142,
        revenue: 245600,
        returns: 8,
        profit: 77200,
        currency: 'TL',
      },
      chartData: [
        { label: 'Pzt', orders: 45, revenue: 12500 },
        { label: 'Sal', orders: 52, revenue: 15200 },
        { label: 'Çar', orders: 38, revenue: 10800 },
        { label: 'Per', orders: 61, revenue: 18900 },
        { label: 'Cum', orders: 48, revenue: 14200 },
        { label: 'Cmt', orders: 35, revenue: 9500 },
        { label: 'Paz', orders: 28, revenue: 7800 },
      ],
      topProducts: [
        {
          id: '1',
          name: 'Kablosuz Kulaklık V5',
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100',
          orders: 245,
          quantity: 245,
          revenue: 61250,
        },
        {
          id: '2',
          name: 'Akıllı Saat Pro',
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100',
          orders: 189,
          quantity: 189,
          revenue: 47250,
        },
        {
          id: '3',
          name: 'USB-C Hızlı Şarj',
          image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=100',
          orders: 156,
          quantity: 312,
          revenue: 15600,
        },
      ],
      marketplaceOrders: [
        {
          id: '1',
          orderNumber: 'TY-8821',
          marketplace: { name: 'Trendyol' },
          productName: 'Kablosuz Kulaklık V5',
          date: '2024-01-15',
          price: 250,
          currency: 'TL',
          status: 'Shipped',
        },
        {
          id: '2',
          orderNumber: 'HB-4512',
          marketplace: { name: 'Hepsiburada' },
          productName: 'Akıllı Saat Pro',
          date: '2024-01-15',
          price: 450,
          currency: 'TL',
          status: 'Processing',
        },
      ],
    };
  }
};
