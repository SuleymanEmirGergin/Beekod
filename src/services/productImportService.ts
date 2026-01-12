import { scrapeProductFromUrl } from "./productScraper.js";
import { rewriteProductContent, generateHtmlSpecTable } from "./ai/productRewriter.js";
import { upsertProduct } from "./productService.js";
import { getAllIntegrations } from "./integrationService.js";
import { ShopifyConnector } from "./connectors/shopifyConnector.js";
import { WooConnector } from "./connectors/wooConnector.js";
import { logger } from "../logger.js";

type ImportResult = {
    success: boolean;
    provider: string | "none";
    productName: string;
    editUrl?: string;
    localId?: string;
    aiImageInsight?: string;
    aiMarketInsight?: string;
    socialPosts?: any;
    error?: string;
};

export async function importProductFromUrl(url: string, providerId?: "shopify" | "woocommerce"): Promise<ImportResult> {
    logger.info("import.start", { url, providerId });

    // 1. Scrape raw data
    const scraped = await scrapeProductFromUrl(url);
    if (!scraped) {
        return { success: false, provider: providerId || "none", productName: "", error: "Pazaryerinden ürün verisi çekilemedi." };
    }

    // 2. AI Optimization (SEO Rewrite & Spec Table)
    const optimized = await rewriteProductContent(scraped);
    const specTable = generateHtmlSpecTable(scraped.attributes as Record<string, string> || {});

    // Combine optimized description with spec table
    let finalDescription = `${optimized.description}`;

    // Add AI Insights if available
    if (optimized.insights) {
        finalDescription += `\n\n<div style="background: #e3f2fd; border-left: 5px solid #2196f3; padding: 15px; margin: 20px 0;">
            <strong>💡 Müşteri Deneyimi Analizi (AI):</strong><br/>
            ${optimized.insights}
        </div>`;
    }

    if (scraped.rating) {
        finalDescription += `\n\n<div style="color: #fbc02d; font-size: 18px; margin-bottom: 10px;">
            ${'★'.repeat(Math.round(scraped.rating))}${'☆'.repeat(5 - Math.round(scraped.rating))} 
            <span style="color: #666; font-size: 14px;">(${scraped.rating}/5)</span>
        </div>`;
    }

    finalDescription += `\n\n${specTable}`;

    // 2.5 AI Market & Image Insights
    let aiImageInsight = "";
    let aiMarketInsight = "";
    try {
        // Market Insight (Price Suggestion)
        const { getPriceSuggestion } = await import("./pricingService.js");
        const suggestion = await getPriceSuggestion(scraped.barcode || "");
        if (suggestion) {
            aiMarketInsight = suggestion.reason;
        }

        // Image Insight (AI Check)
        let imageBuffer = Buffer.from([]);
        let imgMime = "image/jpeg";
        if (scraped.imageUrl) {
            try {
                const imgRes = await fetch(scraped.imageUrl);
                if (imgRes.ok) {
                    imageBuffer = Buffer.from(await imgRes.arrayBuffer());
                    imgMime = imgRes.headers.get("content-type") || "image/jpeg";
                }
            } catch (e) { }
        }

        const { analyzeImage } = await import("./geminiClient.js");
        const imageAnalysis = await analyzeImage({
            prompt: "Bu bir e-ticaret ürünü görseli. Profesyonelliğini (ışık, kadraj vb.) tek cümlede değerlendir.",
            buffer: imageBuffer,
            mimeType: imgMime,
            locale: "tr"
        });
        aiImageInsight = imageAnalysis || "";
    } catch (aiErr) {
        logger.warn("import.ai_insights_failed", { aiErr });
    }

    // 3. Save to Local DB (Beekod Inventory)
    let localProduct = null;
    try {
        localProduct = await upsertProduct({
            barcode: scraped.barcode || `IMP${Date.now()}`,
            name: optimized.title,
            description: finalDescription,
            category: optimized.suggestedCategory || scraped.category || "Genel",
            price: scraped.price || 0,
            stock: scraped.stock || 50,
            currency: scraped.currency || "TRY",
            imageUrl: scraped.imageUrl,
            brand: scraped.category,
            sourceUrl: url,
            sourceSite: new URL(url).hostname,
        });
        logger.info("import.saved_local", { barcode: localProduct?.barcode });
    } catch (dbErr) {
        logger.error("import.local_db_failed", { dbErr });
    }

    // 4. Get Integration Config
    const integrations = await getAllIntegrations();
    let targetProvider = providerId;

    // If no provider specified, pick the first connected supported one
    if (!targetProvider) {
        const supported = integrations.find(i => i.connected && (i.providerId === "shopify" || i.providerId === "woocommerce"));
        if (supported) {
            targetProvider = supported.providerId as "shopify" | "woocommerce";
        }
    }

    const integration = targetProvider ? integrations.find(i => i.providerId === targetProvider) : null;

    if (!integration || !integration.connected) {
        return {
            success: true, // Mark as success because local DB saved, but store failed
            provider: targetProvider || "none",
            productName: optimized.title,
            localId: localProduct?.barcode,
            error: targetProvider
                ? `Envantere kaydedildi ancak ${targetProvider} bağlantısı olmadığı için mağazaya yüklenemedi.`
                : `Envantere kaydedildi. Mağaza bağlantısı (Shopify/Woo) bulunamadığı için sadece yerel envantere eklendi.`
        };
    }

    const finalProviderId = targetProvider!;

    // 5. Connect & Create in Store (Shopify/Woo)
    try {
        let storeResult: { id: string; editUrl: string };

        // Prepare adapted product for store
        const storeProduct = {
            ...scraped,
            name: optimized.title,
            description: finalDescription,
            category: optimized.suggestedCategory || scraped.category || "General"
        };

        if (finalProviderId === "shopify") {
            const connector = new ShopifyConnector(integration.config);
            storeResult = await connector.createProductDraft(storeProduct);
        } else {
            const connector = new WooConnector(integration.config);
            storeResult = await connector.createProductDraft(storeProduct);
        }

        return {
            success: true,
            provider: finalProviderId,
            productName: optimized.title,
            editUrl: storeResult.editUrl,
            localId: localProduct?.barcode,
            aiImageInsight,
            aiMarketInsight,
            socialPosts: optimized.socialPosts
        };

    } catch (err: any) {
        logger.error("import.connector_error", { err });
        return {
            success: true,
            provider: finalProviderId,
            productName: optimized.title,
            localId: localProduct?.barcode,
            aiImageInsight,
            aiMarketInsight,
            socialPosts: optimized.socialPosts,
            error: `Envantere kaydedildi ancak mağazaya yüklenirken hata oluştu: ${err.message}`
        };
    }
}
