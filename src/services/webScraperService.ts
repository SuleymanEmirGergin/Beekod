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

    const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    logger.info("scraper.browser_launch", { chromePath });
    
    browserInstance = await puppeteerExtra.launch({
        executablePath: chromePath,
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu",
            "--window-size=1920x1080",
            "--disable-blink-features=AutomationControlled",
            ...getProxyArgs()
        ],
        ignoreDefaultArgs: ["--enable-automation"],
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
    competitors?: {
        sellerName: string;
        price: number;
        currency: string;
        shippingInfo?: string;
    }[];
};

// ============================================
// ANTI-CLOUDFLARE UTILITIES (Phase 9)
// ============================================

/**
 * Pool of realistic User-Agent strings for rotation
 */
const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
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
async function simulateHumanBehavior(page: import('puppeteer').Page): Promise<void> {
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
            await page.setViewport({ width: 1536, height: 864 });
            
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
            productCard: ".product-card",
            title: ".product-card h2",
            price: ".product-card p.text-xl", // removed general 'p' fallback to avoid 1 TL issues
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
    const { timeout = 30000, retries = 3 } = options;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        // PAZARAMA FRESH BROWSER: Close any existing instance to ensure clean state
        if (siteName === "Pazarama" && attempt === 1) {
            await closeBrowser();
        }
        
        const browser = await getBrowser();
        const page = await browser.newPage();
        
        try {
            // Anti-Cloudflare: Random User-Agent
            const userAgent = getRandomUserAgent();
            await page.setUserAgent(userAgent);
            // Set realistic headers
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'tr-TR,tr;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Cache-Control': 'no-cache',
                'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="143", "Chromium";v="143"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Upgrade-Insecure-Requests': '1'
            });

            // Set timezone and viewport with dpr
            await page.emulateTimezone('Europe/Istanbul');
            await page.setViewport({ width: 1536, height: 864, deviceScaleFactor: 1.25 });

            // PAZARAMA-SPECIFIC STEALTH: Aggressive fingerprint spoofing
            if (siteName === "Pazarama") {
                await page.evaluateOnNewDocument(() => {
                    // Override webdriver
                    Object.defineProperty(navigator, 'webdriver', { get: () => false });
                    // Realistic hardware info
                    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 16 });
                    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
                    // Realistic plugins
                    const mockPlugins = [
                        { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
                        { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
                        { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
                        { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
                        { name: 'WebKit built-in PDF', filename: 'internal-pdf-viewer', description: 'Portable Document Format' }
                    ];
                    Object.defineProperty(navigator, 'plugins', { get: () => mockPlugins });
                    Object.defineProperty(navigator, 'languages', { get: () => ["tr-TR", "tr", "en-US", "en"] });
                });
            }
            
            logger.info("scraper.details.navigate", { site: siteName, url, attempt, userAgent: userAgent.substring(0, 30) + "..." });
            
            // COMPLEX NAVIGATION FLOW (Anti-bot Strategy)
            if (siteName === "Hepsiburada" || siteName === "N11") {
                const baseUrl = siteName === "Hepsiburada" ? "https://www.hepsiburada.com" : "https://www.n11.com";
                await page.goto(baseUrl, { waitUntil: "networkidle2", timeout: 20000 }).catch(() => {});
                await simulateHumanBehavior(page);
                await humanDelay(1500, 3000);
            }
            
            // Navigate to Product
            try {
                await page.goto(url, { waitUntil: "networkidle2", timeout });
            } catch (e) {
                logger.warn("scraper.details.navigation_error", { site: siteName, error: (e as any).message });
            }

            // Redirect handling for Hepsiburada: If redirected to a search page, try to find and click the product
            if (siteName === "Hepsiburada") {
                const title = await page.title();
                if (title.includes("fiyatları") || title.includes("bulunamadı") || page.url().includes("/ara?q=")) {
                    logger.warn("scraper.details.hb_redirect_detected", { title, currentUrl: page.url() });
                    // Try to find the product in the search results if we were redirected
                    const firstProduct = await page.$('[class*="productListContent"], [class*="product-item"], [data-test-id="product-card"]');
                    if (firstProduct) {
                        await firstProduct.click();
                        await page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {});
                    }
                }
            }

            
            // Anti-Cloudflare: Human-like behavior
            await simulateHumanBehavior(page);
            
            // Pazarama specific: Incremental scroll to trigger lazy-loaded sections (Other Sellers)
            if (siteName === "Pazarama") {
                await page.evaluate(async () => {
                    await new Promise<void>((resolve) => {
                        let currentScroll = 0;
                        const distance = 800;
                        const timer = setInterval(() => {
                            window.scrollBy(0, distance);
                            currentScroll += distance;
                            if (currentScroll >= 6000) {
                                clearInterval(timer);
                                resolve();
                            }
                        }, 400);
                    });
                });
                await humanDelay(1500, 2500);
            }

            // Hepsiburada specific: Scroll to trigger drawer
            if (siteName === "Hepsiburada") {
                await page.evaluate(async () => {
                    window.scrollBy(0, 800);
                    await new Promise(r => setTimeout(r, 1000));
                });
            }

            // Trendyol specific: Click to open BuyBox if not visible
            if (siteName === "Trendyol") {
                const seeAllBtn = await page.$('.see-all-button-see-all-button, [class*="see-all"]');
                if (seeAllBtn) {
                    await seeAllBtn.click();
                    await humanDelay(1000, 2000);
                }
            }

            // N11 specific: Ensure modal is triggered
            if (siteName === "N11") {
                const showAllBtn = await page.$('.showAllButton, [href="#unification/products"]');
                if (showAllBtn) {
                    await showAllBtn.click().catch(() => {});
                    await humanDelay(1500, 2500);
                }
            }
            
            // Wait for site-specific hydration/props initialization
            if (siteName === "Trendyol") {
                await page.waitForFunction(() => (window as any)["__envoy_product-detail__PROPS"]?.product?.otherMerchants, { timeout: 5000 }).catch(() => {});
            } else if (siteName === "Hepsiburada") {
                await page.waitForFunction(() => (window as any).productModelSelect?.listings || document.querySelector('[data-test-id="other-merchants"]'), { timeout: 5000 }).catch(() => {});
            }

            // Wait for page to fully render
            await humanDelay(500, 1500);

        // Extract using JSON-LD and specific selectors
        const resultData = await page.evaluate((mp: string) => {
            const result: any = { competitors: [] };
            
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
                            result.title = result.title || item.name;
                            
                            if (item.offers) {
                                const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
                                if (offer.price) result.price = parseFloat(offer.price);
                            }
                            if (result.barcode) break;
                        }
                    }
                } catch { /* ignore parse errors */ }
                if (result.barcode) break;
            }

            // 2. DOM Fallbacks for Basic Info
            if (!result.title) result.title = document.querySelector('h1')?.textContent?.trim();
            
            // 3. Site-specific enrichment (Barcode & BuyBox/Competitors)
            if (mp === "Trendyol") {
                // Barcode
                const allScripts = Array.from(document.querySelectorAll('script'));
                for (const s of allScripts) {
                    if (s.textContent?.includes('PRODUCT_DETAIL_APP_STATE')) {
                        const match = s.textContent.match(/"barcode":"(\d+)"/);
                        if (match) { result.barcode = match[1]; break; }
                    }
                }
                // BuyBox / Competitors (JSON Strategy - NEW PATH)
                const tyProps = (window as any)["__envoy_product-detail__PROPS"];
                const tyMerchants = tyProps?.product?.otherMerchants || tyProps?.otherMerchants;
                
                if (tyMerchants) {
                    tyMerchants.forEach((m: any) => {
                        const p = m.price?.discountedPrice?.value || m.price?.sellingPrice?.value || m.price?.value || 0;
                        if (p > 0 && result.competitors.length < 10) {
                            result.competitors.push({
                                sellerName: m.name || m.merchantName,
                                price: p,
                                currency: "TL",
                                shippingInfo: m.freeCargo || m.isFreeShipping ? "Ücretsiz Kargo" : undefined
                            });
                        }
                    });
                }
                // Fallback DOM for Trendyol
                if (result.competitors.length === 0) {
                    document.querySelectorAll('[class*="other-seller-item"], .other-seller-item-other-seller-container').forEach(el => {
                        const sName = el.querySelector('[class*="merchant-name"], .other-seller-header-merchant-name')?.textContent?.trim();
                        const sPriceTxt = el.querySelector('[class*="price"], .price-current-price')?.textContent?.trim() || "";
                        const sPrice = parseFloat(sPriceTxt.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
                        if (sName && sPrice > 0 && result.competitors.length < 10) {
                            result.competitors.push({ sellerName: sName, price: sPrice, currency: "TL" });
                        }
                    });
                }

            } else if (mp === "Hepsiburada") {
                // Barcode
                const barcodeEl = document.querySelector('[data-test-id="barcode"]');
                if (barcodeEl) result.barcode = barcodeEl.textContent?.trim();

                // BuyBox / Competitors (Hybrid Strategy)
                // 1. Try window.productModelSelect (highly reliable if present)
                const hbModel = (window as any).productModelSelect;
                if (hbModel?.listings) {
                    hbModel.listings.forEach((l: any) => {
                        if (l.merchantName && l.price && result.competitors.length < 10) {
                            result.competitors.push({
                                sellerName: l.merchantName,
                                price: typeof l.price === 'string' ? parseFloat(l.price.replace(/[^\d,]/g, '').replace(',', '.')) : l.price,
                                currency: "TL"
                            });
                        }
                    });
                }

                // 2. Try [data-test-id="other-merchants"] with data-hbus attribute
                if (result.competitors.length === 0) {
                    const hbusEl = document.querySelector('[data-test-id="other-merchants"]');
                    const hbusData = hbusEl?.getAttribute('data-hbus');
                    if (hbusData) {
                        try {
                            const parsed = JSON.parse(hbusData);
                            // Some versions of HB use this structure
                            if (Array.isArray(parsed)) {
                                parsed.forEach((m: any) => {
                                    if (m.merchant_name && result.competitors.length < 10) {
                                        result.competitors.push({ sellerName: m.merchant_name, price: 0, currency: "TL" }); // Price might be missing in data-hbus
                                    }
                                });
                            }
                        } catch {}
                    }
                }

                // 3. Fallback DOM Strategy - Drawer
                if (result.competitors.length === 0) {
                    const hbDrawer = document.querySelector('.hb-AxhfK, [data-test-id="other-merchants"]');
                    if (hbDrawer) {
                        const rows = Array.from(hbDrawer.querySelectorAll('li, div[class*="product-item"], [data-test-id="merchant-name"]')).map(el => el.closest('li, div, section')).filter(el => el && el.textContent?.includes('TL'));
                        rows.forEach(row => {
                            if (!row) return;
                            const sellerEl = row.querySelector('[data-test-id="merchant-name"], a[href*="magaza"]');
                            const priceEl = row.querySelector('[data-test-id="price-current-price"], div[class*="sf-AxioQ"], [class*="price"]');
                            if (sellerEl && priceEl) {
                                const sellerName = sellerEl.textContent?.trim() || "Bilinmeyen Satıcı";
                                const priceText = priceEl.textContent?.trim() || "0";
                                const price = parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
                                if (price > 0 && result.competitors.length < 10) {
                                    if (!result.competitors.find((s: any) => s.sellerName === sellerName)) {
                                        result.competitors.push({ sellerName, price, currency: "TL" });
                                    }
                                }
                            }
                        });
                    }
                }

            } else if (mp === "N11") {
                // Barcode
                const n11Scripts = Array.from(document.querySelectorAll('script'));
                for (const s of n11Scripts) {
                    if (s.textContent?.includes('barcode')) {
                        const match = s.textContent.match(/"barcode":"(\d+)"/);
                        if (match) { result.barcode = match[1]; break; }
                    }
                }
                // BuyBox / Competitors (DOM Strategy - Modal)
                const n11Rows = document.querySelectorAll('.unificationItemWrapper, .unification-product, .unification-item');
                n11Rows.forEach(row => {
                    const sellerEl = row.querySelector('.seller-name, .seller-info');
                    const priceEl = row.querySelector('.priceDisplay, .newPrice, [class*="price"]');
                    if (sellerEl && priceEl) {
                        const sellerName = sellerEl.textContent?.trim() || "Bilinmeyen Satıcı";
                        const priceText = priceEl.textContent?.trim() || "0";
                        const price = parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
                        if (price > 0 && result.competitors.length < 10) {
                            if (!result.competitors.find((s: any) => s.sellerName === sellerName)) {
                                result.competitors.push({ sellerName, price, currency: "TL" });
                            }
                        }
                    }
                });

            } else if (mp === "Ciceksepeti" && !result.barcode) {
                const csScripts = Array.from(document.querySelectorAll('script'));
                for (const s of csScripts) {
                    const text = s.textContent || "";
                    if (text.includes('"barcode"') || text.includes('"productCode"')) {
                        const barcodeMatch = text.match(/"barcode"\s*:\s*"(\d+)"/);
                        const skuMatch = text.match(/"productCode"\s*:\s*"(\d+)"/);
                        if (barcodeMatch) { result.barcode = barcodeMatch[1]; break; }
                        if (skuMatch) { result.barcode = skuMatch[1]; break; }
                    }
                }
            } else if (mp === "Pazarama") {
                // Barcode enrichment
                if (!result.barcode) {
                    const scripts = Array.from(document.querySelectorAll('script'));
                    const barcodeScript = scripts.find(s => s.textContent?.includes('productBarcode'));
                    if (barcodeScript) {
                        const match = barcodeScript.textContent?.match(/"productBarcode"\s*:\s*"([^"]+)"/);
                        if (match) result.barcode = match[1];
                    }
                }

                // BUYBOX / OTHER SELLERS (Pazarama specific) - Use Nuxt State for maximum reliability
                const debug: any = { mp };
                
                try {
                    const nuxt = (window as any).__NUXT__;
                    debug.nuxtExists = !!nuxt;
                    
                    if (nuxt) {
                        debug.nuxtKeys = Object.keys(nuxt).slice(0, 10);
                        debug.stateExists = !!nuxt.state;
                        
                        if (nuxt.state?.ui) {
                            debug.uiKeys = Object.keys(nuxt.state.ui).slice(0, 10);
                            const productDetail = nuxt.state.ui.UI_PRODUCT_DETAIL;
                            debug.productDetailExists = !!productDetail;
                            
                            if (productDetail) {
                                debug.productDetailKeys = Object.keys(productDetail).slice(0, 20);
                                debug.code = productDetail.code;
                                debug.barcode = productDetail.barcode;
                                debug.otherSellersType = typeof productDetail.otherSellers;
                                debug.otherSellersIsArray = Array.isArray(productDetail.otherSellers);
                                debug.otherSellersCount = Array.isArray(productDetail.otherSellers) ? productDetail.otherSellers.length : 'N/A';
                                
                                // Pazarama-specific: Always prefer Nuxt code (12-digit GTIN) over JSON-LD barcode (UUID)
                                if (productDetail.code) {
                                    result.barcode = productDetail.code;
                                }
                                
                                const otherSellers = productDetail.otherSellers;
                                if (Array.isArray(otherSellers) && otherSellers.length > 0) {
                                    debug.firstSeller = otherSellers[0] ? { name: otherSellers[0].sellerName, price: otherSellers[0].salePrice } : null;
                                    otherSellers.forEach((s: any) => {
                                        const sellerName = s.sellerName || "Bilinmeyen Satıcı";
                                        const priceStr = s.salePrice?.valueString || "0";
                                        const price = parseFloat(priceStr.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".")) || 0;
                                        
                                        if (price > 0 && result.competitors.length < 10) {
                                            result.competitors.push({
                                                sellerName,
                                                price,
                                                currency: "TL",
                                                shippingInfo: s.deliveryOptions?.deliveryDetailText
                                            });
                                        }
                                    });
                                }
                            }
                        }
                    }
                } catch (err) {
                    debug.error = String(err);
                }
                
                result._debug = debug;

                // DOM Fallback if state extraction failed or returned no results
                if (result.competitors.length === 0) {
                    let container: Element | null = document.querySelector('.product__seller-row, .product__other-sellers');
                    if (!container) {
                        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, span, p'));
                        const buyBoxHeading = headings.find(el => {
                            const t = el.textContent?.trim() || "";
                            return (t === 'Diğer Satıcılar' || t === 'Tüm Satıcılar') && t.length < 30;
                        });
                        if (buyBoxHeading) {
                            const section = buyBoxHeading.closest('.container-7xl') || buyBoxHeading.parentElement?.parentElement;
                            container = section?.querySelector('.product__seller-row, [class*="seller-row"]') || null;
                        }
                    }
                    
                    if (container) {
                        debug.source = "dom_fallback";
                        const candidateRows = Array.from(container.querySelectorAll(':scope > div, .product__seller-row > div, [class*="seller-row"] > div')).filter(el => {
                            const text = el.textContent || "";
                            return text.includes('TL') && (text.includes('Sepete Ekle') || text.includes('Kargoda') || text.includes('Satış'));
                        });
                        
                        const rows = candidateRows.filter(r => !candidateRows.some(other => other !== r && other.contains(r)));
                        rows.forEach((row) => {
                            const sellerEl = row.querySelector('[class*="font-bold"], .font-bold');
                            let sellerName = sellerEl?.textContent?.trim().split('\n')[0] || "Bilinmeyen Satıcı";
                            const priceEls = Array.from(row.querySelectorAll('span, div')).filter(s => s.textContent?.includes('TL') && /\d/.test(s.textContent));
                            const priceText = priceEls[priceEls.length - 1]?.textContent?.trim() || "0";
                            const price = parseFloat(priceText.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".")) || 0;

                            if (price > 0 && !result.competitors.find((s: any) => s.sellerName === sellerName)) {
                                result.competitors.push({
                                    sellerName,
                                    price,
                                    currency: "TL"
                                });
                            }
                        });
                    }
                }
                result._debug = debug;
            } else if (mp === "PttAVM" && !result.barcode) {
                const pttScripts = Array.from(document.querySelectorAll('script'));
                for (const s of pttScripts) {
                    const text = s.textContent || "";
                    if (text.includes('"barcode"') || text.includes('"productBarcode"')) {
                        const barcodeMatch = text.match(/"(?:product)?[Bb]arcode"\s*:\s*"(\d+)"/);
                        if (barcodeMatch) { result.barcode = barcodeMatch[1]; break; }
                    }
                }
            }

            return result;
        }, siteName);

        logger.info("scraper.details.success", { site: siteName, barcodeFound: !!resultData.barcode, competitorsFound: resultData.competitors?.length || 0, attempt });
        return resultData;

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
