
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LiveImportProvider } from "../../../../src/services/providers/import/LiveImportProvider";
import * as scraperModule from "../../../../src/services/productScraper";
import * as mappingModule from "../../../../src/services/mappingService";

describe("LiveImportProvider", () => {
    let provider: LiveImportProvider;

    beforeEach(() => {
        vi.resetAllMocks();
        provider = new LiveImportProvider();
    });

    it("getImportDraft scrapes and maps product", async () => {
        const mockScraped = {
            name: "Trendyol Dress",
            description: "A nice dress",
            price: 500,
            currency: "TRY",
            imageUrl: "http://img.com/dress.jpg",
            images: ["http://img.com/dress.jpg"],
            category: "Elbise",
            attributes: { "Beden": "M", "Renk": "Kırmızı" },
            url: "http://trendyol.com/dress",
            barcode: "123",
            stock: 10
        };

        const mockMapping = {
            attributes: { "Size": "M", "Color": "Red" }, // Simulated mapping
            categorySuggestion: { id: "cat1", name: "Dresses", confidence: 0.8, source: "mapping" as const },
            providerKey: "Trendyol"
        };

        vi.spyOn(scraperModule, "scrapeProductFromUrl").mockResolvedValue(mockScraped);
        vi.spyOn(mappingModule.mappingService, "mapProduct").mockResolvedValue(mockMapping);

        const draft = await provider.getImportDraft("http://trendyol.com/dress");

        expect(scraperModule.scrapeProductFromUrl).toHaveBeenCalledWith("http://trendyol.com/dress");
        expect(draft.title).toBe("Trendyol Dress");
        expect(draft.attributes).toEqual(mockMapping.attributes);
        expect(draft.categorySuggestion?.name).toBe("Dresses");
        expect(draft.provider).toBe("Trendyol");
    });

    it("getImportDraft throws if scraping fails", async () => {
        vi.spyOn(scraperModule, "scrapeProductFromUrl").mockResolvedValue(null);

        await expect(provider.getImportDraft("http://fail.com"))
            .rejects.toThrow("Pazaryerinden ürün verisi çekilemedi.");
    });
});
