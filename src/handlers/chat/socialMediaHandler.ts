import { ParsedMessage } from "../../services/nlp.js";
import { t } from "../../i18n.js";
import { logger } from "../../logger.js";
import { ChatContext, IntentHandlerResult } from "./index.js";
import {
  generateInstagramPost,
  generateFacebookPost,
  generateTwitterPost,
  generateAllPlatformPosts,
} from "../../services/socialMediaService.js";
import { getProductByBarcode } from "../../services/productService.js";

/**
 * Social Media content generation handler
 * Handles: "Bee252525 için Instagram postu hazırla", "Sosyal medya içeriği oluştur"
 */
export async function socialMediaHandler(parsed: ParsedMessage, context: ChatContext): Promise<IntentHandlerResult> {
  const { intent, locale, barcode } = parsed;
  const params = (parsed as any).params || {};
  const intentStr = String(intent);

  try {
    // Get product info
    let productName = params.productName || "";

    if (barcode) {
      const product = await getProductByBarcode(barcode);
      if (!product) {
        return {
          reply: `Bu barkodu bulamadım kanka. Kontrol eder misin? 🤔`,
          success: false,
        };
      }
      productName = product.name;
    }

    if (!productName) {
      return {
        reply: `Hangi ürün için içerik hazırlayayım? Ürün adı veya barkod ver. 😊`,
        success: false,
      };
    }

    const tone = params.tone || "trendy";
    const platform = params.platform || "all";

    // Generate content based on platform
    if (platform === "instagram" || intentStr === "content.instagram") {
      const post = await generateInstagramPost(productName, tone, locale);

      const reply =
        `📸 **Instagram Postu Hazır!**\n\n` +
        `${post.content}\n\n` +
        `**Hashtag'ler:**\n${post.hashtags.join(" ")}\n\n` +
        `Kopyala yapıştır, hemen paylaş! 🚀`;

      return {
        reply,
        success: true,
        data: { post },
      };
    }

    if (platform === "facebook" || intentStr === "content.facebook") {
      const post = await generateFacebookPost(productName, tone, locale);

      const reply =
        `📘 **Facebook Postu Hazır!**\n\n` +
        `${post.content}\n\n` +
        `**Hashtag'ler:**\n${post.hashtags.join(" ")}\n\n` +
        `Paylaş gitsin! 👍`;

      return {
        reply,
        success: true,
        data: { post },
      };
    }

    if (platform === "twitter" || intentStr === "content.twitter") {
      const post = await generateTwitterPost(productName, tone, locale);

      const reply =
        `🐦 **Twitter Postu Hazır!**\n\n` +
        `${post.content}\n\n` +
        `**Hashtag'ler:**\n${post.hashtags.join(" ")}\n\n` +
        `Tweet at! 🔥`;

      return {
        reply,
        success: true,
        data: { post },
      };
    }

    // Generate for all platforms
    const posts = await generateAllPlatformPosts(productName, tone, locale);

    let reply = `🎨 **Tüm Platformlar İçin İçerik Hazır!**\n\n`;

    posts.forEach((post) => {
      reply += `**${post.platform}:**\n${post.content}\n\n`;
    });

    reply += `**Ortak Hashtag'ler:**\n${posts[0].hashtags.join(" ")}\n\n`;
    reply += `Hepsini kullanabilirsin! 🚀`;

    return {
      reply,
      success: true,
      data: { posts },
    };
  } catch (error) {
    logger.error("chat.social_media_handler_failed", { intent, barcode, err: error });
    return {
      reply: `İçerik oluştururken bir sorun çıktı. Tekrar dener misin? 😅`,
      success: false,
    };
  }
}
