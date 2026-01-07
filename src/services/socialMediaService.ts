import { Locale } from "../types.js";
import { generateGeminiReply } from "./geminiService.js";
import { logger } from "../logger.js";

export interface SocialMediaPost {
  platform: string;
  content: string;
  hashtags: string[];
  emoji: string[];
}

/**
 * Instagram için post üretir
 */
export async function generateInstagramPost(
  productName: string,
  tone: string = "trendy",
  locale: Locale = "tr",
): Promise<SocialMediaPost> {
  const prompt = `
        Ürün: ${productName}
        Ton: ${tone}
        Platform: Instagram
        
        Bu ürün için Instagram'da paylaşılacak kısa, etkileyici bir post metni yaz.
        
        Kurallar:
        - Maksimum 150 karakter
        - 3-5 emoji kullan
        - Samimi ve çekici ol
        - CTA (Call-to-Action) ekle (örn: "Hemen sipariş ver!", "Stoklarla sınırlı!")
        
        Sadece post metnini yaz, başka açıklama ekleme.
    `;

  try {
    const content = await generateGeminiReply({ message: prompt, locale });
    const hashtags = await generateHashtags(productName, locale);

    // Emoji'leri çıkar
    const emojiRegex =
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const safeContent = content || "";
    const emojis = safeContent.match(emojiRegex) || [];

    return {
      platform: "Instagram",
      content: safeContent || `✨ ${productName} - Yeni koleksiyonumuzda! 🛍️\n\nHemen sipariş ver! 🚀`,
      hashtags,
      emoji: [...new Set(emojis)],
    };
  } catch (error) {
    logger.error("social_media.instagram_post_failed", { productName, err: error });
    return {
      platform: "Instagram",
      content: `✨ ${productName} - Yeni koleksiyonumuzda! 🛍️\n\nHemen sipariş ver! 🚀`,
      hashtags: ["#yeniürün", "#alışveriş", "#moda"],
      emoji: ["✨", "🛍️", "🚀"],
    };
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
  const prompt = `
        Ürün: ${productName}
        Ton: ${tone}
        Platform: Facebook
        
        Bu ürün için Facebook'ta paylaşılacak detaylı bir post metni yaz.
        
        Kurallar:
        - Maksimum 300 karakter
        - Ürünün özelliklerinden bahset
        - Profesyonel ama samimi ol
        - Emoji kullan ama abartma (2-3 tane)
        - CTA ekle
        
        Sadece post metnini yaz.
    `;

  try {
    const content = await generateGeminiReply({ message: prompt, locale });
    const hashtags = await generateHashtags(productName, locale);

    const emojiRegex =
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const safeContent = content || "";
    const emojis = safeContent.match(emojiRegex) || [];

    return {
      platform: "Facebook",
      content:
        safeContent ||
        `${productName} artık stoklarımızda! 🎉\n\nKaliteli ürünler, uygun fiyatlar. Detaylı bilgi için mesaj atın! 📩`,
      hashtags,
      emoji: [...new Set(emojis)],
    };
  } catch (error) {
    logger.error("social_media.facebook_post_failed", { productName, err: error });
    return {
      platform: "Facebook",
      content: `${productName} artık stoklarımızda! 🎉\n\nKaliteli ürünler, uygun fiyatlar. Detaylı bilgi için mesaj atın! 📩`,
      hashtags: ["#yeniürün", "#kaliteli", "#uygunfiyat"],
      emoji: ["🎉", "📩"],
    };
  }
}

/**
 * Twitter/X için post üretir
 */
export async function generateTwitterPost(
  productName: string,
  tone: string = "casual",
  locale: Locale = "tr",
): Promise<SocialMediaPost> {
  const prompt = `
        Ürün: ${productName}
        Ton: ${tone}
        Platform: Twitter/X
        
        Bu ürün için Twitter'da paylaşılacak kısa, dikkat çekici bir tweet yaz.
        
        Kurallar:
        - Maksimum 280 karakter
        - Kısa ve öz ol
        - 1-2 emoji kullan
        - Viral olabilecek bir şeyler yaz
        
        Sadece tweet metnini yaz.
    `;

  try {
    const content = await generateGeminiReply({ message: prompt, locale });
    const hashtags = await generateHashtags(productName, locale);

    const emojiRegex =
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const safeContent = content || "";
    const emojis = safeContent.match(emojiRegex) || [];

    return {
      platform: "Twitter",
      content: safeContent || `${productName} geldi! 🔥\n\nKaçırma! 👉`,
      hashtags: hashtags.slice(0, 3), // Twitter için max 3 hashtag
      emoji: [...new Set(emojis)],
    };
  } catch (error) {
    logger.error("social_media.twitter_post_failed", { productName, err: error });
    return {
      platform: "Twitter",
      content: `${productName} geldi! 🔥\n\nKaçırma! 👉`,
      hashtags: ["#yeniürün", "#alışveriş"],
      emoji: ["🔥", "👉"],
    };
  }
}

/**
 * Ürün için hashtag önerileri üretir
 */
export async function generateHashtags(productName: string, locale: string = "tr"): Promise<string[]> {
  const prompt = `
        Ürün: ${productName}
        
        Bu ürün için sosyal medyada kullanılacak 5-7 hashtag öner.
        
        Kurallar:
        - Türkçe hashtag'ler kullan
        - Popüler ve aranabilir hashtag'ler seç
        - Ürünle alakalı ol
        - # işareti ile başlat
        - Her hashtag'i virgülle ayır
        
        Örnek: #moda, #ayakkabı, #trend, #stil, #alışveriş
        
        Sadece hashtag listesini ver, başka açıklama ekleme.
    `;

  try {
    const response = await generateGeminiReply({ message: prompt, locale: locale as Locale });
    const hashtags = (response || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.startsWith("#"))
      .slice(0, 7);

    return hashtags.length > 0 ? hashtags : ["#yeniürün", "#alışveriş", "#trend"];
  } catch (error) {
    logger.error("social_media.hashtag_generation_failed", { productName, err: error });
    return ["#yeniürün", "#alışveriş", "#trend", "#moda", "#stil"];
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
  try {
    const [instagram, facebook, twitter] = await Promise.all([
      generateInstagramPost(productName, tone, locale),
      generateFacebookPost(productName, tone, locale),
      generateTwitterPost(productName, tone, locale),
    ]);

    return [instagram, facebook, twitter];
  } catch (error) {
    logger.error("social_media.all_platforms_failed", { productName, err: error });
    throw error;
  }
}
