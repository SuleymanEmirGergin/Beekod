import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProductByBarcode, updatePrice, updateStock } from "../../src/services/product/productService.js";
import { query } from "../../src/db.js";

// Mock dependencies
vi.mock("../../src/db.js", () => ({
    query: vi.fn(),
}));

// We don't need to mock cacheService or auditService as they are not used in the implementation
// referenced by these tests (based on source code inspection).

describe("ProductService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getProductByBarcode", () => {
        it("should fetch from DB", async () => {
            const mockProduct = { barcode: "123", name: "DB Product", stock: 5 };
            vi.mocked(query).mockResolvedValue([mockProduct]);

            const result = await getProductByBarcode("123");

            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.value).toEqual(mockProduct);
                expect(query).toHaveBeenCalledWith(expect.stringContaining("SELECT * FROM products"), expect.any(Array));
            }
        });

        it("should fail if product not found", async () => {
            vi.mocked(query).mockResolvedValue([]);

            const result = await getProductByBarcode("123");

            expect(result.ok).toBe(false);
        });
    });

    describe("updatePrice", () => {
        it("should update price and log to history", async () => {
            const mockProduct = { barcode: "123", price: 150 };

            vi.mocked(query)
                .mockResolvedValueOnce({ affectedRows: 1 }) // UPDATE
                .mockResolvedValueOnce({ insertId: 1 }) // INSERT history
                .mockResolvedValueOnce([mockProduct]); // SELECT return

            const result = await updatePrice("123", 150, 1);

            expect(result.ok).toBe(true);
            expect(result.ok && result.value.price).toBe(150);
            expect(query).toHaveBeenCalledTimes(3);
        });
    });

    describe("updateStock", () => {
        it("should update stock and log change", async () => {
            const currentProduct = { barcode: "123", name: "Test", stock: 10 };
            
            vi.mocked(query)
                .mockResolvedValueOnce([currentProduct]) // SELECT current
                .mockResolvedValueOnce({ affectedRows: 1 }) // UPDATE
                .mockResolvedValueOnce({ insertId: 1 }); // INSERT history

            const result = await updateStock("123", 5, "Test Source", "Test Reason", 1);

            expect(result.ok).toBe(true);
            expect(result.ok && result.value.stock).toBe(15); // 10 + 5
            expect(query).toHaveBeenCalledTimes(3);
        });
    });
});
