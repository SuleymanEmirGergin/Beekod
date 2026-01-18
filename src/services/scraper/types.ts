/**
 * Scraper Types
 * Shared types for all scraper adapters
 */

export type ScrapedProduct = {
    title: string;
    price: number;
    currency: string;
    url: string;
    image?: string;
    inStock: boolean;
    barcode?: string;
    brand?: string;
    description?: string;
    seller?: string; // Added seller
    attributes?: Record<string, string>;
    competitors?: {
        sellerName: string;
        price: number;
        currency: string;
        shippingInfo?: string;
    }[];
};

export type SiteSelectors = {
    productCard: string;
    title: string;
    price: string;
    link: string;
    image: string;
};

export type ScrapeOptions = {
    timeout?: number;
    maxResults?: number;
    retries?: number;
};

export type ScraperConfig = {
    siteName: string;
    baseUrl: string;
    searchPath: string;
    selectors: SiteSelectors;
};
