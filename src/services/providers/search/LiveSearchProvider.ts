
import { ISearchProvider } from "../../interfaces.js";
import { ProductCard } from "../../../chatbot/types.js";
import { searchMarketplaceAgent, SearchResultJSON, MarketplaceOffer } from "../../marketplaceFinderAgent.js";
import { CircuitBreaker } from "../../../utils/circuitBreaker.js";
import { logger } from "../../../logger.js";
import { SearchResult } from "../../dto/search.js";
import { MarketplaceName } from "../../marketplace/types.js";

export class LiveSearchProvider implements ISearchProvider {
    private circuitBreaker: CircuitBreaker;
    private retryLimit: number = 2;

    constructor() {
        this.circuitBreaker = new CircuitBreaker("LiveSearchAgent", {
            failureThreshold: 3,
            resetTimeoutMs: 30000
        });
    }

    async search(query: string): Promise<ProductCard[]> {
        const marketplacesEnv = process.env.LIVE_SEARCH_MARKETPLACES;
        const timeoutMs = parseInt(process.env.LIVE_SEARCH_TIMEOUT_MS || "20000", 10);

        // Note: Currently marketplaceFinderAgent doesn't support filtering by marketplace option.
        // We'll filter post-search for now until agent refactor is prioritized.
        const targetMarketplaces = marketplacesEnv
            ? marketplacesEnv.split(",").map(m => m.trim().toLowerCase())
            : undefined;

        try {
            const agentResult = await this.executeWithRetry(async () => {
                return await this.circuitBreaker.execute<SearchResultJSON>(async () => {
                    // Timeout wrapper
                    return await Promise.race([
                        searchMarketplaceAgent(query),
                        new Promise<SearchResultJSON>((_, reject) =>
                            setTimeout(() => reject(new Error("Timeout")), timeoutMs)
                        )
                    ]);
                });
            });

            const searchResults = this.normalizeResults(agentResult);
            let productCards = this.mapToProductCards(searchResults);

            if (targetMarketplaces) {
                productCards = productCards.filter(p =>
                    p.marketplace && targetMarketplaces.includes(p.marketplace.toLowerCase())
                );
            }

            return productCards;

        } catch (error) {
            logger.error("live_search.failed", { query, error });
            return []; // Fail safe by returning empty results
        }
    }

    private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
        let lastError: unknown;
        for (let i = 0; i <= this.retryLimit; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                // Only retry on specific errors if needed, or all.
                // For now assuming all are retryable unless CircuitBreaker is OPEN which throws immediately.
                if (i < this.retryLimit) {
                    logger.warn("live_search.retry", { attempt: i + 1, error });
                    await new Promise(res => setTimeout(res, 1000 * (i + 1))); // Exponential backoffish
                }
            }
        }
        throw lastError;
    }

    private normalizeResults(agentResult: SearchResultJSON): SearchResult[] {
        return agentResult.offers.map(offer => ({
            marketplace: offer.marketplace,
            title: offer.title,
            price: offer.price,
            currency: "TRY", // Agent uses TRY
            url: offer.product_url,
            imageUrl: offer.image_url,
            vendor: offer.seller,
            rating: offer.rating ? parseFloat(offer.rating) : undefined,
            raw: offer
        }));
    }

    private mapToProductCards(results: SearchResult[]): ProductCard[] {
        return results.map(res => ({
            name: res.title,
            price: res.price,
            currency: res.currency,
            url: res.url,
            image: res.imageUrl, // For chat widget
            imageUrl: res.imageUrl, // For internal use
            marketplace: this.mapMarketplaceName(res.marketplace),
            canImport: true,
            stock: 1 // Default to 1 as availability is usually boolean "in stock"
        }));
    }

    private mapMarketplaceName(raw: string): MarketplaceName | undefined {
        const lower = raw.toLowerCase();
        if (lower.includes("trendyol")) return "Trendyol";
        if (lower.includes("hepsiburada")) return "Hepsiburada";
        if (lower.includes("n11")) return "N11";
        if (lower.includes("ciceksepeti")) return "Ciceksepeti";
        if (lower.includes("pttavm") || lower.includes("ptt")) return "PttAVM";
        if (lower.includes("pazarama")) return "Pazarama";
        if (lower.includes("amazon")) return "Amazon";
        return undefined;
    }
}
