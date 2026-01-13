import { pool } from "../../db.js";
import { logger } from "../../logger.js";
import { generateGeminiReply } from "../ai/geminiClient.js";
import { getProductByBarcode } from "../product/productService.js";
import { ISocialPost, mapSocialPostRow, ISocialPostDbRow } from "../../models/SocialPost.js";
import { ResultSetHeader } from "mysql2";
import { Locale } from "../../types.js";

/**
 * Sosyal medya işlemlerini (İçerik üretimi, veritabanı kaydı ve yayım) 
 * yöneten birleştirilmiş servis.
 */

export interface PostFilters {
  platform?: string;
  status?: ISocialPost["status"];
}

export interface SocialMediaPost {
  platform: string;
  content: string;
  hashtags: string[];
  emoji: string[];
}

// --- DATABASE OPERATIONS ---

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

// --- PLATFORM PROVIDERS & PUBLISHING ---

import { InstagramProvider } from "./providers/InstagramProvider.js";
import { TwitterProvider } from "./providers/TwitterProvider.js";
import { ISocialProvider } from "./providers/ISocialProvider.js";

const providers: Record<string, ISocialProvider> = {
  'Instagram': new InstagramProvider(),
  'Twitter': new TwitterProvider(),
  'Facebook': new InstagramProvider() // Fallback/Alias
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
    const result = await provider.postContent({
      content: post.content,
      mediaUrl: post.mediaUrl,
      hashtags: [] 
    });

    if (result.success) {
      await pool.query(
        "UPDATE social_posts SET status = 'Posted', platform_post_id = ?, posted_at = NOW() WHERE id = ?",
        [result.postId, postId]
      );
      return true;
    } else {
      await pool.query("UPDATE social_posts SET status = 'Failed' WHERE id = ?", [postId]);
      return false;
    }
  } catch (error) {
    logger.error("social.post_exception", { postId, error });
    await pool.query("UPDATE social_posts SET status = 'Failed' WHERE id = ?", [postId]);
    return false;
  }
};

export const simulateAutoPost = postNow;

// --- CONTENT GENERATION (AI) ---

/**
 * Instagram için post üretir
 */
export async function generateInstagramPost(
  productName: string,
  tone: string = "trendy",
  locale: Locale = "tr",
): Promise<SocialMediaPost> {
  const prompt = `Ürün: ${productName}. Ton: ${tone}. Platform: Instagram. Bu ürün için Instagram'da paylaşılacak kısa, etkileyici bir post metni yaz. Kurallar: Maksimum 150 karakter, 3-5 emoji, samimi, CTA ekle. Sadece post metnini yaz.`;
  try {
    const content = await generateGeminiReply({ message: prompt, locale });
    const hashtags = await generateHashtags(productName, locale);
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const safeContent = content || "";
    const emojis = safeContent.match(emojiRegex) || [];
    return {
      platform: "Instagram",
      content: safeContent || `✨ ${productName} - Yeni koleksiyonumuzda! 🛍️`,
      hashtags,
      emoji: [...new Set(emojis)],
    };
  } catch (_error) {
    logger.error("social.instagram_gen_failed", { productName, err: _error });
    return { platform: "Instagram", content: "", hashtags: [], emoji: [] };
  }
}

/**
 * Facebook için post üretir
 */
export async function generateFacebookPost(
  productName: string,
  tone: string = "professional",
  locale: Locale = "tr",
): Promise<SocialMediaPost> {
  const prompt = `Ürün: ${productName}. Ton: ${tone}. Platform: Facebook. Detaylı post metni (max 300 karakter). CTA ve 2-3 emoji ekle.`;
  try {
    const content = await generateGeminiReply({ message: prompt, locale });
    const hashtags = await generateHashtags(productName, locale);
    return {
      platform: "Facebook",
      content: content || "",
      hashtags,
      emoji: [],
    };
  } catch (_error) {
    return { platform: "Facebook", content: "", hashtags: [], emoji: [] };
  }
}

/**
 * Twitter için post üretir
 */
export async function generateTwitterPost(
  productName: string,
  tone: string = "casual",
  locale: Locale = "tr",
): Promise<SocialMediaPost> {
  const prompt = `Ürün: ${productName}. Ton: ${tone}. Platform: Twitter. Kısa tweet (max 280 karakter). Viral odaklı.`;
  try {
    const content = await generateGeminiReply({ message: prompt, locale });
    const hashtags = await generateHashtags(productName, locale);
    return {
      platform: "Twitter",
      content: content || "",
      hashtags: hashtags.slice(0, 3),
      emoji: [],
    };
  } catch (_error) {
    return { platform: "Twitter", content: "", hashtags: [], emoji: [] };
  }
}

/**
 * Ürün için hashtag önerileri üretir
 */
export async function generateHashtags(productName: string, locale: string = "tr"): Promise<string[]> {
  const prompt = `Ürün: ${productName}. 5-7 hashtag öner (# ile başlasın, virgülle ayrılmış).`;
  try {
    const response = await generateGeminiReply({ message: prompt, locale: locale as Locale });
    return (response || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.startsWith("#"))
      .slice(0, 7);
  } catch (_error) {
    return ["#yeniürün", "#alışveriş"];
  }
}

/**
 * Tüm platformlar için post üretir
 */
export async function generateAllPlatformPosts(
  productName: string,
  tone: string = "trendy",
  locale: Locale = "tr",
): Promise<SocialMediaPost[]> {
  const [instagram, facebook, twitter] = await Promise.all([
    generateInstagramPost(productName, tone, locale),
    generateFacebookPost(productName, tone, locale),
    generateTwitterPost(productName, tone, locale),
  ]);
  return [instagram, facebook, twitter];
}

/**
 * Generic AI content generation based on product data
 */
export const generateSocialContent = async (barcode: string, platform: string): Promise<string> => {
  const productResult = await getProductByBarcode(barcode);
  if (!productResult.ok) throw new Error("Product not found");
  const product = productResult.value;

  const prompt = `Ürün: ${product.name}. Platform: ${platform}. Viral ve ilgi çekici bir paylaşım metni oluştur (Hashtagler dahil).`;
  const result = await generateGeminiReply({
    message: prompt,
    locale: "tr",
  });
  return result || "İçerik oluşturulamadı.";
};

export const generateBulkSocialContent = async (
  barcodes: string[],
  platform: string,
): Promise<Array<{ barcode: string; content: string }>> => {
  const promises = barcodes.map(async (barcode) => {
    try {
      const content = await generateSocialContent(barcode, platform);
      return { barcode, content };
    } catch (_error) {
      return { barcode, content: "Hata" };
    }
  });
  return await Promise.all(promises);
};
