
import { MarketplaceName } from "../services/marketplace/types.js";

// --- Envelopes ---

export interface ApiResponse<T> {
    data: T;
    traceId: string;
}

export interface ApiErrorResponse {
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
    traceId: string;
}

// --- Search ---

export interface SearchRequest {
    query: string;
    filters?: {
        minPrice?: number;
        maxPrice?: number;
        category?: string;
    };
    limit?: number;
}

export interface SearchResult {
    marketplace: MarketplaceName;
    title: string;
    price: number;
    currency: string;
    url: string;
    imageUrl?: string;
    vendor?: string;
    rating?: number;
    stock: number;
}

export type SearchResponse = ApiResponse<SearchResult[]>;

// --- Import Preview ---

export interface ImportPreviewRequest {
    url: string;
}

export interface ImportDraft {
    title: string;
    description: string;
    price: number;
    currency: string;
    images: string[];
    variants?: any[];
    categorySuggestion?: {
        id: string;
        name: string;
        confidence: number;
    };
    attributes: Record<string, string>;
    sourceUrl: string;
    provider: string;
    needsManualMapping: boolean;
}

export type ImportPreviewResponse = ApiResponse<ImportDraft>;

// --- Import Submit ---

export interface ImportSubmitRequest {
    sourceUrl: string;
    providerId?: "shopify" | "woocommerce";
    // Overrides
    title?: string;
    description?: string;
    price?: number;
    currency?: string;
    category?: string; // Mapped local category
    attributes?: Record<string, string>;
    images?: string[];
}

export interface ImportSubmitResult {
    product: {
        localId: string;
        name: string;
        provider: string;
    };
    editUrl?: string;
}

export type ImportSubmitResponse = ApiResponse<ImportSubmitResult>;

// --- Inventory ---

export interface ProductUpdateRequest {
    barcode: string;
    price?: number;
    stock?: number;
    version: number; // REQUIRED for optimistic locking
}

export interface ProductUpdateResult {
    success: boolean;
    jobId?: string;
    message: string;
}

export type ProductUpdateResponse = ApiResponse<ProductUpdateResult>;
