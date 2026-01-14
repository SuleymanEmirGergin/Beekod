import { optimize, pickBestResult } from "../../query/QueryOptimizer.js";
import { optimizeSearchQuery } from "../searchQueryOptimizer.js";

import { unifiedMarketplaceSearch, SearchResult } from "./unifiedMarketplaceSearch.js";
import { ScoredResult, SearchResultItem, TargetSite } from "../../types/searchTypes.js";
import { logger } from "../../logger.js";

/**
 * Executes an optimized search and returns the top results.
 */
export async function runOptimizedSearchList(
  userQuery: string,
  limit: number = 10
): Promise<ScoredResult[]> {
  logger.info("smart_search_list.start", { userQuery, limit });

  // 1. Optimize Query
  const cleanQuery = await optimizeSearchQuery(userQuery);
  logger.info("smart_search.optimized", { cleanQuery });

  // 2. Single Execution (unifiedMarketplaceSearch already handles 3-pronged Google strategy)
  try {
    const result = await unifiedMarketplaceSearch(cleanQuery);
    if (!result.ok) throw result.error;

    const rawResults = result.value;
    const plan = optimize(cleanQuery);
    const seenUrls = new Set<string>();
    const allItems: ScoredResult[] = [];

    const items: SearchResultItem[] = rawResults.map(r => ({
      title: r.title,
      url: r.url,
      priceText: `${r.price} ${r.currency}`,
      price: r.price,
      site: r.marketplace.toLowerCase() as TargetSite,
      image: r.image || r.imageUrl,
      barcode: r.barcode,
      brand: r.brand,
      description: r.description,
      stockCount: r.stockCount,
      inStock: r.inStock || false
    }));

    // Score and deduplicate
    items.forEach(item => {
      if (!seenUrls.has(item.url)) {
        const scored = pickBestResult(plan.extracted, [item]);
        allItems.push(scored);
        seenUrls.add(item.url);
      }
    });

    return allItems.slice(0, limit);
  } catch (error) {
    logger.error("smart_search_list.failed", { query: cleanQuery, error });
    return [];
  }
}

/**
 * Executes an optimized search (Legacy/Single Result Wrapper)
 */
export async function runOptimizedSearch(
  userQuery: string,
  targetSites?: TargetSite[]
): Promise<ScoredResult | null> {
  const results = await runOptimizedSearchList(userQuery, 10);
  if (results.length === 0) return null;
  // valid results are likely sorted by relevance/price from unified search
  return results[0];
}

/** Error classes for Google CSE functionality */
export class CseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CseConfigError";
  }
}

export class CseRequestError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "CseRequestError";
  }
}

/**
 * Restored: Search images using Google CSE
 */
export async function searchImages(query: string, options: { maxResults?: number } = {}): Promise<any[]> {
  logger.info("search.images", { query, options });
  const { googleSearchService } = await import("./googleSearchService.js");
  if (!googleSearchService.isConfigured()) return [];

  // googleSearchService.findProduct handles the API call
  // We could add a specific searchWeb vs searchImages if needed, 
  // but findProduct is currently our main entry.
  return await googleSearchService.findProduct(query);
}

/**
 * Restored: Search web (alias for optimized search or direct)
 */
export async function searchWeb(query: string) {
  return await runOptimizedSearch(query);
}
