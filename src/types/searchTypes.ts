export type TargetSite = "google" | "trendyol" | "n11" | "hepsiburada" | "ciceksepeti" | "pttavm" | "pazarama";

export type QueryIntent = "price" | "product_lookup" | "spec" | "compare" | "unknown";

export interface ExtractedAttributes {
    brand?: string;          // Apple
    model?: string;          // iPhone 17
    series?: string;         // Pro / Pro Max / Plus / Mini
    storageGB?: number;      // 128/256/512/1024
    color?: string;          // Ada Çayı / Siyah / Koyu Mavi ...
    guaranteeType?: "turkiye" | "ithalatci" | "unknown";
    condition?: "new" | "used" | "unknown";
    categoryHint?: string;   // iOS Cep Telefonları
    tokens?: string[];       // normalize edilmiş tokenlar
}

export interface QueryPlan {
    normalizedQuery: string;
    intent: QueryIntent;
    extracted: ExtractedAttributes;
    primary: string;
    alternates: string[];
    siteSpecific: Array<{ site: TargetSite; query: string }>;
    confidence: number; // 0..1 (sorgu çıkarım güveni)
    fallbackOrder: string[]; // denenme sırası (query string listesi)
}

export interface SearchResultItem {
    title: string;
    url: string;
    priceText?: string;      // "129.347 TL" vs
    site?: TargetSite;
    snippet?: string;
    price?: number;
    currency?: string;
    image?: string;
}

export interface ScoredResult extends SearchResultItem {
    score: number;           // 0..100
    match: {
        titleSimilarity: number;      // 0..1
        storageMatch: boolean;
        colorMatch: boolean;
        modelMatch: boolean;
        guaranteeMatch: boolean;
        pricePresent: boolean;
    };
}
