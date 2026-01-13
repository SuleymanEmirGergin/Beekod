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

// ============================================
// ANTI-CLOUDFLARE UTILITIES (Phase 9)
// ============================================

/**
 * Pool of realistic User-Agent strings for rotation
 */
const USER_AGENTS = [
    // Chrome Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    // Chrome Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    // Firefox Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    // Safari Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    // Edge Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    // Mobile Chrome Android
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    // Mobile Safari iOS
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
];

/**
 * Get a random User-Agent string
 */
function getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Random delay to mimic human behavior
 */
async function humanDelay(minMs = 500, maxMs = 2000): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Simulate human-like page interaction
 */
async function simulateHumanBehavior(page: any): Promise<void> {
    try {
        // Random scroll
        await page.evaluate(() => {
            window.scrollTo(0, Math.floor(Math.random() * 500) + 100);
        });
        await humanDelay(300, 800);
        
        // Move mouse randomly
        const viewport = page.viewport();
        if (viewport) {
            await page.mouse.move(
                Math.floor(Math.random() * viewport.width),
                Math.floor(Math.random() * viewport.height)
            );
        }
        await humanDelay(200, 500);
    } catch {
        // Ignore errors in human simulation
    }
}

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
 * Uses anti-Cloudflare techniques: UA rotation, human behavior, retries.
 */
export async function scrapeProductDetails(
    url: string,
    siteName: string,
    options: { timeout?: number; retries?: number } = {}
): Promise<Partial<ScrapedProduct>> {
    const { timeout = 20000, retries = 2 } = options;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        const browser = await getBrowser();
        const page = await browser.newPage();
        
        try {
            // Anti-Cloudflare: Random User-Agent
            const userAgent = getRandomUserAgent();
            await page.setUserAgent(userAgent);
            await page.setViewport({ width: 1920, height: 1080 });
            
            // Set realistic headers
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            });
            
            logger.info("scraper.details.navigate", { site: siteName, url, attempt, userAgent: userAgent.substring(0, 30) + "..." });
            
            // Initial delay before navigation (looks more human)
            if (attempt > 1) {
                await humanDelay(1000, 3000);
            }
            
            await page.goto(url, {
                waitUntil: "networkidle2",
                timeout,
            });
            
            // Anti-Cloudflare: Human-like behavior
            await simulateHumanBehavior(page);
            
            // Wait for page to fully render
            await humanDelay(500, 1500);

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
                } else if (mp === "Ciceksepeti") {
                    // Çiçeksepeti usually has product data in __NEXT_DATA__ or similar
                    const csScripts = Array.from(document.querySelectorAll('script'));
                    for (const s of csScripts) {
                        const text = s.textContent || "";
                        // Try multiple patterns
                        if (text.includes('"barcode"') || text.includes('"productCode"') || text.includes('"sku"')) {
                            const barcodeMatch = text.match(/"barcode"\s*:\s*"(\d+)"/);
                            const skuMatch = text.match(/"productCode"\s*:\s*"(\d+)"/);
                            if (barcodeMatch) {
                                result.barcode = barcodeMatch[1];
                                break;
                            }
                            if (skuMatch) {
                                result.barcode = skuMatch[1];
                                break;
                            }
                        }
                    }
                    // Fallback: Try meta tags
                    if (!result.barcode) {
                        const skuMeta = document.querySelector('meta[property="product:retailer_item_id"]');
                        if (skuMeta) result.barcode = skuMeta.getAttribute('content') || undefined;
                    }
                } else if (mp === "Pazarama") {
                    // Pazarama stores product info in scripts
                    const pazScripts = Array.from(document.querySelectorAll('script'));
                    for (const s of pazScripts) {
                        const text = s.textContent || "";
                        if (text.includes('"code"') || text.includes('"barcode"')) {
                            const barcodeMatch = text.match(/"barcode"\s*:\s*"(\d+)"/);
                            const codeMatch = text.match(/"code"\s*:\s*"(\d+)"/);
                            if (barcodeMatch) {
                                result.barcode = barcodeMatch[1];
                                break;
                            }
                            if (codeMatch) {
                                result.barcode = codeMatch[1];
                                break;
                            }
                        }
                    }
                } else if (mp === "PttAVM") {
                    // PttAVM often uses productCode or barcode in page scripts
                    const pttScripts = Array.from(document.querySelectorAll('script'));
                    for (const s of pttScripts) {
                        const text = s.textContent || "";
                        if (text.includes('"barcode"') || text.includes('"productBarcode"')) {
                            const barcodeMatch = text.match(/"(?:product)?[Bb]arcode"\s*:\s*"(\d+)"/);
                            if (barcodeMatch) {
                                result.barcode = barcodeMatch[1];
                                break;
                            }
                        }
                    }
                    // Fallback: Check for visible barcode element
                    if (!result.barcode) {
                        const barcodeSpan = document.querySelector('.product-barcode, [data-barcode]');
                        if (barcodeSpan) result.barcode = barcodeSpan.textContent?.trim();
                    }
                }
            }

            return result;
        }, siteName);

        logger.info("scraper.details.success", { site: siteName, barcodeFound: !!data.barcode, attempt });
        return data;

        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            logger.warn("scraper.details.attempt_failed", { site: siteName, url, attempt, error: lastError.message });
        } finally {
            await page.close();
        }
        
        // Exponential backoff before retry
        if (attempt < retries) {
            const backoffMs = Math.pow(2, attempt) * 1000;
            logger.info("scraper.details.retry_backoff", { site: siteName, attempt, backoffMs });
            await humanDelay(backoffMs, backoffMs + 1000);
        }
    }
    
    // All retries failed
    logger.error("scraper.details.all_retries_failed", { site: siteName, url, error: lastError?.message });
    return {};
}
