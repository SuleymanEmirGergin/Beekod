import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getRevenueTimeline, RevenueData } from '../../services/analytics';
import { TrendingUp, DollarSign } from 'lucide-react';

interface RevenueChartProps {
  days?: number;
}

export function RevenueChart({ days = 30 }: RevenueChartProps) {
  const {
    data: timeline,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['revenueTimeline', days],
    queryFn: () => getRevenueTimeline(days),
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !timeline) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-500">Gelir verisi yüklenemedi</p>
      </div>
    );
  }

  const totalRevenue = (timeline as RevenueData[]).reduce((sum: number, item: RevenueData) => sum + (item.revenue || 0), 0);
  const totalOrders = (timeline as RevenueData[]).reduce((sum: number, item: RevenueData) => sum + (item.orderCount || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Format data for recharts
  const chartData = (timeline as RevenueData[]).map((item: RevenueData) => ({
    date: new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
    Gelir: item.revenue || 0,
    Sipariş: item.orderCount || 0,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gelir Trendi</h3>
          <p className="text-sm text-gray-500">Son {days} günlük performans</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500">Toplam Gelir</p>
            <p className="text-lg font-bold text-green-600">
              ₺{totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Ortalama Sipariş</p>
            <p className="text-lg font-bold text-blue-600">
              ₺{avgOrderValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
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
                return `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
              }
              return value;
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="Gelir"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="Sipariş"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
