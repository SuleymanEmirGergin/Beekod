import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("../../../src/db", () => ({
    pool: {
        execute: vi.fn(),
    },
}));

vi.mock("../../../src/logger", () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));

vi.mock("../../../src/services/wiroService", () => ({
    runChatCompletion: vi.fn().mockResolvedValue('{"intent": "product_search", "entities": {}}'),
}));

vi.mock("../../../src/services/search/unifiedMarketplaceSearch", () => ({
    unifiedMarketplaceSearch: vi.fn().mockResolvedValue({ ok: true, value: [] }),
}));

// Import handlers
import { searchHandler } from "../../../src/chatbot/handlers/searchHandler";
import { productSearchHandler } from "../../../src/chatbot/handlers/productSearchHandler";
import { priceHandler } from "../../../src/chatbot/handlers/priceHandler";
import { stockHandler } from "../../../src/chatbot/handlers/stockHandler";
import { orderHandler } from "../../../src/chatbot/handlers/orderHandler";
import { pool } from "../../../src/db";

// ============================================================
// SEARCH HANDLER TESTS
// ============================================================

describe("SearchHandler", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should have correct name and supported intents", () => {
        expect(searchHandler.name).toBe("SearchHandler");
        expect(searchHandler.supportedIntents).toContain("product_import");
    });

    it("should handle product search with productName entity", async () => {
        const result = await searchHandler.handle({
            productName: "iPhone 15 kılıf",
        }, "user123", "session123");

        expect(result.success).toBe(true);
        expect(result.productCards).toBeDefined();
    });

    it("should return error for empty entities", async () => {
        const result = await searchHandler.handle({}, "user123", "session123");

        expect(result.success).toBe(false);
        expect(result.message).toContain("belirtin");
    });
});

// ============================================================
// PRICE HANDLER TESTS
// ============================================================

describe("PriceHandler", () => {
    const mockPool = vi.mocked(pool);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should carry out price query successfully", async () => {
        (mockPool.execute as any).mockResolvedValueOnce([[{
            barcode: "8690000000001",
            name: "Test Product",
            price: 199.99,
            currency: "TRY",
        }]]);

        const result = await priceHandler.handle({
            barcode: "8690000000001",
        }, "user123", "session123", "price_query");

        expect(result.success).toBe(true);
        expect(mockPool.execute).toHaveBeenCalledTimes(1);
    });

    it("should handle price update successfully with audit log", async () => {
        (mockPool.execute as any)
            .mockResolvedValueOnce([[{ price: 100 }]]) // SELECT current price
            .mockResolvedValueOnce([{}]) // UPDATE price
            .mockResolvedValueOnce([{}]); // INSERT audit log

        const result = await priceHandler.handle({
            barcode: "8690000000001",
            price: 149.99,
        }, "user123", "session123", "price_update");

        expect(result.success).toBe(true);
        expect(mockPool.execute).toHaveBeenCalledTimes(3);
    });
});

// ============================================================
// STOCK HANDLER TESTS
// ============================================================

describe("StockHandler", () => {
    const mockPool = vi.mocked(pool);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should query stock for barcode", async () => {
        (mockPool.execute as any).mockResolvedValueOnce([[{
            barcode: "8690000000001",
            name: "Test Product",
            stock: 50,
            alert_threshold: 5
        }]]);

        const result = await stockHandler.handle({
            barcode: "8690000000001",
        }, "user123", "session123", "stock_query");

        expect(result.success).toBe(true);
        expect(mockPool.execute).toHaveBeenCalledTimes(1);
    });

    it("should handle stock update successfully with audit log", async () => {
        (mockPool.execute as any)
            .mockResolvedValueOnce([[{ stock: 20 }]]) // SELECT current stock
            .mockResolvedValueOnce([{}]) // UPDATE stock
            .mockResolvedValueOnce([{}]); // INSERT audit log

        const result = await stockHandler.handle({
            barcode: "8690000000001",
            stock: 50,
        }, "user123", "session123", "stock_update");

        expect(result.success).toBe(true);
        expect(mockPool.execute).toHaveBeenCalledTimes(3);
    });
});

// ============================================================
// ORDER HANDLER TESTS
// ============================================================

describe("OrderHandler", () => {
    const mockPool = vi.mocked(pool);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should query orders", async () => {
        (mockPool.execute as any).mockResolvedValueOnce([[{
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
        expect(mockPool.execute).toHaveBeenCalledTimes(1);
    });
});
