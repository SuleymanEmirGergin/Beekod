
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LiveSearchProvider } from "../../../../src/services/providers/search/LiveSearchProvider";
import * as agentModule from "../../../../src/services/marketplaceFinderAgent";

describe("LiveSearchProvider", () => {
    let provider: LiveSearchProvider;

    beforeEach(() => {
        vi.resetAllMocks();
        provider = new LiveSearchProvider();
    });

    it("calls searchMarketplaceAgent and normalizes results", async () => {
        const mockResult = {
            query: "iphone",
            currency: "TRY",
            accessory_intent: false,
            search_passes: [],
            offers: [
                {
                    marketplace: "trendyol" as any,
                    title: "iPhone 15",
                    price: 50000,
                    shipping_cost: 0,
                    total_cost: 50000,
                    product_url: "http://trendyol.com/iphone",
                    image_url: "http://img.com/iphone.jpg",
                    availability: "in_stock" as any,
                    product_type: "core" as any,
                    match_quality: "good" as any
                }
            ],
            blocked_marketplaces: []
        };

        const agentSpy = vi.spyOn(agentModule, "searchMarketplaceAgent").mockResolvedValue(mockResult);

        const results = await provider.search("iphone");

        expect(agentSpy).toHaveBeenCalledWith("iphone");
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe("iPhone 15");
        expect(results[0].marketplace).toBe("Trendyol");
        expect(results[0].price).toBe(50000);
        expect(results[0].canImport).toBe(true);
    });

    it("retries on failure", async () => {
        const agentSpy = vi.spyOn(agentModule, "searchMarketplaceAgent")
            .mockRejectedValueOnce(new Error("Network Error"))
            .mockResolvedValueOnce({
                query: "iphone",
                currency: "TRY",
                accessory_intent: false,
                search_passes: [],
                offers: [],
                blocked_marketplaces: []
            });

        await provider.search("iphone");

        expect(agentSpy).toHaveBeenCalledTimes(2);
    });

    it("returns empty array after retries exhausted", async () => {
        const agentSpy = vi.spyOn(agentModule, "searchMarketplaceAgent")
            .mockRejectedValue(new Error("Network Error"));

        const results = await provider.search("iphone");

        expect(agentSpy).toHaveBeenCalledTimes(3); // Initial + 2 retries
        expect(results).toEqual([]);
    });

    it("filters marketplaces if env var is set", async () => {
        process.env.LIVE_SEARCH_MARKETPLACES = "trendyol";

        const mockResult = {
            query: "iphone",
            currency: "TRY",
            accessory_intent: false,
            search_passes: [],
            offers: [
                {
                    marketplace: "trendyol" as any,
                    title: "iPhone 15",
                    price: 50000,
                    shipping_cost: 0,
                    total_cost: 50000,
                    product_url: "http://trendyol.com/iphone",
                    image_url: "http://img.com/iphone.jpg",
                    availability: "in_stock" as any,
                    product_type: "core" as any,
                    match_quality: "good" as any
                },
                {
                    marketplace: "hepsiburada" as any,
                    title: "iPhone 15 HB",
                    price: 49000,
                    shipping_cost: 0,
                    total_cost: 49000,
                    product_url: "http://hb.com/iphone",
                    image_url: "http://img.com/iphone.jpg",
                    availability: "in_stock" as any,
                    product_type: "core" as any,
                    match_quality: "good" as any
                }
            ],
            blocked_marketplaces: []
        };

        vi.spyOn(agentModule, "searchMarketplaceAgent").mockResolvedValue(mockResult);

        const results = await provider.search("iphone");

        expect(results).toHaveLength(1);
        expect(results[0].marketplace).toBe("Trendyol");

        delete process.env.LIVE_SEARCH_MARKETPLACES;
    });
});
