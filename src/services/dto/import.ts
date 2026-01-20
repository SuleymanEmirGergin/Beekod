
export interface ImportDraft {
    title: string;
    description: string;
    price: number;
    currency: string;
    images: string[];
    variants?: ImportVariant[];

    // Auto-fill Suggestions
    categorySuggestion?: CategorySuggestion;
    attributeSuggestions?: Record<string, string>;
    shippingSuggestion?: ShippingSuggestion;

    // Metadata
    sourceUrl: string;
    provider: string; // "trendyol", "hepsiburada", etc.
    needsManualMapping: boolean;
    raw?: unknown;
}

export interface ImportVariant {
    name: string;
    value: string;
    price?: number;
    stock?: number;
    sku?: string;
}

export interface CategorySuggestion {
    id: string; // Local Category ID
    name: string; // Local Category Name
    confidence: number; // 0-1
    source: "mapping" | "ai" | "default";
}

export interface ShippingSuggestion {
    type: "free" | "paid" | "conditional";
    price?: number;
    company?: string;
}
