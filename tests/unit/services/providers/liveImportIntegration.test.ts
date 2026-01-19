
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LiveImportProvider } from "../../../../src/services/providers/import/LiveImportProvider";
import * as scraperModule from "../../../../src/services/productScraper";
import * as mappingModule from "../../../../src/services/mappingService";

// Correctly mock the dependencies
vi.mock("../../../../src/services/ai/productRewriter.js", () => ({
    rewriteProductContent: vi.fn().mockResolvedValue({
        title: "Rewritten Title",
        description: "Rewritten Description",
        suggestedCategory: "Dresses",
        insights: "Great product",
        socialPosts: {}
    }),
    generateHtmlSpecTable: vi.fn().mockReturnValue("<table></table>")
}));

// Mock productService
vi.mock("../../../../src/services/product/productService.js", () => ({
    upsertProduct: vi.fn().mockResolvedValue({ ok: true, value: { barcode: "TEST-123" } }),
    getProductByBarcode: vi.fn(),
    searchProducts: vi.fn()
}));

// Mock integrationService
vi.mock("../../../../src/services/marketplace/integrationService.js", () => ({
    getAllIntegrations: vi.fn().mockResolvedValue([{ providerId: "shopify", connected: true, config: {} }])
}));

// Mock Connector
// Ensure default export or named export matches source
vi.mock("../../../../src/services/connectors/shopifyConnector.js", () => {
    return {
        ShopifyConnector: class {
            constructor() {
                console.log("Mock ShopifyConnector initialized");
            }
            async createProductDraft() {
                console.log("Mock createProductDraft called");
                return { id: "shop-123", editUrl: "http://shop.com/edit/123" };
            }
        }
    };
});

describe("LiveImportProvider Integration", () => {
    let provider: LiveImportProvider;

    beforeEach(() => {
        vi.clearAllMocks();
        provider = new LiveImportProvider();
    });

    it("scrapes, maps, and imports product using fixture data", async () => {
        const mockScraped = {
            name: "Mock Trendyol Dress",
            description: "Detailed description",
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

        vi.spyOn(scraperModule, "scrapeProductFromUrl").mockResolvedValue(mockScraped);

        vi.spyOn(mappingModule.mappingService, "mapProduct").mockResolvedValue({
            attributes: { "Size": "M", "Color": "Red" },
            categorySuggestion: { id: "cat1", name: "Dresses", confidence: 0.9, source: "mapping" },
            providerKey: "Trendyol"
        });

        // 3. Execute getImportDraft (Preview Step)
        const draft = await provider.getImportDraft("http://trendyol.com/dress");

        expect(draft).toBeDefined();
        expect(draft.title).toBe("Mock Trendyol Dress");
        expect(draft.provider).toBe("Trendyol");
        expect(draft.attributes).toEqual({ "Size": "M", "Color": "Red" });

        // 4. Execute importProduct (Import Step) using the draft details (simulating UI flow)
        const importResult = await provider.importProduct("http://trendyol.com/dress", "shopify", {
            ...draft,
            title: "Edited Title" // Simulate user edit
        });

        if (!importResult.success) {
            console.error("Test failed with error:", importResult.error);
        }

        expect(importResult.success).toBe(true);
        expect(importResult.productName).toBe("Rewritten Title");
        expect(importResult.localId).toBe("TEST-123");
        expect(importResult.editUrl).toBe("http://shop.com/edit/123");
    });
});
