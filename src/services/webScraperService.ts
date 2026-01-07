import { createRequire } from "module";
const require = createRequire(import.meta.url);

import type { Browser, Page } from "puppeteer";
import { logger } from "../logger.js";

// Use dynamic require for puppeteer-extra due to TypeScript compatibility issues
const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// Configure plugins
puppeteerExtra.use(StealthPlugin());

// Note: Adblocker plugin has compatibility issues with latest puppeteer-extra
// Commented out for now - can be re-enabled if needed
// const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
// puppeteerExtra.use(AdblockerPlugin({ blockTrackers: true }));

let browserInstance: Browser | null = null;

/**
 * Get or create a shared browser instance for scraping.
 * Reuses the same browser to save resources.
 */
async function getBrowser(): Promise<Browser> {
    if (browserInstance && browserInstance.connected) {
        return browserInstance;
    }

    logger.info("scraper.browser_launch");
    browserInstance = await puppeteerExtra.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu",
            "--window-size=1920x1080",
            "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ],
    });

    return browserInstance!; // Non-null assertion since we just created it
}

/**
 * Close the shared browser instance.
 */
export async function closeBrowser(): Promise<void> {
    if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
        logger.info("scraper.browser_closed");
    }
}

export type ScrapedProduct = {
    title: string;
    price: number;
    currency: string;
    url: string;
    image?: string;
    inStock: boolean;
};

/**
 * Scrape a marketplace for product search results.
 * Uses site-specific selectors to extract product data.
 */
export async function scrapeMarketplace(
    siteName: string,
    query: string,
    options: { timeout?: number; maxResults?: number } = {}
): Promise<ScrapedProduct[]> {
    const { timeout = 15000, maxResults = 5 } = options;

    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        // Set viewport and user agent
        await page.setViewport({ width: 1920, height: 1080 });

        // Navigate to search page
        const searchUrl = getSearchUrl(siteName, query);
        logger.info("scraper.navigate", { site: siteName, url: searchUrl });

        await page.goto(searchUrl, {
            waitUntil: "domcontentloaded",
            timeout,
        });

        // Fast wait for body or a small delay to let JS run a bit
        await new Promise(r => setTimeout(r, 3000));

        // Wait for products to load
        const selectors = getSiteSelectors(siteName);
        await page.waitForSelector(selectors.productCard, { timeout: 8000 }).catch(async () => {
            logger.warn("scraper.no_products_found", { site: siteName, query });
            const fs = require("fs");
            const html = await page.content();
            fs.writeFileSync(`scraper_fail_${siteName}.html`, html);
        });

        // Extract product data
        const products = await page.evaluate((sel, max) => {
            const items: ScrapedProduct[] = [];
            const cards = document.querySelectorAll(sel.productCard);

            for (let i = 0; i < Math.min(cards.length, max); i++) {
                const card = cards[i];

                const titleEl = card.querySelector(sel.title);
                const priceEl = card.querySelector(sel.price);
                let linkEl = card.querySelector(sel.link);
                // If card itself is the link (common in semantic HTML5)
                if (!linkEl && card.tagName === 'A') {
                    linkEl = card;
                }

                const imageEl = card.querySelector(sel.image);

                if (!titleEl || !priceEl || !linkEl) continue;

                const title = titleEl.textContent?.trim() || "";
                const priceText = priceEl.textContent?.trim() || "0";
                const url = (linkEl as HTMLAnchorElement).href || "";

                // Better image extraction (handle lazy loading)
                let image = undefined;
                if (imageEl) {
                    const img = imageEl as HTMLImageElement;
                    image = img.getAttribute('data-src') ||
                        img.getAttribute('data-original') ||
                        img.getAttribute('srcset')?.split(' ')[0] ||
                        img.src;
                }

                // Parse price (remove non-numeric characters except decimal point)
                // Handle formats like "1.299,00 TL" or "₺1.299"
                const cleanPriceText = priceText.replace(/[^\d.,]/g, "").trim();
                let price = 0;

                if (cleanPriceText) {
                    // If contains both . and , (e.g. 1.250,50)
                    if (cleanPriceText.includes('.') && cleanPriceText.includes(',')) {
                        price = parseFloat(cleanPriceText.replace(/\./g, "").replace(",", "."));
                    }
                    // If contains only , and it's likely a decimal (e.g. 1250,50)
                    else if (cleanPriceText.includes(',') && cleanPriceText.indexOf(',') > cleanPriceText.length - 4) {
                        price = parseFloat(cleanPriceText.replace(",", "."));
                    }
                    // If contains only . and it's likely a thousand separator (e.g. 1.250)
                    else if (cleanPriceText.includes('.') && cleanPriceText.indexOf('.') <= cleanPriceText.length - 4) {
                        price = parseFloat(cleanPriceText.replace(/\./g, ""));
                    }
                    else {
                        price = parseFloat(cleanPriceText);
                    }
                }

                // Detect currency
                const currency = priceText.includes("$") ? "USD"
                    : priceText.includes("€") ? "EUR"
                        : "TL";

                // Check stock status
                const inStock = !card.textContent?.toLowerCase().includes("stokta yok");

                items.push({ title, price, currency, url, image, inStock });
            }

            return items;
        }, selectors, maxResults);

        logger.info("scraper.success", {
            site: siteName,
            query,
            resultsFound: products.length
        });

        if (products.length === 0) {
            const fs = require("fs");
            const html = await page.content();
            fs.writeFileSync(`scraper_zero_${siteName}.html`, html);
        }

        return products;

    } catch (error) {
        logger.error("scraper.failed", {
            site: siteName,
            query,
            error: error instanceof Error ? error.message : String(error)
        });
        return [];
    } finally {
        await page.close();
    }
}

/**
 * Generate search URL for each marketplace.
 */
function getSearchUrl(siteName: string, query: string): string {
    const encodedQuery = encodeURIComponent(query);

    const urls: Record<string, string> = {
        "N11": `https://www.n11.com/arama?q=${encodedQuery}`,
        "Ciceksepeti": `https://www.ciceksepeti.com/arama?q=${encodedQuery}`,
        "Pazarama": `https://www.pazarama.com/arama?q=${encodedQuery}`,
        "PttAVM": `https://www.pttavm.com/arama?q=${encodedQuery}`,
        "Trendyol": `https://www.trendyol.com/sr?q=${encodedQuery}`,
        "Hepsiburada": `https://www.hepsiburada.com/ara?q=${encodedQuery}`,
    };

    return urls[siteName] || `https://www.google.com/search?q=${encodedQuery}+site:${siteName.toLowerCase()}.com`;
}

/**
 * Site-specific CSS selectors for scraping.
 * These may need updates if sites change their HTML structure.
 */
function getSiteSelectors(siteName: string): {
    productCard: string;
    title: string;
    price: string;
    link: string;
    image: string;
} {
    const selectors: Record<string, any> = {
        "N11": {
            productCard: ".columnContent",
            title: ".productName",
            price: ".priceContainer ins",
            link: "a.plink",
            image: ".lazy-load-image",
        },
        "Ciceksepeti": {
            productCard: ".product-card",
            title: ".product-title",
            price: ".price",
            link: "a",
            image: "img",
        },
        "Pazarama": {
            productCard: "[data-testid='product-card']",
            title: "[data-testid='product-name']",
            price: "[data-testid='product-price']",
            link: "a",
            image: "img",
        },
        "PttAVM": {
            productCard: ".product-item",
            title: ".product-name",
            price: ".price-new",
            link: "a",
            image: "img",
        },
        "Trendyol": {
            productCard: ".product-card",
            title: ".title, .product-name",
            price: ".price-section, .prc-box-dscntd",
            link: "a",
            image: "img",
        },
        "Hepsiburada": {
            productCard: "[data-test-id='product-card'], .product-item",
            title: "h3, .product-title",
            price: "[data-test-id='price-current-price'], .current-price",
            link: "a",
            image: "img",
        },
    };

    return selectors[siteName] || {
        productCard: ".product, .product-card, .product-item",
        title: "h2, h3, .title, .product-name",
        price: ".price",
        link: "a",
        image: "img",
    };
}
