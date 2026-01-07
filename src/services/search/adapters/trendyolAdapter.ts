import * as cheerio from "cheerio";
import { SearchAdapter, SearchResultItem } from "../types.js";
import { getBrowser, createPage } from "../../scraper/browser.js";
import { logger } from "../../../logger.js";

export class TrendyolAdapter implements SearchAdapter {
  name = "Trendyol" as const;

  async search(query: string): Promise<SearchResultItem[]> {
    let page;
    try {
      const browser = await getBrowser();
      page = await createPage(browser);

      const url = `https://www.trendyol.com/sr?q=${encodeURIComponent(query)}`;

      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

      // Wait for product cards
      try {
        await page.waitForSelector(".product-card", { timeout: 5000 });
      } catch (e) {
        // ignore timeout, maybe 0 results
      }

      const content = await page.content();
      const $ = cheerio.load(content);
      const items: SearchResultItem[] = [];

      $(".product-card").each((_, element) => {
        const el = $(element);

        // Link handling: check specific link or if card itself is link
        let linkTag = el.find("a").first();
        if (linkTag.length === 0 && el.is("a")) {
          linkTag = el;
        }
        const relativeUrl = linkTag.attr("href") || "";
        const productUrl = relativeUrl.startsWith("http") ? relativeUrl : `https://www.trendyol.com${relativeUrl}`;

        // Title: try .title first (new design), then .product-name
        const title = el.find(".title, .product-name").first().text().trim();

        // Price logic
        let priceText = el.find(".price-section, .prc-box-dscntd").text().trim();
        if (!priceText) priceText = el.find(".prc-box-sllng").text().trim();
        if (!priceText) priceText = el.find("[class*='price']").first().text().trim();

        const cleanPrice = priceText.replace(/[.]/g, "").replace(",", ".").replace(/TL/i, "").trim();
        let price = parseFloat(cleanPrice);

        const imageUrl = el.find("img").attr("src") || "";

        if (title && !isNaN(price) && productUrl) {
          items.push({
            marketplace: this.name,
            title,
            price,
            currency: "TRY",
            url: productUrl,
            imageUrl,
            image: imageUrl, // Populating alias
          });
        }
      });

      return items.slice(0, 10);
    } catch (error) {
      logger.error(`search.trendyol_failed`, { error });
      return [];
    } finally {
      if (page) await page.close();
    }
  }
}
