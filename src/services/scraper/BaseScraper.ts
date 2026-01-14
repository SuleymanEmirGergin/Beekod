/**
 * Base Scraper
 * Abstract class for all marketplace scrapers
 */

import type { Page } from "puppeteer";
import { getBrowser, createPage, humanDelay, simulateHumanBehavior } from "./browserManager.js";
import { logger } from "../../logger.js";
import type { ScrapedProduct, SiteSelectors, ScrapeOptions } from "./types.js";

export abstract class BaseScraper {
    abstract siteName: string;
    abstract baseUrl: string;
    abstract selectors: SiteSelectors;

    /**
     * Generate search URL for query
     */
    abstract getSearchUrl(query: string): string;

    /**
     * Parse product details from detail page - site specific
     */
    abstract parseDetailPage(page: Page): Promise<Partial<ScrapedProduct>>;

    /**
     * Scrape marketplace for product search results
     */
    async scrapeSearch(query: string, options: ScrapeOptions = {}): Promise<ScrapedProduct[]> {
        const { timeout = 20000, maxResults = 5, retries = 2 } = options;
        let attempt = 0;

        while (attempt <= retries) {
            attempt++;
            let page: Page | null = null;

            try {
                const browser = await getBrowser();
                page = await createPage(browser);
                
                const searchUrl = this.getSearchUrl(query);
                logger.info(`scraper.${this.siteName.toLowerCase()}.search`, { query, attempt, url: searchUrl });

                await page.goto(searchUrl, { waitUntil: "networkidle2", timeout });
                await humanDelay(1000, 2000);
                await simulateHumanBehavior(page);

                const products = await this.extractProducts(page, maxResults);
                
                logger.info(`scraper.${this.siteName.toLowerCase()}.success`, { count: products.length });
                return products;

            } catch (err: any) {
                logger.warn(`scraper.${this.siteName.toLowerCase()}.error`, { 
                    attempt, 
                    error: err.message 
                });
                
                if (attempt > retries) {
                    return [];
                }
                await humanDelay(2000, 4000);
            } finally {
                if (page) await page.close().catch(() => {});
            }
        }

        return [];
    }

    /**
     * Extract products from search results page
     */
    protected async extractProducts(page: Page, maxResults: number): Promise<ScrapedProduct[]> {
        const { productCard, title, price, link, image } = this.selectors;

        return page.evaluate(
            (selectors, max, baseUrl) => {
                const products: ScrapedProduct[] = [];
                const cards = document.querySelectorAll(selectors.productCard);

                for (let i = 0; i < Math.min(cards.length, max); i++) {
                    const card = cards[i];
                    
                    const titleEl = card.querySelector(selectors.title);
                    const priceEl = card.querySelector(selectors.price);
                    const linkEl = card.querySelector(selectors.link) as HTMLAnchorElement | null;
                    const imgEl = card.querySelector(selectors.image) as HTMLImageElement | null;

                    if (!titleEl || !priceEl) continue;

                    const priceText = priceEl.textContent?.replace(/[^\d,\.]/g, "") || "0";
                    const priceNum = parseFloat(priceText.replace(",", ".")) || 0;
                    
                    if (priceNum < 1) continue;

                    let productUrl = linkEl?.href || "";
                    if (productUrl && !productUrl.startsWith("http")) {
                        productUrl = baseUrl + productUrl;
                    }

                    products.push({
                        title: titleEl.textContent?.trim() || "",
                        price: priceNum,
                        currency: "TRY",
                        url: productUrl,
                        image: imgEl?.src || imgEl?.dataset.src,
                        inStock: true,
                    });
                }

                return products;
            },
            { productCard, title, price, link, image },
            maxResults,
            this.baseUrl
        );
    }

    /**
     * Scrape product detail page
     */
    async scrapeDetail(url: string, options: ScrapeOptions = {}): Promise<Partial<ScrapedProduct>> {
        const { timeout = 25000, retries = 2 } = options;
        let attempt = 0;

        while (attempt <= retries) {
            attempt++;
            let page: Page | null = null;

            try {
                const browser = await getBrowser();
                page = await createPage(browser);

                await page.goto(url, { waitUntil: "networkidle2", timeout });
                await humanDelay(1000, 2000);
                await simulateHumanBehavior(page);

                const details = await this.parseDetailPage(page);
                details.url = url;

                logger.info(`scraper.${this.siteName.toLowerCase()}.detail_success`, { url });
                return details;

            } catch (err: any) {
                logger.warn(`scraper.${this.siteName.toLowerCase()}.detail_error`, {
                    attempt,
                    error: err.message
                });

                if (attempt > retries) {
                    return { url };
                }
                await humanDelay(2000, 4000);
            } finally {
                if (page) await page.close().catch(() => {});
            }
        }

        return { url };
    }
}
