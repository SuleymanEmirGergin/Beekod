import { logger } from "../logger.js";
import { ImportProviderFactory } from "./providers/ImportProviderFactory.js";

export type ImportResult = {
    success: boolean;
    provider: string | "none";
    productName: string;
    editUrl?: string;
    localId?: string;
    aiImageInsight?: string;
    aiMarketInsight?: string;
    socialPosts?: Record<string, string>;
    error?: string;
};

export async function importProductFromUrl(url: string, providerId?: "shopify" | "woocommerce"): Promise<ImportResult> {
    logger.info("import.start", { url, providerId });
    try {
        const provider = ImportProviderFactory.getProvider();
        return await provider.importProduct(url, providerId);
    } catch (error: any) {
        logger.error("import.error", { error: error.message });
        return {
            success: false,
            provider: providerId || "none",
            productName: "",
            error: error.message || "Bilinmeyen bir hata oluştu"
        };
    }
}
