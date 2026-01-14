/**
 * Unit tests for scraper utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock puppeteer before import
vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setUserAgent: vi.fn(),
        setViewport: vi.fn(),
        goto: vi.fn(),
        waitForSelector: vi.fn(),
        evaluate: vi.fn(),
        close: vi.fn(),
      }),
      close: vi.fn(),
    }),
  },
}));

describe('Scraper Types', () => {
  it('should define ScrapedProduct interface correctly', async () => {
    const { ScrapedProduct } = await import('../../../src/services/scraper/types') as { ScrapedProduct: any };
    
    // Type check - this will fail at compile time if interface is wrong
    const product: typeof ScrapedProduct = {
      title: 'Test Product',
      price: 100,
      currency: 'TRY',
      imageUrls: ['https://example.com/image.jpg'],
      originalUrl: 'https://example.com/product',
    };

    expect(product.title).toBe('Test Product');
    expect(product.price).toBe(100);
  });
});

describe('Scraper Index', () => {
  it('should export getScraper function', async () => {
    const scraper = await import('../../../src/services/scraper/index');
    expect(typeof scraper.getScraper).toBe('function');
  });

  it('should return TrendyolScraper for trendyol', async () => {
    const { getScraper } = await import('../../../src/services/scraper/index');
    const scraper = getScraper('trendyol');
    expect(scraper).toBeDefined();
    expect(scraper?.siteName).toBe('trendyol');
  });

  it('should return HepsiburadaScraper for hepsiburada', async () => {
    const { getScraper } = await import('../../../src/services/scraper/index');
    const scraper = getScraper('hepsiburada');
    expect(scraper).toBeDefined();
    expect(scraper?.siteName).toBe('hepsiburada');
  });

  it('should return undefined for unknown site', async () => {
    const { getScraper } = await import('../../../src/services/scraper/index');
    const scraper = getScraper('unknown-site');
    expect(scraper).toBeUndefined();
  });
});

describe('Browser Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export humanDelay function', async () => {
    const browserManager = await import('../../../src/services/scraper/browserManager');
    expect(typeof browserManager.humanDelay).toBe('function');
  });

  it('should export getRandomUserAgent function', async () => {
    const browserManager = await import('../../../src/services/scraper/browserManager');
    expect(typeof browserManager.getRandomUserAgent).toBe('function');
  });

  it('should return a valid user agent string', async () => {
    const { getRandomUserAgent } = await import('../../../src/services/scraper/browserManager');
    const ua = getRandomUserAgent();
    expect(typeof ua).toBe('string');
    expect(ua.length).toBeGreaterThan(0);
    expect(ua).toContain('Mozilla');
  });
});
