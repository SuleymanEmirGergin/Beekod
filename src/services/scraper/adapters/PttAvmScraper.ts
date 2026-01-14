/**
 * PttAVM Scraper
 */

import type { Page } from "puppeteer";
import { BaseScraper } from "../BaseScraper.js";
import type { ScrapedProduct, SiteSelectors } from "../types.js";

export class PttAvmScraper extends BaseScraper {
    siteName = "PttAVM";
    baseUrl = "https://www.pttavm.com";
    
    selectors: SiteSelectors = {
        productCard: ".product-item, .product-card",
        title: ".product-name, h3",
        price: ".price-new, .current-price",
        link: "a",
        image: "img",
    };

    getSearchUrl(query: string): string {
        return `${this.baseUrl}/arama?q=${encodeURIComponent(query)}`;
    }

    async parseDetailPage(page: Page): Promise<Partial<ScrapedProduct>> {
        return page.evaluate(() => {
            const result: Partial<ScrapedProduct> = {};
            
            const titleEl = document.querySelector("h1.product-name, .product-title");
            result.title = titleEl?.textContent?.trim();

            const priceEl = document.querySelector(".price-new, .current-price");
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

export const pttAvmScraper = new PttAvmScraper();
