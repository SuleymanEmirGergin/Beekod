import { logger } from "../../logger.js";
import { XMLParser } from "fast-xml-parser";

export interface N11Category {
    id: number;
    name: string;
    parentId?: number;
    subCategories?: N11Category[];
}

export interface N11Attribute {
    id: number;
    name: string;
    mandatory: boolean;
    multipleSelection: boolean;
}

export interface N11ShipmentPackage {
    id: string;
    status: string;
    orderNumber: string;
    cargoTrackingNumber?: string;
    cargoProviderName?: string;
    shippingDate?: string;
}

export interface N11Product {
    id: string;
    productId: number;
    title: string;
    barcode: string;
    stockCode: string;
    salePrice: number;
    quantity: number;
    status: string;
}

export interface N11ProductQueryResult {
    items: N11Product[];
    totalCount: number;
    page: number;
    size: number;
}

export interface N11SoapProduct {
    id: string;
    title: string;
    categoryId: number;
    brand: string;
    price?: number;
    currency?: string;
    stockCode?: string;
    images?: string[];
}

export interface N11SoapSearchResult {
    products: N11SoapProduct[];
    totalCount: number;
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

            const data = await response.json() as { categories?: N11Category[] };

            // N11 returns categories array directly or in a wrapper
            const categories: N11Category[] = data.categories || (data as unknown as N11Category[]) || [];

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
    async getCategoryAttributes(categoryId: number): Promise<{ attributes: N11Attribute[] }> {
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

            return await response.json() as { attributes: N11Attribute[] };
        } catch (error) {
            logger.error("n11.category_attributes.failed", { categoryId, error });
            throw error;
        }
    }

    /**
     * Fetches shipment packages (orders ready for shipment)
     * URL: GET https://api.n11.com/rest/delivery/v1/shipmentPackages
     */
    async getShipmentPackages(params?: { page?: number; size?: number; status?: string }): Promise<{ shipmentPackages: N11ShipmentPackage[], pagingData: { totalCount: number } }> {
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

            return await response.json() as { shipmentPackages: N11ShipmentPackage[], pagingData: { totalCount: number } };
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
    }): Promise<N11ProductQueryResult> {
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

            return await response.json() as N11ProductQueryResult;
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

    /**
     * Searches N11 catalog using SOAP API
     * URL: POST https://api.n11.com/ws/CatalogService/
     */
    async searchCatalog(params: {
        title?: string;
        categoryId?: number;
        brand?: string;
        gtin?: string;
    }): Promise<N11SoapSearchResult> {
        if (!this.isConfigured()) {
            throw new Error("N11 API credentials not configured");
        }

        try {
            const soapBody = this.buildSearchCatalogRequest(params);
            const endpoint = `${this.config.baseUrl}/ws/CatalogService/`;

            logger.info("n11.search_catalog.fetch", { endpoint, params });

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "text/xml; charset=utf-8",
                    "SOAPAction": "http://www.n11.com/ws/schemas/SearchCatalog"
                },
                body: soapBody
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`N11 SOAP error: ${response.status} - ${errorText}`);
            }

            const xmlText = await response.text();
            
            // XML response'u logla (debug için)
            logger.info("n11.search_catalog.response", { 
                xmlPreview: xmlText.substring(0, 500) 
            });
            
            const parsedData = this.parseSoapResponse(xmlText);

            logger.info("n11.search_catalog.success", { 
                resultCount: parsedData?.products?.length || 0 
            });

            return parsedData;
        } catch (error) {
            logger.error("n11.search_catalog.failed", { error });
            throw error;
        }
    }

    private buildSearchCatalogRequest(params: {
        title?: string;
        categoryId?: number;
        brand?: string;
        gtin?: string;
    }): string {
        const { title, categoryId, brand, gtin } = params;

        return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas">
  <soapenv:Header/>
  <soapenv:Body>
    <sch:SearchCatalogRequest>
      <auth>
        <appKey>${this.escapeXml(this.config.apiKey)}</appKey>
        <appSecret>${this.escapeXml(this.config.secretKey)}</appSecret>
      </auth>
      <pagingData>
        <currentPage>0</currentPage>
        <pageSize>50</pageSize>
      </pagingData>
      <productSearch>
        ${title ? `<title>${this.escapeXml(title)}</title>` : ""}
        ${categoryId ? `<categoryId>${categoryId}</categoryId>` : ""}
        ${brand ? `<brand>${this.escapeXml(brand)}</brand>` : ""}
        ${gtin ? `<gtin>${this.escapeXml(gtin)}</gtin>` : ""}
      </productSearch>
    </sch:SearchCatalogRequest>
  </soapenv:Body>
</soapenv:Envelope>`;
    }

    private escapeXml(str: string): string {
        return String(str || "").replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c] || c));
    }

    private parseSoapResponse(xml: string): N11SoapSearchResult {
        try {
            // XMLParser kullanarak SOAP response'u parse et
            const parserConfig = { ignoreAttributes: false, removeNSPrefix: true, trimValues: true };
            const xmlParser = new XMLParser(parserConfig);
            const parsed = xmlParser.parse(xml);

            // SOAP Body'yi al
            const body = parsed?.Envelope?.Body || parsed?.Body || {};
            const response = body?.SearchCatalogResponse || body?.searchCatalogResponse || {};
            
            // Ürünleri array olarak döndür
            const products = response?.products?.product || [];
            const productsArray = Array.isArray(products) ? products : [products];

            return {
                products: productsArray.filter((p: N11SoapProduct) => p && p.id),
                totalCount: response?.totalCount || productsArray.length
            };
        } catch (error) {
            logger.error("n11.soap_parse_failed", { error });
            return { products: [], totalCount: 0 };
        }
    }
}

export const n11Service = new N11Service();
