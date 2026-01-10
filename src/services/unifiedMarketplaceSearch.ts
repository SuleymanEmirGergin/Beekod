// REMOVED: import { getMarketplaceProviders } from "../marketplaces/index.js";
import { scrapeMarketplace, ScrapedProduct } from "./webScraperService.js";
import { logger } from "../logger.js";
import { ChatEntity } from "../chatbot/types.js";

export type SearchResult = {
    title: string;
    price: number;
    currency: string;
    url: string;
    image?: string;
    site: string;
    source: "api" | "scraper";
    inStock: boolean;
};

/**
 * Unified marketplace search combining Google CSE and web scraping.
 * Uses CSE for broad coverage and scraping for high-confidence site data.
 */
export async function unifiedMarketplaceSearch(query: string, entities?: ChatEntity): Promise<SearchResult[]> {
    const sanitizedQuery = sanitizeQuery(query);
    logger.info("unified_search.start", { query, sanitizedQuery });
    query = sanitizedQuery;

    const targetMarketplaces = [
        { name: "Trendyol", site: "trendyol.com" },
        { name: "Hepsiburada", site: "hepsiburada.com" },
        { name: "N11", site: "n11.com" },
        { name: "Ciceksepeti", site: "ciceksepeti.com" },
        { name: "Pazarama", site: "pazarama.com" },
        { name: "PttAVM", site: "pttavm.com" }
    ];

    // Process in chunks of 3 to avoid rate limits/timeouts
    const resultsPerSite: SearchResult[][] = [];
    const chunkSize = 3;

    for (let i = 0; i < targetMarketplaces.length; i += chunkSize) {
        const chunk = targetMarketplaces.slice(i, i + chunkSize);

        const chunkResults = await Promise.all(chunk.map(async (mp) => {
            try {
                const { googleSearchService } = await import("./googleSearchService.js");
                if (!googleSearchService.isConfigured()) return [];

                // Targeted search: "query site:domain"
                const siteQuery = `${query} site:${mp.site}`;
                const candidates = await googleSearchService.findProduct(siteQuery);

                let results: SearchResult[] = [];
                if (candidates.length > 0) {
                    // Debug log to check image presence
                    if (!candidates[0].image && candidates[0].title) {
                        logger.debug("unified_search.first_candidate_missing_image", {
                            site: mp.name,
                            title: candidates[0].title.substring(0, 30)
                        });
                    }

                    results = candidates.map(c => ({
                        title: c.title,
                        price: c.price ?? 0,
                        currency: c.currency ?? "TL",
                        url: c.link,
                        image: c.image || "",
                        site: mp.name,
                        source: "api" as const,
                        inStock: true
                    }));
                }

                // Fallback to scraper if Google fails OR returns a price of 0 OR has no image
                const hasValidPrice = results.some(r => r.price > 0);
                const hasImage = results.some(r => !!r.image);

                if (!hasValidPrice || !hasImage) {
                    // logger.debug("unified_search.incomplete_data_triggering_scraper", { site: mp.name, hasValidPrice, hasImage });
                    const scrapeRes = await scrapeMarketplace(mp.name, query, {
                        maxResults: 1,
                        timeout: 15000 // Increased timeout for better success rate
                    }).catch(() => []);

                    if (scrapeRes.length > 0) {
                        return scrapeRes.map(r => ({ ...r, site: mp.name, source: "scraper" as const }));
                    }
                }
                return results;
            } catch (err) {
                logger.warn("unified_search.site_failed", { site: mp.name, error: err });
                return [];
            }
        }));
        resultsPerSite.push(...chunkResults);
    }

    const products = resultsPerSite.flat();
    const urlMap = new Map<string, SearchResult>();

    products.forEach(r => {
        try {
            const normalizedUrl = new URL(r.url).origin + new URL(r.url).pathname;
            const existing = urlMap.get(normalizedUrl);

            if (!existing) {
                urlMap.set(normalizedUrl, r);
            } else {
                // Priority: 
                // 1. Result with image
                // 2. Scraper results 
                if (r.image && !existing.image) {
                    urlMap.set(normalizedUrl, r);
                } else if (r.source === "scraper" && existing.source === "api") {
                    urlMap.set(normalizedUrl, r);
                }
            }
        } catch {
            urlMap.set(r.url, r);
        }
    });

    const deduped = Array.from(urlMap.values());
    const filtered = filterAccessories(deduped, query, entities);

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
            const { filterSearchResults } = await import("./geminiClient.js");
            const relevantIndices = await filterSearchResults(query, uniqueBySite);
            const semanticFiltered = uniqueBySite.filter((_, i) => relevantIndices.includes(i));
            if (semanticFiltered.length > 0) return semanticFiltered;
        } catch (e) {
            logger.warn("unified_search.semantic_filter_error", { error: e });
        }
    }

    return uniqueBySite;
}

/**
 * Filter out accessories if query doesn't explicitly ask for them.
 */
function filterAccessories(products: SearchResult[], query: string, entities?: ChatEntity): SearchResult[] {
    const ACCESSORY_KEYWORDS = [
        "kılıf", "kilif", "case", "kapak", "cover",
        "ekran koruyucu", "screen protector", "cam", "glass",
        "şarj", "sarj", "charger", "kablo", "cable",
        "kulaklık", "kulaklik", "headphone",
        "aksesuar", "accessory",
        "şeffaf", "silikon", "uyumlu", "for", "için", "film",
        "lens", "koruyucu", "adaptör", "askı"
    ];

    const lowerQuery = query.toLowerCase();

    // Check AI classification first
    const isMainProductQuery = entities?.queryProductType === "MAIN_PRODUCT";
    const isAccessoryQuery = entities?.queryProductType === "ACCESSORY" ||
        ACCESSORY_KEYWORDS.some(k => lowerQuery.includes(k));

    if (isAccessoryQuery && !isMainProductQuery) {
        return products; // User wants accessories, don't filter
    }

    // Identify average price to catch suspicious "cheap" accessories if we are looking for a main product
    let avgPrice = 0;
    const productsWithPrice = products.filter(p => p.price > 0);
    if (productsWithPrice.length > 0) {
        avgPrice = productsWithPrice.reduce((sum, p) => sum + p.price, 0) / productsWithPrice.length;
    }

    // Filter out products with accessory keywords in title
    return products.filter(p => {
        const titleLower = p.title.toLowerCase();

        // If searching for a main product (like iPhone), filter out anything with accessory keywords
        // IF the price is significantly lower than average (e.g., < 20% of avg price)
        // This prevents filtering out "iPhone + Kılıf Hediyeli" (expensive) while catching "iPhone Kılıfı" (cheap)
        const hasKeyword = ACCESSORY_KEYWORDS.some(k => titleLower.includes(k));

        if (hasKeyword) {
            // If it's very cheap compared to average, it's definitely an accessory
            if (avgPrice > 1000 && p.price < avgPrice / 10) {
                return false;
            }

            // If we are VERY sure it's a main product query, be stricter
            if (isMainProductQuery) {
                // BUT don't filter if it contains "hediyeli" or "paketi" (likely a bundle)
                if (titleLower.includes("hediyeli") || titleLower.includes("paketi") || titleLower.includes("seti")) {
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
        if (!siteGroups.has(p.site)) {
            siteGroups.set(p.site, []);
        }
        siteGroups.get(p.site)!.push(p);
    }

    // Sort each group by quality (price > 0, hasImage, title matching relevance)
    for (const [site, group] of siteGroups.entries()) {
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

    return result.slice(0, 6);
}

function sanitizeQuery(query: string): string {
    const stopWords = ["bul", "getir", "ara", "listele", "fiyatı", "fiyatlari", "fiyati", "fiyatları", "lazım", "istiyorum", "bak", "göster", "lütfen", "varmı", "hangisi"];
    let q = query.toLowerCase();

    stopWords.forEach(word => {
        const reg = new RegExp(`\\b${word}\\b`, "gu");
        q = q.replace(reg, "");
    });

    return q.replace(/\s+/g, " ").trim();
}
