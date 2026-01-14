import { describe, it, expect, vi, beforeEach } from 'vitest';
import { batchUpdatePrice, batchUpdateStock, batchSetPrice, batchSetStock } from '../../src/services/batchUpdateService.js';
import * as ProductService from '../../src/services/product/productService.js';
import { ok } from '../../src/utils/result.js';

// Mock product service
vi.mock('../../src/services/product/productService.js', () => ({
    getAllProducts: vi.fn(),
    updatePrice: vi.fn(),
    updateStock: vi.fn(),
}));

describe('Batch Update Service', () => {
    const mockProducts = [
        { barcode: '123', price: 100, stock: 10, category: 'electronics' },
        { barcode: '456', price: 200, stock: 20, category: 'fashion' },
        { barcode: '789', price: 300, stock: 30, category: 'electronics' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(ProductService.getAllProducts).mockResolvedValue(ok(mockProducts as any));
        vi.mocked(ProductService.updatePrice).mockResolvedValue(ok({ success: true } as any));
        vi.mocked(ProductService.updateStock).mockResolvedValue(ok({ success: true } as any));
    });

    describe('batchUpdatePrice', () => {
        it('should update all product prices by percent', async () => {
            const result = await batchUpdatePrice({ percent: 10 });
            
            expect(result.updated).toBe(3);
            expect(ProductService.updatePrice).toHaveBeenCalledTimes(3);
            expect(ProductService.updatePrice).toHaveBeenCalledWith('123', 110);
            expect(ProductService.updatePrice).toHaveBeenCalledWith('456', 220);
            expect(ProductService.updatePrice).toHaveBeenCalledWith('789', 330);
        });

        it('should filter by category', async () => {
            const result = await batchUpdatePrice({ percent: -10, category: 'electronics' });
            
            expect(result.updated).toBe(2);
            expect(ProductService.updatePrice).toHaveBeenCalledTimes(2);
            expect(ProductService.updatePrice).toHaveBeenCalledWith('123', 90);
            expect(ProductService.updatePrice).toHaveBeenCalledWith('789', 270);
        });
    });

    describe('batchUpdateStock', () => {
        it('should update stock by amount', async () => {
            const result = await batchUpdateStock({ amount: 5 });
            
            expect(result.updated).toBe(3);
            expect(ProductService.updateStock).toHaveBeenCalledTimes(3);
            expect(ProductService.updateStock).toHaveBeenCalledWith('123', 15);
        });
    });

    describe('batchSetPrice', () => {
        it('should set absolute price for category', async () => {
            const result = await batchSetPrice({ amount: 99.99, category: 'fashion' });
            
            expect(result.updated).toBe(1);
            expect(ProductService.updatePrice).toHaveBeenCalledWith('456', 99.99);
        });
    });
});
