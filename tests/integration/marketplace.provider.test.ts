/**
 * Integration tests for marketplace providers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock environment variables
vi.stubEnv('TRENDYOL_API_KEY', 'test-key');
vi.stubEnv('TRENDYOL_API_SECRET', 'test-secret');
vi.stubEnv('TRENDYOL_SUPPLIER_ID', '12345');
vi.stubEnv('TRENDYOL_API_BASE', 'https://api.trendyol.com');

describe('Marketplace Provider Integration', () => {
  describe('TrendyolProvider', () => {
    it('should check configuration status', async () => {
      const { TrendyolProvider } = await import('../../src/services/marketplace/providers/trendyolProvider');
      const provider = new TrendyolProvider();
      
      const status = provider.getConfigStatus();
      
      expect(status).toHaveProperty('configured');
      expect(status).toHaveProperty('missing');
      expect(Array.isArray(status.missing)).toBe(true);
    });

    it('should have correct provider name', async () => {
      const { TrendyolProvider } = await import('../../src/services/marketplace/providers/trendyolProvider');
      const provider = new TrendyolProvider();
      
      expect(provider.name).toBe('Trendyol');
    });

    it('should return not_configured for missing credentials', async () => {
      vi.stubEnv('TRENDYOL_API_KEY', '');
      vi.stubEnv('TRENDYOL_API_SECRET', '');
      
      const { TrendyolProvider } = await import('../../src/services/marketplace/providers/trendyolProvider');
      const provider = new TrendyolProvider();
      
      const result = await provider.upsertProduct({
        barcode: 'TEST123',
        name: 'Test Product',
        price: 100,
        stock: 10,
        currency: 'TRY',
      });
      
      expect(result.ok).toBe(true);
      expect(result.value?.status).toBe('not_configured');
    });
  });

  describe('N11Provider', () => {
    it('should check configuration status', async () => {
      const { N11Provider } = await import('../../src/services/marketplace/providers/n11Provider');
      const provider = new N11Provider();
      
      const status = provider.getConfigStatus();
      
      expect(status).toHaveProperty('configured');
      expect(status).toHaveProperty('missing');
    });

    it('should have correct provider name', async () => {
      const { N11Provider } = await import('../../src/services/marketplace/providers/n11Provider');
      const provider = new N11Provider();
      
      expect(provider.name).toBe('N11');
    });
  });

  describe('PazaramaProvider', () => {
    it('should check configuration status', async () => {
      const { PazaramaProvider } = await import('../../src/services/marketplace/providers/pazaramaProvider');
      const provider = new PazaramaProvider();
      
      const status = provider.getConfigStatus();
      
      expect(status).toHaveProperty('configured');
      expect(status).toHaveProperty('missing');
    });

    it('should have correct provider name', async () => {
      const { PazaramaProvider } = await import('../../src/services/marketplace/providers/pazaramaProvider');
      const provider = new PazaramaProvider();
      
      expect(provider.name).toBe('Pazarama');
    });
  });

  describe('Provider Factory', () => {
    it('should list available providers', async () => {
      const { listMarketplaceProviders } = await import('../../src/services/marketplace/index');
      
      const providers = listMarketplaceProviders();
      
      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
    });
  });
});

describe('Marketplace Types', () => {
  it('should export MarketplaceListing interface', async () => {
    const types = await import('../../src/services/marketplace/types');
    
    expect(types).toHaveProperty('MarketplaceListing');
  });

  it('should export MarketplaceProductPayload interface', async () => {
    const types = await import('../../src/services/marketplace/types');
    
    expect(types).toBeDefined();
  });
});

describe('Normalizers', () => {
  it('should export all normalize functions', async () => {
    const normalizers = await import('../../src/services/marketplace/providers/normalizers');
    
    expect(typeof normalizers.normalizeNumber).toBe('function');
    expect(typeof normalizers.normalizePositiveNumber).toBe('function');
    expect(typeof normalizers.normalizeString).toBe('function');
    expect(typeof normalizers.normalizeBoolean).toBe('function');
    expect(typeof normalizers.normalizeImages).toBe('function');
    expect(typeof normalizers.normalizeAttributes).toBe('function');
    expect(typeof normalizers.normalizeSizeVariants).toBe('function');
  });
});
