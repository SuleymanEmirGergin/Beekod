import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface SalesTrendChartProps {
    data: Array<{
        date: string;
        orderCount: number;
        revenue: number;
    }>;
}

export function SalesTrendChart({ data }: SalesTrendChartProps) {
    // Format data for display
    const formattedData = data.map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
        revenue: parseFloat(item.revenue.toFixed(2))
    }));

    return (
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800">Satış Trendleri</h3>
                        <p className="text-sm font-medium text-slate-400">Son 30 günlük performans</p>
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        style={{ fontSize: '12px', fontWeight: '600' }}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        style={{ fontSize: '12px', fontWeight: '600' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fff',
                            fontWeight: '600'
                        }}
                    />
                    <Legend
                        wrapperStyle={{
                            fontSize: '12px',
                            fontWeight: '700'
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={3}
                        name="Gelir (₺)"
                        dot={{ fill: '#10b981', r: 4 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="orderCount"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        name="Sipariş Sayısı"
                        dot={{ fill: '#3b82f6', r: 4 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
