
import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchHandler } from "../../src/handlers/chat/searchHandler";
import * as chatSessionService from "../../src/services/chatSessionService";

// Mocks
const mockRunOptimizedSearchList = vi.fn();
const mockOptimizeSearchQuery = vi.fn();
const mockSearchProductsByEmbedding = vi.fn();

vi.mock("../../src/services/searchService.js", () => ({
    runOptimizedSearchList: (...args: any[]) => mockRunOptimizedSearchList(...args),
}));

vi.mock("../../src/services/searchQueryOptimizer.js", () => ({
    optimizeSearchQuery: (...args: any[]) => mockOptimizeSearchQuery(...args),
}));

vi.mock("../../src/services/productService.js", () => ({
    searchProductsByEmbedding: (...args: any[]) => mockSearchProductsByEmbedding(...args),
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
        // Reset Session Context (Simulated)
        // In a real integration test we'd rely on the real service, but here we can spy on setContext
        vi.spyOn(chatSessionService, 'setContext');
    });

    it("should generate unique search_id for repeated identical queries", async () => {
        // Setup Mocks
        mockOptimizeSearchQuery.mockResolvedValue("iphone 15");
        mockRunOptimizedSearchList.mockResolvedValue([
            { title: "iPhone 15", price: 50000, site: "trendyol", url: "http://t.com/1" }
        ]);

        // 1st Search
        const result1 = await searchHandler({
            intent: "web.search",
            query: "iphone 15 bul",
            confidence: 1
        }, mockContext);

        expect(result1.success).toBe(true);
        expect(result1.data?.type).toBe("marketplace_search_results_list");
        const id1 = result1.data?.search_id;
        const ts1 = result1.data?.ts;

        expect(id1).toBeDefined();
        expect(ts1).toBeDefined();

        // 2nd Search (Identical Query)
        const result2 = await searchHandler({
            intent: "web.search",
            query: "iphone 15 bul",
            confidence: 1
        }, mockContext);

        expect(result2.success).toBe(true);
        const id2 = result2.data?.search_id;

        // CRITICAL CHECK: IDs must be different to trigger UI re-render
        expect(id2).not.toBe(id1);
    });

    it("should update session context with new results", async () => {
        mockOptimizeSearchQuery.mockResolvedValue("samsung s24");
        const mockResults = [
            { title: "Samsung S24", price: 40000, site: "hepsiburada", url: "http://hb.com/1" }
        ];
        mockRunOptimizedSearchList.mockResolvedValue(mockResults);

        await searchHandler({
            intent: "web.search",
            query: "samsung bul",
            confidence: 1
        }, mockContext);

        // Verify setContext was called to save results for "selection"
        expect(chatSessionService.setContext).toHaveBeenCalledWith(
            "user_123",
            "last_search_results_list",
            mockResults
        );
    });
});
