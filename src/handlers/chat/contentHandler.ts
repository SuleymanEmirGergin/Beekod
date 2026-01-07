import { t } from "../../i18n.js";
import { getProductByBarcode } from "../../services/productService.js";
import { generateGeminiReply } from "../../services/geminiService.js";
import { IntentHandler, ChatContext } from "./types.js";
import { extractBarcode } from "../../utils/intent.js";


export const contentHandler: IntentHandler = async (parsed, context) => {
  const { locale, message, intent } = context;
  let name = parsed.text?.trim();
  let price: number | undefined;
  let currency: string | undefined;

  // Handle SEO_CONTENT and TRANSLATE intents
  if (intent === "SEO_CONTENT" || intent === "TRANSLATE") {
    const barcode = parsed.barcode || extractBarcode(message);

    if (!barcode) {
      return {
        reply: locale === "tr"
          ? "Kanka hangi ürün için içerik oluşturayım? Barkod numarasını söyle. 📝"
          : "Which product should I create content for? Please provide the barcode. 📝",
        success: false,
      };
    }

    const product = await getProductByBarcode(barcode);
    if (!product) {
      return {
        reply: locale === "tr"
          ? `${barcode} barkodlu ürünü bulamadım kanka. 🤔`
          : `Could not find product with barcode ${barcode}. 🤔`,
        success: false,
      };
    }

    name = product.name;
    price = product.price;
    currency = product.currency;
  } else {
    if (name) {
      const normalizedName = name.toLowerCase();
      const toneMatch = parsed.tone && normalizedName === parsed.tone.toLowerCase();
      const categoryMatch = parsed.category && normalizedName === parsed.category.toLowerCase();
      if (toneMatch || categoryMatch) {
        name = undefined;
      }
    }

    if (parsed.barcode) {
      const product = await getProductByBarcode(parsed.barcode);
      if (product) {
        if (!name) {
          name = product.name;
        }
        price = product.price;
        currency = product.currency;
      }
    }

    if (!name) {
      return {
        reply: t(locale, "missing_product_info"),
        success: false,
      };
    }
  }

  // Helper context builder
  const productContext = `Fiyat: ${price ?? "?"} ${currency ?? "TRY"}`;

  // Handle SEO_CONTENT intent
  if (context.intent === "SEO_CONTENT") {
    const text =
      (await generateGeminiReply({
        message: `SEO Uzmanı gibi davran. "${name}" ürünü için (${productContext}) SEO uyumlu, keyword-rich başlık ve açıklama yaz. Google'da üst sıralara çıkacak şekilde optimize et. 150-160 karakter arası meta description ekle.`,
        locale,
      })) || "İçerik oluşturulamadı.";

    return {
      reply: locale === "tr"
        ? `SEO içeriği hazır kanka! ✅📝\n\n${text}`
        : `SEO content ready buddy! ✅📝\n\n${text}`,
      data: {
        contentType: "content_card",
        title: "SEO İçeriği",
        text,
        platform: "seo",
      },
      success: true,
    };
  }

  // Handle TRANSLATE intent
  if (context.intent === "TRANSLATE") {
    const lowerMsg = context.message.toLowerCase();
    const targetLang = lowerMsg.includes("ingilizce") || lowerMsg.includes("english") ? "English" :
      lowerMsg.includes("türkçe") || lowerMsg.includes("turkish") ? "Türkçe" :
        lowerMsg.includes("arapça") || lowerMsg.includes("arabic") ? "Arabic" : "English";

    const text =
      (await generateGeminiReply({
        message: `Profesyonel e-ticaret çevirmeni gibi davran. "${name}" ürün ismini ve şu bilgileri: ${productContext}, ${targetLang} diline çevir. SEO-friendly ve doğal olsun. Sadece çeviriyi ver, açıklama yapma.`,
        locale,
      })) || "Çeviri yapılamadı.";

    return {
      reply: locale === "tr"
        ? `Çeviri hazır kanka! 🌍✅\n\n**${targetLang}:**\n${text}`
        : `Translation ready buddy! 🌍✅\n\n**${targetLang}:**\n${text}`,
      data: {
        contentType: "content_card",
        title: `Çeviri (${targetLang})`,
        text,
        platform: "translation",
      },
      success: true,
    };
  }

  // Original content.seo and content.social handling
  if (parsed.intent === "content.seo") {
    const text =
      (await generateGeminiReply({
        message: `SEO Uzmanı gibi davran. "${name}" ürünü için (${productContext}) SEO uyumlu başlık ve açıklama yaz. Nötr ve profesyonel ol.`,
        locale,
      })) || "İçerik oluşturulamadı.";

    return {
      reply: t(locale, "content_seo_ready", { text: "..." }), // UI will show card
      data: {
        contentType: "content_card",
        title: "SEO İçeriği",
        text,
        platform: "seo",
      },
      success: true,
    };
  } else if (parsed.intent === "content.social") {
    const platform = (parsed as any).platform || "instagram";
    const text =
      (await generateGeminiReply({
        message: `Sosyal Medya Fenomeni gibi davran. "${name}" ürünü için (${productContext}) ${platform} platformuna uygun, bol emojili, ${parsed.tone || "enerjik"} bir post hazırla. Hashtag ekle.`,
        locale,
      })) || "İçerik oluşturulamadı.";

    return {
      reply: t(locale, "content_social_ready", { text: "..." }),
      data: {
        contentType: "content_card",
        title: `${platform} Postu`,
        text,
        platform,
      },
      success: true,
    };
  } else {
    // Translation
    const targetLang = parsed.intent === "content.translate.tr" ? "Türkçe" : "İngilizce";
    const text =
      (await generateGeminiReply({
        message: `Profesyonel çevirmen gibi davran. "${name}" ürün ismini ve şu detayları: ${productContext}, ${targetLang} diline çevir. Sadece çeviriyi ver.`,
        locale,
      })) || "Çeviri yapılamadı.";

    return {
      reply: t(locale, "content_translation_ready", { text: "..." }),
      data: {
        contentType: "content_card",
        title: `Çeviri (${targetLang})`,
        text,
        platform: "translation",
      },
      success: true,
    };
  }
};
