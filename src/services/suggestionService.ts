import { generateGeminiReply } from "./geminiService.js";
import { SalesSummary, TopProduct, MarketplaceSummary } from "./reportService.js";
import { Locale } from "../types.js";
import { t } from "../i18n.js";

type SuggestionContext = {
  sales: SalesSummary;
  topProducts: TopProduct[];
  marketplaces: MarketplaceSummary[];
};

export async function getSuggestions(context: SuggestionContext, locale: Locale): Promise<string> {
  const prompt = `
Analyzing these e-commerce metrics:
- Period: ${context.sales.period}
- Total Revenue: ${context.sales.revenue} ${context.sales.currency}
- Total Orders: ${context.sales.orders}
- Top Marketplace: ${context.sales.topMarketplace}

Top Products:
${context.topProducts.map((p) => `- ${p.barcode}: ${p.quantity} sold`).join("\n")}

Provide 3 concise, actionable strategic suggestions to improve sales or stock efficiency.
Focus on pricing, inventory, or marketing.
Response MUST be in ${locale} language.
Format as a bulleted list.
`;

  const response = await generateGeminiReply({
    message: "You are an expert e-commerce analyst. Be concise.\n\n" + prompt,
    locale: locale,
  });

  return response || t(locale, "gemini_suggestion_failed");
}

export async function getMarketTrends(category: string | undefined, locale: Locale): Promise<any> {
  const prompt = category
    ? `${category} kategorisi için güncel e-ticaret pazar trendlerini analiz et. En çok aranan özellikler, fiyat eğilimleri ve müşteri beklentilerini belirt.`
    : `Genel e-ticaret pazarında şu an yükselen trendleri, popüler kategorileri ve müşteri davranış değişimlerini analiz et.`;

  const systemInstruction = `Sen profesyonel bir pazar araştırmacısısın. Verileri analiz ederken sektörel jargondan kaçınma ama anlaşılır ol. Yanıtı JSON formatında ver: { "trends": [ { "title": "...", "description": "...", "impact": "high|medium|low" } ], "hotKeywords": ["...", "..."], "recommendation": "..." }. Diline ${locale} uygun olsun.`;

  const response = await generateGeminiReply({
    message: systemInstruction + "\n\n" + prompt,
    locale: locale,
  });

  if (!response) {
    return {
      trends: [],
      hotKeywords: [],
      recommendation: "Veri alınamadı.",
    };
  }

  try {
    // Clean markdown if present
    const cleaned = response
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    // Fallback for demo if non-json returned
    return {
      trends: [{ title: "Trend Analizi", description: response, impact: "medium" }],
      hotKeywords: ["e-ticaret", "indirim", "kampanya"],
      recommendation: "Pazar verilerini takip etmeye devam edin.",
    };
  }
}
