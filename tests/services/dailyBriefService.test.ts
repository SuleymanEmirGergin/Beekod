
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateDailyBrief } from '../../src/services/dailyBriefService.js';
import * as AnalyticsService from '../../src/services/analyticsService.js';
import * as ProductService from '../../src/services/productService.js';
import * as GeminiService from '../../src/services/geminiService.js';
import * as UserPreferenceService from '../../src/services/userPreferenceService.js';

// Mock all dependencies
vi.mock('../../src/services/analyticsService.js', () => ({
    getRevenueTimeline: vi.fn(),
    getTopSellers: vi.fn(),
}));
vi.mock('../../src/services/productService.js', () => ({
    getLowStockProducts: vi.fn(),
}));
vi.mock('../../src/services/geminiService.js', () => ({
    generateGeminiReply: vi.fn(),
}));
vi.mock('../../src/services/userPreferenceService.js', () => ({
    getUserPreferences: vi.fn(),
}));

describe('dailyBriefService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Note: Cache is currently disabled in dailyBriefService (commented out)
    // So we skip cache-related tests

    it('should generate brief using Gemini with analytics data', async () => {
        const userId = 'user123';

        // Mock data
        vi.mocked(AnalyticsService.getRevenueTimeline).mockResolvedValue([
            { date: '2023-01-01', revenue: 1000, orderCount: 5 },
            { date: '2023-01-02', revenue: 2000, orderCount: 10 }
        ]);
        vi.mocked(AnalyticsService.getTopSellers).mockResolvedValue([
            { product_name: 'iPhone 15', units_sold: 50 }
        ]);
        vi.mocked(ProductService.getLowStockProducts).mockResolvedValue([
            { barcode: '123', name: 'Low Item', stock: 2, price: 10, currency: 'TL' }
        ]);
        vi.mocked(UserPreferenceService.getUserPreferences).mockReturnValue({ tone: 'friendly' });
        vi.mocked(GeminiService.generateGeminiReply).mockResolvedValue('Good morning! Yesterday was great.');

        const result = await generateDailyBrief(userId, 'en');

        expect(AnalyticsService.getRevenueTimeline).toHaveBeenCalledWith(3);
        expect(ProductService.getLowStockProducts).toHaveBeenCalled();
        expect(GeminiService.generateGeminiReply).toHaveBeenCalledWith(expect.objectContaining({
            locale: 'en',
            userPreferences: { tone: 'friendly' }
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
        vi.mocked(ProductService.getLowStockProducts).mockResolvedValue([]);
        vi.mocked(UserPreferenceService.getUserPreferences).mockReturnValue({});
        vi.mocked(GeminiService.generateGeminiReply).mockResolvedValue(null);

        const result = await generateDailyBrief('user1', 'tr');

        expect(result).toBeNull();
    });
});
