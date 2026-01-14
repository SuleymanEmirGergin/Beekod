import { describe, it, expect, beforeEach } from 'vitest';
import { getMarketplaceProvider } from '../../src/services/marketplace/index.js';

describe('Marketplace Integration (Mock Mode)', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
        // Ensure we are in mock mode
        originalEnv = process.env.MARKETPLACE_MODE;
        process.env.MARKETPLACE_MODE = 'mock';
    });

    it('should initialize Trendyol provider', async () => {
        const trendyolProvider = getMarketplaceProvider('Trendyol');
        expect(trendyolProvider).toBeDefined();
        expect(trendyolProvider?.name.toLowerCase()).toBe('trendyol');
    });

    it('should initialize Hepsiburada provider', async () => {
        const hbProvider = getMarketplaceProvider('Hepsiburada');
        expect(hbProvider).toBeDefined();
        expect(hbProvider?.name.toLowerCase()).toBe('hepsiburada');
    });

    it('should return null for unknown marketplace', async () => {
        const provider = getMarketplaceProvider('UnknownMarketplace');
        expect(provider).toBeNull();
    });
});
