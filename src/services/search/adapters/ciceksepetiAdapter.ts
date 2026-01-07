import * as cheerio from "cheerio";
import { SearchAdapter, SearchResultItem } from "../types.js";
import { getBrowser, createPage } from "../../scraper/browser.js";
import { logger } from "../../../logger.js";

export class CiceksepetiAdapter implements SearchAdapter {
  name = "Ciceksepeti" as const;

  async search(query: string): Promise<SearchResultItem[]> {
    let page;
    try {
      const browser = await getBrowser();
      page = await createPage(browser);

      const url = `https://www.ciceksepeti.com/arama?query=${encodeURIComponent(query)}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

      const content = await page.content();
      const $ = cheerio.load(content);
      const items: SearchResultItem[] = [];

      $(".products__item").each((_, element) => {
        const el = $(element);
        const linkTag = el.find("a.products__item-link");
        const relativeUrl = linkTag.attr("href") || "";
        const productUrl = relativeUrl.startsWith("http") ? relativeUrl : `https://www.ciceksepeti.com${relativeUrl}`;

        const title = el.find(".products__item-title").text().trim();

        const priceText = el.find(".price--new").text().trim().replace(/[.]/g, "").replace(",", ".").replace("TL", "");
        const price = parseFloat(priceText);

        const imageUrl =
          el.find(".products__item-img-container img").attr("data-src") ||
          el.find(".products__item-img-container img").attr("src") ||
          "";

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
      logger.error(`search.ciceksepeti_failed`, { error });
      return [];
    } finally {
      if (page) await page.close();
    }
  }
}
