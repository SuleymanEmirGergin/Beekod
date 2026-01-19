
import { IImportProvider } from "../../interfaces.js";
import { ImportResult } from "../../productImportService.js";
import { ImportDraft } from "../../dto/import.js";
import { scrapeProductFromUrl } from "../../productScraper.js";
import { mappingService } from "../../mappingService.js";
import { rewriteProductContent, generateHtmlSpecTable } from "../../ai/productRewriter.js";
import { upsertProduct } from "../../product/productService.js";
import { getAllIntegrations } from "../../marketplace/integrationService.js";
import { ShopifyConnector } from "../../connectors/shopifyConnector.js";
import { WooConnector } from "../../connectors/wooConnector.js";
import { logger } from "../../../logger.js";
import { Buffer } from "buffer";

export class LiveImportProvider implements IImportProvider {

    async getImportDraft(url: string): Promise<ImportDraft> {
        const u = new URL(url);
        const hostname = u.hostname;

        // 1. Scrape
        const scraped = await scrapeProductFromUrl(url);
        if (!scraped) {
            throw new Error("Pazaryerinden ürün verisi çekilemedi.");
        }

        // 2. Map
        const mapping = await mappingService.mapProduct(
            hostname,
            scraped.attributes || {},
            scraped.category
        );

        // 3. Construct Draft
        return {
            title: scraped.name,
            description: scraped.description || "",
            price: scraped.price || 0,
            currency: scraped.currency || "TRY",
            images: scraped.images && scraped.images.length > 0 ? scraped.images : (scraped.imageUrl ? [scraped.imageUrl] : []),
            sourceUrl: url,
            provider: mapping.providerKey || "unknown",
            needsManualMapping: !mapping.providerKey || mapping.categorySuggestion?.confidence === 0,

            attributes: mapping.attributes,
            categorySuggestion: mapping.categorySuggestion,

            // Raw data for debugging or advanced mapping
            raw: scraped
        };
    }

    async importProduct(url: string, providerId?: "shopify" | "woocommerce"): Promise<ImportResult> {
        // Full Import Flow: Scrape -> Map -> AI Optimize -> DB Save -> Store Push
        // Leveraging getImportDraft for consistency

        let draft: ImportDraft;
        try {
            draft = await this.getImportDraft(url);
        } catch (error: any) {
            return {
                success: false,
                provider: providerId || "none",
                productName: "",
                error: error.message || "Taslak oluşturulamadı"
            };
        }

        // AI Optimization
        // Note: productScraper returns ScrapedProduct which rewriteProductContent expects.
        // draft.raw should be castable back if we kept it compliant, but rewriteProductContent takes ScrapedProduct.
        // We can reconstruct a ScrapedProduct-like object from draft or use draft.raw

        const scrapedProductLike: any = draft.raw || {
            name: draft.title,
            description: draft.description,
            price: draft.price,
            currency: draft.currency,
            images: draft.images,
            attributes: draft.attributes,
            category: draft.categorySuggestion?.name
        };

        const optimized = await rewriteProductContent(scrapedProductLike);
        const specTable = generateHtmlSpecTable(draft.attributes);

        let finalDescription = `${optimized.description}`;
        if (optimized.insights) {
            finalDescription += `\n\n<div style="background: #e3f2fd; border-left: 5px solid #2196f3; padding: 15px; margin: 20px 0;">
                <strong>💡 Müşteri Deneyimi Analizi (AI):</strong><br/>
                ${optimized.insights}
            </div>`;
        }
        finalDescription += `\n\n${specTable}`;

        // Save to DB
        try {
            const upResult = await upsertProduct({
                barcode: `IMP${Date.now()}`, // Generate barcode or use scraped if available (draft.raw?.barcode)
                name: optimized.title,
                description: finalDescription,
                category: optimized.suggestedCategory || draft.categorySuggestion?.name || "Genel",
                price: draft.price,
                stock: 50, // Default stock as scraping might not get it reliably
                currency: draft.currency,
                imageUrl: draft.images[0],
                brand: scrapedProductLike.brand || "",
                sourceUrl: url,
                sourceSite: new URL(url).hostname,
            });

            if (!upResult.ok) throw upResult.error;

            logger.info("live_import.saved_local", { barcode: upResult.value.barcode });

            // Store Push Logic (Copied/Refactored from original service)
            const integrations = await getAllIntegrations();
            let targetProvider = providerId;
            if (!targetProvider) {
                const supported = integrations.find(i => i.connected && (i.providerId === "shopify" || i.providerId === "woocommerce"));
                if (supported) targetProvider = supported.providerId as "shopify" | "woocommerce";
            }

            const integration = targetProvider ? integrations.find(i => i.providerId === targetProvider) : null;

            if (!integration || !integration.connected) {
                return {
                    success: true,
                    provider: targetProvider || "none",
                    productName: optimized.title,
                    localId: upResult.value.barcode,
                    error: targetProvider ? `${targetProvider} not connected` : "No store connected"
                };
            }

            const storeProduct = {
                ...scrapedProductLike,
                name: optimized.title,
                description: finalDescription,
                category: optimized.suggestedCategory || "General"
            };

            let storeResult;
            if (targetProvider === "shopify") {
                const connector = new ShopifyConnector(integration.config);
                storeResult = await connector.createProductDraft(storeProduct);
            } else {
                const connector = new WooConnector(integration.config);
                storeResult = await connector.createProductDraft(storeProduct);
            }

            return {
                success: true,
                provider: targetProvider,
                productName: optimized.title,
                editUrl: storeResult.editUrl,
                localId: upResult.value.barcode,
                socialPosts: optimized.socialPosts
            };

        } catch (dbErr: any) {
            logger.error("live_import.failed", { err: dbErr });
            return {
                success: false,
                provider: providerId || "none",
                productName: optimized.title,
                error: dbErr.message || "Import failed"
            };
        }
    }
}
