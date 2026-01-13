import { logger } from "../../logger.js";
import { getMarketplaceProvider } from "./index.js";
import { PttavmProvider } from "./providers/pttavmProvider.js";

class PttavmService {
    private getProvider(): PttavmProvider {
        const provider = getMarketplaceProvider("PttAVM");
        if (!provider) throw new Error("PttAVM provider not found");
        return provider as PttavmProvider;
    }

    isConfigured(): boolean {
        return this.getProvider().isConfigured();
    }

    async getOrders(params?: {
        startDate?: string;
        endDate?: string;
        orderId?: number;
        activeOnly?: boolean;
        useV2?: boolean;
        urunKirilim?: boolean;
    }) {
        return this.getProvider().getNewOrders(params);
    }

    async getListings(params?: {
        status?: "active" | "inactive";
        barcode?: string;
        page?: number;
        shopId?: number;
    }) {
        return this.getProvider().listListings(params);
    }

    async updatePriceAndStock(barcode: string, price?: number, stock?: number) {
        return this.getProvider().updateListing({ barcode, price, stock });
    }
}

export const pttavmService = new PttavmService();
