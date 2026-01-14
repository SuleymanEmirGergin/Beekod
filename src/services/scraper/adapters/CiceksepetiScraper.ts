/**
 * Ciceksepeti Scraper
 */

import type { Page } from "puppeteer";
import { BaseScraper } from "../BaseScraper.js";
import type { ScrapedProduct, SiteSelectors } from "../types.js";

export class CiceksepetiScraper extends BaseScraper {
    siteName = "Ciceksepeti";
    baseUrl = "https://www.ciceksepeti.com";
    
    selectors: SiteSelectors = {
        productCard: ".product-card, .products__item, .js-product-item",
        title: ".product-title, .products__item-title",
        price: ".price, .product-price, .products__item-price",
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

            const priceEl = document.querySelector(".product-price, .price");
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

export const ciceksepetiScraper = new CiceksepetiScraper();
