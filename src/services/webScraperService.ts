/**
 * Web Scraper Service
 * 
 * REFACTORED: This file is now a thin backward-compatible wrapper.
 * All implementation moved to src/services/scraper/ module.
 * 
 * @see src/services/scraper/index.ts for the new modular implementation
 */

import { 
    getScraper, 
    closeBrowser as closeScraperBrowser,
    type ScrapedProduct,
    type ScrapeOptions
} from "./scraper/index.js";
import { logger } from "../logger.js";

// Re-export types for backward compatibility
export type { ScrapedProduct } from "./scraper/index.js";

/**
 * Close the shared browser instance.
 * @deprecated Use closeBrowser from scraper module directly
 */
export async function closeBrowser(): Promise<void> {
    return closeScraperBrowser();
}

/**
 * Scrape a marketplace for product search results.
 * 
 * @param siteName - Marketplace name (Trendyol, Hepsiburada, N11, etc.)
 * @param query - Search query
 * @param options - Scrape options
 * @returns Array of scraped products
 */
export async function scrapeMarketplace(
    siteName: string,
    query: string,
    options: ScrapeOptions = {}
): Promise<ScrapedProduct[]> {
    const scraper = getScraper(siteName);
    
    if (!scraper) {
        logger.warn("scraper.unsupported_site", { siteName });
        return [];
    }

    return scraper.scrapeSearch(query, options);
}

/**
 * Visit a product detail page to extract rich data like barcode.
 * 
 * @param url - Product page URL
 * @param siteName - Marketplace name
 * @param options - Scrape options
 * @returns Partial product data from detail page
 */
export async function scrapeProductDetails(
    url: string,
    siteName: string,
    options: ScrapeOptions = {}
): Promise<Partial<ScrapedProduct>> {
    const scraper = getScraper(siteName);
    
    if (!scraper) {
        logger.warn("scraper.unsupported_site_detail", { siteName, url });
        return { url };
    }

    return scraper.scrapeDetail(url, options);
}
