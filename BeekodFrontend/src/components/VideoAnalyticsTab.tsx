import { useState, useEffect } from 'react';
import {
  BarChart,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Save,
  Clock,
  Award,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  getVideoAnalytics,
  generateVideoRecommendations,
  syncPlatformAnalytics,
  VideoAnalytics as VideoAnalyticsType,
} from '../services/videoAnalytics';
import { toast } from 'sonner';

interface VideoAnalyticsTabProps {
  videoId: string;
  productBarcode?: string;
}

export function VideoAnalyticsTab({ videoId, productBarcode }: VideoAnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<VideoAnalyticsType[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadAnalytics();
    loadRecommendations();
  }, [videoId]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await getVideoAnalytics(videoId);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const recs = await generateVideoRecommendations(productBarcode);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load recommendations', error);
    }
  };

  const handleSyncPlatform = async (platform: string) => {
    setIsSyncing(true);
    toast.loading('Analytics senkronize ediliyor...');
    try {
      await syncPlatformAnalytics(videoId, platform, `${videoId}-${platform}`);
      await loadAnalytics();
      toast.dismiss();
      toast.success(`${platform} analytics güncellendi`);
    } catch (error) {
      toast.dismiss();
      toast.error('Senkronizasyon başarısız');
    } finally {
      setIsSyncing(false);
    }
  };

  const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
  const totalEngagement = analytics.reduce((sum, a) => sum + a.likes + a.comments + a.shares, 0);
  const avgPerformance =
    analytics.length > 0
      ? Math.round(
          analytics.reduce((sum, a) => sum + (a.performanceScore || 0), 0) / analytics.length,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Toplam Görüntülenme</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-xl border border-pink-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Heart className="w-5 h-5 text-pink-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Toplam Etkileşim</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalEngagement.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Performans Skoru</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{avgPerformance}/100</p>
        </div>
      </div>

      {/* Platform Analytics */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart className="w-5 h-5 text-gray-600" />
            Platform Performansı
          </h3>
          <button
            onClick={() => handleSyncPlatform('instagram')}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            Senkronize
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center">
            <RefreshCw className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-gray-500">Analytics yükleniyor...</p>
          </div>
        ) : analytics.length === 0 ? (
          <div className="py-12 text-center">
            <BarChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900 mb-1">Henüz Veri Yok</p>
            <p className="text-xs text-gray-500">Videonu yayınla ve performansını takip et</p>
          </div>
        ) : (
          <div className="space-y-3">
            {analytics.map((platformData, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 capitalize">
                      {platformData.platform}
                    </span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
                      {platformData.performanceScore}/100
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(platformData.publishedAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Eye className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] text-gray-500">Görüntülenme</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {platformData.views.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Heart className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] text-gray-500">Beğeni</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {platformData.likes.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <MessageCircle className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] text-gray-500">Yorum</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {platformData.comments.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Share2 className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] text-gray-500">Paylaşım</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {platformData.shares.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Save className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] text-gray-500">Kaydet</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {platformData.saves.toLocaleString()}
                    </p>
                  </div>
                </div>

                {platformData.averageWatchTime && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      Ortalama İzlenme: {platformData.averageWatchTime}s
                    </span>
                    <span className="text-xs text-gray-600">
                      Tamamlama: %{platformData.completionRate?.toFixed(0)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Recommendations */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-900">AI Önerileri</h3>
        </div>

        <div className="space-y-2">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-100"
            >
              <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-purple-600">{idx + 1}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
