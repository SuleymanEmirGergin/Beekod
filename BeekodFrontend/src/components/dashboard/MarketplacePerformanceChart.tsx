import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getMarketplacePerformance } from '../../services/analytics';
import { Store } from 'lucide-react';

export function MarketplacePerformanceChart() {
  const {
    data: performance,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['marketplacePerformance'],
    queryFn: getMarketplacePerformance,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !performance || performance.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pazaryeri Performansı</h3>
        <p className="text-sm text-gray-500">Henüz sipariş verisi yok</p>
      </div>
    );
  }

  const chartData = performance.map((item) => ({
    name: item.marketplace || 'Diğer',
    Gelir: item.revenue || 0,
    Sipariş: item.orderCount || 0,
  }));

  const totalRevenue = performance.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalOrders = performance.reduce((sum, item) => sum + (item.orderCount || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Pazaryeri Performansı</h3>
          <p className="text-sm text-gray-500">Son 30 günlük karşılaştırma</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500">Toplam Gelir</p>
            <p className="text-lg font-bold text-purple-600">
              ₺{totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Toplam Sipariş</p>
            <p className="text-lg font-bold text-indigo-600">{totalOrders}</p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
          />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'Gelir') {
                return [`₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, name];
              }
              return [value, name];
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="Gelir" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          <Bar yAxisId="right" dataKey="Sipariş" fill="#6366f1" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Detaylı Liste */}
      <div className="mt-6 space-y-2">
        {performance.map((item, index) => {
          const revenuePercent =
            totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : 0;
          return (
            <div
              key={item.marketplace}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  {item.marketplace || 'Diğer'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{item.orderCount} sipariş</span>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    ₺{item.revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">%{revenuePercent} pay</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
