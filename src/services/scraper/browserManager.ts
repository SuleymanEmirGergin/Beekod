/**
 * Browser Manager
 * Manages shared Puppeteer browser instance
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);

import type { Browser, Page } from "puppeteer";
import { logger } from "../../logger.js";

// Use dynamic require for puppeteer-extra
const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteerExtra.use(StealthPlugin());

let browserInstance: Browser | null = null;

/**
 * Get proxy configuration if available.
 */
function getProxyArgs(): string[] {
    const proxy = process.env.SCRAPER_PROXY;
    if (proxy) {
        return [`--proxy-server=${proxy}`];
    }
    return [];
}

/**
 * Get or create a shared browser instance for scraping.
 */
export async function getBrowser(): Promise<Browser> {
    if (browserInstance && browserInstance.connected) {
        return browserInstance;
    }

    const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
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

/**
 * Create a new page with anti-bot settings
 */
export async function createPage(browser: Browser): Promise<Page> {
    const page = await browser.newPage();
    await page.setUserAgent(getRandomUserAgent());
    await page.setViewport({ width: 1920, height: 1080 });
    return page;
}

// ============================================
// ANTI-BOT UTILITIES
// ============================================

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
];

export function getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Random delay to mimic human behavior
 */
export async function humanDelay(minMs = 500, maxMs = 2000): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Simulate human-like page interaction
 */
export async function simulateHumanBehavior(page: Page): Promise<void> {
    try {
        await page.evaluate(() => {
            window.scrollTo(0, Math.floor(Math.random() * 500) + 100);
        });
        await humanDelay(300, 800);
        
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
