import React, { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';

interface DailyBrief {
    title: string;
    subtitle: string;
    narrative: string;
    metrics: {
        label: string;
        value: string;
        trend?: string;
        trendType?: 'up' | 'down' | 'neutral';
    }[];
}

export const DailyInsightWidget: React.FC = () => {
    const [brief, setBrief] = useState<DailyBrief | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBrief = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/intelligence/daily-brief');
            setBrief(response.data);
        } catch (err) {
            console.error('Failed to fetch daily brief', err);
            setError('Günlük analiz alınamadı.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBrief();
    }, []);

    if (error) return null; // Hide widget on error to not clutter dashboard

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-gray-900 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-6 shadow-sm relative overflow-hidden mb-6">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 dark:from-indigo-600/10 dark:to-purple-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {loading ? 'Analiz Hazırlanıyor...' : brief?.title || 'Günlük İş Analizi'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {loading ? 'Yapay zeka verilerinizi inceliyor' : brief?.subtitle}
                            </p>
                        </div>
                    </div>

                    {!loading && (
                        <button onClick={fetchBrief} className="p-2 hover:bg-white/50 dark:hover:bg-gray-800 rounded-full transition-colors" title="Analizi Yenile">
                            <RefreshCw className="w-4 h-4 text-gray-400" />
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Narrative Section */}
                        <div className="lg:col-span-2">
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm lg:text-base">
                                {brief?.narrative}
                            </p>
                        </div>

                        {/* Metrics Section */}
                        <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-indigo-50 dark:border-indigo-900/30 flex flex-col justify-center gap-4">
                            {brief?.metrics.map((metric, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</span>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">{metric.value}</div>
                                        {metric.trend && (
                                            <div className={`text-xs flex items-center justify-end gap-1 ${metric.trendType === 'up' ? 'text-green-600 dark:text-green-400' :
                                                    metric.trendType === 'down' ? 'text-red-600 dark:text-red-400' : 'text-gray-500'
                                                }`}>
                                                {metric.trendType === 'up' ? <TrendingUp className="w-3 h-3" /> :
                                                    metric.trendType === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                                                {metric.trend}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
