/**
 * Scraper Module Index
 * Central export for all scraper functionality
 */

// Types
export * from "./types.js";

// Browser utilities
export { getBrowser, closeBrowser, humanDelay, simulateHumanBehavior } from "./browserManager.js";

// Base class
export { BaseScraper } from "./BaseScraper.js";

// Adapters
export { TrendyolScraper, trendyolScraper } from "./adapters/TrendyolScraper.js";
export { HepsiburadaScraper, hepsiburadaScraper } from "./adapters/HepsiburadaScraper.js";
export { N11Scraper, n11Scraper } from "./adapters/N11Scraper.js";
export { PazaramaScraper, pazaramaScraper } from "./adapters/PazaramaScraper.js";
export { PttAvmScraper, pttAvmScraper } from "./adapters/PttAvmScraper.js";
export { CiceksepetiScraper, ciceksepetiScraper } from "./adapters/CiceksepetiScraper.js";

// Scraper registry for dynamic access
import { trendyolScraper } from "./adapters/TrendyolScraper.js";
import { hepsiburadaScraper } from "./adapters/HepsiburadaScraper.js";
import { n11Scraper } from "./adapters/N11Scraper.js";
import { pazaramaScraper } from "./adapters/PazaramaScraper.js";
import { pttAvmScraper } from "./adapters/PttAvmScraper.js";
import { ciceksepetiScraper } from "./adapters/CiceksepetiScraper.js";
import type { BaseScraper } from "./BaseScraper.js";

const scraperRegistry: Record<string, BaseScraper> = {
    "Trendyol": trendyolScraper,
    "Hepsiburada": hepsiburadaScraper,
    "N11": n11Scraper,
    "Pazarama": pazaramaScraper,
    "PttAVM": pttAvmScraper,
    "Ciceksepeti": ciceksepetiScraper,
};

/**
 * Get scraper by site name
 */
export function getScraper(siteName: string): BaseScraper | undefined {
    // Try exact match first
    if (scraperRegistry[siteName]) return scraperRegistry[siteName];

    // Try case-insensitive lookup
    const key = Object.keys(scraperRegistry).find(
        (k) => k.toLowerCase() === siteName.toLowerCase()
    );
    return key ? scraperRegistry[key] : undefined;
}

/**
 * Get all available scrapers
 */
export function getAllScrapers(): BaseScraper[] {
    return Object.values(scraperRegistry);
}

/**
 * Get all supported site names
 */
export function getSupportedSites(): string[] {
    return Object.keys(scraperRegistry);
}
