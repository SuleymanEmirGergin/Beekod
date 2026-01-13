import { pool } from "../db.js";
import { logger } from "../logger.js";
<<<<<<< HEAD
import { generateGeminiReply } from "./ai/geminiClient.js";
=======
import { generateGeminiReply } from "./geminiClient.js";
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
import { IVideoAnalytics, IVideoAnalyticsDbRow, mapVideoAnalyticsRow } from "../models/VideoAnalytics.js";
import { RowDataPacket } from "mysql2";

interface VideoAnalyticsRow extends IVideoAnalyticsDbRow, RowDataPacket {}

function calculateEngagementRate(views: number, likes: number, comments: number, shares: number): number {
  if (views === 0) return 0;
  return ((likes + comments + shares) / views) * 100;
}

function calculatePerformanceScore(analytics: Partial<IVideoAnalytics>): number {
  let score = 0;
  const engagementRate = analytics.engagementRate || 0;
  score += Math.min(40, engagementRate * 4);
  const views = analytics.views || 0;
  score += Math.min(30, (views / 1000) * 30);
  const completionRate = analytics.completionRate || 50;
  score += (completionRate / 100) * 20;
  const saves = analytics.saves || 0;
  score += Math.min(10, (saves / 100) * 10);
  return Math.min(100, Math.round(score));
}

export interface IVideoAnalyticsInput {
  videoId: string;
  productBarcode: string;
  platform: string;
  platformVideoId: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  averageWatchTime?: number;
  completionRate?: number;
  publishedAt?: Date | string;
}

export async function recordVideoAnalytics(data: IVideoAnalyticsInput): Promise<IVideoAnalytics> {
  try {
    const views = data.views || 0;
    const likes = data.likes || 0;
    const comments = data.comments || 0;
    const shares = data.shares || 0;
    const saves = data.saves || 0;
    const engagementRate = calculateEngagementRate(views, likes, comments, shares);

    const performanceScore = calculatePerformanceScore({
      views,
      likes,
      comments,
      shares,
      saves,
      engagementRate,
      completionRate: data.completionRate,
    });

    const sql = `
            INSERT INTO video_analytics (
                video_id, product_barcode, platform, platform_video_id, 
                views, likes, comments, shares, saves, 
                engagement_rate, average_watch_time, completion_rate,
                published_at, performance_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                views = VALUES(views), likes = VALUES(likes), comments = VALUES(comments),
                shares = VALUES(shares), saves = VALUES(saves), engagement_rate = VALUES(engagement_rate),
                performance_score = VALUES(performance_score), last_synced_at = NOW()
        `;

    await pool.query(sql, [
      data.videoId,
      data.productBarcode,
      data.platform,
      data.platformVideoId,
      views,
      likes,
      comments,
      shares,
      saves,
      engagementRate,
      data.averageWatchTime,
      data.completionRate,
      data.publishedAt || new Date(),
      performanceScore,
    ]);

    const [rows] = await pool.query<VideoAnalyticsRow[]>(
      "SELECT * FROM video_analytics WHERE video_id = ? AND platform = ?",
      [data.videoId, data.platform],
    );
    const row = rows[0];
    if (!row) throw new Error("Failed to record video analytics");
    return mapVideoAnalyticsRow(row);
  } catch (error) {
    logger.error("video_analytics.record_failed", { err: error });
    throw error;
  }
}

export async function getVideoAnalytics(videoId: string): Promise<IVideoAnalytics[]> {
  const [rows] = await pool.query<VideoAnalyticsRow[]>(
    "SELECT * FROM video_analytics WHERE video_id = ? ORDER BY platform ASC",
    [videoId],
  );
  return rows.map(mapVideoAnalyticsRow);
}

export async function getTopPerformingVideos(limit: number = 10): Promise<IVideoAnalytics[]> {
  const [rows] = await pool.query<VideoAnalyticsRow[]>(
    "SELECT * FROM video_analytics ORDER BY performance_score DESC, views DESC LIMIT ?",
    [limit],
  );
  return rows.map(mapVideoAnalyticsRow);
}

export async function getProductVideoAnalytics(productBarcode: string): Promise<IVideoAnalytics[]> {
  const [rows] = await pool.query<VideoAnalyticsRow[]>(
    "SELECT * FROM video_analytics WHERE product_barcode = ? ORDER BY published_at DESC",
    [productBarcode],
  );
  return rows.map(mapVideoAnalyticsRow);
}

export async function generateVideoRecommendations(productBarcode?: string): Promise<string[]> {
  try {
    const topVideos = productBarcode
      ? await getProductVideoAnalytics(productBarcode)
      : await getTopPerformingVideos(20);

    if (topVideos.length === 0) {
      return [
        "İlk videolarınızı oluşturun ve performanslarını takip edin",
        "Kısa, dikkat çekici açılışlar kullanın (ilk 3 saniye kritik)",
        "Call-to-action ekleyin: beğen, yorum yap, takip et",
      ];
    }

    const avgEngagement = topVideos.reduce((sum, v) => sum + (v.engagementRate || 0), 0) / topVideos.length;
    const avgCompletion = topVideos.reduce((sum, v) => sum + (v.completionRate || 50), 0) / topVideos.length;
    const mostUsedPlatform = topVideos.reduce((acc, v) => {
      acc[v.platform] = (acc[v.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedPlatforms = Object.entries(mostUsedPlatform).sort((a, b) => b[1] - a[1]);
    const topPlatform = sortedPlatforms.length > 0 ? sortedPlatforms[0][0] : "Bilinmiyor";

    const prompt = `Sen bir video marketing uzmanısın. Aşağıdaki performans verilerine göre 5 kısa, net öneri ver:
        
Ortalama Engagement: %${avgEngagement.toFixed(2)}
Ortalama Completion Rate: %${avgCompletion.toFixed(2)}
En Başarılı Platform: ${topPlatform}
Video Sayısı: ${topVideos.length}

Öneriler kısa ve uygulanabilir olsun (her biri max 10 kelime).`;

    const aiRecommendations = await generateGeminiReply({
      message: prompt,
      locale: "tr",
    });

    if (!aiRecommendations) {
      return [
        `${topPlatform} platformunda performansınız güçlü, odaklanın`,
        `İzlenme süresini artırmak için ilk 3 saniyeyi optimize edin`,
        `Etkileşim oranı için soru sorun ve CTA ekleyin`,
      ];
    }

    const recommendations = aiRecommendations
      .split("\n")
      .filter((line) => line.trim().length > 0 && !line.includes("**"))
      .map((line) => line.replace(/^[-*•]\s*/, "").trim())
      .slice(0, 5);

    return recommendations.length > 0
      ? recommendations
      : [
          `${topPlatform} platformunda performansınız güçlü, odaklanın`,
          `İzlenme süresini artırmak için ilk 3 saniyeyi optimize edin`,
          `Etkileşim oranı için soru sorun ve CTA ekleyin`,
        ];
  } catch (error) {
    logger.error("video_analytics.generate_recommendations_failed", { err: error });
    return [
      "Video performansınızı düzenli takip edin",
      "Farklı formatlar ve zamanlar test edin",
      "İzleyici geri bildirimlerini analiz edin",
    ];
  }
}

export async function syncPlatformAnalytics(
  videoId: string,
  platform: string,
  platformVideoId: string,
): Promise<IVideoAnalytics | null> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const mockData: IVideoAnalyticsInput = {
      videoId,
      productBarcode: "8690000000001", // Added missing required property
      platform: platform,
      platformVideoId,
      views: Math.floor(Math.random() * 10000) + 500,
      likes: Math.floor(Math.random() * 500) + 50,
      comments: Math.floor(Math.random() * 100) + 10,
      shares: Math.floor(Math.random() * 200) + 20,
      saves: Math.floor(Math.random() * 150) + 15,
      averageWatchTime: Math.floor(Math.random() * 30) + 10,
      completionRate: Math.floor(Math.random() * 40) + 50,
      publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    };

    return await recordVideoAnalytics(mockData);
  } catch (error) {
    logger.error("video_analytics.sync_failed", { videoId, platform, err: error });
    return null;
  }
}
