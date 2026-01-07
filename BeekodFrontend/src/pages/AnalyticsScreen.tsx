import { SidebarV2 } from '../layouts/SidebarV2';
import { Card } from '../components/shared/';
import { Badge } from '../components/shared/';
import { Button } from '../components/shared/';
import {
  Search,
  Bell,
  HelpCircle,
  Calendar,
  Download,
  X,
  Sparkles,
  Euro,
  ShoppingBag,
  Store,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useState, useEffect } from 'react';
import {
  getDashboardStats,
  getSalesReport,
  DashboardStats,
  SalesReport,
} from '../services/analytics';

interface AnalyticsScreenProps {
  onNavigate: (screen: string) => void;
}

export function AnalyticsScreen({ onNavigate }: AnalyticsScreenProps) {
  const [showBanner, setShowBanner] = useState(true);
  const [chartView, setChartView] = useState<'revenue' | 'orders'>('revenue');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, reportData] = await Promise.all([
        getDashboardStats(),
        getSalesReport('this_month'),
      ]);
      setStats(statsData);
      setSalesReport(reportData);
    } catch (error) {
      console.error('Failed to load analytics', error);
    } finally {
      setLoading(false);
    }
  };

  // Default chart data if api fails or returns empty
  const defaultChartData = [
    { label: 'Week 1', value: 0 },
    { label: 'Week 2', value: 0 },
    { label: 'Week 3', value: 0 },
    { label: 'Week 4', value: 0 },
  ];

  const chartData = salesReport ? salesReport.chartData : defaultChartData;

  const getPercentColor = (val?: number) => (val && val >= 0 ? 'text-green-600' : 'text-red-600');
  const TrendingIcon = (val?: number) => (val && val >= 0 ? TrendingUp : TrendingDown);

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarV2
        activeItem="analytics"
        onNavigate={onNavigate}
        userName="Emir"
        userEmail="emir@beekod.com"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Sipariş, ürün veya rapor ara..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 ml-6">
              <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </button>
              <button
                onClick={() => console.log('Help clicked')}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <span>Ana Sayfa</span>
            <span>›</span>
            <span className="text-gray-900">Analitik</span>
          </div>

          {/* Page header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl text-gray-900 mb-2">Analitik Genel Bakış</h1>
              <p className="text-gray-500">
                Toptan satış performansınızı, satış trendlerinizi ve envanter sağlığınızı takip edin.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                <Calendar className="w-4 h-4" />
                Son 30 Gün
              </button>
              <Button className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Raporları Dışa Aktar
              </Button>
            </div>
          </div>

          {/* AI Insight banner */}
          {showBanner && (
            <div className="bg-gradient-to-r from-[#FFFBF0] to-[#FFF8E1] border border-[#F5E5B8] rounded-xl p-5 mb-6 relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                onClick={() => setShowBanner(false)}
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm text-gray-900 mb-1">AI Insight</h3>
                  <p className="text-sm text-gray-600">
                    Based on current velocity, stock for{' '}
                    <span className="text-gray-900">Wildflower Honey Jars (500g)</span> is projected
                    to run out in 6 days. Consider restocking soon.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Metrics grid */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            <Card padding="lg">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Euro className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {stats && (
                    <TrendingUp className={`w-3 h-3 ${getPercentColor(stats.revenueChange)}`} />
                  )}
                  <span className={getPercentColor(stats?.revenueChange)}>
                    {stats?.revenueChange ?? 0}%
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500 mb-1">Toplam Gelir</div>
              <div className="text-2xl text-gray-900">
                {stats
                  ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                    stats.totalRevenue,
                  )
                  : '...'}
              </div>
            </Card>

            <Card padding="lg">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {stats && (
                    <TrendingUp className={`w-3 h-3 ${getPercentColor(stats.ordersChange)}`} />
                  )}
                  <span className={getPercentColor(stats?.ordersChange)}>
                    {stats?.ordersChange ?? 0}%
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500 mb-1">İşlenen Siparişler</div>
              <div className="text-2xl text-gray-900">{stats?.totalOrders ?? '...'}</div>
            </Card>

            <Card padding="lg">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-400">—</span>
                </div>
              </div>
              <div className="text-sm text-gray-500 mb-1">Düşük Stok Ürünleri</div>
              <div className="text-2xl text-gray-900">{stats?.lowStockCount ?? '...'}</div>
            </Card>

            <Card padding="lg">
              {/* Keeping Return Rate separate or mocked as we don't have it in stats yet */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingDown className="w-3 h-3 text-red-600" />
                  <span className="text-red-600">+2%</span>
                </div>
              </div>
              <div className="text-sm text-gray-500 mb-1">İade Oranı</div>
              <div className="text-2xl text-gray-900">3.2%</div>
            </Card>
          </div>

          {/* Sales Performance Chart */}
          <Card padding="lg">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-lg text-gray-900 mb-1">Satış Performansı</h2>
                <p className="text-sm text-gray-500">
                  Önceki dönemle karşılaştırılmış gelir
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1.5 ${chartView === 'revenue' ? 'bg-white border border-gray-200' : 'text-sm text-gray-500 hover:bg-gray-50'} rounded-lg`}
                  onClick={() => setChartView('revenue')}
                >
                  Gelir
                </button>
                <button
                  className={`px-3 py-1.5 ${chartView === 'orders' ? 'bg-white border border-gray-200' : 'text-sm text-gray-500 hover:bg-gray-50'} rounded-lg`}
                  onClick={() => setChartView('orders')}
                >
                  Siparişler
                </button>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F5B800" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F5B800" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(value) => `€${value / 1000}k`}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`€${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#F5B800"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </main>
      </div >
    </div >
  );
}
