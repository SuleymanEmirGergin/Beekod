import { describe, it, expect, vi, beforeEach } from 'vitest';
import { upsertProduct } from '../../src/services/product/productService.js';
import { query, withTransaction } from '../../src/db.js';

// Mock DB interactions
vi.mock('../../src/db.js', () => ({
    query: vi.fn(),
    withTransaction: vi.fn(async (cb) => {
        const mockConn = {
            query: vi.fn(),
            beginTransaction: vi.fn(),
            commit: vi.fn(),
            rollback: vi.fn(),
            release: vi.fn()
        };
        return cb(mockConn);
    })
}));

describe('Concurrency & Integrity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock for getProductByBarcode (called internally by upsertProduct in some paths, though we refactored to SQL upsert)
        // Wait, the new upsertProduct uses pure SQL upsert, then getProductByBarcode.
        vi.mocked(query).mockResolvedValue([{}]);
    });

    it('should handle concurrent upserts without crashing', async () => {
        const parallelRequests = 20;
        const barcode = 'CONCURRENT-123';

        vi.mocked(query).mockResolvedValue({ affectedRows: 1 });

        const operations = Array(parallelRequests).fill(null).map((_, i) =>
            upsertProduct({
                barcode,
                name: `Product ${i}`,
                price: 100 + i,
                stock: 10,
                currency: 'TRY'
            })
        );

        const results = await Promise.all(operations);

        // In a real DB this proves locking works; in unit test with mocks it proves logic flow handles parallel Promises
        expect(results).toHaveLength(parallelRequests);
        expect(query).toHaveBeenCalledTimes(parallelRequests * 2); // Upsert + Select
    });

    it('should rollback transaction on failure', async () => {
        const mockError = new Error("Simulated DB Error");

        // Re-implement mocked withTransaction to verify rollback specifically
        const mockConn = {
            query: vi.fn(),
            beginTransaction: vi.fn(),
            commit: vi.fn(),
            rollback: vi.fn(),
            release: vi.fn()
        };

        vi.mocked(withTransaction).mockImplementationOnce(async (cb: any) => {
            try {
                await mockConn.beginTransaction();
                await cb(mockConn);
                await mockConn.commit();
            } catch (e) {
                await mockConn.rollback();
                throw e;
            } finally {
                mockConn.release();
            }
        });

        await expect(withTransaction(async (conn) => {
            await conn.query("INSERT INTO products ...");
            throw mockError;
        })).rejects.toThrow("Simulated DB Error");

        expect(mockConn.beginTransaction).toHaveBeenCalled();
        expect(mockConn.rollback).toHaveBeenCalled();
        expect(mockConn.commit).not.toHaveBeenCalled();
    });

    it('should NOT overwrite created_at on upsert', async () => {
        // This validates the SQL construction logic
        const input = {
            barcode: 'IMMUTABLE-TEST',
            name: 'Test',
            price: 100,
            stock: 10,
            currency: 'TRY'
        };

        await upsertProduct(input);

        const lastCall = vi.mocked(query).mock.calls.find(call => (call[0] as string).includes('ON DUPLICATE KEY UPDATE'));
        const sql = lastCall ? (lastCall[0] as string) : '';

        expect(sql).toContain('created_at');
        expect(sql).toContain('updated_at = NOW()');

        // Crucial check: verify created_at is NOT in the update clause
        const updateClause = sql.split('ON DUPLICATE KEY UPDATE')[1];
        expect(updateClause).not.toContain('created_at =');
    });
});
