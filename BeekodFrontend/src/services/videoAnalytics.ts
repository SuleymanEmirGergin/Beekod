import api from './api';

export interface VideoAnalytics {
  _id: string;
  videoId: string;
  productBarcode?: string;
  platform: 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'twitter';
  platformVideoId?: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
  averageWatchTime?: number;
  completionRate?: number;
  performanceScore?: number;
  recommendedPostingTime?: string;
  suggestedImprovements?: string[];
  publishedAt: string;
  lastSyncedAt: string;
}

export const getVideoAnalytics = async (videoId: string): Promise<VideoAnalytics[]> => {
  const response = await api.get(`/video-analytics/${videoId}`);
  return response.data.analytics;
};

export const getTopPerformingVideos = async (limit: number = 10): Promise<VideoAnalytics[]> => {
  const response = await api.get(`/video-analytics/top/performers?limit=${limit}`);
  return response.data.videos;
};

export const getProductVideoAnalytics = async (barcode: string): Promise<VideoAnalytics[]> => {
  const response = await api.get(`/video-analytics/product/${barcode}`);
  return response.data.analytics;
};

export const generateVideoRecommendations = async (productBarcode?: string): Promise<string[]> => {
  const response = await api.post('/video-analytics/recommendations', { productBarcode });
  return response.data.recommendations;
};

export const syncPlatformAnalytics = async (
  videoId: string,
  platform: string,
  platformVideoId: string,
): Promise<VideoAnalytics> => {
  const response = await api.post('/video-analytics/sync', { videoId, platform, platformVideoId });
  return response.data.analytics;
};

export const recordVideoAnalytics = async (
  data: Partial<VideoAnalytics>,
): Promise<VideoAnalytics> => {
  const response = await api.post('/video-analytics', data);
  return response.data.analytics;
};
