import { t } from "../../i18n.js";
import { getProductByBarcode } from "../../services/productService.js";
import { getPriceSuggestion } from "../../services/pricingService.js";
import { generateGeminiReply } from "../../services/geminiService.js";
import { searchNetwork } from "../../services/networkService.js";
import { IntentHandler, ChatContext, IntentHandlerResult } from "./types.js";

export const geminiHandler: IntentHandler = async (parsed, context) => {
  const { message, locale, history, userPreferences } = context;
  let contextMessage = message;

  // Transform history to Gemini format
  const chatHistory: any[] = [];
  if (history && Array.isArray(history)) {
    // Take last 5 messages to avoid token bloat
    const recent = history.filter(h => h.message || h.reply).slice(-5);
    for (const h of recent) {
      chatHistory.push({
        role: h.role === "user" ? "user" : "model",
        text: h.message || h.reply || ""
      });
    }
  }

  if (parsed.barcode) {
    const product = await getProductByBarcode(parsed.barcode);
    if (product) {
      let pricingContext = "";
      const lowerMsg = message.toLowerCase();

      if (lowerMsg.includes("fiyat") || lowerMsg.includes("optimize") || lowerMsg.includes("rekabet")) {
        const suggestion = await getPriceSuggestion(product.barcode);
        if (suggestion) {
          pricingContext = `\n[Pazar Analizi: Rakiplerin fiyatları: ${suggestion.competitors.map((c: any) => `${c.platform}: ${c.price} ${c.currency}`).join(", ")}. AI Önerisi: ${suggestion.suggestedPrice} ${suggestion.currency}. Gerekçe: ${suggestion.reason}]`;
        }
      }

      const productContext = `[Context: Kullanıcı şu an "${product.name}" (${product.barcode}) ürününe odaklanmış durumda. Fiyatı: ${product.price} ${product.currency}, Stoku: ${product.stock}.${pricingContext}]\n\n`;
      contextMessage = productContext + message;
    }
  }

  const file = context.body?.file;
  let imageInput;

  if (file && file.buffer) {
    imageInput = {
      buffer: file.buffer,
      mimeType: file.mimetype,
    };
  }

  const geminiReply = await generateGeminiReply({
    message: contextMessage,
    locale,
    history: chatHistory,
    image: imageInput,
  });
  if (!geminiReply) {
    // Check if Gemini is disabled or API key is missing
    const apiKey = (process.env.GEMINI_API_KEY ?? "").trim();
    const enabledFlag = process.env.GEMINI_ENABLED;
    const enabled = enabledFlag === undefined || enabledFlag === "true" || enabledFlag === "1";

    if (!apiKey) {
      return {
        reply: locale === "tr"
          ? "Üzgünüm kanka, AI servisi şu anda kullanılamıyor. GEMINI_API_KEY ayarlanmamış. 😞\n\nLütfen sistem yöneticisiyle iletişime geçin."
          : "Sorry buddy, AI service is currently unavailable. GEMINI_API_KEY is not configured. 😞\n\nPlease contact the system administrator.",
        success: false,
        data: { error: "gemini_api_key_missing" },
      };
    }

    if (!enabled) {
      return {
        reply: locale === "tr"
          ? "Üzgünüm kanka, AI servisi şu anda devre dışı. GEMINI_ENABLED=false ayarı var. 😞\n\nLütfen sistem yöneticisiyle iletişime geçin."
          : "Sorry buddy, AI service is currently disabled. GEMINI_ENABLED=false is set. 😞\n\nPlease contact the system administrator.",
        success: false,
        data: { error: "gemini_disabled" },
      };
    }

    // API call failed
    return {
      reply: locale === "tr"
        ? "Üzgünüm kanka, AI servisine bağlanamadım. Birkaç saniye sonra tekrar deneyebilir misin? 🤔\n\nEğer sorun devam ederse, sistem yöneticisiyle iletişime geçin."
        : "Sorry buddy, I couldn't connect to the AI service. Could you try again in a few seconds? 🤔\n\nIf the problem persists, please contact the system administrator.",
      success: false,
      data: { error: "gemini_api_failed" },
    };
  }

  // Try to parse partial JSON from Gemini if it triggers a hidden intent
  try {
    const jsonMatch = geminiReply.match(/\{.*"intent"\s*:\s*"network\.stock\.query".*\}/s);
    if (jsonMatch) {
      const cmd = JSON.parse(jsonMatch[0]);
      if (cmd.intent === "network.stock.query") {
        const barcodeMatch = (cmd.text || message).match(/\d{13}/) || (cmd.text || message).match(/\d{8,}/);
        const barcode = barcodeMatch ? barcodeMatch[0] : null;

        if (!barcode) {
          return { reply: t(locale, "missing_barcode"), success: false };
        } else {
          const whitelist = await searchNetwork(barcode);
          if (whitelist.length === 0) {
            return {
              reply:
                locale === "tr"
                  ? "Bu ürünü ağdaki başka hiçbir toptancı satmıyor kanka. Tek bizde var herhalde! 👑"
                  : "No other wholesaler in the network has this item. We are the only ones! 👑",
              success: true,
            };
          } else {
            const rows = whitelist
              .map(
                (w: any, i: number) =>
                  `${i + 1}. **${w.wholesalerName}**\n   📦 Stok: ${w.stock} | 💰 Fiyat: ${w.price} ${w.currency}\n   📞 ${w.phone}`,
              )
              .join("\n\n");
            return {
              reply:
                locale === "tr"
                  ? `Ooo buldum kanka! Şu toptancılarda var:\n\n${rows}`
                  : `Found it buddy! Available at these wholesalers:\n\n${rows}`,
              success: true,
              data: { wholesalerMatches: whitelist },
            };
          }
        }
      }
    }
  } catch (e) {
    // Ignore JSON parse errors, treat as text
  }

  return {
    reply: geminiReply,
    success: true,
    data: { source: "gemini" },
  };
};
