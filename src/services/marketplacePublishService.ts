import { getMarketplaceProvider } from "../marketplaces/index.js";
import { MarketplaceActionResult, MarketplaceProductPayload } from "../marketplaces/types.js";
import { CanonicalProduct, canonicalProductService } from "./canonicalProductService.js";
import { logger } from "../logger.js";
import { credentialService } from "./credentialService.js";

export interface PublishPayload {
    productId: number;
    marketplace: string;
    userId: number; // Added userId for SaaS mode
    overridePrice?: number;
    overrideStock?: number;
}

export async function performPublish(payload: PublishPayload): Promise<MarketplaceActionResult> {
    const { productId, marketplace, userId, overridePrice, overrideStock } = payload;

    try {
        const product = await canonicalProductService.findById(productId);
        if (!product) {
            throw new Error(`Product ${productId} not found`);
        }

        const provider = getMarketplaceProvider(marketplace);
        if (!provider) {
            throw new Error(`Provider for ${marketplace} not found`);
        }

        // --- SaaS Credential Injection ---
        const dbCreds = await credentialService.getCredentials(userId, marketplace);
        if (dbCreds && provider.setCredentials) {
            logger.info("publish_service.using_db_credentials", { userId, marketplace });
            provider.setCredentials(dbCreds);
        }
        // ---------------------------------

        const marketplacePayload: MarketplaceProductPayload = {
            barcode: product.gtin || `PROD-${product.id}`,
            name: product.title,
            price: overridePrice ?? 0, // In real app, we'd grab from a 'mapped_prices' table or product
            stock: overrideStock ?? 0,
            currency: "TRY",
            images: product.images || []
        };

        logger.info("publish_service.publishing", { productId, marketplace });

        const result = await provider.upsertProduct(marketplacePayload);

        return result;

    } catch (error: any) {
        logger.error("publish_service.failed", { productId, marketplace, err: error });
        return { status: "failed", message: error.message };
    }
}
