import { pool } from "../db.js";
import { logger } from "../logger.js";
import { generateGeminiReply } from "./geminiClient.js";
import { getProductByBarcode } from "./product/productService.js";
import { ISocialPost, mapSocialPostRow, ISocialPostDbRow } from "../models/SocialPost.js";
import { ResultSetHeader } from "mysql2";

export interface PostFilters {
  platform?: string;
  status?: ISocialPost["status"];
}

export const createPost = async (data: Partial<ISocialPost>): Promise<ISocialPost> => {
  const [result] = (await pool.query(
    `INSERT INTO social_posts (platform, content, media_url, scheduled_date, status, product_id, ai_generated)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.platform,
      data.content,
      data.mediaUrl,
      data.scheduledDate,
      data.status || "Draft",
      data.productId,
      data.aiGenerated || false,
    ],
  )) as [ResultSetHeader, unknown];

  const [rows] = await pool.query("SELECT * FROM social_posts WHERE id = ?", [result.insertId]);
  return mapSocialPostRow((rows as ISocialPostDbRow[])[0]);
};

export const getPosts = async (filters: PostFilters = {}): Promise<ISocialPost[]> => {
  let sql = "SELECT * FROM social_posts WHERE 1=1";
  const params: (string | number)[] = [];

  if (filters.platform) {
    sql += " AND platform = ?";
    params.push(filters.platform);
  }
  if (filters.status) {
    sql += " AND status = ?";
    params.push(filters.status);
  }

  sql += " ORDER BY scheduled_date ASC";

  const [rows] = await pool.query(sql, params);
  return (rows as ISocialPostDbRow[]).map(mapSocialPostRow);
};

export const updatePostStatus = async (id: string, status: ISocialPost["status"]): Promise<ISocialPost | null> => {
  await pool.query("UPDATE social_posts SET status = ? WHERE id = ?", [status, id]);
  const [rows] = await pool.query("SELECT * FROM social_posts WHERE id = ?", [id]);
  const row = (rows as ISocialPostDbRow[])[0];
  return row ? mapSocialPostRow(row) : null;
};

export const deletePost = async (id: string): Promise<boolean> => {
  const [result] = (await pool.query("DELETE FROM social_posts WHERE id = ?", [id])) as [ResultSetHeader, unknown];
  return result.affectedRows > 0;
};

import { InstagramProvider } from "./social/providers/InstagramProvider.js";
import { TwitterProvider } from "./social/providers/TwitterProvider.js";
import { ISocialProvider } from "./social/providers/ISocialProvider.js";

const providers: Record<string, ISocialProvider> = {
  'Instagram': new InstagramProvider(),
  'Twitter': new TwitterProvider(),
  'Facebook': new InstagramProvider() // Fallback/Alias for now
};

export const postNow = async (postId: string): Promise<boolean> => {
  const [rows] = await pool.query("SELECT * FROM social_posts WHERE id = ?", [postId]);
  const postRow = (rows as ISocialPostDbRow[])[0];
  if (!postRow) {
    logger.error("social.post_now_failed", { postId, error: "Post not found" });
    return false;
  }

  const post = mapSocialPostRow(postRow);

  const provider = providers[post.platform];
  if (!provider) {
    logger.error("social.post_now_failed", { postId, platform: post.platform, error: "Provider not found" });
    return false;
  }

  try {
    logger.info("social.post_start", { postId, platform: post.platform });

    const result = await provider.postContent({
      content: post.content,
      mediaUrl: post.mediaUrl,
      hashtags: [] // Hashtags usually inside content, but can vary
    });

    if (result.success) {
      await pool.query(
        "UPDATE social_posts SET status = 'Posted', platform_post_id = ?, posted_at = NOW() WHERE id = ?",
        [result.postId, postId]
      );
      logger.info("social.post_success", { postId, result });
      return true;
    } else {
      await pool.query("UPDATE social_posts SET status = 'Failed' WHERE id = ?", [postId]);
      logger.error("social.post_failed", { postId, result });
      return false;
    }

  } catch (error) {
    logger.error("social.post_exception", { postId, error });
    await pool.query("UPDATE social_posts SET status = 'Failed' WHERE id = ?", [postId]);
    return false;
  }
};

// Kept for backward compatibility if needed, but aliases to postNow
export const simulateAutoPost = postNow;

export const generateSocialContent = async (barcode: string, platform: string): Promise<string> => {
  const result = await getProductByBarcode(barcode);
  if (!result.ok) throw result.error;
  const product = result.value;

  const prompt = `Sen Beekod e-ticaret otomasyonu için profesyonel bir sosyal medya yöneticisisin.
    Aşağıdaki ürün için ${platform} platformuna uygun, viral olma potansiyeli yüksek, ilgi çekici bir paylaşım metni oluştur.
    
    Ürün Adı: ${product.name}
    Kategori: ${product.category}
    Fiyat: ${product.price} ${product.currency}
    Özellikler: ${JSON.stringify(product.attributes)}
    
    Lütfen metne uygun hashtagler de ekle. Yanıtın sadece paylaşım metni olsun.`;

  const geminiResponse = await generateGeminiReply({
    message: prompt,
    locale: "tr",
  });

  return geminiResponse || "İçerik oluşturulamadı.";
};

export const generateBulkSocialContent = async (
  barcodes: string[],
  platform: string,
): Promise<Array<{ barcode: string; content: string }>> => {
  const promises = barcodes.map(async (barcode) => {
    try {
      const content = await generateSocialContent(barcode, platform);
      return { barcode, content };
    } catch (error) {
      logger.error("social.bulk_generate_item_failed", { barcode, error });
      return { barcode, content: "İçerik oluşturulamadı." };
    }
  });

  return await Promise.all(promises);
};
