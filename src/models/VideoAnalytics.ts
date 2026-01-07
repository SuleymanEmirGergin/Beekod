export interface IVideoAnalytics {
  id: number;
  videoId: string;
  productBarcode?: string;
  platform: "instagram" | "tiktok" | "facebook" | "youtube" | "twitter";
  platformVideoId?: string;

  // Performance Metrics
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;

  // Engagement Metrics
  engagementRate: number;
  averageWatchTime?: number;
  completionRate?: number;

  // Demographics
  topCountries?: string[];
  topAgeGroups?: string[];
  malePercentage?: number;
  femalePercentage?: number;

  // Temporal Data
  peakViewingHours?: number[];
  publishedAt: Date;
  lastSyncedAt: Date;

  // AI Insights
  performanceScore?: number;
  recommendedPostingTime?: string;
  suggestedImprovements?: string[];

  createdAt: Date;
  updatedAt: Date;
}

export interface IVideoAnalyticsDbRow {
  id: number;
  video_id: string;
  product_barcode?: string;
  platform: "instagram" | "tiktok" | "facebook" | "youtube" | "twitter";
  platform_video_id?: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  engagement_rate?: number;
  average_watch_time?: number;
  completion_rate?: number;
  top_countries?: string | string[];
  top_age_groups?: string | string[];
  male_percentage?: number;
  female_percentage?: number;
  peak_viewing_hours?: string | number[];
  published_at: string | Date;
  last_synced_at: string | Date;
  performance_score?: number;
  recommended_posting_time?: string;
  suggested_improvements?: string | string[];
  created_at: string | Date;
  updated_at: string | Date;
}

export function mapVideoAnalyticsRow(row: IVideoAnalyticsDbRow): IVideoAnalytics {
  return {
    id: row.id,
    videoId: row.video_id,
    productBarcode: row.product_barcode,
    platform: row.platform,
    platformVideoId: row.platform_video_id,
    views: row.views || 0,
    likes: row.likes || 0,
    comments: row.comments || 0,
    shares: row.shares || 0,
    saves: row.saves || 0,
    engagementRate: row.engagement_rate || 0,
    averageWatchTime: row.average_watch_time,
    completionRate: row.completion_rate,
    topCountries: typeof row.top_countries === "string" ? JSON.parse(row.top_countries) : row.top_countries,
    topAgeGroups: typeof row.top_age_groups === "string" ? JSON.parse(row.top_age_groups) : row.top_age_groups,
    malePercentage: row.male_percentage,
    femalePercentage: row.female_percentage,
    peakViewingHours:
      typeof row.peak_viewing_hours === "string" ? JSON.parse(row.peak_viewing_hours) : row.peak_viewing_hours,
    publishedAt: row.published_at ? new Date(row.published_at) : new Date(),
    lastSyncedAt: new Date(row.last_synced_at),
    performanceScore: row.performance_score || 0,
    recommendedPostingTime: row.recommended_posting_time,
    suggestedImprovements:
      typeof row.suggested_improvements === "string"
        ? JSON.parse(row.suggested_improvements)
        : row.suggested_improvements,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
