
export type ProviderError =
    | { kind: "BLOCKED"; message: string; marketplace?: string }
    | { kind: "RATE_LIMITED"; message: string; retryAfterMs?: number; marketplace?: string }
    | { kind: "TIMEOUT"; message: string; marketplace?: string }
    | { kind: "NOT_FOUND"; message: string; marketplace?: string }
    | { kind: "UNKNOWN"; message: string; marketplace?: string; cause?: unknown };

export interface SearchQuery {
    text: string;
    filters?: {
        minPrice?: number;
        maxPrice?: number;
        category?: string;
    };
    limit?: number;
}

export interface SearchResult {
    marketplace: string;
    title: string;
    price: number;
    currency: string;
    url: string;
    imageUrl?: string;
    vendor?: string;
    rating?: number;
    raw?: unknown;
}

export interface SearchResponse {
    query: string;
    results: SearchResult[];
    errors: ProviderError[];
}
