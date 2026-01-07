import * as cheerio from "cheerio";
import { SearchAdapter, SearchResultItem } from "../types.js";
import { getBrowser, createPage } from "../../scraper/browser.js";
import { logger } from "../../../logger.js";

export class PttAVMAdapter implements SearchAdapter {
  name = "PttAVM" as const;

  async search(query: string): Promise<SearchResultItem[]> {
    let page;
    try {
      const browser = await getBrowser();
      page = await createPage(browser);

      const url = `https://www.pttavm.com/arama?q=${encodeURIComponent(query)}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

      const content = await page.content();
      const $ = cheerio.load(content);
      const items: SearchResultItem[] = [];

      // PttAVM class names often "product-list-item" or similar grid cols
      $(".product-list-box-container").each((_, element) => {
        const el = $(element);
        const linkTag = el.find("a").first();
        const relativeUrl = linkTag.attr("href") || "";
        const productUrl = relativeUrl.startsWith("http") ? relativeUrl : `https://www.pttavm.com${relativeUrl}`;

        const title = el.find(".product-list-box-container-info-name").text().trim();

        const priceText = el
          .find(".price-box-price")
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
      logger.error(`search.pttavm_failed`, { error });
      return [];
    } finally {
      if (page) await page.close();
    }
  }
}
