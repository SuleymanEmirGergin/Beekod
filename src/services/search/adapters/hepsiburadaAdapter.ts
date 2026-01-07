import * as cheerio from "cheerio";
import { SearchAdapter, SearchResultItem } from "../types.js";
import { getBrowser, createPage } from "../../scraper/browser.js";
import { logger } from "../../../logger.js";

export class HepsiburadaAdapter implements SearchAdapter {
  name = "Hepsiburada" as const;

  async search(query: string): Promise<SearchResultItem[]> {
    let page;
    try {
      const browser = await getBrowser();
      page = await createPage(browser);

      const url = `https://www.hepsiburada.com/ara?q=${encodeURIComponent(query)}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

      // Wait for product list
      try {
        await page.waitForSelector('ul.productListContent, li[id^="i"]', { timeout: 5000 });
      } catch (e) {
        // Timeout or no results, continue
      }

      const content = await page.content();
      const $ = cheerio.load(content);
      const items: SearchResultItem[] = [];

      // Hepsiburada uses <li> elements with id starting with "i" for product cards
      $('li[id^="i"]').each((_, element) => {
        const el = $(element);

        // Get product link - Look for the main anchor tag
        const linkTag = el.find("a").first();
        const relativeUrl = linkTag.attr("href") || "";
        const productUrl = relativeUrl.startsWith("http") ? relativeUrl : `https://www.hepsiburada.com${relativeUrl}`;

        // Get product title
        // Try data-test-id first (format: title-X), then fallback to h2/h3 text
        const title =
          el.find('[data-test-id^="title-"]').text().trim() ||
          el.find("h2").text().trim() ||
          el.find("h3").text().trim();

        // Find price
        // Try data-test-id first (format: final-price-X), then fallback classes
        let priceText = el.find('[data-test-id^="final-price-"]').text().trim();

        // Fallback selectors if data-test-id fails
        if (!priceText) {
          priceText = el.find('[data-test-id="price-current-price"]').text().trim();
        }
        if (!priceText) {
          priceText = el.find(".price-value").text().trim();
        }
        if (!priceText) {
          // Try to find any element with 'price' in its class name
          priceText = el.find('[class*="price-module_finalPrice"]').text().trim();
        }

        // Clean price: "1.234,56 TL" -> 1234.56
        const cleanPrice = priceText
          .replace(/\./g, "") // Remove thousand separators
          .replace(",", ".") // Convert comma to decimal point
          .replace(/TL/i, "") // Remove currency
          .replace(/₺/g, "") // Remove Turkish Lira symbol
          .replace(/[^\d.]/g, "") // Remove any remaining non-numeric chars except dot
          .trim();

        const price = parseFloat(cleanPrice);

        // Get image
        const imageUrl =
          el.find("img").attr("src") || el.find("img").attr("data-src") || el.find("img").attr("data-lazy-src") || "";

        // Validation
        if (title && !isNaN(price) && price > 0 && productUrl) {
          items.push({
            marketplace: this.name,
            title,
            price,
            currency: "TRY",
            url: productUrl,
            imageUrl,
            image: imageUrl,
          });
        }
      });

      if (items.length === 0) {
        logger.warn("search.hepsiburada_no_results", { query });
        const fs = await import("fs/promises");
        await fs.writeFile("debug_hepsiburada.html", content);
      }

      logger.info("search.hepsiburada_success", { query, count: items.length });
      return items.slice(0, 10);
    } catch (error) {
      logger.error(`search.hepsiburada_failed`, { error });
      return [];
    } finally {
      if (page) await page.close();
    }
  }
}
