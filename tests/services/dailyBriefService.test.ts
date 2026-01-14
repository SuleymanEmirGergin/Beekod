import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateDailyBrief } from '../../src/services/dailyBriefService.js';
import * as AnalyticsService from '../../src/services/analyticsService.js';
import * as ProductService from '../../src/services/product/productService.js';
import * as GeminiService from '../../src/services/ai/geminiClient.js';
import * as UserPreferenceService from '../../src/services/userPreferenceService.js';
import { getCache } from '../../src/services/product/cacheService.js';
import { ok } from '../../src/utils/result.js';

// Mock all dependencies
vi.mock('../../src/services/analyticsService.js', () => ({
    getRevenueTimeline: vi.fn(),
    getTopSellers: vi.fn(),
}));
vi.mock('../../src/services/product/productService.js', () => ({
    getLowStockProducts: vi.fn(),
}));
vi.mock('../../src/services/ai/geminiClient.js', () => ({
    generateGeminiReply: vi.fn(),
}));
vi.mock('../../src/services/userPreferenceService.js', () => ({
    getUserPreferences: vi.fn(),
}));
vi.mock('../../src/services/product/cacheService.js', () => ({
    getCache: vi.fn(),
    setCache: vi.fn(),
}));

describe('dailyBriefService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Ensure cache is missed by default
        vi.mocked(getCache).mockResolvedValue(null);
    });

    it('should generate brief using Gemini with analytics data', async () => {
        const userId = 'user123';

        // Mock data
        vi.mocked(AnalyticsService.getRevenueTimeline).mockResolvedValue([
            { date: '2023-01-01', revenue: 1000, orderCount: 5 },
            { date: '2023-01-02', revenue: 2000, orderCount: 10 }
        ]);
        vi.mocked(AnalyticsService.getTopSellers).mockResolvedValue([
            { product_id: '1', product_name: 'iPhone 15', units_sold: 50, revenue: 2500000 }
        ]);
        vi.mocked(ProductService.getLowStockProducts).mockResolvedValue(ok([
            { barcode: '123', name: 'Low Item', stock: 2, price: 10, currency: 'TL' } as any
        ]));
        vi.mocked(UserPreferenceService.getUserPreferences).mockReturnValue({ tone: 'friendly' });
        vi.mocked(GeminiService.generateGeminiReply).mockResolvedValue('Good morning! Yesterday was great.');

        const result = await generateDailyBrief(userId, 'en');

        expect(AnalyticsService.getRevenueTimeline).toHaveBeenCalledWith(3);
        expect(ProductService.getLowStockProducts).toHaveBeenCalled();
        expect(GeminiService.generateGeminiReply).toHaveBeenCalledWith(expect.objectContaining({
            locale: 'en'
        }));
        expect(result).toBe('Good morning! Yesterday was great.');
    });

    it('should handle errors gracefully and return null', async () => {
        vi.mocked(AnalyticsService.getRevenueTimeline).mockRejectedValue(new Error('DB Error'));

        const result = await generateDailyBrief('user1', 'tr');

        expect(result).toBeNull();
    });

    it('should return null if Gemini returns nothing', async () => {
        vi.mocked(AnalyticsService.getRevenueTimeline).mockResolvedValue([]);
        vi.mocked(AnalyticsService.getTopSellers).mockResolvedValue([]);
        vi.mocked(ProductService.getLowStockProducts).mockResolvedValue(ok([]));
        vi.mocked(UserPreferenceService.getUserPreferences).mockReturnValue({});
        vi.mocked(GeminiService.generateGeminiReply).mockResolvedValue("");

        const result = await generateDailyBrief('user1', 'tr');

        expect(result).toBeNull();
    });
});
