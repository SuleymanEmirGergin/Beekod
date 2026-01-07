import { t } from "../../i18n.js";
import { analyzePricing } from "../../services/pricingService.js";
import { logger } from "../../logger.js";
import { IntentHandler } from "./types.js";

export const pricingHandler: IntentHandler = async (parsed, context) => {
  const { locale, requestId } = context;

  if (parsed.intent === "pricing.recommend") {
    const productName = (parsed.productName ?? parsed.text ?? "").trim();
    const myCost = parsed.price;

    if (!productName) {
      return {
        reply:
          locale === "tr"
            ? "Hangi ürün için fiyat önerisi istiyorsunuz?"
            : "Which product do you want a price recommendation for?",
        success: false,
      };
    }

    try {
      const analysis = await analyzePricing({
        productName,
        myCost,
        locale,
      });

      if (!analysis) {
        return { reply: t(locale, "pricing_recommend_failed"), success: false };
      }

      const { min, max, avg } = analysis.marketStats;
      const currency = analysis.competitors[0]?.currency || "TL";

      const competitorList = analysis.competitors.length
        ? analysis.competitors.map((c: any) => `- ${c.name}: ${c.price} ${c.currency}`).join("\n")
        : locale === "tr"
          ? "Listelenecek rakip bulunamadı."
          : "No competitors listed.";

      const statsTr = `**Rakip Fiyatları:**\n${competitorList}\n\n**Pazar:** Min: ${min} ${currency} | Ort: ${avg.toFixed(2)} ${currency} | Maks: ${max} ${currency}`;
      const statsEn = `**Competitor Prices:**\n${competitorList}\n\n**Market:** Min: ${min} ${currency} | Avg: ${avg.toFixed(2)} ${currency} | Max: ${max} ${currency}`;

      return {
        reply: `${locale === "tr" ? statsTr : statsEn}\n\n💡 **Öneri:**\n${analysis.recommendation}`,
        data: { analysis },
        success: true,
      };
    } catch (error) {
      logger.error("chat.pricing.recommend_failed", { requestId, err: error });
      return { reply: t(locale, "pricing_recommend_system_error"), success: false };
    }
  }

  return { reply: t(locale, "unknown_intent"), success: false };
};
