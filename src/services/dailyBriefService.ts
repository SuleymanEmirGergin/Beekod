import { getRevenueTimeline } from "./analyticsService.js";
import { getLowStockProducts } from "./product/productService.js";
import { generateGeminiReply } from "./ai/geminiClient.js";
import { logger } from "../logger.js";
import { Locale } from "../types.js";
import { getUserPreferences } from "./userPreferenceService.js";
import { getCache, setCache } from "./product/cacheService.js";

const BRIEF_CACHE_TTL = 3600; // 1 hour

export async function generateDailyBrief(userId: string, locale: Locale): Promise<string | null> {
    const cacheKey = `daily_brief:${userId}:${new Date().toDateString()}`;
    
    // Try to get from cache first
    const cached = await getCache<string>(cacheKey);
    if (cached) {
        logger.debug("daily_brief.cached_hit", { userId });
        return cached;
    }

    try {
        // 1. Fetch Data
        // Get last 3 days to compare "Yesterday" vs "Day Before" properly if needed,
        // or just last 2.
        const timeline = await getRevenueTimeline(3);
        const yesterday = timeline[timeline.length - 1] || { revenue: 0, orderCount: 0 };
        const dayBefore = timeline[timeline.length - 2] || { revenue: 0, orderCount: 0 };

        // Revenue delta
        const revenueChange = dayBefore.revenue > 0
            ? ((yesterday.revenue - dayBefore.revenue) / dayBefore.revenue) * 100
            : 0;

        // Low stock (critical < 5)
        const lowStockResult = await getLowStockProducts(5, 5);
        const lowStock = lowStockResult.ok ? lowStockResult.value : [];

        // Top seller of yesterday
        const { getTopSellers } = await import("./analyticsService.js");
        const topSellers = await getTopSellers(1, 1);
        const topSeller = topSellers[0];

        // 2. Prepare Context for AI
        const dataContext = `
    DATE: ${new Date().toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
    
    YESTERDAY'S PERFORMANCE:
    - Revenue: ${yesterday.revenue} TL (${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}% vs previous day)
    - Orders: ${yesterday.orderCount || 0}
    
    TOP SELLING PRODUCT YESTERDAY:
    ${topSeller ? `- ${topSeller.product_name} (${topSeller.units_sold} units)` : "No sales recorded."}

    CRITICAL ALERTS (Stock < 5):
    ${lowStock.length === 0 ? "None. Inventory is healthy." : lowStock.map(p => `- ${p.name} (${p.stock} left)`).join("\n")}
    `;

        // 3. Generate Content
        const prefs = getUserPreferences(userId);
        const systemInstruction = locale === 'tr'
            ? `Sen Beekod asistanısın. Kullanıcının güne başlarken okuyacağı "Günlük Özet" mesajını hazırla.
          Verilen satış ve stok verilerini analiz et. 
          - Ton: friendly (Samimi, enerjik, "kanka" modunda).
          - Dün satışlar iyiyse "Harikasın kanka!" diyerek tebrik et, kötüyse "Sıkma canını dostum, bugün hallederiz" diyerek motive et.
          - Stok uyarısı varsa "Hocam bak şu ürünler bitiyor" şeklinde nazikçe hatırlat.
          - Bol emoji kullan (🚀, ✅, 📦, 💰, 🔥).
          - Kısa ve öz tut (maksimum 3-4 cümle).`
            : locale === 'ar'
                ? `أنت مساعد Beekod. قم بإعداد رسالة "ملخص يومي" للمستخدم لبدء يومه.
          قم بتحليل بيانات المبيعات والمخزون المقدمة.
          - النبرة: صديق ودود (Friendly).
          - إذا كانت المبيعات جيدة قل "أنت رائع يا صديقي!"، وإذا كانت منخفضة قل "لا تقلق يا أخي، سنحقق مبيعات أفضل اليوم".
          - اذكر تنبيهات المخزون بلهجة ودية "يا أخي، هذه المنتجات تنفد".
          - استخدم الكثير من الإيموجي.
          - اجعلها قصيرة (3-4 جمل).`
                : `You are Beekod assistant. Prepare a "Daily Brief" for the user to start their day.
          Analyze the provided sales and stock data.
          - Tone: friendly ("buddy" style).
          - Congratulate if sales were good ("Great job buddy!"), motivate if low ("Don't worry friend, we'll nail it today").
          - Mention stock alerts kindly ("Hocam, these products are running out").
          - Use emojis.
          - Keep it short (3-4 sentences).`;


        const brief = await generateGeminiReply({
            message: systemInstruction + "\n\n" + `Here is the data:\n${dataContext}`,
            locale,
        });

        if (brief) {
            // Cache the generated brief
            await setCache(cacheKey, brief, BRIEF_CACHE_TTL);
            return brief;
        }

        return null;

    } catch (error) {
        logger.error("daily_brief.failed", { err: error });
        return null;
    }
}
