import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SidebarV2 } from '../layouts/SidebarV2';

import { SalesTrendChart } from '../components/charts/SalesTrendChart';
import { TopProductsTable } from '../components/charts/TopProductsTable';
import {
    getTopProfitable,
    getProfitSummary,
    getSalesTrends,
    getTopSellers
} from '../services/analytics';
import {
    TrendingUp,
    DollarSign,
    Percent,
    ShoppingCart,
    Calendar,
    RefreshCw
} from 'lucide-react';

interface AdvancedAnalyticsScreenProps {
    onNavigate: (screen: string) => void;
}

export function AdvancedAnalyticsScreen({ onNavigate }: AdvancedAnalyticsScreenProps) {
    const [timeRange, setTimeRange] = useState(30);

    // Fetch analytics data
    const { data: salesTrends = [], isLoading: trendsLoading, refetch: refetchTrends } = useQuery({
        queryKey: ['salesTrends', timeRange],
        queryFn: () => getSalesTrends(timeRange),
    });

    const { data: topSellers = [], isLoading: sellersLoading, refetch: refetchSellers } = useQuery({
        queryKey: ['topSellers'],
        queryFn: () => getTopSellers(10),
    });

    const { data: topProfitable = [], isLoading: profitableLoading, refetch: refetchProfitable } = useQuery({
        queryKey: ['topProfitable', timeRange],
        queryFn: () => getTopProfitable(10, timeRange),
    });

    const { data: profitSummary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
        queryKey: ['profitSummary', timeRange],
        queryFn: () => getProfitSummary(timeRange),
    });

    const handleRefreshAll = () => {
        refetchTrends();
        refetchSellers();
        refetchProfitable();
        refetchSummary();
    };

    const isLoading = trendsLoading || sellersLoading || profitableLoading || summaryLoading;

    return (
        <div className="flex h-screen bg-gray-50">
            <SidebarV2
                activeItem="analytics"
                onNavigate={onNavigate}
                userName="Emir"
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">İleri Seviye Analitik</h1>
                            <p className="text-sm font-medium text-slate-400">Satış performansını detaylı incele</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(parseInt(e.target.value))}
                                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value={7}>Son 7 Gün</option>
                                <option value={30}>Son 30 Gün</option>
                                <option value={90}>Son 90 Gün</option>
                            </select>
                            <button
                                onClick={handleRefreshAll}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-black transition-all disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                Yenile
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto px-8 py-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-[32px] p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <Calendar className="w-5 h-5 opacity-50" />
                            </div>
                            <p className="text-sm font-medium opacity-90 mb-1">Toplam Gelir</p>
                            <p className="text-3xl font-black">₺{(profitSummary?.totalRevenue || 0).toFixed(2)}</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-[32px] p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <Calendar className="w-5 h-5 opacity-50" />
                            </div>
                            <p className="text-sm font-medium opacity-90 mb-1">Toplam Kar</p>
                            <p className="text-3xl font-black">₺{(profitSummary?.totalProfit || 0).toFixed(2)}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-[32px] p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <Percent className="w-6 h-6" />
                                </div>
                                <Calendar className="w-5 h-5 opacity-50" />
                            </div>
                            <p className="text-sm font-medium opacity-90 mb-1">Kar Marjı</p>
                            <p className="text-3xl font-black">%{(profitSummary?.profitMargin || 0).toFixed(1)}</p>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-[32px] p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <ShoppingCart className="w-6 h-6" />
                                </div>
                                <Calendar className="w-5 h-5 opacity-50" />
                            </div>
                            <p className="text-sm font-medium opacity-90 mb-1">Toplam Maliyet</p>
                            <p className="text-3xl font-black">₺{(profitSummary?.totalCost || 0).toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Sales Trend Chart */}
                    <div className="mb-6">
                        <SalesTrendChart data={salesTrends} />
                    </div>

                    {/* Top Products Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <TopProductsTable products={topSellers} type="sellers" />
                        <TopProductsTable products={topProfitable} type="profitable" />
                    </div>
                </main>
            </div>

            
        </div>
    );
}
