import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dependencies
vi.mock("../../src/db", () => ({
    pool: {
        execute: vi.fn(),
    },
}));

vi.mock("../../src/logger", () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));

vi.mock("../../src/services/wiroService", () => ({
    runChatCompletion: vi.fn().mockResolvedValue('{"intent": "product_search", "entities": {}}'),
}));

// Import handlers
import { searchHandler } from "../../src/chatbot/handlers/searchHandler";
import { priceHandler } from "../../src/chatbot/handlers/priceHandler";
import { stockHandler } from "../../src/chatbot/handlers/stockHandler";
import { orderHandler } from "../../src/chatbot/handlers/orderHandler";

// ============================================================
// SEARCH HANDLER TESTS
// ============================================================

describe("SearchHandler", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should have correct name and supported intents", () => {
        expect(searchHandler.name).toBe("SearchHandler");
        expect(searchHandler.supportedIntents).toContain("product_search");
        expect(searchHandler.supportedIntents).toContain("product_import");
    });

    it("should handle product search with query entity", async () => {
        const result = await searchHandler.handle({
            query: "iPhone 15 kılıf",
        }, "user123", "session123", "product_search");

        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
    });

    it("should return error for empty query", async () => {
        const result = await searchHandler.handle({
            query: "",
        }, "user123", "session123", "product_search");

        expect(result.success).toBe(false);
        expect(result.message).toContain("belirtin");
    });
});

// ============================================================
// PRICE HANDLER TESTS
// ============================================================

describe("PriceHandler", () => {
    const mockPool = vi.mocked(await import("../../src/db")).pool;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should have correct name and supported intents", () => {
        expect(priceHandler.name).toBe("PriceHandler");
        expect(priceHandler.supportedIntents).toContain("price_query");
        expect(priceHandler.supportedIntents).toContain("price_update");
    });

    it("should query price for barcode", async () => {
        mockPool.execute.mockResolvedValueOnce([[{
            barcode: "8690000000001",
            name: "Test Product",
            price: 199.99,
            currency: "TRY",
        }]]);

        const result = await priceHandler.handle({
            barcode: "8690000000001",
        }, "user123", "session123", "price_query");

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(mockPool.execute).toHaveBeenCalled();
    });

    it("should require confirmation for price update", async () => {
        const result = await priceHandler.handle({
            barcode: "8690000000001",
            newPrice: 149.99,
        }, undefined, undefined, "price_update");

        // Price updates should require confirmation
        expect(result.requiresConfirmation).toBe(true);
    });
});

// ============================================================
// STOCK HANDLER TESTS
// ============================================================

describe("StockHandler", () => {
    const mockPool = vi.mocked(await import("../../src/db")).pool;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should have correct name and supported intents", () => {
        expect(stockHandler.name).toBe("StockHandler");
        expect(stockHandler.supportedIntents).toContain("stock_query");
        expect(stockHandler.supportedIntents).toContain("stock_update");
        expect(stockHandler.supportedIntents).toContain("stock_alert");
    });

    it("should query stock for barcode", async () => {
        mockPool.execute.mockResolvedValueOnce([[{
            barcode: "8690000000001",
            name: "Test Product",
            stock: 50,
        }]]);

        const result = await stockHandler.handle({
            barcode: "8690000000001",
        }, "user123", "session123", "stock_query");

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
    });

    it("should return warning for low stock", async () => {
        mockPool.execute.mockResolvedValueOnce([[{
            barcode: "8690000000001",
            name: "Test Product",
            stock: 3,
        }]]);

        const result = await stockHandler.handle({
            barcode: "8690000000001",
        }, undefined, undefined, "stock_query");

        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
    });
});

// ============================================================
// ORDER HANDLER TESTS
// ============================================================

describe("OrderHandler", () => {
    const mockPool = vi.mocked(await import("../../src/db")).pool;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should have correct name and supported intents", () => {
        expect(orderHandler.name).toBe("OrderHandler");
        expect(orderHandler.supportedIntents).toContain("order_query");
        expect(orderHandler.supportedIntents).toContain("sales_report");
    });

    it("should query orders", async () => {
        mockPool.execute.mockResolvedValueOnce([[{
            order_number: "ORD-123",
            marketplace: "Trendyol",
            order_date: "2026-01-08",
            status: "Teslim Edildi",
            total_amount: 299.99,
            currency: "TRY",
        }]]);

        const result = await orderHandler.handle({
            dateRange: { start: "2026-01-01", end: "2026-01-09" },
        }, "user123", "session123", "order_query");

        expect(result.success).toBe(true);
        expect(mockPool.execute).toHaveBeenCalled();
    });

    it("should generate sales report", async () => {
        mockPool.execute.mockResolvedValueOnce([[{
            date: "2026-01-08",
            order_count: 5,
            total_revenue: 1499.95,
            total_items: 12,
            marketplace: "Trendyol",
        }]]);

        const result = await orderHandler.handle({
            dateRange: { start: "2026-01-01", end: "2026-01-09" },
        }, undefined, undefined, "sales_report");

        expect(result.success).toBe(true);
        expect(result.message).toContain("Satış Raporu");
    });
});
