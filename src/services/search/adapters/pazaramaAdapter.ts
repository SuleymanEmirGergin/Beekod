import * as cheerio from "cheerio";
import { SearchAdapter, SearchResultItem } from "../types.js";
import { getBrowser, createPage } from "../../scraper/browser.js";
import { logger } from "../../../logger.js";

export class PazaramaAdapter implements SearchAdapter {
  name = "Pazarama" as const;

  async search(query: string): Promise<SearchResultItem[]> {
    let page;
    try {
      const browser = await getBrowser();
      page = await createPage(browser);

      const url = `https://www.pazarama.com/arama?q=${encodeURIComponent(query)}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

      const content = await page.content();
      const $ = cheerio.load(content);
      const items: SearchResultItem[] = [];

      // Pazarama grid items
      $(".product-list-item, .card-product").each((_, element) => {
        const el = $(element);
        const linkTag = el.find("a").first();
        const relativeUrl = linkTag.attr("href") || "";
        const productUrl = relativeUrl.startsWith("http") ? relativeUrl : `https://www.pazarama.com${relativeUrl}`;

        const title = el.find(".text-gray-600, .card-product-title, .title").text().trim();

        // Price: usually .current-price or .price
        const priceText = el
          .find(".text-primary-500, .current-price, .price")
          .first()
          .text()
          .trim()
          .replace(/[.]/g, "")
          .replace(",", ".")
          .replace("TL", "");
        const price = parseFloat(priceText);

        const imageUrl = el.find("img").attr("data-src") || el.find("img").attr("src") || "";

        if (title && price && productUrl) {
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

      return items.slice(0, 10);
    } catch (error) {
      logger.error(`search.pazarama_failed`, { error });
      return [];
    } finally {
      if (page) await page.close();
    }
  }
}
