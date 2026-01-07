import api from './api';

export interface ImportPreviewResponse {
    title: string;
    price?: number;
    currency: string;
    image?: string;
    snippet?: string;
    site: string;
    sourceUrl: string;
    category?: string;
}

export interface ImportProductParams {
    sourceUrl: string;
    title: string;
    category?: string;
    price?: number;
    currency?: string;
    stock?: number;
    barcode?: string;
    description?: string;
    imageUrl?: string;
}

export interface ProductPreview {
    title: string;
    price?: number;
    currency?: string;
    image?: string;
    snippet?: string;
    site?: string;
    sourceUrl?: string;
    category?: string;
    attributes?: Record<string, string>;
    prefillAttributes?: Record<string, string>;
}

export const getImportPreview = async (url: string): Promise<ImportPreviewResponse> => {
    const response = await api.post('/product-import/preview', { url });
    return response.data.data;
};

export const getProductPreview = async (url: string): Promise<ProductPreview> => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${API_URL}/product-import/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    });

    if (!response.ok) {
        throw new Error('Failed to fetch preview');
    }

    const data = await response.json();
    return data.data; // Assuming standardization wrapper returns { success: true, data: ... }
};

export const importProduct = async (params: ImportProductParams) => {
    const response = await api.post('/product-import/import', params);
    return response.data.data;
};
