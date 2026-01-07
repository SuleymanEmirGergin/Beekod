import {
    ExtractedAttributes,
    QueryIntent,
    QueryPlan,
    TargetSite,
    SearchResultItem,
    ScoredResult
} from "../types/searchTypes.js";
import {
    BRAND_ALIASES,
    SERIES_ALIASES,
    COLOR_ALIASES,
    GUARANTEE_ALIASES,
    STORAGE_REGEX,
    IPHONE_MODEL_REGEX,
    SERIES_REGEX,
    PRICE_INTENT_REGEX,
    STOPWORDS_TR,
    SITE_DOMAINS
} from "./queryDictionaries.js";
import { normalizeText, tokenize, dedupeSpaces } from "./queryUtils.js";
import { scoreItem } from "./queryScoring.js";

/**
 * Extracts structured attributes from a raw query string
 */
export function extractAttributes(query: string): ExtractedAttributes {
    const normalized = normalizeText(query);
    const tokens = tokenize(normalized);

    const attrs: ExtractedAttributes = { tokens };

    // 1. Brand Detection
    for (const [brand, aliases] of Object.entries(BRAND_ALIASES)) {
        if (aliases.some(alias => normalized.includes(normalizeText(alias)))) {
            attrs.brand = brand;
            break;
        }
    }

    // 2. Model Detection (iPhone specific for now)
    const modelMatch = normalized.match(IPHONE_MODEL_REGEX);
    if (modelMatch) attrs.model = `iPhone ${modelMatch[1]}`;

    // 3. Series Detection
    const seriesMatch = normalized.match(SERIES_REGEX);
    if (seriesMatch) {
        const found = seriesMatch[1];
        for (const [canonical, aliases] of Object.entries(SERIES_ALIASES)) {
            if (aliases.some(alias => normalizeText(alias) === found) || normalizeText(canonical) === found) {
                attrs.series = canonical;
                break;
            }
        }
    }

    // 4. Storage Detection
    const storageMatch = normalized.match(STORAGE_REGEX);
    if (storageMatch) {
        const val = storageMatch[0].toLowerCase();
        if (val.includes("tb")) {
            attrs.storageGB = 1024;
        } else {
            attrs.storageGB = parseInt(val);
        }
    }

    // 5. Color Detection
    for (const [color, aliases] of Object.entries(COLOR_ALIASES)) {
        if (aliases.some(alias => normalized.includes(normalizeText(alias)))) {
            attrs.color = color;
            break;
        }
    }

    // 6. Guarantee Detection
    if (GUARANTEE_ALIASES.turkiye.some(a => normalized.includes(normalizeText(a)))) attrs.guaranteeType = "turkiye";
    else if (GUARANTEE_ALIASES.ithalatci.some(a => normalized.includes(normalizeText(a)))) attrs.guaranteeType = "ithalatci";

    return attrs;
}

/**
 * Generates a full query plan based on extracted attributes
 */
export function generateQueries(extracted: ExtractedAttributes): QueryPlan {
    const { brand, model, series, storageGB, color } = extracted;

    // Primary Query Construction
    const parts = [brand || "", model || "", series || "", storageGB ? `${storageGB}GB` : "", color || ""];
    const primary = dedupeSpaces(parts.join(" "));

    // Alternates
    const alternates: string[] = [];
    if (color && COLOR_ALIASES[color]) {
        // Try with first alias
        alternates.push(dedupeSpaces([brand || "", model || "", series || "", storageGB ? `${storageGB}GB` : "", COLOR_ALIASES[color][0]].join(" ")));
    }
    if (storageGB) {
        // Space variant: 128GB vs 128 GB
        alternates.push(dedupeSpaces([brand || "", model || "", series || "", `${storageGB} GB`, color || ""].join(" ")));
    }

    // Site Specific
    const siteSpecific: Array<{ site: TargetSite; query: string }> = [];
    const baseSearch = dedupeSpaces([(model || brand || ""), (series || ""), (storageGB ? `"${storageGB}GB"` : ""), (color ? `"${color}"` : "")].join(" "));

    const targets: TargetSite[] = ["trendyol", "hepsiburada", "n11", "ciceksepeti", "pttavm", "pazarama"];
    targets.forEach(site => {
        siteSpecific.push({
            site,
            query: `site:${SITE_DOMAINS[site]} ${baseSearch}`
        });
    });

    // Intent
    let intent: QueryIntent = "product_lookup";
    if (extracted.tokens?.some(t => STOPWORDS_TR.includes(t)) || extracted.tokens?.join(" ").match(PRICE_INTENT_REGEX)) {
        intent = "price";
    }

    const fallbackOrder = [primary, ...alternates, ...siteSpecific.map(s => s.query)];

    return {
        normalizedQuery: extracted.tokens?.join(" ") || "",
        intent,
        extracted,
        primary,
        alternates,
        siteSpecific,
        confidence: (brand && model) ? 0.9 : 0.5,
        fallbackOrder
    };
}

/**
 * Main API: Optimize a raw query
 */
export function optimize(userQuery: string): QueryPlan {
    const extracted = extractAttributes(userQuery);
    return generateQueries(extracted);
}

/**
 * Main API: Pick best result from a list
 */
export function pickBestResult(extracted: ExtractedAttributes, results: SearchResultItem[]): ScoredResult {
    const scored = results.map(r => scoreItem(extracted, r));
    return scored.sort((a, b) => b.score - a.score)[0];
}
