import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the database query
vi.mock('../../src/db.js', () => ({
    query: vi.fn(),
}));

// Mock logger
vi.mock('../../src/logger.js', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));

import { query } from '../../src/db.js';
import {
    getDashboardStats,
    getProductPerformance,
    getRevenueTimeline,
    getProfitMargins,
    getInventoryHealth,
    getMarketplacePerformance,
    getTopSellers,
    getSalesSummary,
} from '../../src/services/analyticsService.js';

describe('AnalyticsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetAllMocks();
    });

    describe('getDashboardStats', () => {
        it('should return dashboard statistics', async () => {
            // getDashboardStats calls query in this order:
            // 1. totalProducts
            // 2. lowStockCount
            // 3. totalRevenue
            // 4. topProducts
            // 5. categoryData
            vi.mocked(query)
                .mockResolvedValueOnce([{ total: 100 }])
                .mockResolvedValueOnce([{ total: 5 }])
                .mockResolvedValueOnce([{ total: 50000 }])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            const stats = await getDashboardStats();

            expect(stats).toBeDefined();
            expect(stats.totalProducts).toBe(100);
            expect(stats.lowStockCount).toBe(5);
            expect(stats.totalRevenue).toBe(50000);
            expect(query).toHaveBeenCalledTimes(5);
        });

        it('should handle empty database results', async () => {
            vi.mocked(query)
                .mockResolvedValueOnce([{ total: 0 }])
                .mockResolvedValueOnce([{ total: 0 }])
                .mockResolvedValueOnce([{ total: 0 }])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            const stats = await getDashboardStats();

            expect(stats.totalProducts).toBe(0);
            expect(stats.totalRevenue).toBe(0);
            expect(stats.lowStockCount).toBe(0);
        });
    });

    describe('getProductPerformance', () => {
        it('should return product performance for valid barcode', async () => {
            vi.mocked(query).mockResolvedValueOnce([
                {
                    barcode: 'ABC123',
                    name: 'Test Product',
                    category: 'Electronics',
                    price: 50,
                    stock: 100,
                    totalValue: 5000,
                },
            ]);

            const result = await getProductPerformance('ABC123');

            expect(result).toBeDefined();
            expect(result?.barcode).toBe('ABC123');
            expect(result?.totalSales).toBe(100); // stock maps to totalSales in this specific function
        });

        it('should throw NotFoundError for non-existent barcode', async () => {
            vi.mocked(query).mockResolvedValueOnce([]);

            await expect(getProductPerformance('NONEXISTENT')).rejects.toThrow();
        });
    });

    describe('getRevenueTimeline', () => {
        it('should return revenue timeline for default 30 days', async () => {
            vi.mocked(query).mockResolvedValueOnce([
                { date: '2026-01-01', orderCount: 10, revenue: 1000 },
                { date: '2026-01-02', orderCount: 15, revenue: 1500 },
            ]);

            const timeline = await getRevenueTimeline();

            expect(timeline).toHaveLength(2);
            expect(timeline[0].date).toBe('2026-01-01');
            expect(timeline[0].revenue).toBe(1000);
        });
    });

    describe('getProfitMargins', () => {
        it('should return profit margin data', async () => {
            vi.mocked(query).mockResolvedValueOnce([
                {
                    barcode: 'ABC123',
                    name: 'Test Product',
                    category: 'Electronics',
                    price: 100,
                    cost_price: 60,
                    profit: 40,
                    profit_margin_percent: 40,
                    total_sold: 50,
                },
            ]);

            const margins = await getProfitMargins();

            expect(margins).toHaveLength(1);
            expect(margins[0].profit_margin_percent).toBe(40);
        });
    });

    describe('getInventoryHealth', () => {
        it('should return inventory health breakdown', async () => {
            // getInventoryHealth calls query 5 separate times for each category
            vi.mocked(query)
                .mockResolvedValueOnce([{ count: 5 }]) // critical
                .mockResolvedValueOnce([{ count: 2 }]) // outOfStock
                .mockResolvedValueOnce([{ count: 10 }]) // low
                .mockResolvedValueOnce([{ count: 80 }]) // normal
                .mockResolvedValueOnce([{ count: 3 }]); // overstocked

            const health = await getInventoryHealth();

            expect(health).toEqual({
                critical: 5,
                outOfStock: 2,
                low: 10,
                normal: 80,
                overstocked: 3,
            });
        });
    });

    describe('getMarketplacePerformance', () => {
        it('should return performance by marketplace', async () => {
            vi.mocked(query).mockResolvedValueOnce([
                { marketplace: 'Trendyol', orderCount: 100, revenue: 10000 },
                { marketplace: 'Hepsiburada', orderCount: 50, revenue: 5000 },
            ]);

            const performance = await getMarketplacePerformance();

            expect(performance).toHaveLength(2);
            expect(performance[0].marketplace).toBe('Trendyol');
        });
    });

    describe('getTopSellers', () => {
        it('should return top selling products', async () => {
            vi.mocked(query).mockResolvedValueOnce([
                { product_id: '1', product_name: 'Top Product', units_sold: 500, revenue: 25000 },
            ]);

            const topSellers = await getTopSellers(5, 30);

            expect(topSellers).toHaveLength(1);
            expect(topSellers[0].units_sold).toBe(500);
        });
    });

    describe('getSalesSummary', () => {
        it('should return sales summary', async () => {
            vi.mocked(query).mockResolvedValueOnce([
                { orders: 150, units: 500, revenue: 25000 },
            ]);

            const summary = await getSalesSummary(30);

            expect(summary.orders).toBe(150);
            expect(summary.units).toBe(500);
            expect(summary.revenue).toBe(25000);
        });
    });
});
