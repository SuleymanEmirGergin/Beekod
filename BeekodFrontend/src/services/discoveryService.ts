import api from './api';

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

export const searchDiscoveryProducts = async (query: string): Promise<DiscoveryProduct[]> => {
    const { data } = await api.get('/marketplace/discovery/search', { params: { q: query } });
    return data.results || [];
};

export const extractProductDetails = async (url: string): Promise<CanonicalProduct> => {
    const { data } = await api.post('/marketplace/discovery/extract', { url });
    return data.product;
};

export const generateAIListing = async (productData: CanonicalProduct, marketplace: string): Promise<AIListingDraft> => {
    const { data } = await api.post('/marketplace/ai/generate-listing', { productData, marketplace });
    return data.listing;
};

export const publishProductToMarketplaces = async (payload: {
    productData: CanonicalProduct;
    marketplaces: string[];
    userId: string;
}): Promise<{ jobIds: string[] }> => {
    const { data } = await api.post('/marketplace/products/publish', payload);
    return data;
};

export const getJobStatus = async (jobId: string): Promise<any> => {
    const { data } = await api.get(`/marketplace/jobs/${jobId}`);
    return data;
};
