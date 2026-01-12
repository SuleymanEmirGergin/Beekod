
import { logger } from "../logger.js";
import { scrapeMarketplace } from "./webScraperService.js";

// --- Types ---

export type ProductType = "core" | "accessory" | "unknown";
export type MatchQuality = "good" | "maybe" | "bad";
export type Availability = "in_stock" | "out_of_stock" | "unknown";

export interface MarketplaceOffer {
    marketplace: "trendyol" | "hepsiburada" | "pazarama" | "n11" | "ciceksepeti" | "pttavm";
    title: string;
    price: number;
    shipping_cost: number | "unknown";
    total_cost: number;
    seller?: string;
    rating?: string;
    reviews?: string;
    product_url: string;
    image_url: string;
    variant_info?: string;
    availability: Availability;
    product_type: ProductType;
    match_quality: MatchQuality;
    notes?: string;
}

export interface SearchResultJSON {
    query: string;
    currency: string;
    accessory_intent: boolean;
    search_passes: string[];
    offers: MarketplaceOffer[];
    best_offer?: MarketplaceOffer;
    blocked_marketplaces: { marketplace: string; reason: string }[];
}

export interface ImportPayloadJSON {
    action: "IMPORT_PRODUCT";
    source_marketplace: string;
    source_url: string;
    product_type: ProductType;
    product: {
        title: string;
        brand: string;
        model: string;
        description: string;
        price: number;
        currency: string;
        images: string[];
        category_path: string[];
        attributes: Record<string, string>;
        sku: string;
        barcode: string;
    };
    store_integration: {
        target: "shopify" | "woocommerce" | "custom_api" | "csv";
        mapping_notes: string;
        category_mapping: Record<string, string>;
    };
}

// --- Constants & Config ---

const MARKETPLACES = [
    { id: "Trendyol", domain: "trendyol.com" },
    { id: "Hepsiburada", domain: "hepsiburada.com" },
    { id: "N11", domain: "n11.com" },
    { id: "Ciceksepeti", domain: "ciceksepeti.com" },
    { id: "Pazarama", domain: "pazarama.com" },
    { id: "PttAVM", domain: "pttavm.com" },
] as const;

const ACCESSORY_KEYWORDS = [
    // Kılıf / Kapak
    "kılıf", "kapak", "case", "cover", "silikon", "bumper", "koruma", "koruyucu kılıf",
    // Ekran koruyucu
    "ekran koruyucu", "kırılmaz cam", "cam film", "temperli cam", "nano cam", "mat cam",
    "screen protector", "tempered glass",
    // Şarj / Kablo
    "şarj aleti", "adaptör", "kablo", "type-c", "lightning", "magsafe", "usb", "pd charger",
    "powerbank", "taşınabilir şarj", "kablosuz şarj",
    // Yedek parça
    "yedek parça", "batarya", "pil", "ekran değişim", "arka cam",
    // Tutucu / Stand
    "stand", "tutucu", "tripod", "araç içi", "araç kiti", "araç tutucu", "telefon tutucu",
    "masa üstü", "stant",
    // Lens / Kamera
    "kamera koruyucu", "lens koruyucu", "kamera camı", "lens",
    // Kaplama / Sticker
    "sticker", "skin", "kaplama", "dekor",
    // Taşıma
    "çanta", "pouch", "kılıflı", "taşıma kabı",
    // Bakım
    "bakım seti", "temizleme", "temizlik",
    // Genel
    "aksesuar", "accessory", "set", "paket", "kit",
    // Kulaklık / Audio (bazen aksesuar olarak gelir)
    "kulaklık", "earbuds", "pods",
];

// === Ürün tipi belirleme için CORE kelimeler (aksesuar DEĞİL) ===
const CORE_PRODUCT_KEYWORDS = [
    // Telefon modelleri
    "iphone", "samsung galaxy", "xiaomi", "redmi", "poco", "oppo", "vivo", "huawei",
    "realme", "oneplus", "google pixel", "nothing phone", "asus rog", "sony xperia",
    // GB/TB depolama (telefon/tablet genellikle)
    "256gb", "512gb", "128gb", "64gb", "1tb",
    // Telefon özellikleri
    "cep telefonu", "akıllı telefon", "smartphone", "telefon",
    // Tablet
    "tablet", "ipad",
    // Laptop
    "laptop", "notebook", "macbook",
];

// --- Logic Implementation ---

/**
 * Main Entry Point: Search for a product query across 6 marketplaces with "Agent" logic.
 */
export async function searchMarketplaceAgent(baseQuery: string): Promise<SearchResultJSON> {
    const accessoryIntent = detectAccessoryIntent(baseQuery);
    const results: SearchResultJSON = {
        query: baseQuery,
        currency: "TRY",
        accessory_intent: accessoryIntent,
        search_passes: [],
        offers: [],
        blocked_marketplaces: [],
        best_offer: undefined
    };

    logger.info("agent.search_start", { query: baseQuery, accessoryIntent });

    // Execute search for each marketplace in parallel (with concurrency limit ideally, but simple parallel for now)
    const promises = MARKETPLACES.map(mp => searchSingleMarketplace(mp.id, baseQuery, accessoryIntent));

    const marketplaceResults = await Promise.all(promises);

    // Aggregate results
    let allOffers: MarketplaceOffer[] = [];
    marketplaceResults.forEach(res => {
        if (res.offers.length > 0) {
            allOffers.push(...res.offers);
        }
        if (res.blocked) {
            results.blocked_marketplaces.push({ marketplace: res.marketplace, reason: res.blockedReason || "unknown" });
        }
        if (res.passes.length > 0) {
            res.passes.forEach(p => {
                if (!results.search_passes.includes(p)) results.search_passes.push(p);
            });
        }
    });

    // Final global filtering & best offer selection
    results.offers = allOffers;
    results.best_offer = selectBestOffer(allOffers, accessoryIntent);

    return results;
}

async function searchSingleMarketplace(
    marketplaceId: string,
    baseQuery: string,
    accessoryIntent: boolean
): Promise<{ marketplace: string, offers: MarketplaceOffer[], blocked: boolean, blockedReason?: string, passes: string[] }> {

    const outcome = {
        marketplace: marketplaceId,
        offers: [] as MarketplaceOffer[],
        blocked: false,
        blockedReason: undefined as string | undefined,
        passes: [] as string[]
    };

    // --- PASS 1: Broad Search ---
    outcome.passes.push("PASS-1");
    let query1 = baseQuery;
    let rawResults = await scrapeMarketplace(marketplaceId, query1, { maxResults: 15 });

    if (!rawResults || rawResults.length === 0) {
        // Retry logic or just fail? The prompt says "Her pazaryerinde aramayı tek seferde bırakma."
        // If Pass 1 fails to find *core* results, go to Pass 2.
    }

    let classifiedOffers = classifyResults(rawResults, marketplaceId, accessoryIntent);
    let hasCore = classifiedOffers.some(o => o.product_type === "core");

    // --- PASS 2: Negative / Exact Search ---
    if (!accessoryIntent && !hasCore) {
        outcome.passes.push("PASS-2");
        // Try exact match or negative keywords
        // Ideally we check if marketplace supports negative (most don't strictly via broad search, but we can try)
        // Strat 1: Exact phrase
        const query2_exact = `"${baseQuery}"`;
        let rawResults2 = await scrapeMarketplace(marketplaceId, query2_exact, { maxResults: 15 });

        if (rawResults2.length === 0) {
            // Strat 2: Negative keywords (appended string) - risky if engine strictly matches
            // Skipping explicit negative keyword string query as scraping usually relies on search box which might not support "-keyword" well on all sites.
            // Instead, rely on Post-Filter (which is what we do in classifyResults anyway).
            // But let's try a "cleaner" query if base had noise.
        } else {
            const classified2 = classifyResults(rawResults2, marketplaceId, accessoryIntent);
            if (classified2.some(o => o.product_type === "core")) {
                classifiedOffers = [...classifiedOffers, ...classified2];
                hasCore = true;
            }
        }
    }

    // --- PASS 3: Simplify / Broaden ---
    if (!hasCore) {
        outcome.passes.push("PASS-3");
        // Remove common noise words, simplify query
        const query3 = simplifyQuery(baseQuery);
        if (query3 !== baseQuery) {
            let rawResults3 = await scrapeMarketplace(marketplaceId, query3, { maxResults: 20 });
            const classified3 = classifyResults(rawResults3, marketplaceId, accessoryIntent);
            classifiedOffers = [...classifiedOffers, ...classified3];
        }
    }

    // Deduplicate by URL
    const uniqueMap = new Map<string, MarketplaceOffer>();
    classifiedOffers.forEach(o => uniqueMap.set(o.product_url, o));
    outcome.offers = Array.from(uniqueMap.values());

    return outcome;
}

// --- Helpers ---

function detectAccessoryIntent(query: string): boolean {
    const q = query.toLowerCase();
    return ACCESSORY_KEYWORDS.some(kw => q.includes(kw));
}

function classifyResults(
    rawItems: any[],
    marketplace: string,
    accessoryIntent: boolean
): MarketplaceOffer[] {
    return rawItems.map(item => {
        const titleLower = (item.title || "").toLowerCase();

        // Product Type Determination - MORE AGGRESSIVE FILTERING
        let type: ProductType = "unknown";

        // Check if title contains accessory keywords
        const hasAccessoryKw = ACCESSORY_KEYWORDS.some(kw => titleLower.includes(kw.toLowerCase()));

        // Check if title contains core product keywords
        const hasCoreKw = CORE_PRODUCT_KEYWORDS.some(kw => titleLower.includes(kw.toLowerCase()));

        // Additional check: If title contains "için" (for) + device name, it's likely an accessory
        // e.g., "iPhone 17 için kılıf" vs "iPhone 17"
        const hasForPattern = /\b(için|for|uyumlu|compatible)\b/i.test(item.title || "");

        if (accessoryIntent) {
            // User wants accessories
            type = hasAccessoryKw ? "core" : "unknown";
        } else {
            // User wants core product (e.g., the actual phone)
            if (hasAccessoryKw || hasForPattern) {
                type = "accessory"; // Definitely an accessory
            } else if (hasCoreKw) {
                type = "core"; // Has core product keywords, likely the actual product
            } else {
                type = "unknown"; // Can't determine - mark as unknown for safety
            }
        }

        // Match Quality
        let quality: MatchQuality = "good";
        if (!accessoryIntent && type === "accessory") quality = "bad";
        if (type === "unknown") quality = "maybe";

        // Total Cost (Price + Shipping)
        // Scraper might not return shipping. Default to 0 or unknown.
        const price = item.price || 0;
        const shipping = item.shipping_cost || 0;
        const total = price + shipping;

        // Cast to MarketplaceOffer
        return {
            marketplace: marketplace as any,
            title: item.title,
            price: price,
            shipping_cost: shipping > 0 ? shipping : "unknown",
            total_cost: total,
            seller: item.seller,
            rating: item.rating,
            reviews: item.reviews,
            product_url: item.url,
            image_url: item.image,
            availability: "in_stock", // Scraper usually returns in-stock items
            product_type: type,
            match_quality: quality
        };
    });
}

function selectBestOffer(offers: MarketplaceOffer[], accessoryIntent: boolean): MarketplaceOffer | undefined {
    // Filter candidates
    const candidates = offers.filter(o =>
        o.price > 0 &&
        o.match_quality !== "bad" &&
        (accessoryIntent ? true : o.product_type !== "accessory")
    );

    if (candidates.length === 0) return undefined;

    // Sort by Total Cost
    candidates.sort((a, b) => a.total_cost - b.total_cost);

    return candidates[0];
}

function simplifyQuery(query: string): string {
    // Basic simplification: remove last word if > 2 words? 
    // Or remove specific attributes like "128 gb".
    // For now, let's just return query to avoid over-engineering without NLP.
    // User logic: "remove 'set', 'paket', capacity/color"
    let q = query.toLowerCase();
    q = q.replace(/\b(set|paket|kit)\b/g, "");
    q = q.replace(/\b\d+\s?gb\b/g, ""); // remove capacity
    return q.trim();
}

/**
 * Generates the import payload for the store.
 */
export async function generateImportPayload(offer: MarketplaceOffer): Promise<ImportPayloadJSON> {
    // Logic to fetch details (description, specs) from the page if not already in offer.
    // Since scraper might only get listing info, we might need a "details" fetch.

    // For now, construct from offer + placeholder for deep details.
    // In a real agent, we would visit `offer.product_url` and extract descriptions.

    return {
        action: "IMPORT_PRODUCT",
        source_marketplace: offer.marketplace,
        source_url: offer.product_url,
        product_type: offer.product_type,
        product: {
            title: offer.title,
            brand: "Unknown", // extraction needed
            model: "Unknown",
            description: "Imported via Beekod Agent",
            price: offer.price,
            currency: "TRY",
            images: [offer.image_url],
            category_path: [],
            attributes: {},
            sku: "",
            barcode: ""
        },
        store_integration: {
            target: "shopify", // Default
            mapping_notes: "Auto-generated",
            category_mapping: {}
        }
    };
}
