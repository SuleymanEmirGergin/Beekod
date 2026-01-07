import { logger } from "../logger.js";

export interface N11Category {
    id: number;
    name: string;
    parentId?: number;
    subCategories?: N11Category[];
}

interface N11Config {
    apiKey: string;
    secretKey: string;
    baseUrl: string;
}

// In-memory cache
let categoryCache: N11Category[] | null = null;
let categoryFlatMap: Map<number, N11Category> = new Map();
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

class N11Service {
    private config: N11Config;

    constructor() {
        this.config = {
            apiKey: process.env.N11_API_KEY || "",
            secretKey: process.env.N11_SECRET_KEY || "",
            baseUrl: process.env.N11_API_BASE_URL || "https://api.n11.com"
        };
    }

    isConfigured(): boolean {
        return !!(this.config.apiKey && this.config.secretKey);
    }

    private getAuthHeaders(): Record<string, string> {
        return {
            "Content-Type": "application/json",
            "appkey": this.config.apiKey,
            "appsecret": this.config.secretKey
        };
    }

    /**
     * Fetches the full category tree from N11 API
     * URL: GET https://api.n11.com/cdn/categories
     */
    async getCategoryTree(forceRefresh = false): Promise<N11Category[]> {
        if (!this.isConfigured()) {
            throw new Error("N11 API credentials not configured");
        }

        // Check cache
        if (!forceRefresh && categoryCache && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
            logger.debug("n11.category_tree.cache_hit");
            return categoryCache;
        }

        try {
            const url = `${this.config.baseUrl}/cdn/categories`;

            logger.info("n11.category_tree.fetch", { url });

            const response = await fetch(url, {
                method: "GET",
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`N11 API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            // N11 returns categories array directly or in a wrapper
            const categories: N11Category[] = data.categories || data || [];

            // Update cache
            categoryCache = categories;
            cacheTimestamp = Date.now();

            // Build flat map for quick lookup
            categoryFlatMap.clear();
            this.buildFlatMap(categories);

            logger.info("n11.category_tree.success", { count: categories.length });

            return categories;
        } catch (error) {
            logger.error("n11.category_tree.failed", { error });
            throw error;
        }
    }

    private buildFlatMap(categories: N11Category[]) {
        for (const cat of categories) {
            categoryFlatMap.set(cat.id, cat);
            if (cat.subCategories && cat.subCategories.length > 0) {
                this.buildFlatMap(cat.subCategories);
            }
        }
    }

    /**
     * Gets a category by ID from the cached flat map
     */
    getCategoryById(id: number): N11Category | undefined {
        return categoryFlatMap.get(id);
    }

    /**
     * Searches categories by name
     */
    searchCategories(query: string): N11Category[] {
        const results: N11Category[] = [];
        const lowerQuery = query.toLowerCase();

        categoryFlatMap.forEach((cat) => {
            if (cat.name.toLowerCase().includes(lowerQuery)) {
                results.push(cat);
            }
        });

        return results.slice(0, 50);
    }

    /**
     * Fetches category attributes
     * URL: GET https://api.n11.com/cdn/category/{categoryId}/attribute
     */
    async getCategoryAttributes(categoryId: number): Promise<any> {
        if (!this.isConfigured()) {
            throw new Error("N11 API credentials not configured");
        }

        try {
            const url = `${this.config.baseUrl}/cdn/category/${categoryId}/attribute`;

            logger.info("n11.category_attributes.fetch", { categoryId, url });

            const response = await fetch(url, {
                method: "GET",
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`N11 API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            logger.error("n11.category_attributes.failed", { categoryId, error });
            throw error;
        }
    }

    /**
     * Fetches shipment packages (orders ready for shipment)
     * URL: GET https://api.n11.com/rest/delivery/v1/shipmentPackages
     */
    async getShipmentPackages(params?: { page?: number; size?: number; status?: string }): Promise<any> {
        if (!this.isConfigured()) {
            throw new Error("N11 API credentials not configured");
        }

        try {
            const url = new URL(`${this.config.baseUrl}/rest/delivery/v1/shipmentPackages`);

            // Add query params
            if (params?.page) url.searchParams.append("page", String(params.page));
            if (params?.size) url.searchParams.append("size", String(params.size));
            if (params?.status) url.searchParams.append("status", params.status);

            logger.info("n11.shipment_packages.fetch", { url: url.toString() });

            const response = await fetch(url.toString(), {
                method: "GET",
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`N11 API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            logger.error("n11.shipment_packages.failed", { error });
            throw error;
        }
    }

    /**
     * Queries products
     * URL: GET https://api.n11.com/ms/product-query
     */
    async queryProducts(params?: {
        page?: number;
        size?: number;
        productId?: string;
        barcode?: string;
        status?: string;
    }): Promise<any> {
        if (!this.isConfigured()) {
            throw new Error("N11 API credentials not configured");
        }

        try {
            const url = new URL(`${this.config.baseUrl}/ms/product-query`);

            // Add query params
            if (params?.page) url.searchParams.append("page", String(params.page));
            if (params?.size) url.searchParams.append("size", String(params.size));
            if (params?.productId) url.searchParams.append("productId", params.productId);
            if (params?.barcode) url.searchParams.append("barcode", params.barcode);
            if (params?.status) url.searchParams.append("status", params.status);

            logger.info("n11.product_query.fetch", { url: url.toString() });

            const response = await fetch(url.toString(), {
                method: "GET",
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`N11 API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            logger.error("n11.product_query.failed", { error });
            throw error;
        }
    }

    /**
     * Gets API key for reference
     */
    getApiKey(): string {
        return this.config.apiKey.substring(0, 8) + "...";
    }
}

export const n11Service = new N11Service();
