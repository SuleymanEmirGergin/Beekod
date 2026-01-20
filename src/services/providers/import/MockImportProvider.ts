
import { ScrapedProduct, scrapeProductFromUrl } from "../../productScraper.js";
import { logger } from "../../../logger.js";
import { IImportProvider } from "../../interfaces.js";
import { ImportResult } from "../../productImportService.js";
import { rewriteProductContent, generateHtmlSpecTable } from "../../ai/productRewriter.js";
import { upsertProduct } from "../../product/productService.js";
import { getAllIntegrations } from "../../marketplace/integrationService.js";
import { ShopifyConnector } from "../../connectors/shopifyConnector.js";
import { WooConnector } from "../../connectors/wooConnector.js";
import { Buffer } from "buffer";
import { ImportDraft } from "../../dto/import.js";

export class MockImportProvider implements IImportProvider {

    async getImportDraft(url: string): Promise<ImportDraft> {
        // Simple deterministic draft for Mock
        const u = new URL(url);
        const query = u.searchParams.get('q') || "Ürün";

        let title = "Örnek Ürün";
        let price = 1000;

        if (query.toLowerCase().includes("iphone")) {
            title = "Apple iPhone 15 128GB";
            price = 54000;
        } else if (query.toLowerCase().includes("samsung")) {
            title = "Samsung Galaxy S24";
            price = 45000;
        }

        return {
            title,
            description: "Bu bir örnek ürün taslağıdır.",
            price,
            currency: "TRY",
            images: ["https://via.placeholder.com/400"],
            sourceUrl: url,
            provider: "mock",
            needsManualMapping: false,
            attributes: { "Marka": "Apple", "Model": "iPhone 15" },
            categorySuggestion: { id: "1", name: "Cep Telefonu", confidence: 1.0, source: "default" }
        };
    }

    async importProduct(url: string, providerId?: "shopify" | "woocommerce", options?: Partial<ImportDraft>): Promise<ImportResult> {
        logger.info("mock_import.start", { url, providerId, options });

        // Use options if provided, otherwise simulate scraping
        let scraped: Partial<ScrapedProduct> | null = null;

        if (options) {
            scraped = {
                name: options.title,
                description: options.description,
                price: options.price,
                currency: options.currency,
                imageUrl: options.images?.[0],
                attributes: options.attributes,
                category: options.categorySuggestion?.name
            };
        } else {
            // Existing logic fallback
            try {
                const u = new URL(url);
                const query = u.searchParams.get('q') || "Ürün";
                // ... (Existing deterministic mock logic)
                // For brevity, using a simpler fallback since the main flow now uses options
                scraped = {
                    name: "Mock Product",
                    price: 1000,
                    currency: "TRY",
                    imageUrl: "https://via.placeholder.com/400",
                    category: "General"
                };
            } catch (err) {
               scraped = await scrapeProductFromUrl(url);
            }
        }

        if (!scraped) {
            return { success: false, provider: providerId || "none", productName: "", error: "Pazaryerinden ürün verisi çekilemedi." };
        }

         // 2. AI Optimization (SEO Rewrite & Spec Table)
            // Note: casting scraped to any to satisfy rewriteProductContent
            const optimized = await rewriteProductContent(scraped as any);
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
                const { getPriceSuggestion } = await import("../../pricingService.js");
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
                    } catch (_e) { }
                }

                const { analyzeImage } = await import("../../geminiClient.js");
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
            try {
                const upResult = await upsertProduct({
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

                if (!upResult.ok) {
                    throw upResult.error;
                }

                const savedBarcode = upResult.value.barcode;
                logger.info("import.saved_local", { barcode: savedBarcode });
            } catch (dbErr) {
                logger.error("import.local_db_failed", { dbErr });
                return {
                    success: false,
                    provider: providerId || "none",
                    productName: optimized.title,
                    error: "Veritabanına kayıt sırasında hata oluştu. Lütfen sistem yöneticisine başvurun."
                };
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
                    localId: scraped?.barcode,
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
                    localId: scraped?.barcode,
                    aiImageInsight,
                    aiMarketInsight,
                    socialPosts: optimized.socialPosts
                };

            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                logger.error("import.connector_error", { err });
                return {
                    success: true,
                    provider: finalProviderId,
                    productName: optimized.title,
                    localId: scraped?.barcode,
                    aiImageInsight,
                    aiMarketInsight,
                    socialPosts: optimized.socialPosts,
                    error: `Envantere kaydedildi ancak mağazaya yüklenirken hata oluştu: ${message}`
                };
            }
    }
}
