/**
 * Barcode Lookup Service
 * Integrates with UPCitemdb (free 100 queries/day) and ZXing for visual barcode detection
 */

import { logger } from "../logger.js";

// ============================================
// UPCitemdb API (Free: 100 queries/day)
// ============================================

interface UPCItemDBProduct {
    ean: string;
    title: string;
    description?: string;
    upc?: string;
    brand?: string;
    model?: string;
    color?: string;
    size?: string;
    dimension?: string;
    weight?: string;
    category?: string;
    images?: string[];
    offers?: Array<{
        merchant: string;
        domain: string;
        title: string;
        currency: string;
        list_price: string;
        price: number;
        shipping: string;
        condition: string;
        availability: string;
        link: string;
        updated_t: number;
    }>;
}

interface UPCItemDBResponse {
    code: string;
    total: number;
    offset: number;
    items: UPCItemDBProduct[];
}

/**
 * Search for product barcode using UPCitemdb free API
 * @param query Product name to search for
 * @returns Barcode and product info if found
 */
export async function searchBarcodeByName(query: string): Promise<{
    barcode?: string;
    product?: UPCItemDBProduct;
    source: "upcitemdb";
} | null> {
    try {
        // UPCitemdb Trial API - no key required, 100 queries/day limit
        const encodedQuery = encodeURIComponent(query);
        const url = `https://api.upcitemdb.com/prod/trial/search?s=${encodedQuery}&match_mode=0&type=product`;
        
        logger.info("barcode_lookup.search", { query, url });
        
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        });
        
        if (!response.ok) {
            if (response.status === 429) {
                logger.warn("barcode_lookup.rate_limited", { query });
                return null; // Daily limit reached
            }
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json() as UPCItemDBResponse;
        
        if (data.items && data.items.length > 0) {
            const product = data.items[0];
            logger.info("barcode_lookup.found", { 
                query, 
                barcode: product.ean, 
                title: product.title 
            });
            
            return {
                barcode: product.ean || product.upc,
                product,
                source: "upcitemdb",
            };
        }
        
        logger.info("barcode_lookup.not_found", { query });
        return null;
        
    } catch (error) {
        logger.error("barcode_lookup.error", { query, error: String(error) });
        return null;
    }
}

/**
 * Lookup product info by barcode using UPCitemdb free API
 * @param barcode EAN/UPC barcode to lookup
 * @returns Product info if found
 */
export async function lookupBarcode(barcode: string): Promise<UPCItemDBProduct | null> {
    try {
        const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;
        
        logger.info("barcode_lookup.lookup", { barcode, url });
        
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });
        
        if (!response.ok) {
            if (response.status === 429) {
                logger.warn("barcode_lookup.rate_limited", { barcode });
                return null;
            }
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json() as UPCItemDBResponse;
        
        if (data.items && data.items.length > 0) {
            logger.info("barcode_lookup.lookup_found", { barcode, title: data.items[0].title });
            return data.items[0];
        }
        
        return null;
        
    } catch (error) {
        logger.error("barcode_lookup.lookup_error", { barcode, error: String(error) });
        return null;
    }
}

// ============================================
// ZXing Visual Barcode Detection (Free, Open Source)
// ============================================

/**
 * Extract barcode from image using ZXing online decoder
 * @param imageUrl URL of the image to scan
 * @returns Decoded barcode if found
 */
export async function extractBarcodeFromImage(imageUrl: string): Promise<string | null> {
    try {
        // Use ZXing online decoder API
        const encodedUrl = encodeURIComponent(imageUrl);
        const zxingUrl = `https://zxing.org/w/decode?u=${encodedUrl}`;
        
        logger.info("barcode_visual.scan", { imageUrl });
        
        const response = await fetch(zxingUrl, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        });
        
        if (!response.ok) {
            throw new Error(`ZXing error: ${response.status}`);
        }
        
        const html = await response.text();
        
        // Parse the result from ZXing HTML response
        // The barcode is usually in a <pre> tag with class "result"
        const resultMatch = html.match(/<pre[^>]*>([^<]+)<\/pre>/);
        if (resultMatch) {
            const barcode = resultMatch[1].trim();
            // Check if it looks like a valid barcode (digits only, 8-14 chars)
            if (/^\d{8,14}$/.test(barcode)) {
                logger.info("barcode_visual.found", { imageUrl, barcode });
                return barcode;
            }
        }
        
        logger.info("barcode_visual.not_found", { imageUrl });
        return null;
        
    } catch (error) {
        logger.error("barcode_visual.error", { imageUrl, error: String(error) });
        return null;
    }
}

// ============================================
// Unified Barcode Service
// ============================================

export interface BarcodeResult {
    barcode: string;
    source: "upcitemdb" | "visual" | "scraper";
    product?: {
        title?: string;
        brand?: string;
        description?: string;
        image?: string;
    };
}

/**
 * Try multiple methods to find a barcode for a product
 * @param productName Name of the product to search
 * @param imageUrl Optional product image URL for visual scanning
 * @returns Barcode result if found
 */
export async function findBarcode(
    productName: string,
    imageUrl?: string
): Promise<BarcodeResult | null> {
    
    // Strategy 1: Search by product name in UPCitemdb
    const dbResult = await searchBarcodeByName(productName);
    if (dbResult?.barcode) {
        return {
            barcode: dbResult.barcode,
            source: "upcitemdb",
            product: {
                title: dbResult.product?.title,
                brand: dbResult.product?.brand,
                description: dbResult.product?.description,
                image: dbResult.product?.images?.[0],
            },
        };
    }
    
    // Strategy 2: Visual barcode detection from image
    if (imageUrl) {
        const visualBarcode = await extractBarcodeFromImage(imageUrl);
        if (visualBarcode) {
            return {
                barcode: visualBarcode,
                source: "visual",
            };
        }
    }
    
    return null;
}

export const barcodeLookupService = {
    searchBarcodeByName,
    lookupBarcode,
    extractBarcodeFromImage,
    findBarcode,
};
