
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

export class MockImportProvider implements IImportProvider {

    async importProduct(url: string, providerId?: "shopify" | "woocommerce"): Promise<ImportResult> {
        logger.info("mock_import.start", { url, providerId });

        let scraped: ScrapedProduct | null = null;

        try {
            const u = new URL(url);
            const hostname = u.hostname;
            const searchParams = u.searchParams;
            const query = searchParams.get('q') || searchParams.get('query') || "Ürün";

            if (hostname.includes("trendyol") ||
                hostname.includes("hepsiburada") ||
                hostname.includes("n11") ||
                hostname.includes("ciceksepeti") ||
                hostname.includes("pttavm") ||
                hostname.includes("pazarama") ||
                hostname.includes("google")) { // Add Google for Samsung results

                logger.info("mock_import.match_generated", { url });

                // Extract model from query if possible
                let model = "15";
                let brand = "Apple";
                let baseName = "iPhone";

                // Check for Samsung
                if (query.toLowerCase().includes("samsung") || query.toLowerCase().includes("galaxy")) {
                    brand = "Samsung";
                    baseName = "Galaxy";
                    if (query.includes("s24")) model = "S24 Ultra";
                    else if (query.includes("s23")) model = "S23";
                    else if (query.includes("s22")) model = "S22";
                    else if (query.includes("a55")) model = "A55";
                    else if (query.includes("a54")) model = "A54";
                    else model = "S24"; // Default Samsung
                } else {
                    // iPhone Logic
                    if (query.includes("11")) model = "11";
                    else if (query.includes("12")) model = "12";
                    else if (query.includes("13")) model = "13";
                    else if (query.includes("14")) model = "14";
                }

                let color = "Siyah";
                const qLower = query.toLowerCase();
                if (qLower.includes("beyaz") || qLower.includes("white")) color = "Beyaz";
                else if (qLower.includes("mavi") || qLower.includes("blue")) color = "Mavi";
                else if (qLower.includes("gri") || qLower.includes("grey") || qLower.includes("titanium")) color = "Titanyum Gri";
                else if (qLower.includes("sarı") || qLower.includes("yellow")) color = "Sarı";
                else if (qLower.includes("mor") || qLower.includes("purple") || qLower.includes("violet") || qLower.includes("menekşe")) color = "Menekşe";
                else if (qLower.includes("yeşil") || qLower.includes("green")) color = "Yeşil";
                else if (qLower.includes("pembe") || qLower.includes("pink")) color = "Pembe";

                const productName = brand === "Samsung"
                    ? `Samsung Galaxy ${model} 256GB ${color}`
                    : `Apple iPhone ${model} 128GB ${color}`;

                const imgUrl = brand === "Samsung"
                    ? "https://cdn.dsmcdn.com/ty1170/product/media/images/prod/SPM/PIM/20240221/11/043e03cd-6a6c-4977-850d-65dabe7825b7/1_org_zoom.jpg" // Samsung S24 Image
                    : "https://cdn.dsmcdn.com/ty986/product/media/images/20230922/16/438332159/1018398886/1/1_org_zoom.jpg"; // iPhone Image

                // Generate deterministic mock data based on URL
                scraped = {
                    name: productName,
                    description: `<h3>${brand} ${baseName} ${model}</h3><p>Bu ürün ${hostname} üzerinden içe aktarılmıştır. Demo amaçlı üretilmiş veridir.</p>`,
                    category: "Cep Telefonu",
                    price: (brand === "Samsung" ? 45000 : 35000) + (Math.random() * 5000), // Random price for realism
                    currency: "TRY",
                    stock: 20,
                    barcode: `MOCK-${Date.now()}`,
                    imageUrl: imgUrl,
                    originalUrl: url,
                    attributes: { "Marka": brand, "Model": `${baseName} ${model}`, "Hafıza": "128 GB" },
                    rating: 4.5
                };
            } else {
                // Fallback to real scrape attempt even in mock if domain unknown
                scraped = await scrapeProductFromUrl(url);
            }
        } catch (err) {
            logger.warn("mock_import.check_failed", { err });
            scraped = await scrapeProductFromUrl(url);
        }

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
