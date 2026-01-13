import { getMarketplaceProvider } from "./index.js";
import { MarketplaceActionResult, MarketplaceProductPayload } from "./types.js";
import { canonicalProductService } from "../canonicalProductService.js";
import { logger } from "../../logger.js";
import { credentialService } from "../credentialService.js";

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

        const resultResult = await provider.upsertProduct(marketplacePayload);
        if (!resultResult.ok) {
            return { status: "failed", message: resultResult.error.message };
        }

        return resultResult.value;

    } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error("publish_service.failed", { productId, marketplace, err: errorMsg });
        return { status: "failed", message: errorMsg };
    }
}
