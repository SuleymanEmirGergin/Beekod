import { createRequire } from "module";
const require = createRequire(import.meta.url);

import type { Browser } from "puppeteer";
import { logger } from "../logger.js";

// Use dynamic require for puppeteer-extra due to TypeScript compatibility issues
const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// Configure plugins
puppeteerExtra.use(StealthPlugin());

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
            "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            ...getProxyArgs()
        ],
    });

    return browserInstance!; 
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
    barcode?: string;
    brand?: string;
    description?: string;
    attributes?: Record<string, string>;
};

/**
 * Get proxy configuration if available.
 */
function getProxyArgs(): string[] {
    const proxy = process.env.SCRAPER_PROXY; // Format: http://user:pass@host:port
    if (proxy) {
        return [`--proxy-server=${proxy}`];
    }
    return [];
}

/**
 * Scrape a marketplace for product search results.
 * Uses site-specific selectors to extract product data.
 */
export async function scrapeMarketplace(
    siteName: string,
    query: string,
    options: { timeout?: number; maxResults?: number; retries?: number } = {}
): Promise<ScrapedProduct[]> {
    const { timeout = 20000, maxResults = 5, retries = 2 } = options;
    let attempt = 0;

    while (attempt < retries) {
        attempt++;
        const browser = await getBrowser();
        const page = await browser.newPage();

        try {
            // Set viewport and random user agent
            await page.setViewport({ width: 1920, height: 1080 });
            
            // Navigate to search page
            const searchUrl = getSearchUrl(siteName, query);
            logger.info("scraper.navigate", { site: siteName, url: searchUrl, attempt });

            // Use networkidle2 for better content loading assessment
            await page.goto(searchUrl, {
                waitUntil: "networkidle2",
                timeout,
            });

            // Wait for products to load with a fallback
            const selectors = getSiteSelectors(siteName);
            const found = await page.waitForSelector(selectors.productCard, { timeout: 10000 }).catch(() => null);

            if (!found && attempt < retries) {
                logger.warn("scraper.retry_triggered", { site: siteName, query, attempt });
                await page.close();
                continue; 
            }

            // Extract product data
            const products = await page.evaluate((sel, max) => {
                const items: ScrapedProduct[] = [];
                const cards = document.querySelectorAll(sel.productCard);

                for (let i = 0; i < Math.min(cards.length, max); i++) {
                    const card = cards[i];

                    const titleEl = card.querySelector(sel.title);
                    const priceEl = card.querySelector(sel.price);
                    let linkEl = card.querySelector(sel.link);
                    if (!linkEl && card.tagName === 'A') {
                        linkEl = card;
                    }

                    const imageEl = card.querySelector(sel.image);

                    if (!titleEl || !priceEl || !linkEl) continue;

                    const title = titleEl.textContent?.trim() || "";
                    const priceText = priceEl.textContent?.trim() || "0";
                    const url = (linkEl as HTMLAnchorElement).href || "";

                    let image = undefined;
                    if (imageEl) {
                        const img = imageEl as HTMLImageElement;
                        image = img.getAttribute('data-src') ||
                            img.getAttribute('data-original') ||
                            img.getAttribute('srcset')?.split(' ')[0] ||
                            img.src;
                    }

                    const cleanPriceText = priceText.replace(/[^\d.,]/g, "").trim();
                    let price = 0;

                    if (cleanPriceText) {
                        if (cleanPriceText.includes('.') && cleanPriceText.includes(',')) {
                            price = parseFloat(cleanPriceText.replace(/\./g, "").replace(",", "."));
                        }
                        else if (cleanPriceText.includes(',') && cleanPriceText.indexOf(',') > cleanPriceText.length - 4) {
                            price = parseFloat(cleanPriceText.replace(",", "."));
                        }
                        else if (cleanPriceText.includes('.') && cleanPriceText.indexOf('.') <= cleanPriceText.length - 4) {
                            price = parseFloat(cleanPriceText.replace(/\./g, ""));
                        }
                        else {
                            price = parseFloat(cleanPriceText);
                        }
                    }

                    const currency = priceText.includes("$") ? "USD"
                        : priceText.includes("€") ? "EUR"
                            : "TL";

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

            return products;

        } catch (error) {
            logger.error("scraper.failed", {
                site: siteName,
                query,
                attempt,
                error: error instanceof Error ? error.message : String(error)
            });
            if (attempt === retries) return [];
        } finally {
            await page.close();
        }
    }
    return [];
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
    const selectors: Record<string, { productCard: string; title: string; price: string; link: string; image: string; }> = {
        "N11": {
            productCard: ".columnContent, .pro, .product-item, [data-testid='product-card']",
            title: ".productName, .proName",
            price: ".priceContainer ins, .newPrice",
            link: "a.plink",
            image: ".lazy-load-image, .cardImage",
        },
        "Ciceksepeti": {
            productCard: ".product-card, .products__item, .js-product-item, .product-item",
            title: ".product-title, .products__item-title",
            price: ".price, .product-price, .products__item-price",
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

/**
 * Visit a product detail page to extract rich data like barcode.
 */
export async function scrapeProductDetails(
    url: string,
    siteName: string,
    options: { timeout?: number } = {}
): Promise<Partial<ScrapedProduct>> {
    const { timeout = 15000 } = options;
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        await page.setViewport({ width: 1920, height: 1080 });
        logger.info("scraper.details.navigate", { site: siteName, url });

        await page.goto(url, {
            waitUntil: "networkidle2",
            timeout,
        });

        // Extract using JSON-LD and specific selectors
        const data = await page.evaluate((mp: string) => {
            const result: { barcode?: string; brand?: string; description?: string } = {};
            
            // 1. Try JSON-LD (Standard)
            const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
            for (const script of Array.from(ldScripts)) {
                try {
                    const json = JSON.parse(script.textContent || "{}");
                    const items = Array.isArray(json) ? json : [json];
                    
                    for (const item of items) {
                        if (item["@type"] === "Product") {
                            result.barcode = item.gtin13 || item.gtin || item.gtin8 || item.gtin12 || item.productID || item.sku;
                            result.brand = typeof item.brand === 'object' ? item.brand.name : item.brand;
                            result.description = item.description;
                            if (result.barcode) break;
                        }
                    }
                } catch { /* ignore parse errors */ }
                if (result.barcode) break;
            }

            // 2. Site-specific fallbacks
            if (!result.barcode) {
                if (mp === "Trendyol") {
                    const allScripts = Array.from(document.querySelectorAll('script'));
                    for (const s of allScripts) {
                        if (s.textContent?.includes('PRODUCT_DETAIL_APP_STATE')) {
                            const match = s.textContent.match(/"barcode":"(\d+)"/);
                            if (match) {
                                result.barcode = match[1];
                                break;
                            }
                        }
                    }
                } else if (mp === "Hepsiburada") {
                    // Try data-test-id first
                    const barcodeEl = document.querySelector('[data-test-id="barcode"]');
                    if (barcodeEl) {
                        result.barcode = barcodeEl.textContent?.trim();
                    }
                    // Fallback: search scripts for barcode/gtin regex
                    if (!result.barcode) {
                        const hbScripts = Array.from(document.querySelectorAll('script'));
                        for (const s of hbScripts) {
                            const text = s.textContent || "";
                            if (text.includes('"barcode"') || text.includes('"gtin"')) {
                                const barcodeMatch = text.match(/"barcode"\s*:\s*"(\d+)"/);
                                const gtinMatch = text.match(/"gtin\d*"\s*:\s*"(\d+)"/);
                                if (barcodeMatch) {
                                    result.barcode = barcodeMatch[1];
                                    break;
                                }
                                if (gtinMatch) {
                                    result.barcode = gtinMatch[1];
                                    break;
                                }
                            }
                        }
                    }
                } else if (mp === "N11") {
                    const n11Scripts = Array.from(document.querySelectorAll('script'));
                    for (const s of n11Scripts) {
                        if (s.textContent?.includes('barcode')) {
                            const match = s.textContent.match(/"barcode":"(\d+)"/);
                            if (match) result.barcode = match[1];
                        }
                    }
                }
            }

            return result;
        }, siteName);

        logger.info("scraper.details.success", { site: siteName, barcodeFound: !!data.barcode });
        return data;

    } catch (error) {
        logger.error("scraper.details.failed", { site: siteName, url, error: String(error) });
        return {};
    } finally {
        await page.close();
    }
}
