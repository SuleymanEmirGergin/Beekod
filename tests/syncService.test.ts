import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncPriceStock, getConfiguredMarketplaces } from '../src/services/syncService.js';

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

vi.mock('../src/marketplaces/trendyolProvider.js', () => ({ TrendyolProvider: createMockProvider('Trendyol') }));
vi.mock('../src/marketplaces/n11Provider.js', () => ({ N11Provider: createMockProvider('N11') }));
vi.mock('../src/marketplaces/hepsiburadaProvider.js', () => ({ HepsiburadaProvider: createMockProvider('Hepsiburada') }));
vi.mock('../src/marketplaces/pazaramaProvider.js', () => ({ PazaramaProvider: createMockProvider('Pazarama') }));
vi.mock('../src/marketplaces/pttavmProvider.js', () => ({ PttAVMProvider: createMockProvider('PttAVM') }));
vi.mock('../src/marketplaces/ciceksepetiProvider.js', () => ({ CiceksepetiProvider: createMockProvider('Ciceksepeti') }));

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
        mockUpdateListing.mockResolvedValue({ status: 'ok', message: 'Success' });
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
            expect(result.results).toHaveLength(6); // 6 providers
            expect(mockUpdateListing).toHaveBeenCalledTimes(6);
            expect(mockUpdateListing).toHaveBeenCalledWith({
                barcode: '123',
                price: 100,
                stock: 50
            });
        });

        it('should sync only to specified targets', async () => {
            const input = {
                barcode: '123',
                price: 100,
                targets: ['Trendyol', 'N11'] as any
            };

            const result = await syncPriceStock(input);

            expect(result.success).toBe(true);
            // Since we mocked all providers with the same mock functions, 
            // verifying exact calls is tricky unless we differentiate instances.
            // But checking call count is a good proxy.
            expect(mockUpdateListing).toHaveBeenCalledTimes(2);
        });

        it('should handle providers that are not configured', async () => {
            // Mock isConfigured to return false for all first
            mockIsConfigured.mockReturnValue(false);

            const result = await syncPriceStock({
                barcode: '123',
                price: 100
            });

            expect(result.success).toBe(true); // Technically success because no failures (just skipped/not configured)
            expect(result.results.every(r => r.status === 'not_configured')).toBe(true);
            expect(mockUpdateListing).not.toHaveBeenCalled();
        });

        it('should report failure if updateListing fails', async () => {
            mockUpdateListing.mockRejectedValue(new Error('API Error'));

            const result = await syncPriceStock({
                barcode: '123',
                price: 100,
                targets: ['Trendyol'] as any
            });

            expect(result.success).toBe(false);
            expect(result.results[0].status).toBe('failed');
            expect(result.results[0].message).toBe('API Error');
        });

        it('should map provider failure status correctly', async () => {
            mockUpdateListing.mockResolvedValue({ status: 'error', message: 'Invalid API Key' });

            const result = await syncPriceStock({
                barcode: '123',
                price: 100,
                targets: ['Trendyol'] as any
            });

            expect(result.success).toBe(false);
            expect(result.results[0].status).toBe('failed');
            expect(result.results[0].message).toBe('Invalid API Key');
        });
    });

    describe('getConfiguredMarketplaces', () => {
        it('should return only configured marketplaces', () => {
            // Since providers array is initialized at top level of module,
            // and we mock the classes, but the instances in the array share the mocked prototype methods.

            // This test might be tricky because `providers` array in syncService is created once.
            // However, `isConfigured` call should hit our mock.

            mockIsConfigured.mockReturnValueOnce(true)  // Trendyol
                .mockReturnValueOnce(false) // N11
                .mockReturnValueOnce(true)  // Hepsiburada
                .mockReturnValue(false);    // Others

            const configured = getConfiguredMarketplaces();

            // Expected length depends on how many times mock is called and returns true.
            // But since 'providers' order is fixed: Trendyol, N11, HB, Pazarama, PttAVM, Ciceksepeti.
            // T, F, T, F, F, F
            expect(configured).toEqual(['Trendyol', 'Hepsiburada']);
        });
    });
});
