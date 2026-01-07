import { logger } from "../logger.js";

export interface TrendyolCategory {
    id: number;
    name: string;
    parentId?: number;
    subCategories?: TrendyolCategory[];
}

interface TrendyolConfig {
    sellerId: string;
    apiKey: string;
    apiSecret: string;
    baseUrl: string;
}

// In-memory cache for category tree
let categoryCache: TrendyolCategory[] | null = null;
let categoryFlatMap: Map<number, TrendyolCategory> = new Map();
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

class TrendyolService {
    private config: TrendyolConfig;

    constructor() {
        this.config = {
            sellerId: process.env.TRENDYOL_SELLER_ID || "",
            apiKey: process.env.TRENDYOL_API_KEY || "",
            apiSecret: process.env.TRENDYOL_API_SECRET || "",
            baseUrl: process.env.TRENDYOL_API_BASE_URL || "https://apigw.trendyol.com"
        };
    }

    isConfigured(): boolean {
        return !!(this.config.sellerId && this.config.apiKey && this.config.apiSecret);
    }

    private getAuthHeader(): string {
        const credentials = `${this.config.apiKey}:${this.config.apiSecret}`;
        const base64 = Buffer.from(credentials).toString("base64");
        return `Basic ${base64}`;
    }

    /**
     * Fetches the full category tree from Trendyol API
     * Results are cached for 24 hours
     */
    async getCategoryTree(forceRefresh = false): Promise<TrendyolCategory[]> {
        if (!this.isConfigured()) {
            throw new Error("Trendyol API credentials not configured");
        }

        // Check cache
        if (!forceRefresh && categoryCache && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
            logger.debug("trendyol.category_tree.cache_hit");
            return categoryCache;
        }

        try {
            const url = `${this.config.baseUrl}/integration/product/product-categories`;

            logger.info("trendyol.category_tree.fetch", { url });

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": this.getAuthHeader(),
                    "Content-Type": "application/json",
                    "User-Agent": `${this.config.sellerId} - BeekodIntegration`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Trendyol API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            // Trendyol returns { categories: [...] }
            const categories: TrendyolCategory[] = data.categories || data || [];

            // Update cache
            categoryCache = categories;
            cacheTimestamp = Date.now();

            // Build flat map for quick lookup
            categoryFlatMap.clear();
            this.buildFlatMap(categories);

            logger.info("trendyol.category_tree.success", { count: categories.length });

            return categories;
        } catch (error) {
            logger.error("trendyol.category_tree.failed", { error });
            throw error;
        }
    }

    private buildFlatMap(categories: TrendyolCategory[]) {
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
    getCategoryById(id: number): TrendyolCategory | undefined {
        return categoryFlatMap.get(id);
    }

    /**
     * Searches categories by name (case-insensitive partial match)
     */
    searchCategories(query: string): TrendyolCategory[] {
        const results: TrendyolCategory[] = [];
        const lowerQuery = query.toLowerCase();

        categoryFlatMap.forEach((cat) => {
            if (cat.name.toLowerCase().includes(lowerQuery)) {
                results.push(cat);
            }
        });

        return results.slice(0, 50); // Limit results
    }

    /**
     * Fetches category attributes (required for product listing)
     * URL: /integration/product/product-categories/{categoryId}/attributes
     */
    async getCategoryAttributes(categoryId: number): Promise<any> {
        if (!this.isConfigured()) {
            throw new Error("Trendyol API credentials not configured");
        }

        try {
            // Correct URL per Trendyol API docs
            const url = `${this.config.baseUrl}/integration/product/product-categories/${categoryId}/attributes`;

            logger.info("trendyol.category_attributes.fetch", { categoryId, url });

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": this.getAuthHeader(),
                    "Content-Type": "application/json",
                    "User-Agent": `${this.config.sellerId} - BeekodIntegration`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Trendyol API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            logger.error("trendyol.category_attributes.failed", { categoryId, error });
            throw error;
        }
    }

    /**
     * Fetches attribute values for a specific attribute in a category
     * URL: /integration/product/product-categories/{categoryId}/attributes/{attributeId}/values
     */
    async getAttributeValues(categoryId: number, attributeId: number): Promise<any> {
        if (!this.isConfigured()) {
            throw new Error("Trendyol API credentials not configured");
        }

        try {
            const url = `${this.config.baseUrl}/integration/product/product-categories/${categoryId}/attributes/${attributeId}/values`;

            logger.info("trendyol.attribute_values.fetch", { categoryId, attributeId, url });

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": this.getAuthHeader(),
                    "Content-Type": "application/json",
                    "User-Agent": `${this.config.sellerId} - BeekodIntegration`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Trendyol API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            logger.error("trendyol.attribute_values.failed", { categoryId, attributeId, error });
            throw error;
        }
    }

    // =============================================================
    // PRODUCT ENDPOINTS
    // =============================================================

    /**
     * Filter products
     * URL: /integration/product/sellers/{sellerId}/products
     */
    async getProducts(params?: {
        page?: number;
        size?: number;
        barcode?: string;
        approved?: boolean;
    }): Promise<any> {
        if (!this.isConfigured()) throw new Error("Trendyol API credentials not configured");

        const url = new URL(`${this.config.baseUrl}/integration/product/sellers/${this.config.sellerId}/products`);
        if (params?.page !== undefined) url.searchParams.append("page", String(params.page));
        if (params?.size !== undefined) url.searchParams.append("size", String(params.size));
        if (params?.barcode) url.searchParams.append("barcode", params.barcode);
        if (params?.approved !== undefined) url.searchParams.append("approved", String(params.approved));

        return this.makeRequest(url.toString());
    }

    /**
     * Get unapproved products
     * URL: /integration/product/sellers/{sellerId}/products/unapproved
     */
    async getUnapprovedProducts(params?: { page?: number; size?: number }): Promise<any> {
        if (!this.isConfigured()) throw new Error("Trendyol API credentials not configured");

        const url = new URL(`${this.config.baseUrl}/integration/product/sellers/${this.config.sellerId}/products/unapproved`);
        if (params?.page !== undefined) url.searchParams.append("page", String(params.page));
        if (params?.size !== undefined) url.searchParams.append("size", String(params.size));

        return this.makeRequest(url.toString());
    }

    /**
     * Get single product
     * URL: /integration/product/sellers/{sellerId}/product
     */
    async getProduct(barcode: string): Promise<any> {
        if (!this.isConfigured()) throw new Error("Trendyol API credentials not configured");

        const url = `${this.config.baseUrl}/integration/product/sellers/${this.config.sellerId}/product?barcode=${barcode}`;
        return this.makeRequest(url);
    }

    // =============================================================
    // ORDER ENDPOINTS
    // =============================================================

    /**
     * Get orders
     * URL: /integration/order/sellers/{sellerId}/orders
     */
    async getOrders(params?: {
        status?: string;
        startDate?: number;
        endDate?: number;
        page?: number;
        size?: number;
    }): Promise<any> {
        if (!this.isConfigured()) throw new Error("Trendyol API credentials not configured");

        const url = new URL(`${this.config.baseUrl}/integration/order/sellers/${this.config.sellerId}/orders`);
        if (params?.status) url.searchParams.append("status", params.status);
        if (params?.startDate) url.searchParams.append("startDate", String(params.startDate));
        if (params?.endDate) url.searchParams.append("endDate", String(params.endDate));
        if (params?.page !== undefined) url.searchParams.append("page", String(params.page));
        if (params?.size !== undefined) url.searchParams.append("size", String(params.size));

        return this.makeRequest(url.toString());
    }

    // =============================================================
    // CLAIMS ENDPOINTS
    // =============================================================

    /**
     * Get claims
     * URL: /integration/order/sellers/{sellerId}/claims
     */
    async getClaims(params?: { page?: number; size?: number }): Promise<any> {
        if (!this.isConfigured()) throw new Error("Trendyol API credentials not configured");

        const url = new URL(`${this.config.baseUrl}/integration/order/sellers/${this.config.sellerId}/claims`);
        if (params?.page !== undefined) url.searchParams.append("page", String(params.page));
        if (params?.size !== undefined) url.searchParams.append("size", String(params.size));

        return this.makeRequest(url.toString());
    }

    /**
     * Get claim audits
     * URL: /integration/order/sellers/{sellerId}/claims/items/{claimItemsId}/audit
     */
    async getClaimAudits(claimItemsId: string): Promise<any> {
        if (!this.isConfigured()) throw new Error("Trendyol API credentials not configured");

        const url = `${this.config.baseUrl}/integration/order/sellers/${this.config.sellerId}/claims/items/${claimItemsId}/audit`;
        return this.makeRequest(url);
    }

    /**
     * Get claim issue reasons
     * URL: /integration/order/claim-issue-reasons
     */
    async getClaimIssueReasons(): Promise<any> {
        if (!this.isConfigured()) throw new Error("Trendyol API credentials not configured");

        const url = `${this.config.baseUrl}/integration/order/claim-issue-reasons`;
        return this.makeRequest(url);
    }

    // =============================================================
    // QUESTIONS (QnA) ENDPOINTS
    // =============================================================

    /**
     * Get questions
     * URL: /integration/qna/sellers/{sellerId}/questions/filter
     */
    async getQuestions(params?: {
        startDate?: number;
        endDate?: number;
        status?: string;
        page?: number;
        size?: number;
    }): Promise<any> {
        if (!this.isConfigured()) throw new Error("Trendyol API credentials not configured");

        const url = new URL(`${this.config.baseUrl}/integration/qna/sellers/${this.config.sellerId}/questions/filter`);
        if (params?.startDate) url.searchParams.append("startDate", String(params.startDate));
        if (params?.endDate) url.searchParams.append("endDate", String(params.endDate));
        if (params?.status) url.searchParams.append("status", params.status);
        if (params?.page !== undefined) url.searchParams.append("page", String(params.page));
        if (params?.size !== undefined) url.searchParams.append("size", String(params.size));

        return this.makeRequest(url.toString());
    }

    // =============================================================
    // SUPPLIER & ADDRESS ENDPOINTS
    // =============================================================

    /**
     * Get supplier addresses
     * URL: /integration/sellers/{sellerId}/addresses
     */
    async getSupplierAddresses(): Promise<any> {
        if (!this.isConfigured()) throw new Error("Trendyol API credentials not configured");

        const url = `${this.config.baseUrl}/integration/sellers/${this.config.sellerId}/addresses`;
        return this.makeRequest(url);
    }

    // =============================================================
    // WEBHOOK ENDPOINTS
    // =============================================================

    /**
     * Get webhooks
     * URL: /integration/webhook/sellers/{sellerId}/webhooks
     */
    async getWebhooks(): Promise<any> {
        if (!this.isConfigured()) throw new Error("Trendyol API credentials not configured");

        const url = `${this.config.baseUrl}/integration/webhook/sellers/${this.config.sellerId}/webhooks`;
        return this.makeRequest(url);
    }

    // =============================================================
    // COMPENSATION ENDPOINTS
    // =============================================================

    /**
     * Get compensation tickets
     * URL: /integration/tex/compensation/sellers/{sellerId}/tickets
     */
    async getCompensationTickets(params?: { page?: number; size?: number }): Promise<any> {
        if (!this.isConfigured()) throw new Error("Trendyol API credentials not configured");

        const url = new URL(`${this.config.baseUrl}/integration/tex/compensation/sellers/${this.config.sellerId}/tickets`);
        if (params?.page !== undefined) url.searchParams.append("page", String(params.page));
        if (params?.size !== undefined) url.searchParams.append("size", String(params.size));

        return this.makeRequest(url.toString());
    }

    // =============================================================
    // CARGO & LABEL ENDPOINTS
    // =============================================================

    /**
     * Get common label
     * URL: /integration/sellers/{sellerId}/common-label/{cargoTrackingNumber}
     */
    async getCommonLabel(cargoTrackingNumber: string): Promise<any> {
        if (!this.isConfigured()) throw new Error("Trendyol API credentials not configured");

        const url = `${this.config.baseUrl}/integration/sellers/${this.config.sellerId}/common-label/${cargoTrackingNumber}`;
        return this.makeRequest(url);
    }

    // =============================================================
    // LOCATION ENDPOINTS
    // =============================================================

    /**
     * Get districts by city
     * URL: /integration/member/countries/domestic/TR/cities/{CityCode}/districts
     */
    async getDistricts(cityCode: string): Promise<any> {
        if (!this.isConfigured()) throw new Error("Trendyol API credentials not configured");

        const url = `${this.config.baseUrl}/integration/member/countries/domestic/TR/cities/${cityCode}/districts`;
        return this.makeRequest(url);
    }

    /**
     * Get neighborhoods
     * URL: /integration/member/countries/domestic/TR/cities/{CityCode}/districts/{DistrictCode}/neighborhoods
     */
    async getNeighborhoods(cityCode: string, districtCode: string): Promise<any> {
        if (!this.isConfigured()) throw new Error("Trendyol API credentials not configured");

        const url = `${this.config.baseUrl}/integration/member/countries/domestic/TR/cities/${cityCode}/districts/${districtCode}/neighborhoods`;
        return this.makeRequest(url);
    }

    // =============================================================
    // HELPER METHODS
    // =============================================================

    private async makeRequest(url: string): Promise<any> {
        try {
            logger.info("trendyol.api_request", { url });

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": this.getAuthHeader(),
                    "Content-Type": "application/json",
                    "User-Agent": `${this.config.sellerId} - BeekodIntegration`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Trendyol API error: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            logger.error("trendyol.api_request.failed", { url, error });
            throw error;
        }
    }

    /**
     * Gets seller ID for product operations
     */
    getSellerId(): string {
        return this.config.sellerId;
    }
}

export const trendyolService = new TrendyolService();
