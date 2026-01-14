import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchHandler } from "../../src/chatbot/handlers/searchHandler";

// Mocks
const mockUnifiedMarketplaceSearch = vi.fn();

vi.mock("../../src/services/search/unifiedMarketplaceSearch", () => ({
    unifiedMarketplaceSearch: (...args: any[]) => mockUnifiedMarketplaceSearch(...args),
}));

// Mock Context
const mockContext = {
    activeSessionId: "sess_123",
    locale: "tr" as const,
    requestId: "req_123",
    userId: "user_123",
    platform: "web",
    role: "admin"
};

describe("Regression: Search State & UI Refresh", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should generate unique search_id for repeated identical queries", async () => {
        // Setup Mocks
        mockUnifiedMarketplaceSearch.mockResolvedValue({
            ok: true,
            value: [
                { title: "iPhone 15", price: 50000, site: "trendyol", url: "http://t.com/1", currency: "TRY", image: "" }
            ]
        });

        // 1st Search
        const result1 = await searchHandler.handle({
            productName: "iphone 15 bul",
        }, mockContext.userId, mockContext.activeSessionId);

        expect(result1.success).toBe(true);
        expect(result1.productCards).toBeDefined();
        const data1 = result1.data as any;
        const id1 = data1?.search_id;
        const ts1 = data1?.ts;

        expect(id1).toBeDefined();
        expect(ts1).toBeDefined();

        // 2nd Search (Identical Query)
        const result2 = await searchHandler.handle({
            productName: "iphone 15 bul",
        }, mockContext.userId, mockContext.activeSessionId);

        expect(result2.success).toBe(true);
        const data2 = result2.data as any;
        const id2 = data2?.search_id;

        // CRITICAL CHECK: IDs must be different to trigger UI re-render
        expect(id2).not.toBe(id1);
    });
});
