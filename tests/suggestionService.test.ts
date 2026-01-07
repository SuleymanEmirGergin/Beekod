import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSuggestions } from '../src/services/suggestionService.js';
import * as geminiService from '../src/services/geminiService.js';
import { SalesSummary } from '../src/services/reportService.js';

vi.mock('../src/services/geminiService.js');
vi.mock('../src/i18n.js', () => ({
    t: (locale: string, key: string) => `[${locale}:${key}]`
}));

describe('Suggestion Service', () => {
    const mockContext = {
        sales: {
            period: 'this_month',
            revenue: 1000,
            orders: 10,
            items: 20,
            averageOrderValue: 100,
            currency: 'TRY',
            topMarketplace: 'Trendyol'
        } as SalesSummary,
        topProducts: [
            { barcode: '123', quantity: 5, revenue: 500 }
        ],
        marketplaces: [
            { marketplace: 'Trendyol', orders: 10, items: 20, revenue: 1000, currency: 'TRY' }
        ]
    };

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should call Gemini with correct prompt and locale for TR', async () => {
        const mockReply = 'Öneriler: 1. Fiyatı artır.';
        vi.spyOn(geminiService, 'generateGeminiReply').mockResolvedValue(mockReply);

        const result = await getSuggestions(mockContext, 'tr');

        expect(geminiService.generateGeminiReply).toHaveBeenCalledWith(expect.objectContaining({
            locale: 'tr',
            systemInstruction: expect.stringContaining('expert e-commerce analyst')
        }));
        expect(result).toBe(mockReply);
    });

    it('should call Gemini with correct prompt and locale for EN', async () => {
        const mockReply = 'Suggestions: 1. Increase price.';
        vi.spyOn(geminiService, 'generateGeminiReply').mockResolvedValue(mockReply);

        const result = await getSuggestions(mockContext, 'en');

        expect(geminiService.generateGeminiReply).toHaveBeenCalledWith(expect.objectContaining({
            locale: 'en'
        }));
        expect(result).toBe(mockReply);
    });

    it('should return fallback message if Gemini fails', async () => {
        vi.spyOn(geminiService, 'generateGeminiReply').mockResolvedValue(''); // Empty response

        const result = await getSuggestions(mockContext, 'de');

        expect(result).toBe('[de:gemini_suggestion_failed]');
    });
});
