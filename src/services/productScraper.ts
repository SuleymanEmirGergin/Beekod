import { logger } from "../logger.js";
import { Product } from "../types.js";
import { getBrowser, createPage } from "./scraper/browser.js";

export type ScrapedProduct = Partial<Product> & {
  originalUrl: string;
  reviews?: string[];
  rating?: number;
};

export async function scrapeProductFromUrl(url: string): Promise<ScrapedProduct | null> {
  let page;
  try {
    const browser = await getBrowser();
    page = await createPage(browser);
    const targetUrl = new URL(url);
    const hostname = targetUrl.hostname.toLowerCase();

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    // Basic wait for SPA hydration
    await new Promise((r) => setTimeout(r, 1000));

    const html = await page.content();

    // Basic OpenGraph extraction
    const ogTitle = extractMetaContent(html, "og:title");
    const ogDescription = extractMetaContent(html, "og:description");
    const ogImage = extractMetaContent(html, "og:image");

    // JSON-LD extraction (common in e-commerce)
    const jsonLdData = extractJsonLd(html);

    let name = ogTitle || "";
    let description = ogDescription || "";
    let price = 0;
    let currency = "TRY";
    let barcode = "";

    // Platform specific adjustments
    if (hostname.includes("trendyol.com")) {
      // Trendyol regex fallback for price if JSON-LD fails or is complex
      const priceMatch = html.match(/"salePrice":\s*(\d+(?:\.\d+)?)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1]);
      }
      // Try to find barcode/SKU
      const skuMatch = html.match(/"productCode":\s*"([^"]+)"/);
      if (skuMatch) {
        barcode = skuMatch[1];
      }
    } else if (hostname.includes("hepsiburada.com")) {
      // Hepsiburada specific regex
      const priceMatch = html.match(/"price":\s*(\d+(?:\.\d+)?)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1]);
      }
      // Try to find SKU
      const skuMatch = html.match(/"sku":\s*"([^"]+)"/);
      if (skuMatch) {
        barcode = skuMatch[1];
      }
    } else if (hostname.includes("n11.com")) {
      // N11 specific
      const priceMatch =
        html.match(/"lowPrice":\s*"?(\d+(?:\.\d+)?)"?/i) || html.match(/"price":\s*"?(\d+(?:\.\d+)?)"?/i);
      if (priceMatch) price = parseFloat(priceMatch[1]);

      const urlSkuMatch = url.match(/-P(\d+)(?:\?|$)/);
      if (urlSkuMatch) barcode = `N11-${urlSkuMatch[1]}`;
    } else if (hostname.includes("ciceksepeti.com")) {
      // Ciceksepeti specific
      const priceMatch = html.match(/"price":\s*"?(\d+(?:\.\d+)?)"?/i);
      if (priceMatch) price = parseFloat(priceMatch[1]);

      const urlSkuMatch = url.match(/-kc(\d+)(?:\?|$)/i);
      if (urlSkuMatch) barcode = `CS-${urlSkuMatch[1]}`;
    } else if (hostname.includes("pttavm.com")) {
      // PttAVM specific
      const priceMatch = html.match(/"price":\s*"?(\d+(?:\.\d+)?)"?/i);
      if (priceMatch) price = parseFloat(priceMatch[1]);

      const urlSkuMatch = url.match(/-(\d+)(?:\?|$)/);
      if (urlSkuMatch) barcode = `PTT-${urlSkuMatch[1]}`;
    } else if (hostname.includes("pazarama.com")) {
      // Pazarama specific
      const priceMatch = html.match(/"price":\s*"?(\d+(?:\.\d+)?)"?/i);
      if (priceMatch) price = parseFloat(priceMatch[1]);
    }

    // JSON-LD priority for standard fields
    let imageUrl = ogImage || "";
    if (jsonLdData) {
      if (jsonLdData.name) name = jsonLdData.name;
      if (jsonLdData.description) description = jsonLdData.description;
      if (jsonLdData.offers) {
        const offer = Array.isArray(jsonLdData.offers) ? jsonLdData.offers[0] : jsonLdData.offers;
        if (offer) {
          if (offer.price) price = Number(offer.price);
          if (offer.priceCurrency) currency = offer.priceCurrency;
          if (offer.sku) barcode = offer.sku;
        }
      }
      if (jsonLdData.sku && !barcode) barcode = jsonLdData.sku;
      if (jsonLdData.image && !imageUrl) {
        imageUrl = Array.isArray(jsonLdData.image) ? jsonLdData.image[0] : jsonLdData.image;
      }
    }

    // --- NEW: Attribute/Spec Extraction ---
    const attributes = await page.evaluate(() => {
      const specs: Record<string, string> = {};

      // Trendyol spec pattern
      const tyRows = document.querySelectorAll('.detail-attr-container .detail-attr-item, .product-detail-container .detail-attr-item');
      tyRows.forEach(row => {
        const key = row.querySelector('.detail-attr-label')?.textContent?.trim();
        const val = row.querySelector('.detail-attr-value')?.textContent?.trim();
        if (key && val) specs[key] = val;
      });

      // Hepsiburada spec pattern
      const hbRows = document.querySelectorAll('.product-properties-table tr, #productTechSpec table tr');
      hbRows.forEach(row => {
        const key = row.querySelector('th, td:first-child')?.textContent?.trim();
        const val = row.querySelector('td:last-child')?.textContent?.trim();
        if (key && val) specs[key] = val;
      });

      // N11 spec pattern
      const n11Rows = document.querySelectorAll('.unf-prop-list .unf-prop-list-item');
      n11Rows.forEach(row => {
        const key = row.querySelector('.unf-prop-list-title')?.textContent?.trim();
        const val = row.querySelector('.unf-prop-list-value')?.textContent?.trim();
        if (key && val) specs[key] = val;
      });

      // Pazarama spec pattern
      const pzRows = document.querySelectorAll('.product-detail-specs .spec-item, .product-features tr');
      pzRows.forEach(row => {
        const key = row.querySelector('.spec-label, td:first-child')?.textContent?.trim();
        const val = row.querySelector('.spec-value, td:last-child')?.textContent?.trim();
        if (key && val) specs[key] = val;
      });

      // Ciceksepeti spec pattern
      const csRows = document.querySelectorAll('.product-specs__item, .product-info__properties tr');
      csRows.forEach(row => {
        const key = row.querySelector('.product-specs__title, .product-info__property-name')?.textContent?.trim();
        const val = row.querySelector('.product-specs__value, .product-info__property-value')?.textContent?.trim();
        if (key && val) specs[key] = val;
      });

      return specs;
    });

    // --- NEW: Variant Extraction ---
    const variants = await page.evaluate(() => {
      const vars: any[] = [];

      // Trendyol Color variants
      const tyColors = document.querySelectorAll('.sl-item');
      tyColors.forEach(item => {
        const title = item.getAttribute('title') || item.querySelector('img')?.getAttribute('alt');
        if (title) {
          vars.push({
            sku: `VAR-${title.replace(/\s+/g, '-').toUpperCase()}`,
            description: title,
            attributes: { "Renk": title },
            price: 0, // Will fallback to main price if 0
            stock: 10
          });
        }
      });

      // Hepsiburada variants
      const hbVariants = document.querySelectorAll('.variant-property-list .variant-item');
      hbVariants.forEach(item => {
        const title = item.getAttribute('title') || item.textContent?.trim();
        if (title) {
          vars.push({
            sku: `VAR-${title.replace(/\s+/g, '-').toUpperCase()}`,
            description: title,
            attributes: { "Seçenek": title },
            price: 0,
            stock: 10
          });
        }
      });

      return vars;
    });

    // --- NEW: Review Extraction ---
    const reviews = await page.evaluate(() => {
      const items: string[] = [];

      // Trendyol reviews
      document.querySelectorAll('.comment-text').forEach(el => items.push(el.textContent?.trim() || ""));

      // Hepsiburada reviews
      document.querySelectorAll('.review-text').forEach(el => items.push(el.textContent?.trim() || ""));

      // N11 reviews
      document.querySelectorAll('.commentText').forEach(el => items.push(el.textContent?.trim() || ""));

      return items.filter(t => t.length > 10).slice(0, 50); // Take top 50 significant reviews
    });

    const rating = await page.evaluate(() => {
      const el = document.querySelector('.rating-score, .hermes-RatingSummary-actual-score, .ratingScore');
      return el ? parseFloat(el.textContent?.trim() || "0") : 0;
    });

    // Fallback cleanup
    if (name.includes("|")) {
      name = name.split("|")[0].trim();
    }

    if (!barcode) {
      // Trendyol: ...-p-123456
      const tyMatch = url.match(/-p-(\d+)/);
      if (tyMatch) barcode = `TY${tyMatch[1]}`;
    }

    if (!name && !price) {
      logger.warn("scraper.failed_content", { url });
      return null;
    }

    return {
      name,
      description,
      category: jsonLdData?.category || jsonLdData?.brand?.name || ogTitle,
      price,
      currency,
      stock: 50, // Default stock
      barcode: barcode || `IMP${Date.now()}`,
      imageUrl,
      attributes,
      variants: variants.length > 0 ? variants : undefined,
      reviews: reviews.length > 0 ? reviews : undefined,
      rating: rating > 0 ? rating : undefined,
      originalUrl: url,
    };
  } catch (error) {
    logger.error("scraper.failed", { url, error });
    return null;
  } finally {
    if (page) await page.close();
  }
}

function extractMetaContent(html: string, property: string): string | null {
  const regex = new RegExp(`<meta\\s+(?:property|name)=["']${property}["']\\s+content=["']([^"']+)["']`, "i");
  const match = html.match(regex);
  return match ? match[1] : null;
}

function extractJsonLd(html: string): any | null {
  try {
    const regex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        if (data["@type"] === "Product") return data;
        if (Array.isArray(data)) {
          const product = data.find((item) => item["@type"] === "Product");
          if (product) return product;
        }
      } catch (e) { }
    }
  } catch (e) {
    return null;
  }
  return null;
}
