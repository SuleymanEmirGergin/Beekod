import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { getMarketplaceProvider } from '../../src/marketplaces/index.js';

describe('Marketplace Integration (Mock Mode)', () => {
    let trendyolProvider;
    let originalEnv;

    before(() => {
        // Ensure we are in mock mode
        originalEnv = process.env.MARKETPLACE_MODE;
        process.env.MARKETPLACE_MODE = 'mock';
    });

    it('should initialize Trendyol provider', async () => {
        trendyolProvider = await getMarketplaceProvider('Trendyol');
        assert.ok(trendyolProvider, 'Trendyol provider should be initialized');
        assert.strictEqual(trendyolProvider.name.toLowerCase(), 'trendyol');
    });

    it('should initialize Hepsiburada provider', async () => {
        const hbProvider = await getMarketplaceProvider('Hepsiburada');
        assert.ok(hbProvider, 'Hepsiburada provider should be initialized');
        assert.strictEqual(hbProvider.name.toLowerCase(), 'hepsiburada');
    });

    // Note: Integration tests with real API calls are skipped in this suite
    // as they require valid credentials and would fail in CI/CD without them.
    // This suite focuses on the provider factory and basic interface compliance.

    it('should return null for unknown marketplace', async () => {
        const provider = await getMarketplaceProvider('UnknownMarketplace');
        assert.strictEqual(provider, null);
    });
});
