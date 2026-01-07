import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useState } from 'react';
import { DashboardStats, ChartDataPoint } from '../../services/dashboard';

interface OrdersChartWidgetProps {
  stats: DashboardStats;
  chartData: ChartDataPoint[];
}

export function OrdersChartWidget({ stats, chartData }: OrdersChartWidgetProps) {
  const [period, setPeriod] = useState('Tümü');

  const formatCurrency = (val: number) => {
    // Simple formatter: 63.6k formatting logic
    if (val >= 1000) return `₺${(val / 1000).toFixed(1)}k`;
    return `₺${val}`;
  };

  const CustomBar = (props: any) => {
    const { x, y, width, height } = props;
    // Rounded top bars
    return (
      <path
        d={`M${x},${y + height} L${x},${y + 10} Q${x},${y} ${x + width / 2},${y} Q${x + width},${y} ${x + width},${y + 10} L${x + width},${y + height} Z`}
        fill="#10B981"
      />
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-gray-900 font-semibold">Siparişler</h3>
        <div className="flex bg-white border border-gray-200 rounded-lg p-1 text-xs">
          {['Tümü', '1A', '6A', '1Y'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md transition-colors ${period === p ? 'bg-[#2E3A59] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-8 text-center divide-x divide-gray-100 border-b border-gray-100 pb-6">
        <div>
          <p className="text-2xl font-bold text-gray-900">{stats.orders}</p>
          <p className="text-gray-500 text-xs mt-1">Siparişler</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.revenue)}</p>
          <p className="text-gray-500 text-xs mt-1">Kazançlar</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{stats.returns}</p>
          <p className="text-gray-500 text-xs mt-1">İadeler</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#10B981]">{formatCurrency(stats.profit)}</p>
          <p className="text-gray-500 text-xs mt-1">Kâr</p>
        </div>
      </div>

      <div className="h-[300px] w-full relative">
        <span className="absolute -left-8 top-1/2 -rotate-90 text-xs text-gray-400">
          Siparişler
        </span>
        <span className="absolute -right-8 top-1/2 -rotate-90 text-xs text-gray-400">
          Kazançlar
        </span>

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={40}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Bar yAxisId="left" dataKey="orders" fill="#10B981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
