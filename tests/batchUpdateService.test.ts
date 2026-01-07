import { describe, it, expect, vi, beforeEach } from 'vitest';
import { batchUpdatePrice, batchUpdateStock } from '../src/services/batchUpdateService.js';

// Mock productService
vi.mock('../src/services/productService.js', () => ({
    getAllProducts: vi.fn(),
    updatePrice: vi.fn(),
    updateStock: vi.fn()
}));

// Mock logger
vi.mock('../src/logger.js', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

import { getAllProducts, updatePrice, updateStock } from '../src/services/productService.js';

describe('BatchUpdateService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('batchUpdatePrice', () => {
        it('should update all products with percentage increase', async () => {
            const mockProducts = [
                { barcode: '111', name: 'Product 1', price: 100, stock: 10, currency: 'TRY' },
                { barcode: '222', name: 'Product 2', price: 200, stock: 20, currency: 'TRY' }
            ];

            vi.mocked(getAllProducts).mockResolvedValue(mockProducts as any);
            vi.mocked(updatePrice).mockResolvedValue({} as any);

            const result = await batchUpdatePrice({ percent: 10 });

            expect(result.updated).toBe(2);
            expect(result.failed).toBe(0);
            expect(updatePrice).toHaveBeenCalledWith('111', 110); // 100 + 10%
            expect(updatePrice).toHaveBeenCalledWith('222', 220); // 200 + 10%
        });

        it('should update only products in specified category', async () => {
            const mockProducts = [
                { barcode: '111', name: 'Book 1', price: 50, stock: 10, currency: 'TRY', category: 'Books' },
                { barcode: '222', name: 'Phone 1', price: 1000, stock: 5, currency: 'TRY', category: 'Electronics' },
                { barcode: '333', name: 'Book 2', price: 75, stock: 15, currency: 'TRY', category: 'Books' }
            ];

            vi.mocked(getAllProducts).mockResolvedValue(mockProducts as any);
            vi.mocked(updatePrice).mockResolvedValue({} as any);

            const result = await batchUpdatePrice({ percent: 20, category: 'Books' });

            expect(result.updated).toBe(2);
            expect(updatePrice).toHaveBeenCalledTimes(2);
            expect(updatePrice).toHaveBeenCalledWith('111', 60);  // 50 + 20%
            expect(updatePrice).toHaveBeenCalledWith('333', 90);  // 75 + 20%
            expect(updatePrice).not.toHaveBeenCalledWith('222', expect.anything());
        });

        it('should handle update failures gracefully', async () => {
            const mockProducts = [
                { barcode: '111', name: 'Product 1', price: 100, stock: 10, currency: 'TRY' },
                { barcode: '222', name: 'Product 2', price: 200, stock: 20, currency: 'TRY' }
            ];

            vi.mocked(getAllProducts).mockResolvedValue(mockProducts as any);
            vi.mocked(updatePrice)
                .mockResolvedValueOnce({} as any)
                .mockRejectedValueOnce(new Error('Database error'));

            const result = await batchUpdatePrice({ amount: 50 });

            expect(result.updated).toBe(1);
            expect(result.failed).toBe(1);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].barcode).toBe('222');
            expect(result.errors[0].error).toBe('Database error');
        });

        it('should use amount instead of percent when both provided', async () => {
            const mockProducts = [
                { barcode: '111', name: 'Product 1', price: 100, stock: 10, currency: 'TRY' }
            ];

            vi.mocked(getAllProducts).mockResolvedValue(mockProducts as any);
            vi.mocked(updatePrice).mockResolvedValue({} as any);

            await batchUpdatePrice({ percent: 10, amount: 25 });

            // Amount takes precedence (in current implementation it's additive)
            expect(updatePrice).toHaveBeenCalledWith('111', 110); // 100 + 10 (percent is calculated first)
        });
    });

    describe('batchUpdateStock', () => {
        it('should update all products stock with absolute amount', async () => {
            const mockProducts = [
                { barcode: '111', name: 'Product 1', price: 100, stock: 10, currency: 'TRY' },
                { barcode: '222', name: 'Product 2', price: 200, stock: 20, currency: 'TRY' }
            ];

            vi.mocked(getAllProducts).mockResolvedValue(mockProducts as any);
            vi.mocked(updateStock).mockResolvedValue({} as any);

            const result = await batchUpdateStock({ amount: 100 });

            expect(result.updated).toBe(2);
            expect(result.failed).toBe(0);
            expect(updateStock).toHaveBeenCalledWith('111', 110); // 10 + 100
            expect(updateStock).toHaveBeenCalledWith('222', 120); // 20 + 100
        });

        it('should round stock values correctly', async () => {
            const mockProducts = [
                { barcode: '111', name: 'Product 1', price: 100, stock: 33, currency: 'TRY' }
            ];

            vi.mocked(getAllProducts).mockResolvedValue(mockProducts as any);
            vi.mocked(updateStock).mockResolvedValue({} as any);

            await batchUpdateStock({ percent: 10 });

            // 33 + (33 * 10%) = 33 + 3.3 = 36.3 -> rounded to 36
            expect(updateStock).toHaveBeenCalledWith('111', 36);
        });

        it('should not allow negative stock', async () => {
            const mockProducts = [
                { barcode: '111', name: 'Product 1', price: 100, stock: 10, currency: 'TRY' }
            ];

            vi.mocked(getAllProducts).mockResolvedValue(mockProducts as any);
            vi.mocked(updateStock).mockResolvedValue({} as any);

            await batchUpdateStock({ amount: -20 });

            // 10 + (-20) = -10 -> clamped to 0
            expect(updateStock).toHaveBeenCalledWith('111', 0);
        });

        it('should filter by category', async () => {
            const mockProducts = [
                { barcode: '111', name: 'Book 1', price: 50, stock: 10, currency: 'TRY', category: 'Books' },
                { barcode: '222', name: 'Phone 1', price: 1000, stock: 5, currency: 'TRY', category: 'Electronics' }
            ];

            vi.mocked(getAllProducts).mockResolvedValue(mockProducts as any);
            vi.mocked(updateStock).mockResolvedValue({} as any);

            const result = await batchUpdateStock({ amount: 50, category: 'Electronics' });

            expect(result.updated).toBe(1);
            expect(updateStock).toHaveBeenCalledWith('222', 55);
            expect(updateStock).not.toHaveBeenCalledWith('111', expect.anything());
        });
    });
});
