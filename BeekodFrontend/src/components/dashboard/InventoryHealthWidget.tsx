import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getInventoryHealth, InventoryHealth } from '../../services/analytics';
import { AlertTriangle, Package, TrendingDown, TrendingUp } from 'lucide-react';

const COLORS = {
  critical: '#ef4444',
  outOfStock: '#dc2626',
  low: '#f59e0b',
  normal: '#10b981',
  overstocked: '#3b82f6',
};

const LABELS = {
  critical: 'Kritik',
  outOfStock: 'Tükendi',
  low: 'Düşük',
  normal: 'Normal',
  overstocked: 'Fazla Stok',
};

export function InventoryHealthWidget() {
  const {
    data: health,
    isLoading,
    isError,
  } = useQuery<InventoryHealth>({
    queryKey: ['inventoryHealth'],
    queryFn: getInventoryHealth,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !health) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Envanter Sağlığı</h3>
        <p className="text-sm text-gray-500">Veri yüklenemedi</p>
      </div>
    );
  }

  const chartData = [
    { name: LABELS.critical, value: health.critical, color: COLORS.critical },
    { name: LABELS.outOfStock, value: health.outOfStock, color: COLORS.outOfStock },
    { name: LABELS.low, value: health.low, color: COLORS.low },
    { name: LABELS.normal, value: health.normal, color: COLORS.normal },
    { name: LABELS.overstocked, value: health.overstocked, color: COLORS.overstocked },
  ].filter((item) => item.value > 0);

  const totalProducts =
    health.critical + health.outOfStock + health.low + health.normal + health.overstocked;
  const needsAttention = health.critical + health.outOfStock + health.low;
  const healthScore = totalProducts > 0 ? ((health.normal / totalProducts) * 100).toFixed(0) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Envanter Sağlığı</h3>
          <p className="text-sm text-gray-500">{totalProducts} toplam ürün</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
          <Package className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-700">%{healthScore} Sağlıklı</span>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="grid grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Envanter verisi yok</p>
      )}

      {needsAttention > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">Dikkat Gereken Ürünler</p>
            <p className="text-xs text-amber-700 mt-1">
              {needsAttention} ürün kritik, tükenmiş veya düşük stok seviyesinde
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
