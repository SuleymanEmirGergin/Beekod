import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser, Page } from "puppeteer";
import { logger } from "../../logger.js";

logger.info("scraper.stealth_plugin_register");
(puppeteer as any).use(StealthPlugin());

let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    logger.info("scraper.browser_launch_start");
    try {
      // @ts-expect-error - Puppeteer types might mismatch with extra plugins
      browserInstance = (await puppeteer.launch({
        headless: true, // Production mode
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      })) as unknown as Browser;
      logger.info("scraper.browser_launch_success");

      browserInstance.on("disconnected", () => {
        logger.warn("scraper.browser_disconnected");
        browserInstance = null;
      });
    } catch (e) {
      logger.error("scraper.browser_launch_failed", { err: e });
      throw e;
    }
  }
  return browserInstance;
}

export async function createPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );
  return page;
}

export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
