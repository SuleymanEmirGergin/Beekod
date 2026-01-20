
import { describe, it, expect, vi, beforeEach } from "vitest";
import { upsertProduct, updateProduct } from "../../../../src/services/product/productService";
import * as db from "../../../../src/db";
import { VersionConflictError } from "../../../../src/errors/VersionConflictError";

vi.mock("../../../../src/db");
vi.mock("../../../../src/services/product/modules/productSearchService", () => ({
    getProductByBarcode: vi.fn()
}));

// We need to re-import the mocked module to control its behavior
import { getProductByBarcode } from "../../../../src/services/product/modules/productSearchService";

describe("Optimistic Locking", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("upsertProduct throws 409 if versions mismatch", async () => {
        const input = {
            barcode: "123",
            name: "Test",
            price: 100,
            stock: 10,
            currency: "TRY",
            version: 1
        };

        // Existing product has version 2
        const existingProduct = { ok: true, value: { barcode: "123", version: 2 } };
        (getProductByBarcode as any).mockResolvedValue(existingProduct);

        const result = await upsertProduct(input);
        expect(result.ok).toBe(false);
        // Robust check for error type
        expect((result.error as any).name).toBe("VersionConflictError");
        expect((result.error as any).statusCode).toBe(409);
    });

    it("upsertProduct succeeds if versions match", async () => {
        const input = {
            barcode: "123",
            name: "Test",
            price: 100,
            stock: 10,
            currency: "TRY",
            version: 1
        };

        const existingProduct = { ok: true, value: { barcode: "123", version: 1 } };
        (getProductByBarcode as any).mockResolvedValue(existingProduct);

        (db.query as any).mockResolvedValue({ affectedRows: 1 });

        const result = await upsertProduct(input);

        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining("version = version + 1"),
            expect.arrayContaining([1]) // version parameter in WHERE
        );
    });

    it("updateProduct includes version check in SQL", async () => {
        const barcode = "123";
        const updates = { price: 200, version: 5 };

        (db.query as any).mockResolvedValue({ affectedRows: 1 });

        await updateProduct(barcode, updates);

        const sqlCall = (db.query as any).mock.calls[0];
        const sql = sqlCall[0];
        const params = sqlCall[1];

        expect(sql).toContain("version = ?");
        expect(params).toContain(5);
        expect(sql).toContain("version = version + 1");
    });
});
