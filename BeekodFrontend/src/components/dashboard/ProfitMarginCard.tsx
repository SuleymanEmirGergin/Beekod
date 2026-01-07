import { useQuery } from '@tanstack/react-query';
import { getProfitMargins, ProfitMarginData } from '../../services/analytics';
import { TrendingUp, DollarSign } from 'lucide-react';

export function ProfitMarginCard() {
    const { data: margins, isLoading, isError } = useQuery<ProfitMarginData[]>({
        queryKey: ['profitMargins'],
        queryFn: getProfitMargins
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-gray-100 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (isError || !margins || margins.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kar Marjı Analizi</h3>
                <p className="text-sm text-gray-500">Henüz kar marjı verisi yok</p>
            </div>
        );
    }

    const topMargins = margins.slice(0, 5);
    const avgMargin = margins.reduce((sum: number, m: ProfitMarginData) => sum + (m.profit_margin_percent || 0), 0) / margins.length;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Kar Marjı Analizi</h3>
                    <p className="text-sm text-gray-500">En karlı ürünler</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">
                        Ort. %{avgMargin.toFixed(1)}
                    </span>
                </div>
            </div>

            <div className="space-y-3">
                {topMargins.map((margin: ProfitMarginData, index: number) => (
                    <div
                        key={margin.barcode}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {margin.name}
                            </p>
                            <p className="text-xs text-gray-500">
                                {margin.category} • {margin.total_sold} satış
                            </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-green-600">
                                %{margin.profit_margin_percent.toFixed(1)}
                            </p>
                            <p className="text-xs text-gray-500">
                                ₺{margin.profit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} kar
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {margins.length > 5 && (
                <div className="mt-4 text-center">
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Tümünü Göster ({margins.length} ürün)
                    </button>
                </div>
            )}
        </div>
    );
}
