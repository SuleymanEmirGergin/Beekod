import { logger } from "../logger.js";

export interface HBCategory {
    categoryId: number;
    name: string;
    displayName?: string;
    leaf?: boolean;
    status?: string;
    parentCategoryId?: number;
}

interface HBConfig {
    merchantId: string;
    serviceKey: string;
    baseUrl: string;
    userAgent: string;
}

// In-memory cache
let categoryCache: HBCategory[] | null = null;
let categoryFlatMap: Map<number, HBCategory> = new Map();
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

class HepsiburadaService {
    private config: HBConfig;

    constructor() {
        this.config = {
            merchantId: process.env.HB_MERCHANT_ID || "",
            serviceKey: process.env.HB_SERVICE_KEY || "",
            baseUrl: process.env.HB_API_BASE_URL || "https://mpop-sit.hepsiburada.com",
            userAgent: process.env.HB_USER_AGENT || "BeekodIntegration"
        };
    }

    isConfigured(): boolean {
        return !!(this.config.merchantId && this.config.serviceKey);
    }

    private getAuthHeader(): string {
        const credentials = `${this.config.merchantId}:${this.config.serviceKey}`;
        const base64 = Buffer.from(credentials).toString("base64");
        return `Basic ${base64}`;
    }

    private getHeaders(): Record<string, string> {
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": this.getAuthHeader(),
            "User-Agent": this.config.userAgent
        };
    }

    /**
     * Fetches all categories from Hepsiburada
     * URL: GET /product/api/categories/get-all-categories?leaf=true&status=ACTIVE&available=true&version=1&page=0&size=1000
     */
    async getAllCategories(params?: {
        leaf?: boolean;
        status?: string;
        available?: boolean;
        version?: number;
        page?: number;
        size?: number;
    }, forceRefresh = false): Promise<HBCategory[]> {
        if (!this.isConfigured()) {
            throw new Error("Hepsiburada API credentials not configured");
        }

        // Check cache
        if (!forceRefresh && categoryCache && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
            logger.debug("hepsiburada.categories.cache_hit");
            return categoryCache;
        }

        try {
            const url = new URL(`${this.config.baseUrl}/product/api/categories/get-all-categories`);

            // Default params
            url.searchParams.append("leaf", String(params?.leaf ?? true));
            url.searchParams.append("status", params?.status ?? "ACTIVE");
            url.searchParams.append("available", String(params?.available ?? true));
            url.searchParams.append("version", String(params?.version ?? 1));
            url.searchParams.append("page", String(params?.page ?? 0));
            url.searchParams.append("size", String(params?.size ?? 1000));

            logger.info("hepsiburada.categories.fetch", { url: url.toString() });

            const response = await fetch(url.toString(), {
                method: "GET",
                headers: this.getHeaders()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Hepsiburada API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            // HB returns { data: { categories: [...] } } or similar
            const categories: HBCategory[] = data.data?.categories || data.categories || data.data || data || [];

            // Update cache
            categoryCache = categories;
            cacheTimestamp = Date.now();

            // Build flat map
            categoryFlatMap.clear();
            categories.forEach(cat => categoryFlatMap.set(cat.categoryId, cat));

            logger.info("hepsiburada.categories.success", { count: categories.length });

            return categories;
        } catch (error) {
            logger.error("hepsiburada.categories.failed", { error });
            throw error;
        }
    }

    /**
     * Gets a category by ID
     */
    getCategoryById(id: number): HBCategory | undefined {
        return categoryFlatMap.get(id);
    }

    /**
     * Searches categories by name
     */
    searchCategories(query: string): HBCategory[] {
        const results: HBCategory[] = [];
        const lowerQuery = query.toLowerCase();

        categoryFlatMap.forEach((cat) => {
            const name = cat.displayName || cat.name || "";
            if (name.toLowerCase().includes(lowerQuery)) {
                results.push(cat);
            }
        });

        return results.slice(0, 50);
    }

    /**
     * Fetches category attributes
     * URL: GET /product/api/categories/{categoryId}/attributes?version=2
     */
    async getCategoryAttributes(categoryId: number | string, version = 2): Promise<any> {
        if (!this.isConfigured()) {
            throw new Error("Hepsiburada API credentials not configured");
        }

        try {
            const url = `${this.config.baseUrl}/product/api/categories/${categoryId}/attributes?version=${version}`;

            logger.info("hepsiburada.category_attributes.fetch", { categoryId, url });

            const response = await fetch(url, {
                method: "GET",
                headers: this.getHeaders()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Hepsiburada API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            logger.error("hepsiburada.category_attributes.failed", { categoryId, error });
            throw error;
        }
    }

    /**
     * Fetches attribute values
     * URL: GET /product/api/categories/{categoryId}/attribute/{attributeId}/values?version=5&page=0&size=1000
     */
    async getAttributeValues(
        categoryId: number | string,
        attributeId: number | string,
        params?: { version?: number; page?: number; size?: number }
    ): Promise<any> {
        if (!this.isConfigured()) {
            throw new Error("Hepsiburada API credentials not configured");
        }

        try {
            const url = new URL(`${this.config.baseUrl}/product/api/categories/${categoryId}/attribute/${attributeId}/values`);

            url.searchParams.append("version", String(params?.version ?? 5));
            url.searchParams.append("page", String(params?.page ?? 0));
            url.searchParams.append("size", String(params?.size ?? 1000));

            logger.info("hepsiburada.attribute_values.fetch", { categoryId, attributeId, url: url.toString() });

            const response = await fetch(url.toString(), {
                method: "GET",
                headers: this.getHeaders()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Hepsiburada API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            logger.error("hepsiburada.attribute_values.failed", { categoryId, attributeId, error });
            throw error;
        }
    }

    // Helper for making requests to different HB domains
    private async makeRequest(url: string): Promise<any> {
        try {
            logger.info("hepsiburada.api_request", { url });

            const response = await fetch(url, {
                method: "GET",
                headers: this.getHeaders()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Hepsiburada API error: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            logger.error("hepsiburada.api_request.failed", { url, error });
            throw error;
        }
    }

    // =============================================================
    // TICKET API
    // =============================================================

    /**
     * Get ticket status by tracking ID
     * URL: /ticket-api/api/integrator/status/{trackingId}
     */
    async getTicketStatus(trackingId: string, params?: { page?: number; size?: number }): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");

        const url = new URL(`${this.config.baseUrl}/ticket-api/api/integrator/status/${trackingId}`);
        url.searchParams.append("version", "1");
        if (params?.page !== undefined) url.searchParams.append("page", String(params.page));
        if (params?.size !== undefined) url.searchParams.append("size", String(params.size ?? 1000));

        return this.makeRequest(url.toString());
    }

    /**
     * Get merchant product by hbSku
     * URL: /ticket-api/api/integrator/merchant/{merchantId}/hbSku/{hbSku}
     */
    async getProductByHbSku(hbSku: string): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");

        const url = `${this.config.baseUrl}/ticket-api/api/integrator/merchant/${this.config.merchantId}/hbSku/${hbSku}`;
        return this.makeRequest(url);
    }

    // =============================================================
    // LISTING EXTERNAL API
    // =============================================================

    private get listingBaseUrl(): string {
        return this.config.baseUrl.replace("mpop-sit", "listing-external-sit");
    }

    async getBuyboxOrders(): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.listingBaseUrl}/buybox-orders/merchantid/${this.config.merchantId}`);
    }

    async getCommissions(): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.listingBaseUrl}/commissions/merchantid/${this.config.merchantId}`);
    }

    async getListings(params?: { offset?: number; limit?: number }): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");

        const url = new URL(`${this.listingBaseUrl}/listings/merchantid/${this.config.merchantId}`);
        url.searchParams.append("offset", String(params?.offset ?? 0));
        url.searchParams.append("limit", String(params?.limit ?? 10));

        return this.makeRequest(url.toString());
    }

    async getInventoryUpload(inventoryUploadId: string): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.listingBaseUrl}/listings/merchantid/${this.config.merchantId}/inventory-uploads/id/${inventoryUploadId}`);
    }

    async getStockUpload(uploadId: string): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.listingBaseUrl}/listings/merchantid/${this.config.merchantId}/stock-uploads/id/${uploadId}`);
    }

    async getPriceUpload(uploadId: string): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.listingBaseUrl}/listings/merchantid/${this.config.merchantId}/price-uploads/id/${uploadId}`);
    }

    async getShippingInfoUpload(uploadId: string): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.listingBaseUrl}/listings/merchantid/${this.config.merchantId}/shipping-info-uploads/id/${uploadId}`);
    }

    async getAdditionalInfoUpload(uploadId: string): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.listingBaseUrl}/listings/merchantid/${this.config.merchantId}/additional-info-uploads/id/${uploadId}`);
    }

    // =============================================================
    // SHIPPING EXTERNAL API
    // =============================================================

    private get shippingBaseUrl(): string {
        return this.config.baseUrl.replace("mpop-sit", "shipping-external-sit");
    }

    async getCargoFirms(): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.shippingBaseUrl}/cargoFirms/${this.config.merchantId}`);
    }

    async getShippingProfiles(): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.shippingBaseUrl}/profiles/${this.config.merchantId}`);
    }

    // =============================================================
    // OMS EXTERNAL API (Orders & Packages)
    // =============================================================

    private get omsBaseUrl(): string {
        return this.config.baseUrl.replace("mpop-sit", "oms-external-sit");
    }

    async getChangeableCargoCompanies(orderLineId: string): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.omsBaseUrl}/delivery/changeablecargocompanies/merchantid/${this.config.merchantId}/orderlineid/${orderLineId}`);
    }

    async getPackageChangeableCargoCompanies(packageNumber: string): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.omsBaseUrl}/packages/merchantid/${this.config.merchantId}/packagenumber/${packageNumber}/changablecargocompanies`);
    }

    async getPackageableWith(lineItemId: string): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.omsBaseUrl}/lineitems/merchantid/${this.config.merchantId}/packageablewith/lineitemid/${lineItemId}`);
    }

    async getPackages(): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.omsBaseUrl}/packages/merchantid/${this.config.merchantId}`);
    }

    async getOrders(): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.omsBaseUrl}/orders/merchantid/${this.config.merchantId}`);
    }

    async getCancelledOrders(): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.omsBaseUrl}/orders/merchantid/${this.config.merchantId}/cancelled`);
    }

    async getPaymentAwaitingOrders(): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.omsBaseUrl}/orders/merchantid/${this.config.merchantId}/paymentawaiting`);
    }

    async getDeliveredPackages(): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.omsBaseUrl}/packages/merchantid/${this.config.merchantId}/delivered`);
    }

    async getShippedPackages(): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.omsBaseUrl}/packages/merchantid/${this.config.merchantId}/shipped`);
    }

    async getMissingInvoicePackages(): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.omsBaseUrl}/packages/merchantid/${this.config.merchantId}/missing-invoice`);
    }

    async getUnpackedPackages(): Promise<any> {
        if (!this.isConfigured()) throw new Error("Hepsiburada API credentials not configured");
        return this.makeRequest(`${this.omsBaseUrl}/packages/merchantid/${this.config.merchantId}/status/unpacked`);
    }

    // =============================================================

    /**
     * Gets merchant ID for reference
     */
    getMerchantId(): string {
        return this.config.merchantId.substring(0, 8) + "...";
    }

    getFullMerchantId(): string {
        return this.config.merchantId;
    }
}

export const hepsiburadaService = new HepsiburadaService();
