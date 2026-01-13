import { getMarketplaceProvider } from "./index.js";
import { PazaramaProvider } from "./providers/pazaramaProvider.js";

class PazaramaService {
    private getProvider(): PazaramaProvider {
        const provider = getMarketplaceProvider("Pazarama");
        if (!provider) throw new Error("Pazarama provider not found");
        return provider as PazaramaProvider;
    }

    isConfigured(): boolean {
        return this.getProvider().isConfigured();
    }

    async getOrders(params?: {
        startDate?: string;
        endDate?: string;
        orderNumber?: string;
        pageSize?: number;
        pageNumber?: number;
        autoPaginate?: boolean;
    }) {
        return this.getProvider().getNewOrders(params);
    }

    async getListings(params?: {
        status?: "active" | "inactive";
        barcode?: string;
        approved?: boolean;
        page?: number;
        size?: number;
        autoPaginate?: boolean;
    }) {
        return this.getProvider().listListings(params);
    }

    async updatePriceAndStock(barcode: string, price?: number, stock?: number) {
        return this.getProvider().updateListing({ barcode, price, stock });
    }
}

export const pazaramaService = new PazaramaService();
