import React, { useEffect, useState } from 'react';
import { TrendingDown, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import api from '../../services/api';

interface ForecastItem {
    barcode: string;
    product_name: string;
    stock: number;
    daily_velocity: number;
    days_remaining: number;
    status: 'critical' | 'low' | 'healthy';
}

export const ForecastingWidget: React.FC = () => {
    const [forecast, setForecast] = useState<ForecastItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchForecast = async () => {
            try {
                const res = await api.get('/analytics/forecasting');
                if (res.data.status === 'ok') {
                    setForecast(res.data.forecast);
                }
            } catch (err) {
                console.error("Failed to load forecast", err);
            } finally {
                setLoading(false);
            }
        };
        fetchForecast();
    }, []);

    if (loading) return <div className="p-4 text-center text-gray-400">Yükleniyor...</div>;
    if (forecast.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-50 rounded-lg">
                    <TrendingDown className="text-purple-600" size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Stok Tahminleri</h3>
                    <p className="text-sm text-gray-500">Tükenme riski taşıyan ürünler</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                            <th className="pb-3 pl-2">Ürün</th>
                            <th className="pb-3">Mevcut Stok</th>
                            <th className="pb-3">Günlük Satış</th>
                            <th className="pb-3">Kalan Gün</th>
                            <th className="pb-3">Durum</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {forecast.map((item) => (
                            <tr key={item.barcode} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 pl-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                            <Package size={16} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 line-clamp-1">{item.product_name}</p>
                                            <p className="text-xs text-gray-400 font-mono">{item.barcode}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 font-medium text-gray-700">{item.stock}</td>
                                <td className="py-4 text-gray-600">{item.daily_velocity} / gün</td>
                                <td className="py-4">
                                    <span className={`font-bold ${item.days_remaining <= 7 ? 'text-red-600' : 'text-orange-600'
                                        }`}>
                                        {item.days_remaining === 999 ? '∞' : `${item.days_remaining} Gün`}
                                    </span>
                                </td>
                                <td className="py-4">
                                    {item.status === 'critical' && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                            <AlertTriangle size={12} /> Kritik
                                        </span>
                                    )}
                                    {item.status === 'low' && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                                            <TrendingDown size={12} /> Azalıyor
                                        </span>
                                    )}
                                    {item.status === 'healthy' && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                            <CheckCircle size={12} /> İyi
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
