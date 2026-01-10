
import api from './api';

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
    availability: "in_stock" | "out_of_stock" | "unknown";
    product_type: "core" | "accessory" | "unknown";
    match_quality: "good" | "maybe" | "bad";
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
    product_type: "core" | "accessory" | "unknown";
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
        target: string;
        mapping_notes: string;
        category_mapping: Record<string, string>;
    };
}

// Kept for backward compatibility if needed, but mapped
export interface DiscoveryProduct {
    title: string;
    sourceUrl: string;
    snippet?: string;
    thumbnail?: string;
}

export interface CanonicalProduct {
    name: string;
    description: string;
    brand?: string;
    model?: string;
    gtin?: string;
    images: string[];
    attributes?: Record<string, any>;
}

export interface AIListingDraft {
    title: string;
    description: string;
    features?: string[];
}


export const searchDiscoveryProducts = async (query: string): Promise<SearchResultJSON> => {
    // Note: Calling the new agent route /api/marketplaces/discovery/search
    const { data } = await api.get('/marketplaces/discovery/search', { params: { q: query } });
    return data;
};

export const prepareImportPayload = async (offer: MarketplaceOffer): Promise<ImportPayloadJSON> => {
    const { data } = await api.post('/marketplaces/import/prepare', { offer });
    return data;
};

// Legacy or auxiliary methods
export const extractProductDetails = async (url: string): Promise<any> => {
    const { data } = await api.post('/marketplace/discovery/extract', { url });
    return data.product;
};

export const generateAIListing = async (productData: any, marketplace: string): Promise<any> => {
    const { data } = await api.post('/marketplace/ai/generate-listing', { productData, marketplace });
    return data.listing;
};

export const publishProductToMarketplaces = async (payload: any): Promise<{ jobIds: string[] }> => {
    const { data } = await api.post('/marketplace/products/publish', payload);
    return data;
};

export const getJobStatus = async (jobId: string): Promise<any> => {
    const { data } = await api.get(`/marketplace/jobs/${jobId}`);
    return data;
};
