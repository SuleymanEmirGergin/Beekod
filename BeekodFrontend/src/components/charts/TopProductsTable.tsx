import { Trophy, TrendingUp, Package } from 'lucide-react';

interface TopProduct {
    barcode: string;
    name: string;
    category?: string;
    totalSold?: number;
    totalRevenue?: number;
    totalProfit?: number;
    profitMargin?: number;
    revenue?: number;
}

interface TopProductsTableProps {
    products: TopProduct[];
    type: 'sellers' | 'profitable';
}

export function TopProductsTable({ products, type }: TopProductsTableProps) {
    const isSellers = type === 'sellers';
    const title = isSellers ? 'En Çok Satanlar' : 'En Karlı Ürünler';
    const icon = isSellers ? <Trophy className="w-6 h-6 text-yellow-600" /> : <TrendingUp className="w-6 h-6 text-green-600" />;
    const bgColor = isSellers ? 'bg-yellow-100' : 'bg-green-100';

    return (
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center`}>
                    {icon}
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800">{title}</h3>
                    <p className="text-sm font-medium text-slate-400">Top 10 performans</p>
                </div>
            </div>

            <div className="space-y-3">
                {products.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">Henüz veri yok</p>
                    </div>
                ) : (
                    products.map((product, index) => (
                        <div
                            key={product.barcode}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${index === 0 ? 'bg-yellow-500 text-white' :
                                        index === 1 ? 'bg-slate-300 text-slate-700' :
                                            index === 2 ? 'bg-orange-400 text-white' :
                                                'bg-slate-200 text-slate-600'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800 truncate">{product.name}</p>
                                    <p className="text-xs font-medium text-slate-400">{product.category || 'Genel'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                {isSellers ? (
                                    <>
                                        <p className="text-sm font-black text-slate-800">{product.totalSold || 0} adet</p>
                                        <p className="text-xs font-medium text-green-600">₺{(product.totalRevenue || product.revenue || 0).toFixed(2)}</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm font-black text-green-600">₺{(product.totalProfit || 0).toFixed(2)}</p>
                                        <p className="text-xs font-medium text-slate-500">%{(product.profitMargin || 0).toFixed(1)} kar</p>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
