import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncPriceStock, getConfiguredMarketplaces } from '../src/services/marketplace/syncService.js';
import { ok, fail } from '../src/utils/result.js';

const { mockUpdateListing, mockIsConfigured, createMockProvider } = vi.hoisted(() => {
    const mockUpdateListing = vi.fn();
    const mockIsConfigured = vi.fn();

    const createMockProvider = (name: string) => {
        return class MockProvider {
            name = name;
            updateListing = mockUpdateListing;
            isConfigured = mockIsConfigured;
        };
    };

    return { mockUpdateListing, mockIsConfigured, createMockProvider };
});

vi.mock('../src/services/marketplace/providers/trendyolProvider.js', () => ({ TrendyolProvider: createMockProvider('Trendyol') }));
vi.mock('../src/services/marketplace/providers/n11Provider.js', () => ({ N11Provider: createMockProvider('N11') }));
vi.mock('../src/services/marketplace/providers/hepsiburadaProvider.js', () => ({ HepsiburadaProvider: createMockProvider('Hepsiburada') }));
vi.mock('../src/services/marketplace/providers/pazaramaProvider.js', () => ({ PazaramaProvider: createMockProvider('Pazarama') }));
vi.mock('../src/services/marketplace/providers/pttavmProvider.js', () => ({ PttavmProvider: createMockProvider('Pttavm') }));
vi.mock('../src/services/marketplace/providers/ciceksepetiProvider.js', () => ({ CiceksepetiProvider: createMockProvider('Ciceksepeti') }));

// Mock logger to suppress output during tests
vi.mock('../src/logger.js', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    }
}));

describe('SyncService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default behavior: configured and success
        mockIsConfigured.mockReturnValue(true);
        mockUpdateListing.mockResolvedValue(ok({ status: 'ok', message: 'Success' }));
    });

    describe('syncPriceStock', () => {
        it('should sync to all configured providers when targets=["all"]', async () => {
            const input = {
                barcode: '123',
                price: 100,
                stock: 50,
                targets: ['all']
            };

            const result = await syncPriceStock(input);

            expect(result.success).toBe(true);
            expect(result.results.length).toBeGreaterThan(0);
            expect(mockUpdateListing).toHaveBeenCalled();
        });

        it('should sync only to specified targets', async () => {
            const input = {
                barcode: '123',
                price: 100,
                targets: ['Trendyol', 'N11'] as any
            };

            const result = await syncPriceStock(input);

            expect(result.success).toBe(true);
            expect(mockUpdateListing).toHaveBeenCalled();
        });

        it('should handle providers that are not configured', async () => {
            mockIsConfigured.mockReturnValue(false);

            const result = await syncPriceStock({
                barcode: '123',
                price: 100
            });

            expect(result.success).toBe(true);
            expect(result.results.every(r => r.status === 'not_configured')).toBe(true);
            expect(mockUpdateListing).not.toHaveBeenCalled();
        });

        it('should report failure if updateListing returns error Result', async () => {
            mockUpdateListing.mockResolvedValue(fail(new Error('API Error')));

            const result = await syncPriceStock({
                barcode: '123',
                price: 100,
                targets: ['Trendyol'] as any
            });

            expect(result.success).toBe(false);
            expect(result.results[0].status).toBe('failed');
            expect(result.results[0].message).toBe('API Error');
        });
    });
});
