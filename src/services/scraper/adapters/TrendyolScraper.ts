/**
 * Trendyol Scraper
 * Site-specific implementation for Trendyol marketplace
 */

import type { Page } from "puppeteer";
import { BaseScraper } from "../BaseScraper.js";
import type { ScrapedProduct, SiteSelectors } from "../types.js";

export class TrendyolScraper extends BaseScraper {
    siteName = "Trendyol";
    baseUrl = "https://www.trendyol.com";
    
    selectors: SiteSelectors = {
        productCard: ".p-card-wrppr, .product-card",
        title: ".prdct-desc-cntnr-name, .product-desc-sub-text",
        price: ".prc-box-dscntd, .prc-box-sllng",
        link: "a",
        image: "img.p-card-img",
    };

    getSearchUrl(query: string): string {
        return `${this.baseUrl}/sr?q=${encodeURIComponent(query)}`;
    }

    async parseDetailPage(page: Page): Promise<Partial<ScrapedProduct>> {
        return page.evaluate(() => {
            const result: Partial<ScrapedProduct> = {};

            // Title
            const titleEl = document.querySelector("h1.pr-new-br span, .product-name");
            result.title = titleEl?.textContent?.trim();

            // Price
            const priceEl = document.querySelector(".prc-dsc, .product-price-container span");
            if (priceEl) {
                const priceText = priceEl.textContent?.replace(/[^\d,\.]/g, "") || "0";
                result.price = parseFloat(priceText.replace(",", ".")) || 0;
                result.currency = "TRY";
            }

            // Brand
            const brandEl = document.querySelector("h1.pr-new-br a, .product-brand");
            result.brand = brandEl?.textContent?.trim();

            // Description
            const descEl = document.querySelector(".detail-desc-content, .product-description");
            result.description = descEl?.textContent?.trim()?.substring(0, 500);

            // Barcode from page data
            const scripts = document.querySelectorAll("script");
            scripts.forEach(script => {
                const text = script.textContent || "";
                const barcodeMatch = text.match(/"barcode"\s*:\s*"(\d+)"/);
                if (barcodeMatch) {
                    result.barcode = barcodeMatch[1];
                }
            });

            // Image
            const imgEl = document.querySelector("img.detail-section-img, .gallery-modal-content img") as HTMLImageElement | null;
            result.image = imgEl?.src;

            // Stock status
            const outOfStock = document.querySelector(".out-of-stock-btn, .sold-out");
            result.inStock = !outOfStock;

            return result;
        });
    }
}

export const trendyolScraper = new TrendyolScraper();
