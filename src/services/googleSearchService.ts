import { logger } from "../logger.js";

export interface CandidateProduct {
    title: string;
    link: string;
    displayLink: string;
    snippet: string;
    image?: string;
    category?: string;
    price?: number;
    currency?: string;
    site?: string;
    attributes?: Record<string, string>;
    _rawPagemap?: any;
}

export interface GoogleSearchConfig {
    apiKey: string;
    cx: string;
}

const ALLOWED_SITES = [
    "trendyol.com",
    "hepsiburada.com",
    "n11.com",
    "ciceksepeti.com",
    "pazarama.com",
    "pttavm.com",
];

function withSiteRestriction(query: string): string {
    const q = (query || "").trim();
    if (!q) return q;

    if (q.startsWith("http://") || q.startsWith("https://")) {
        try {
            const urlObj = new URL(q);
            const host = urlObj.hostname.replace(/^www\./, "");
            const keywords = urlObj.pathname.replace(/[\/\-_]/g, " ").trim();
            if (keywords && ALLOWED_SITES.some(s => host.includes(s))) {
                return `${keywords} site:${host}`;
            }
        } catch (e) { }
        return q;
    }

    const siteFilter = ALLOWED_SITES.map((s) => `site:${s}`).join(" OR ");
    return `${q} (${siteFilter})`;
}

export class GoogleSearchService {
    private getConfig(): GoogleSearchConfig {
        return {
            apiKey: process.env.GOOGLE_CSE_API_KEY || "",
            cx: process.env.GOOGLE_CSE_CX || "",
        };
    }

    isConfigured(): boolean {
        const config = this.getConfig();
        return !!(config.apiKey && config.cx);
    }

    private getSiteNameFromHost(host: string): string {
        const parts = host.toLowerCase().split('.');
        if (parts.length < 2) return host;
        const knownSites = ['trendyol', 'hepsiburada', 'n11', 'ciceksepeti', 'pazarama', 'pttavm'];
        for (const s of knownSites) { if (parts.includes(s)) return s; }
        const mainPart = parts[parts.length - 2];
        if (mainPart === 'com' || mainPart === 'net' || mainPart === 'org') { return parts[parts.length - 3] || mainPart; }
        return mainPart;
    }

    async findProduct(query: string, restrictSites: boolean = true): Promise<CandidateProduct[]> {
        if (!this.isConfigured()) {
            logger.warn("google_search.not_configured");
            return [];
        }

        const config = this.getConfig();

        try {
            const finalQuery = restrictSites ? withSiteRestriction(query) : query;
            const url = new URL("https://www.googleapis.com/customsearch/v1");
            url.searchParams.append("key", config.apiKey);
            url.searchParams.append("cx", config.cx);
            url.searchParams.append("q", finalQuery);
            url.searchParams.append("num", "10");
            url.searchParams.append("fields", "items(title,link,snippet,pagemap),searchInformation");

            const response = await fetch(url.toString());
            if (!response.ok) throw new Error(`Google Search API failed: ${response.statusText}`);

            const data = await response.json();
            if (!data.items) return [];

            let results = data.items.map((item: any) => {
                const host = new URL(item.link).hostname;
                const pInfo = this.extractPriceFromPageMap(item.pagemap);
                const finalP = pInfo?.price || this.extractPriceFromSnippet(item.snippet || "", query);

                // Improved image selection
                const image = item.pagemap?.cse_image?.[0]?.src ||
                    item.pagemap?.cse_thumbnail?.[0]?.src ||
                    this.extractImageFromAllMetatags(item.pagemap?.metatags);

                return {
                    title: item.title,
                    link: item.link,
                    displayLink: host,
                    site: this.getSiteNameFromHost(host),
                    snippet: item.snippet || "",
                    image: image,
                    price: finalP || undefined,
                    currency: pInfo?.currency || "TRY",
                    _rawPagemap: item.pagemap
                };
            }).filter((p: CandidateProduct) => {
                // Only enforce site restrictions if requested
                if (restrictSites) {
                    const isAllowed = ALLOWED_SITES.some(s => p.displayLink.includes(s));
                    if (!isAllowed) return false;
                }

                // Filter out category/search/listing pages
                const isProduct = this.isProductUrl(p.link, p.site || "");
                if (!isProduct) {
                    logger.debug("google_search.skipped_non_product_link", { url: p.link, site: p.site || "unknown" });
                    return false;
                }
                return true;
            });

            // --- NEW: Fast Fetch Enrichment ---
            // For top 5 results missing price/image, do a quick fetch
            const candidatesToEnrich = (results as CandidateProduct[]).slice(0, 5).filter(r => !r.image || !r.price);
            if (candidatesToEnrich.length > 0) {
                logger.info("google_search.fast_enrichment_start", { count: candidatesToEnrich.length });
                await Promise.all(candidatesToEnrich.map(async (res: CandidateProduct) => {
                    try {
                        const enriched = await this.extractProductDetails(res.link);
                        if (enriched.image && !res.image) res.image = enriched.image;
                        if (enriched.price && !res.price) res.price = enriched.price;
                        if (enriched.title && (!res.title || res.title.length < 10)) res.title = enriched.title;
                    } catch (e) {
                        logger.warn("google_search.enrichment_failed", { url: res.link, error: e });
                    }
                }));
            }

            return results;

        } catch (error) {
            logger.error("google_search.failed", { query, error });
            return [];
        }
    }

    private extractImageFromAllMetatags(metatags: any[]): string | undefined {
        if (!Array.isArray(metatags)) return undefined;
        for (const m of metatags) {
            const img = m["og:image"] || m["twitter:image"] || m["image"] || m["thumbnail"];
            if (img) return img;
        }
        return undefined;
    }

    private parsePriceNumber(v: any): number | null {
        if (v == null) return null;
        const s = String(v).replace(/\s/g, "").replace("₺", "").replace("TL", "").replace(/\./g, "").replace(",", ".");
        const n = Number(s);
        return (Number.isFinite(n) && n > 0) ? n : null;
    }

    private extractPriceFromPageMap(pagemap: any) {
        if (!pagemap) return null;

        // 1. Try offer blocks
        for (const key of ["offer", "offers", "aggregateoffer", "product", "hproduct"]) {
            if (Array.isArray(pagemap[key])) {
                for (const it of pagemap[key]) {
                    const p = this.parsePriceNumber(it.lowprice) ?? this.parsePriceNumber(it.price) ?? this.parsePriceNumber(it.highprice);
                    if (p !== null) return { price: p, currency: it.pricecurrency || "TRY" };
                }
            }
        }

        // 2. Try all metatags
        if (Array.isArray(pagemap.metatags)) {
            for (const m of pagemap.metatags) {
                const p = this.parsePriceNumber(m["product:price:amount"]) ??
                    this.parsePriceNumber(m["og:price:amount"]) ??
                    this.parsePriceNumber(m["price"]) ??
                    this.parsePriceNumber(m["offer:price"]) ??
                    this.parsePriceNumber(m["twitter:data1"]) ??
                    this.parsePriceNumber(m["ecommerce:total_value"]);
                if (p !== null) return { price: p, currency: m["product:price:currency"] || m["og:price:currency"] || m["currency"] || "TRY" };
            }
        }
        return null;
    }

    private extractPriceFromSnippet(snip: string, q: string): number | undefined {
        if (!snip) return undefined;

        // Detection of installments (e.g. "5.000 TL x 12")
        const lowerSnip = snip.toLowerCase();
        const isInstallment = /taksit|aylık|ayda|x\s*\d{1,2}/i.test(lowerSnip);

        // Exclude model numbers like "17" from "iPhone 17"
        const match = snip.match(/(?:fiyat[ı:]?\s*|₺|TL)\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i) ||
            snip.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(?:TL|₺)/i);

        if (match && match[1]) {
            const p = this.parsePriceNumber(match[1]);
            if (!p) return undefined;

            // If we found "taksit" nearby, be very careful
            if (isInstallment && p < 10000 && /iphone|samsung|telefon|laptop/i.test(q)) {
                logger.debug("google_search.excluded_suspected_installment", { price: p, snippet: snip });
                return undefined;
            }

            const qNums = (q.match(/\d+/g) || []) as string[];
            if (qNums.includes(String(Math.floor(p))) && p < 1000) return undefined;
            if (/iphone|samsung|telefon|laptop/i.test(q) && p < 1000) return undefined;

            return p;
        }
        return undefined;
    }

    private isProductUrl(url: string, site: string): boolean {
        const u = url.toLowerCase();

        // General search/listing patterns to exclude
        if (u.includes("/arama?") || u.includes("/search?") || u.includes("/sr?") || u.includes("/ara?")) return false;
        if (u.includes("/kategori/") || u.includes("/listeleme/") || u.includes("/vitrin/")) return false;

        // Site specific product patterns
        switch (site) {
            case "trendyol":
                return /-p-\d+/.test(u);
            case "hepsiburada":
                return /-p-hbv[a-z0-9]+/i.test(u) || u.endsWith(".html");
            case "n11":
                return /-p\d+/.test(u);
            case "ciceksepeti":
                return /-kc\d+/.test(u) || /-v\d+/.test(u);
            case "pazarama":
                return /-p-\d+/.test(u) || /-p-s\d+/.test(u);
            case "pttavm":
                return /-p-\d+/.test(u);
            default:
                return true; // Fallback
        }
    }


    async extractProductDetails(url: string): Promise<Partial<CandidateProduct>> {
        try {
            const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" } });
            if (!resp.ok) {
                logger.warn("google_search.enrichment_blocked", { url, status: resp.status });
                return {};
            }
            const html = await resp.text();

            const getMeta = (p: string) => {
                const r = new RegExp(`<meta\\s+[^>]*?(?:property|name)=["']${p}["'][^>]*?content=["']([^"']+)["']`, "i");
                const rRev = new RegExp(`<meta\\s+[^>]*?content=["']([^"']+)["'][^>]*?(?:property|name)=["']${p}["']`, "i");
                return html.match(r)?.[1] || html.match(rRev)?.[1];
            };

            // 1. Meta tag extraction (Image & Price)
            const image = getMeta("og:image") || getMeta("twitter:image");
            let price = Number(getMeta("product:price:amount") || getMeta("og:price:amount") || getMeta("price")) || undefined;
            const currency = getMeta("product:price:currency") || getMeta("og:price:currency") || "TRY";

            // 2. Marketplace Specific Regex (Fast & High Trust)
            const host = new URL(url).hostname;
            if (!price) {
                if (host.includes("trendyol.com")) {
                    // Try to find selling price in JSON-LD or state
                    const tyPrice = html.match(/"sellingPrice":\s*\{\s*"amount":\s*(\d+(?:\.\d+)?)/i) ||
                        html.match(/"salePrice":\s*(\d+(?:\.\d+)?)/i) ||
                        html.match(/"price":\s*(\d+(?:\.\d+)?)/i);
                    if (tyPrice) price = parseFloat(tyPrice[1]);
                } else if (host.includes("hepsiburada.com")) {
                    const hbPrice = html.match(/"price":\s*(\d+(?:\.\d+)?)/i) ||
                        html.match(/"customerPrice":\s*(\d+(?:\.\d+)?)/i);
                    if (hbPrice) price = parseFloat(hbPrice[1]);
                } else if (host.includes("ciceksepeti.com")) {
                    const csPrice = html.match(/"unitPrice":\s*(\d+(?:\.\d+)?)/i) ||
                        html.match(/"price":\s*(\d+(?:\.\d+)?)/i);
                    if (csPrice) price = parseFloat(csPrice[1]);
                }
            }

            // 3. More generic JSON patterns
            if (!price || price < 10) { // Small numbers are suspicious
                const genericPrice = html.match(/"priceValue":\s*"?(\d+(?:\.\d+)?)"?/i) ||
                    html.match(/"amount":\s*"?(\d+(?:\.\d+)?)"?/i);
                if (genericPrice) {
                    const val = parseFloat(genericPrice[1]);
                    if (val > 10) price = val;
                }
            }

            // 4. Image Fallback from JSON-LD or raw tags
            let finalImage = image;
            if (!finalImage) {
                const imgMatch = html.match(/"image":\s*"(https:\/\/[^"]+)"/i);
                if (imgMatch) finalImage = imgMatch[1];
            }

            return {
                title: html.match(/<title>([^<]+)<\/title>/i)?.[1],
                link: url,
                displayLink: host,
                image: finalImage,
                price,
                currency
            };
        } catch (e) {
            return this.recoverProductDetailsFromApi(url);
        }
    }

    private async recoverProductDetailsFromApi(url: string): Promise<Partial<CandidateProduct>> {
        try {
            const res = await this.findProduct(url);
            return res.find(r => r.link === url) || res[0] || { link: url };
        } catch { return { link: url }; }
    }
}

export const googleSearchService = new GoogleSearchService();
