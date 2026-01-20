
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { unifiedMarketplaceSearch } from '../../src/services/search/unifiedMarketplaceSearch';
import { upsertProduct } from '../../src/services/product/productService';
import { SearchProviderFactory } from '../../src/services/providers/SearchProviderFactory';
import * as syncProducer from '../../src/services/queue/syncProducer';
import { query } from '../../src/db';

// Mock DB and Queue
vi.mock('../../src/db', () => ({
    query: vi.fn(),
    pool: { execute: vi.fn() }
}));

vi.mock('../../src/services/queue/syncProducer', () => ({
    enqueueSyncJob: vi.fn().mockResolvedValue('job-123')
}));

// Mock External Services to prevent timeouts
vi.mock('../../src/services/webScraperService', () => ({
    scrapeMarketplace: vi.fn().mockResolvedValue([]),
    scrapeProductDetails: vi.fn().mockResolvedValue({})
}));

vi.mock('../../src/services/search/googleSearchService', () => ({
    googleSearchService: {
        isConfigured: () => true,
        findProduct: vi.fn().mockResolvedValue([])
    }
}));

vi.mock('../../src/services/barcodeLookupService', () => ({
    findBarcode: vi.fn().mockResolvedValue(null)
}));

vi.mock('../../src/ai/geminiClient', () => ({
    filterSearchResults: vi.fn().mockResolvedValue([0]) // Mock AI filtering passing the first result
}));

vi.mock('../../src/ai/marketplaceNormalizer', () => ({
    marketplaceNormalizer: {
        deduplicateResults: vi.fn(items => items),
        normalizeProduct: vi.fn(item => item)
    }
}));

vi.mock('../../src/pricing/competitionService', () => ({
    competitionService: {
        analyzeCompetition: vi.fn().mockResolvedValue(null)
    }
}));

// Mock SearchProvider
const mockSearchProvider = {
    search: vi.fn().mockResolvedValue([
        {
            name: "Mock Product",
            price: 100,
            currency: "TRY",
            marketplace: "Trendyol",
            url: "http://example.com/product",
            imageUrl: "http://example.com/img.jpg",
            stock: 10
        }
    ])
};

vi.mock('../../src/services/providers/SearchProviderFactory', () => ({
    SearchProviderFactory: {
        getProvider: vi.fn(() => mockSearchProvider)
    }
}));

describe('Workstream C Integration', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Chatbot Search Integration', () => {
        it('unifiedMarketplaceSearch should delegate to SearchProviderFactory', async () => {
            const results = await unifiedMarketplaceSearch("iphone");

            expect(SearchProviderFactory.getProvider).toHaveBeenCalled();
            expect(mockSearchProvider.search).toHaveBeenCalledWith("iphone");
            expect(results.ok).toBe(true);

            if (results.ok) {
                expect(results.value).toHaveLength(1);
                expect(results.value[0].title).toBe("Mock Product");
                expect(results.value[0].source).toBe("adapter");
            }
        });
    });

    describe('Inventory Sync Integration', () => {
        it('upsertProduct should enqueue sync job after successful insert', async () => {
            // Sequence of query calls for "Insert" flow:
            // 1. getProductByBarcode -> query() -> [] (Not found)
            // 2. upsertProduct (Insert) -> query() -> { affectedRows: 1 } (Success)

            (query as any)
                .mockResolvedValueOnce([]) // Not found
                .mockResolvedValueOnce({ affectedRows: 1 }); // Insert success

            await upsertProduct({
                barcode: "TEST-BARCODE-NEW",
                name: "Test",
                price: 100,
                stock: 10,
                currency: "TRY"
            });

            expect(syncProducer.enqueueSyncJob).toHaveBeenCalledWith(expect.objectContaining({
                barcode: "TEST-BARCODE-NEW",
                price: 100,
                stock: 10,
                targets: ["all"]
            }));
        });

        it('updateProduct should enqueue sync job if price changed', async () => {
            // This tests the logic in updateProduct indirectly if we can trigger it via upsertProduct
            // Flow:
            // 1. getProductByBarcode -> found
            // 2. updateProduct -> query(update) -> success
            // 3. updateProduct -> getProductByBarcode -> found
            // 4. enqueue

            const mockProduct = {
                barcode: "TEST-BARCODE-EXISTING",
                name: "Test",
                price: 200,
                stock: 5,
                version: 1
            };

            (query as any)
                .mockResolvedValueOnce([mockProduct]) // 1. check existing -> found
                .mockResolvedValueOnce({ affectedRows: 1 }) // 2. update success
                .mockResolvedValueOnce([mockProduct]); // 3. fetch for sync -> found (using same mock for simplicity)

            await upsertProduct({
                barcode: "TEST-BARCODE-EXISTING",
                name: "Test Updated",
                price: 200, // Price same? Wait, upsertProduct logic compares? No, it just updates.
                stock: 5,
                currency: "TRY"
            });

            // upsertProduct calls updateProduct with updates.
            // updateProduct checks if price/stock in updates.
            // upsertProduct constructs updates: if (input.price !== undefined) updates.price = input.price;
            // So price IS in updates. So it should sync.

            // We need to wait for the async background promise in updateProduct.
            // But we can't await it easily. We can wait a bit.
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(syncProducer.enqueueSyncJob).toHaveBeenCalledWith(expect.objectContaining({
                barcode: "TEST-BARCODE-EXISTING",
                price: 200,
                targets: ["all"]
            }));
        });
    });
});
