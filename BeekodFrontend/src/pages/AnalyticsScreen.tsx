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
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Premium Background with Mesh Gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/50" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-purple-200/20 via-pink-200/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-200/20 via-blue-200/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-amber-200/10 to-orange-200/10 rounded-full blur-3xl" />
      </div>

      <SidebarV2
        activeItem="analytics"
        onNavigate={onNavigate}
        userName="Emir"
        userEmail="emir@beekod.com"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Premium Header */}
        <header className="relative px-8 py-5 flex items-center justify-between border-b border-white/20 bg-white/40 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl blur opacity-30" />
              <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analitik Merkezi</h1>
              <p className="text-sm text-gray-500">Performans ve satış verileri</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rapor ara..."
                className="pl-9 pr-4 py-2.5 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/60 hover:bg-white/80 border border-white/40 rounded-xl text-sm text-gray-700 transition-all shadow-sm">
              <Calendar className="w-4 h-4" />
              Son 30 Gün
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl text-sm font-medium transition-all shadow-md">
              <Download className="w-4 h-4" />
              Dışa Aktar
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-8 py-6">

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
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg p-6 hover:shadow-xl transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Euro className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-xs px-2 py-1 bg-green-50 rounded-full">
                  {stats && (
                    <TrendingUp className={`w-3 h-3 ${getPercentColor(stats.revenueChange)}`} />
                  )}
                  <span className={getPercentColor(stats?.revenueChange)}>
                    {stats?.revenueChange ?? 0}%
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500 mb-1">Toplam Gelir</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats
                  ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                    stats.totalRevenue,
                  )
                  : '...'}
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg p-6 hover:shadow-xl transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 rounded-full">
                  {stats && (
                    <TrendingUp className={`w-3 h-3 ${getPercentColor(stats.ordersChange)}`} />
                  )}
                  <span className={getPercentColor(stats?.ordersChange)}>
                    {stats?.ordersChange ?? 0}%
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500 mb-1">İşlenen Siparişler</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.totalOrders ?? '...'}</div>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg p-6 hover:shadow-xl transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-50 rounded-full">
                  <span className="text-amber-600">Dikkat</span>
                </div>
              </div>
              <div className="text-sm text-gray-500 mb-1">Düşük Stok Ürünleri</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.lowStockCount ?? '...'}</div>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg p-6 hover:shadow-xl transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <RotateCcw className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-xs px-2 py-1 bg-red-50 rounded-full">
                  <TrendingDown className="w-3 h-3 text-red-600" />
                  <span className="text-red-600">+2%</span>
                </div>
              </div>
              <div className="text-sm text-gray-500 mb-1">İade Oranı</div>
              <div className="text-2xl font-bold text-gray-900">3.2%</div>
            </div>
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
