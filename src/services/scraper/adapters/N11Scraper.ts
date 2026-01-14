/**
 * N11 Scraper
 * Site-specific implementation for N11 marketplace
 */

import type { Page } from "puppeteer";
import { BaseScraper } from "../BaseScraper.js";
import type { ScrapedProduct, SiteSelectors } from "../types.js";

export class N11Scraper extends BaseScraper {
    siteName = "N11";
    baseUrl = "https://www.n11.com";
    
    selectors: SiteSelectors = {
        productCard: ".columnContent, .pro, .product-item, [data-testid='product-card']",
        title: ".productName, .proName",
        price: ".priceContainer ins, .newPrice, .price ins",
        link: "a.plink, a",
        image: ".lazy-load-image, .cardImage, img",
    };

    getSearchUrl(query: string): string {
        return `${this.baseUrl}/arama?q=${encodeURIComponent(query)}`;
    }

    async parseDetailPage(page: Page): Promise<Partial<ScrapedProduct>> {
        return page.evaluate(() => {
            const result: Partial<ScrapedProduct> = {};

            // Title
            const titleEl = document.querySelector("h1.proName, .unf-p-summary-title");
            result.title = titleEl?.textContent?.trim();

            // Price
            const priceEl = document.querySelector(".newPrice ins, .unf-p-price-current");
            if (priceEl) {
                const priceText = priceEl.textContent?.replace(/[^\d,\.]/g, "") || "0";
                result.price = parseFloat(priceText.replace(",", ".")) || 0;
                result.currency = "TRY";
            }

            // Brand
            const brandEl = document.querySelector(".proName a, .unf-p-summary-brand a");
            result.brand = brandEl?.textContent?.trim();

            // Description
            const descEl = document.querySelector(".tabContent, .unf-p-tab-content");
            result.description = descEl?.textContent?.trim()?.substring(0, 500);

            // Barcode from attributes table
            const attrRows = document.querySelectorAll(".attrList li, .unf-p-specs-item");
            attrRows.forEach(row => {
                const label = row.querySelector(".attrLabel, .unf-p-specs-label")?.textContent?.toLowerCase() || "";
                const value = row.querySelector(".attrValue, .unf-p-specs-value")?.textContent?.trim() || "";
                
                if (label.includes("barkod") || label.includes("gtin") || label.includes("ean")) {
                    result.barcode = value;
                }
            });

            // Collect all attributes
            result.attributes = {};
            attrRows.forEach(row => {
                const label = row.querySelector(".attrLabel, .unf-p-specs-label")?.textContent?.trim() || "";
                const value = row.querySelector(".attrValue, .unf-p-specs-value")?.textContent?.trim() || "";
                if (label && value) {
                    result.attributes![label] = value;
                }
            });

            // Image
            const imgEl = document.querySelector(".imgObj, .unf-p-image img") as HTMLImageElement | null;
            result.image = imgEl?.src;

            // Stock status
            const outOfStock = document.querySelector(".outOfStock, .unf-p-out-of-stock");
            result.inStock = !outOfStock;

            return result;
        });
    }
}

export const n11Scraper = new N11Scraper();
