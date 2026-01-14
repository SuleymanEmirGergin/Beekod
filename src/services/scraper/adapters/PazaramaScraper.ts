/**
 * Pazarama Scraper
 */

import type { Page } from "puppeteer";
import { BaseScraper } from "../BaseScraper.js";
import type { ScrapedProduct, SiteSelectors } from "../types.js";

export class PazaramaScraper extends BaseScraper {
    siteName = "Pazarama";
    baseUrl = "https://www.pazarama.com";
    
    selectors: SiteSelectors = {
        productCard: ".product-card, [data-testid='product-card']",
        title: ".product-card h2, .product-title",
        price: ".product-card p.text-xl, .price-current",
        link: "a",
        image: "img",
    };

    getSearchUrl(query: string): string {
        return `${this.baseUrl}/arama?q=${encodeURIComponent(query)}`;
    }

    async parseDetailPage(page: Page): Promise<Partial<ScrapedProduct>> {
        return page.evaluate(() => {
            const result: Partial<ScrapedProduct> = {};
            
            const titleEl = document.querySelector("h1");
            result.title = titleEl?.textContent?.trim();

            const priceEl = document.querySelector("[data-testid='price'], .price-current");
            if (priceEl) {
                const priceText = priceEl.textContent?.replace(/[^\d,\.]/g, "") || "0";
                result.price = parseFloat(priceText.replace(",", ".")) || 0;
                result.currency = "TRY";
            }

            result.inStock = true;
            return result;
        });
    }
}

export const pazaramaScraper = new PazaramaScraper();
