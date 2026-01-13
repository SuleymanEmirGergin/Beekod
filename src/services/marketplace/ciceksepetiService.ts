import { logger } from "../../logger.js";

export interface CSCategory {
    categoryId: number;
    categoryName: string;
    parentCategoryId?: number;
    subCategories?: CSCategory[];
}

interface CSConfig {
    apiKey: string;
    baseUrl: string;
}

// In-memory cache
let categoryCache: CSCategory[] | null = null;
let categoryFlatMap: Map<number, CSCategory> = new Map();
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

class CiceksepetiService {
    private config: CSConfig;

    constructor() {
        this.config = {
            apiKey: process.env.CICEKSEPETI_API_KEY || "",
            baseUrl: process.env.CICEKSEPETI_API_BASE_URL || "https://apis.ciceksepeti.com"
        };
    }

    isConfigured(): boolean {
        return !!this.config.apiKey;
    }

    private getHeaders(): Record<string, string> {
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "x-api-key": this.config.apiKey
        };
    }

    private async makeRequest(url: string): Promise<any> {
        try {
            logger.info("ciceksepeti.api_request", { url });

            const response = await fetch(url, {
                method: "GET",
                headers: this.getHeaders()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Çiçeksepeti API error: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            logger.error("ciceksepeti.api_request.failed", { url, error });
            throw error;
        }
    }

    // =============================================================
    // CATEGORY ENDPOINTS
    // =============================================================

    /**
     * Gets all categories
     * URL: GET /api/v1/Categories
     */
    async getCategories(forceRefresh = false): Promise<CSCategory[]> {
        if (!this.isConfigured()) {
            throw new Error("Çiçeksepeti API credentials not configured");
        }

        // Check cache
        if (!forceRefresh && categoryCache && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
            logger.debug("ciceksepeti.categories.cache_hit");
            return categoryCache;
        }

        try {
            const url = `${this.config.baseUrl}/api/v1/Categories`;
            const data = await this.makeRequest(url);

            // CS returns { categories: [...] } or array directly
            const categories: CSCategory[] = data.categories || data.response || data || [];

            // Update cache
            categoryCache = categories;
            cacheTimestamp = Date.now();

            // Build flat map
            categoryFlatMap.clear();
            this.buildFlatMap(categories);

            logger.info("ciceksepeti.categories.success", { count: categories.length });

            return categories;
        } catch (error) {
            logger.error("ciceksepeti.categories.failed", { error });
            throw error;
        }
    }

    private buildFlatMap(categories: CSCategory[]) {
        for (const cat of categories) {
            categoryFlatMap.set(cat.categoryId, cat);
            if (cat.subCategories && cat.subCategories.length > 0) {
                this.buildFlatMap(cat.subCategories);
            }
        }
    }

    /**
     * Gets a category by ID
     */
    getCategoryById(id: number): CSCategory | undefined {
        return categoryFlatMap.get(id);
    }

    /**
     * Searches categories by name
     */
    searchCategories(query: string): CSCategory[] {
        const results: CSCategory[] = [];
        const lowerQuery = query.toLowerCase();

        categoryFlatMap.forEach((cat) => {
            if (cat.categoryName.toLowerCase().includes(lowerQuery)) {
                results.push(cat);
            }
        });

        return results.slice(0, 50);
    }

    /**
     * Gets category attributes
     * URL: GET /api/v1/Categories/{categoryId}/attributes
     */
    async getCategoryAttributes(categoryId: number | string): Promise<any> {
        if (!this.isConfigured()) {
            throw new Error("Çiçeksepeti API credentials not configured");
        }

        const url = `${this.config.baseUrl}/api/v1/Categories/${categoryId}/attributes`;
        return this.makeRequest(url);
    }

    // =============================================================
    // PRODUCT ENDPOINTS
    // =============================================================

    /**
     * Gets products
     * URL: GET /api/v1/Products
     */
    async getProducts(params?: { page?: number; pageSize?: number }): Promise<any> {
        if (!this.isConfigured()) {
            throw new Error("Çiçeksepeti API credentials not configured");
        }

        const url = new URL(`${this.config.baseUrl}/api/v1/Products`);
        if (params?.page !== undefined) url.searchParams.append("page", String(params.page));
        if (params?.pageSize !== undefined) url.searchParams.append("pageSize", String(params.pageSize));

        return this.makeRequest(url.toString());
    }

    /**
     * Gets batch status
     * URL: GET /api/v1/Products/batch-status/{batchId}
     */
    async getBatchStatus(batchId: string): Promise<any> {
        if (!this.isConfigured()) {
            throw new Error("Çiçeksepeti API credentials not configured");
        }

        const url = `${this.config.baseUrl}/api/v1/Products/batch-status/${batchId}`;
        return this.makeRequest(url);
    }

    /**
     * Gets API key prefix for reference
     */
    getApiKeyPrefix(): string {
        return this.config.apiKey.substring(0, 8) + "...";
    }
}

export const ciceksepetiService = new CiceksepetiService();
