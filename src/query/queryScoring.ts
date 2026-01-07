import { search } from "fast-fuzzy";
import { ExtractedAttributes, ScoredResult, SearchResultItem } from "../types/searchTypes.js";
import { normalizeText } from "./queryUtils.js";

/**
 * Computes similarity between two strings (0..1)
 */
export function computeTitleSimilarity(a: string, b: string): number {
    const results = search(a, [b], { returnMatchData: true });
    if (results.length === 0) return 0;
    return results[0].score;
}

/**
 * High-level scoring for a single search result
 */
export function scoreItem(extracted: ExtractedAttributes, item: SearchResultItem): ScoredResult {
    const itemTitle = normalizeText(item.title);
    const primaryQuery = extracted.tokens?.join(" ") || "";

    const titleSimilarity = computeTitleSimilarity(itemTitle, normalizeText(primaryQuery));

    // Feature matches
    const storageMatch = extracted.storageGB ? itemTitle.includes(`${extracted.storageGB}gb`) : true;
    const colorMatch = extracted.color ? itemTitle.includes(normalizeText(extracted.color)) : true;
    const modelMatch = extracted.model ? itemTitle.includes(normalizeText(extracted.model)) : true;
    const guaranteeMatch = extracted.guaranteeType === "turkiye"
        ? (itemTitle.includes("turkiye") || itemTitle.includes("tr garantili"))
        : true;
    const pricePresent = !!item.priceText || !!item.price;

    // Weighted Scoring
    let score = (titleSimilarity * 55) +
        (modelMatch ? 15 : 0) +
        (storageMatch ? 12 : 0) +
        (colorMatch ? 8 : 0) +
        (guaranteeMatch ? 5 : 0) +
        (pricePresent ? 5 : 0);

    // Business Logic Constraints
    if (!modelMatch) score = Math.min(score, 40);
    if (extracted.storageGB && !storageMatch) score = Math.min(score, 60);
    if (extracted.color && !colorMatch) score = Math.min(score, 75);

    return {
        ...item,
        score: Math.round(score),
        match: {
            titleSimilarity,
            storageMatch,
            colorMatch,
            modelMatch,
            guaranteeMatch,
            pricePresent
        }
    };
}
