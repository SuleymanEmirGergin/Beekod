/**
 * Hepsiburada Scraper
 * Site-specific implementation for Hepsiburada marketplace
 */

import type { Page } from "puppeteer";
import { BaseScraper } from "../BaseScraper.js";
import type { ScrapedProduct, SiteSelectors } from "../types.js";

export class HepsiburadaScraper extends BaseScraper {
    siteName = "Hepsiburada";
    baseUrl = "https://www.hepsiburada.com";
    
    selectors: SiteSelectors = {
        productCard: "[data-test-id='product-card'], .product-item, .moria-ProductCard-gyqBb",
        title: "[data-test-id='product-card-name'], h3, .product-title",
        price: "[data-test-id='price-current-price'], .price-value",
        link: "a",
        image: "img",
    };

    getSearchUrl(query: string): string {
        return `${this.baseUrl}/ara?q=${encodeURIComponent(query)}`;
    }

    async parseDetailPage(page: Page): Promise<Partial<ScrapedProduct>> {
        return page.evaluate(() => {
            const result: Partial<ScrapedProduct> = {};

            // Title
            const titleEl = document.querySelector("h1[data-test-id='title'], h1.product-name");
            result.title = titleEl?.textContent?.trim();

            // Price
            const priceEl = document.querySelector("[data-test-id='price-current-price'], span.product-price");
            if (priceEl) {
                const priceText = priceEl.textContent?.replace(/[^\d,\.]/g, "") || "0";
                result.price = parseFloat(priceText.replace(",", ".")) || 0;
                result.currency = "TRY";
            }

            // Brand
            const brandEl = document.querySelector("[data-test-id='brand'], .brand a");
            result.brand = brandEl?.textContent?.trim();

            // Description
            const descEl = document.querySelector(".product-description, #productDescriptionContent");
            result.description = descEl?.textContent?.trim()?.substring(0, 500);

            // Barcode - try JSON-LD first
            const jsonLd = document.querySelector('script[type="application/ld+json"]');
            if (jsonLd) {
                try {
                    const data = JSON.parse(jsonLd.textContent || "{}");
                    if (data.gtin13) result.barcode = data.gtin13;
                    else if (data.gtin) result.barcode = data.gtin;
                    else if (data.sku) result.barcode = data.sku;
                } catch {}
            }

            // Image
            const imgEl = document.querySelector("img.product-image, .gallery-image-item img") as HTMLImageElement | null;
            result.image = imgEl?.src;

            // Stock status
            const outOfStock = document.querySelector(".out-of-stock, [data-test-id='out-of-stock']");
            result.inStock = !outOfStock;

            // Competitors / Other sellers
            const otherSellers = document.querySelectorAll(".other-sellers-item, [data-test-id='other-sellers-item']");
            if (otherSellers.length > 0) {
                result.competitors = [];
                otherSellers.forEach(seller => {
                    const sellerName = seller.querySelector(".seller-name")?.textContent?.trim() || "Satıcı";
                    const sellerPriceEl = seller.querySelector(".price");
                    const sellerPriceText = sellerPriceEl?.textContent?.replace(/[^\d,\.]/g, "") || "0";
                    const sellerPrice = parseFloat(sellerPriceText.replace(",", ".")) || 0;
                    
                    if (sellerPrice > 0) {
                        result.competitors!.push({
                            sellerName,
                            price: sellerPrice,
                            currency: "TRY"
                        });
                    }
                });
            }

            return result;
        });
    }
}

export const hepsiburadaScraper = new HepsiburadaScraper();
