import * as cheerio from "cheerio";
import { SearchAdapter, SearchResultItem } from "../types.js";
import { getBrowser, createPage } from "../../scraper/browser.js";
import { logger } from "../../../logger.js";

export class N11Adapter implements SearchAdapter {
  name = "N11" as const;

  async search(query: string): Promise<SearchResultItem[]> {
    let page;
    try {
      const browser = await getBrowser();
      page = await createPage(browser);

      // n11 uses /arama?q={query}
      const url = `https://www.n11.com/arama?q=${encodeURIComponent(query)}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForSelector("a.product-item", { timeout: 10000 }).catch(() => null);

      const content = await page.content();
      const lower = content.toLowerCase();
      if (
        lower.includes("captcha") ||
        lower.includes("recaptcha") ||
        lower.includes("robot doğrulama") ||
        lower.includes("erişim engellendi")
      ) {
        return [];
      }
      const $ = cheerio.load(content);
      const items: SearchResultItem[] = [];

      $("a.product-item").each((_, element) => {
        const el = $(element);
        const productUrl = el.attr("href") || "";
        const title = el.find(".product-item-title").first().text().trim();
        const imageUrl =
          el.find("img.listing-items-image").attr("src") || el.find("img.listing-items-image").attr("data-src") || "";

        let priceText = el.find(".price-currency").first().text().trim();

        const cleanPrice = priceText.replace(/[.]/g, "").replace(",", ".").replace(/TL/i, "").trim();
        const price = parseFloat(cleanPrice);

        if (title && !isNaN(price) && productUrl) {
          items.push({
            marketplace: this.name,
            title,
            price,
            currency: "TRY",
            url: productUrl.startsWith("http") ? productUrl : `https://www.n11.com${productUrl}`,
            imageUrl,
            image: imageUrl,
          });
        }
      });

      return items.slice(0, 10);
    } catch (error) {
      logger.error(`search.n11_failed`, { error });
      return [];
    } finally {
      if (page) await page.close();
    }
  }
}
