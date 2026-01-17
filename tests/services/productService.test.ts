import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProductByBarcode, updatePrice, updateStock } from "../../src/services/product/productService.js";
import { query } from "../../src/db.js";
import { getCache, setCache } from "../../src/services/product/cacheService.js";
import { auditService } from "../../src/services/product/auditService.js";

// Mock dependencies
vi.mock("../../src/db.js", () => ({
    query: vi.fn(),
}));

vi.mock("../../src/services/product/cacheService.js", () => ({
    getCache: vi.fn(),
    setCache: vi.fn(),
}));

vi.mock("../../src/services/product/auditService.js", () => ({
    auditService: {
        log: vi.fn(),
    },
}));

vi.mock("../../src/services/product/stockHistoryService.js", () => ({
    logStockChange: vi.fn(),
}));

vi.mock("../../src/services/product/vectorService.js", () => ({
    generateEmbedding: vi.fn(),
    cosineSimilarity: vi.fn(),
}));

describe("ProductService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getProductByBarcode", () => {
        it("should return cached product if available", async () => {
            const mockProduct = { barcode: "123", name: "Test Product", stock: 10 };
            vi.mocked(getCache).mockResolvedValue(mockProduct);

            const result = await getProductByBarcode("123");

            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.value).toEqual(mockProduct);
                expect(getCache).toHaveBeenCalledWith("product:123");
                expect(query).not.toHaveBeenCalled();
            }
        });

        it("should fetch from DB and cache if not in cache", async () => {
            const mockProduct = { barcode: "123", name: "DB Product", stock: 5 };
            vi.mocked(getCache).mockResolvedValue(null);
            vi.mocked(query).mockResolvedValue([mockProduct]);

            const result = await getProductByBarcode("123");

            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.value.name).toBe("DB Product");
                expect(setCache).toHaveBeenCalledWith("product:123", expect.any(Object), 3600);
            }
        });
    });

    describe("updatePrice", () => {
        it("should update price and log audit", async () => {
            vi.mocked(query).mockResolvedValue({ affectedRows: 1 });
            // For the getProductByBarcode call inside updatePrice
            vi.mocked(getCache).mockResolvedValue({ barcode: "123", price: 100 });

            const result = await updatePrice("123", 150, 1);

            expect(result.ok).toBe(true);
            expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'UPDATE_PRICE',
                details: { price: 150 }
            }));
        });
    });

    describe("updateStock", () => {
        it("should update stock and log change", async () => {
            vi.mocked(query)
                .mockResolvedValueOnce([{ barcode: "123", name: "Test", stock: 10 }]) // 1. Get current
                .mockResolvedValueOnce({ affectedRows: 1 }) // 2. Update
                .mockResolvedValueOnce({ insertId: 1 }); // 3. History

            vi.mocked(getCache).mockResolvedValue({ barcode: "123", name: "Test", stock: 10 });

            const result = await updateStock("123", 5, "Test Source", "Test Reason", 1);

            expect(result.ok).toBe(true);
            expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'UPDATE_STOCK',
            }));
        });
    });
});
