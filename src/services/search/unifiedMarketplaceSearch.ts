import { logger } from "../../logger.js";
import { ChatEntity } from "../../chatbot/types.js";
import { ok, fail, Result } from "../../utils/result.js";
import { SearchResultItem } from "./types.js";
import { MarketplaceName } from "../marketplace/types.js";
import { SearchProviderFactory } from "../providers/SearchProviderFactory.js";

export type SearchResult = SearchResultItem & {
  source: "api" | "scraper" | "adapter";
  winningSeller?: string;
};

// Simple in-memory cache for search results
const searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Unified marketplace search combining Google CSE and web scraping.
 * Refactored to use SearchProviderFactory for robust execution.
 */
export async function unifiedMarketplaceSearch(
  query: string,
  entities?: ChatEntity,
  options: { deep?: boolean } = {},
): Promise<Result<SearchResult[]>> {
  const { deep = false } = options;
  try {
    const sanitizedQuery = sanitizeQuery(query);

    // Check cache
    const cached = searchCache.get(sanitizedQuery);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.info("unified_search.cache_hit", { query: sanitizedQuery });
      return ok(cached.results);
    }

    logger.info("unified_search.start", { query, sanitizedQuery });
    const processedQuery = sanitizedQuery;

    // 1. Fetch from SearchProvider (Live or Mock)
    const provider = SearchProviderFactory.getProvider();
    const productCards = await provider.search(processedQuery);

    const providerResults: SearchResult[] = productCards.map(card => ({
        marketplace: (card.marketplace || "Genel Web") as MarketplaceName,
        title: card.name,
        price: card.price,
        currency: card.currency,
        url: card.url || "",
        imageUrl: card.imageUrl || card.image,
        image: card.imageUrl || card.image,
        source: "adapter" as const,
        inStock: (card.stock || 0) > 0,
        stockCount: card.stock
    }));

    // Deduplicate by URL
    const products = Array.from(new Map(
        providerResults.map(r => [r.url ? (new URL(r.url).origin + new URL(r.url).pathname) : r.title, r])
    ).values());

    // FALLBACK: If no products found in marketplaces (e.g. "iPhone 17"), try general web search
    if (products.length === 0) {
      try {
        const { googleSearchService } = await import("./googleSearchService.js");
        if (googleSearchService.isConfigured()) {
          logger.info("unified_search.fallback_to_general_web", { query: processedQuery });
          const generalResults = await googleSearchService.findProduct(processedQuery, false);

          if (generalResults.length > 0) {
            const mapped = generalResults.map((c) => ({
              title: c.title,
              price: c.price ?? 0,
              currency: c.currency ?? "TL",
              url: c.link,
              image: c.image || "",
              marketplace: c.displayLink as MarketplaceName || "Genel Web" as MarketplaceName,
              source: "api" as const,
              inStock: true,
            }));
            products.push(...mapped);
          }
        }
      } catch (e) {
        logger.error("unified_search.fallback_failed", { error: e });
      }
    }

    const deduped = products;
    const filtered = filterAccessories(deduped, processedQuery, entities);

    // Sort to ensure best items are picked in getUniqueBySite
    filtered.sort((a, b) => {
      if (a.price > 0 && b.price === 0) return -1;
      if (a.price === 0 && b.price > 0) return 1;
      return 0;
    });

    const uniqueBySite = getUniqueBySite(filtered);

    // 3. AI Semantic Filter (only if many results)
    if (uniqueBySite.length > 3) {
      try {
        const { filterSearchResults } = await import("../ai/geminiClient.js");
        const relevantIndices = await filterSearchResults(processedQuery, uniqueBySite);
        const semanticFiltered = uniqueBySite.filter((_, i) => relevantIndices.includes(i));
        if (semanticFiltered.length > 0) {
          // Wrap success result
          return ok(semanticFiltered);
        }
      } catch (e) {
        logger.warn("unified_search.semantic_filter_error", { error: e });
      }
    }

    const finalResults = uniqueBySite;

    // 4. Enrich with Competition Data (Phase 3)
    try {
      const { competitionService } = await import("../pricing/competitionService.js");
      for (const r of finalResults) {
        if (r.barcode) {
          const analysis = await competitionService.analyzeCompetition(r.barcode);
          if (analysis) {
            r.buyBoxPrice = analysis.lowestPrice;
            r.competitorCount = analysis.competitorCount;
            r.isWinningBuyBox = analysis.isWinningBuyBox;
            r.marketPosition = analysis.marketPosition;
            r.winningSeller = analysis.winningSeller;
          }
        }
      }
    } catch (e) {
      logger.warn("unified_search.enrich_competition_failed", { error: e });
    }

    // 5. AI Normalization & Deduplication (Phase 4)
    try {
      const { marketplaceNormalizer } = await import("../ai/marketplaceNormalizer.js");
      // Deduplicate across sites
      const consolidated = await marketplaceNormalizer.deduplicateResults(finalResults as any);

      // Normalize only top 3 results to save time
      const normalized = await Promise.all(
        consolidated.slice(0, 3).map((r) => marketplaceNormalizer.normalizeProduct(r as any)),
      );

      // Replace top 3, keep rest
      const resultItems = [...normalized, ...consolidated.slice(normalized.length)];
      finalResults.length = 0;
      finalResults.push(...(resultItems as any));
    } catch (e) {
      logger.warn("unified_search.normalization_failed", { error: e });
    }

    // 6. Deep Scrape for Barcodes (Phase 8) + Competition Data (Phase 10)
    // Enrichment depth depends on 'deep' flag
    const enrichmentLimit = deep ? 10 : 3;
    const resultsToEnrich = finalResults.filter(r => r.url).slice(0, enrichmentLimit);
    
    if (resultsToEnrich.length > 0) {
      logger.info("unified_search.enrichment_start", { count: resultsToEnrich.length, deep });
      await Promise.all(resultsToEnrich.map(async (r) => {
        try {
          const { scrapeProductDetails } = await import("../webScraperService.js");
          const details = await scrapeProductDetails(r.url, r.marketplace);
          
          if (details.barcode) r.barcode = details.barcode;
          if (details.brand && !r.brand) r.brand = details.brand;
          if (details.description && !r.description) r.description = details.description;
          if (details.competitors) {
            r.attributes = { ...r.attributes, competitors: details.competitors };
            // Also update competition fields if not present
            if (details.competitors.length > 0) {
              r.competitorCount = details.competitors.length;
              r.buyBoxPrice = Math.min(...details.competitors.map(c => c.price));
            }
          }
          
          // Strategy 2: UPCitemdb fallback (for international products)
          const { findBarcode } = await import("../barcodeLookupService.js");
          const lookupResult = await findBarcode(r.title, r.image);
          if (lookupResult?.barcode) {
            r.barcode = lookupResult.barcode;
            if (lookupResult.product?.brand && !r.brand) r.brand = lookupResult.product.brand;
            logger.info("unified_search.barcode_from_upcitemdb", { 
              marketplace: r.marketplace, 
              barcode: r.barcode, 
              source: lookupResult.source 
            });
          }
        } catch (e) {
          logger.warn("unified_search.enrichment_failed", { site: r.marketplace, error: e });
        }
      }));
    }

    // Cache the results before returning
    if (finalResults.length > 0) {
      searchCache.set(sanitizedQuery, {
        results: finalResults,
        timestamp: Date.now(),
      });
    }

    return ok(finalResults);
  } catch (err: unknown) {
    logger.error("unified_search.failed", { query, err });
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
}

/**
 * Filter out accessories if query doesn't explicitly ask for them.
 */
function filterAccessories(
  products: SearchResult[],
  query: string,
  entities?: ChatEntity,
): SearchResult[] {
  const ACCESSORY_KEYWORDS = [
    "kılıf",
    "kilif",
    "case",
    "kapak",
    "cover",
    "ekran koruyucu",
    "screen protector",
    "cam",
    "glass",
    "şarj",
    "sarj",
    "charger",
    "kablo",
    "cable",
    "kulaklık",
    "kulaklik",
    "headphone",
    "aksesuar",
    "accessory",
    "şeffaf",
    "silikon",
    "uyumlu",
    "for",
    "için",
    "film",
    "lens",
    "koruyucu",
    "adaptör",
    "askı",
  ];

  const lowerQuery = query.toLowerCase();

  // Check AI classification first
  const isMainProductQuery = entities?.queryProductType === "MAIN_PRODUCT";
  const isAccessoryQuery =
    entities?.queryProductType === "ACCESSORY" ||
    ACCESSORY_KEYWORDS.some((k) => lowerQuery.includes(k));

  if (isAccessoryQuery && !isMainProductQuery) {
    return products; // User wants accessories, don't filter
  }

  // Identify average price to catch suspicious "cheap" accessories if we are looking for a main product
  let avgPrice = 0;
  const productsWithPrice = products.filter((p) => p.price > 0);
  if (productsWithPrice.length > 0) {
    avgPrice = productsWithPrice.reduce((sum, p) => sum + p.price, 0) / productsWithPrice.length;
  }

  // Filter out products with accessory keywords in title
  return products.filter((p) => {
    const titleLower = p.title.toLowerCase();

    // If searching for a main product (like iPhone), filter out anything with accessory keywords
    // IF the price is significantly lower than average (e.g., < 20% of avg price)
    // This prevents filtering out "iPhone + Kılıf Hediyeli" (expensive) while catching "iPhone Kılıfı" (cheap)
    const hasKeyword = ACCESSORY_KEYWORDS.some((k) => titleLower.includes(k));

    if (hasKeyword) {
      // If it's very cheap compared to average, it's definitely an accessory
      if (avgPrice > 1000 && p.price < avgPrice / 10) {
        return false;
      }

      // If we are VERY sure it's a main product query, be stricter
      if (isMainProductQuery) {
        // BUT don't filter if it contains "hediyeli" or "paketi" (likely a bundle)
        if (
          titleLower.includes("hediyeli") ||
          titleLower.includes("paketi") ||
          titleLower.includes("seti")
        ) {
          return true;
        }
        return false;
      }
    }

    return true;
  });
}

/**
 * Get one result per site, prioritizing the best quality data.
 * If we have fewer than 5 results total, take additional items from the same sites.
 */
function getUniqueBySite(products: SearchResult[]): SearchResult[] {
  const siteGroups = new Map<string, SearchResult[]>();

  for (const p of products) {
    if (!siteGroups.has(p.marketplace)) {
      siteGroups.set(p.marketplace, []);
    }
    siteGroups.get(p.marketplace)!.push(p);
  }

  // Sort each group by quality (price > 0, hasImage, title matching relevance)
  for (const group of siteGroups.values()) {
    group.sort((a, b) => {
      // Priority 1: Price > 0
      if (a.price > 0 && b.price === 0) return -1;
      if (a.price === 0 && b.price > 0) return 1;

      // Priority 2: Has image
      if (!!a.image && !b.image) return -1;
      if (!a.image && !!b.image) return 1;

      // Priority 3: Price value (cheaper first if both > 0)
      if (a.price > 0 && b.price > 0) return a.price - b.price;

      // Priority 4: Title length (usually more descriptive = better)
      return b.title.length - a.title.length;
    });
  }

  const result: SearchResult[] = [];
  const sites = Array.from(siteGroups.keys());

  // Phase 1: Take 1st item from each site
  for (const site of sites) {
    const group = siteGroups.get(site)!;
    if (group.length > 0) {
      result.push(group[0]);
    }
  }

  // Phase 2: If we still have < 5 results, take more items from available sites (up to 3 per site total)
  let index = 1;
  while (result.length < 6 && index < 4) {
    let addedInThisRound = false;
    for (const site of sites) {
      if (result.length >= 6) break;
      const group = siteGroups.get(site)!;
      if (group.length > index) {
        result.push(group[index]);
        addedInThisRound = true;
      }
    }
    if (!addedInThisRound) break;
    index++;
  }

  return result.slice(0, 6) as SearchResult[];
}

function sanitizeQuery(query: string): string {
  const stopWords = [
    "bul",
    "getir",
    "ara",
    "listele",
    "fiyatı",
    "fiyatlari",
    "fiyati",
    "fiyatları",
    "lazım",
    "istiyorum",
    "bak",
    "göster",
    "lütfen",
    "varmı",
    "hangisi",
  ];
  let q = query.toLowerCase();

  stopWords.forEach((word) => {
    const reg = new RegExp(`\\b${word}\\b`, "gu");
    q = q.replace(reg, "");
  });

  return q.replace(/\s+/g, " ").trim();
}
