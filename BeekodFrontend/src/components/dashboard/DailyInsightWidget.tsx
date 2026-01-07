import { useQuery } from '@tanstack/react-query';
import { getDailyBrief } from '../../services/intelligence';
import { Sparkles, TrendingUp, TrendingDown, AlertCircle, Loader2 } from 'lucide-react';

export function DailyInsightWidget() {
    const {
        data: brief,
        isLoading,
        isError,
        refetch
    } = useQuery({
        queryKey: ['dailyBrief'],
        queryFn: getDailyBrief,
        staleTime: 1000 * 60 * 30, // 30 minutes
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <div className="flex items-center gap-4 animate-pulse">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl"></div>
                    <div className="flex-1">
                        <div className="h-4 bg-gray-100 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-50 rounded w-1/4"></div>
                    </div>
                </div>
                <div className="mt-8 space-y-3">
                    <div className="h-3 bg-gray-50 rounded w-full"></div>
                    <div className="h-3 bg-gray-50 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-50 rounded w-4/6"></div>
                </div>
            </div>
        );
    }

    if (isError || !brief) {
        return null; // Don't show if failed
    }

    return (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            {/* Decorative Gradient Blob */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-400/10 rounded-full blur-3xl group-hover:bg-yellow-400/20 transition-all duration-500"></div>

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-100">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold font-display text-gray-900">{brief.title}</h3>
                        <p className="text-sm text-gray-500">{brief.subtitle}</p>
                    </div>
                </div>
                <button
                    onClick={() => refetch()}
                    className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-yellow-600"
                >
                    <Loader2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {brief.metrics?.map((metric, idx) => (
                    <div key={idx} className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{metric.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                        </div>
                        {metric.trend && (
                            <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold ${metric.trendType === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                {metric.trendType === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {metric.trend}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-100 italic text-gray-700 leading-relaxed text-sm">
                <span className="text-2xl text-yellow-500 font-serif mr-2">"</span>
                {brief.narrative}
                <span className="text-2xl text-yellow-500 font-serif ml-1">"</span>
            </div>
        </div>
    );
}
