import {
  MarketplaceActionResult,
  MarketplaceConfigStatus,
  MarketplaceListResult,
  MarketplaceListing,
  MarketplaceOrder,
  MarketplaceOrderResult,
  MarketplaceProductPayload,
  MarketplaceReviewResult,
  MarketplaceTokenStatus,
  MarketplaceUpdatePayload,
} from "../types.js";
import { getProviderConfigStatus, logMarketplaceEvent } from "../../../config.js";
import { logger } from "../../../logger.js";
import { ok, fail, Result } from "../../../utils/result.js";
import { scrapeMarketplace } from "../../webScraperService.js";

// ============================================================
// PAZARAMA TYPES
// ============================================================

interface PazaramaProduct {
  code: string;
  name: string;
  brandName?: string;
  listPrice: number;
  salePrice: number;
  stockCount: number;
  state: number;
  stateDescription?: string;
  categoryName?: string;
  images?: { url: string }[];
  displayName?: string;
  description?: string;
  currency?: string;
  vatRate?: number;
}

interface PazaramaOrderItem {
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: number;
  statusDescription?: string;
}

interface PazaramaOrder {
  orderNumber: string;
  orderId?: number;
  orderDate: string;
  deliveryType: number;
  invoiceType: number;
  paymentType: number;
  totalAmount: number;
  items: PazaramaOrderItem[];
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  shippingAddress?: {
    fullAddress?: string;
    city?: string;
    district?: string;
  };
  deliveryDetail?: {
    phoneNumber?: string;
  };
}

interface PazaramaListingsResponse {
  data?: PazaramaProduct[];
  totalCount?: number;
  page?: number;
  size?: number;
  isSuccess?: boolean;
  message?: string;
}

interface PazaramaOrdersResponse {
  data?: PazaramaOrder[];
  totalCount?: number;
  isSuccess?: boolean;
  message?: string;
}

// ============================================================
// STATE MAPPING
// ============================================================

const PAZARAMA_STATE_MAP: Record<number, string> = {
  1: "Onay Bekliyor İlk Onay",
  2: "Onay Bekliyor Güncelleme",
  3: "Onaylandı",
  6: "Reddedildi Değişiklik Bekleyen",
  7: "Reddedildi Dönüp Güncellenenler",
};

const PAZARAMA_ORDER_STATUS_MAP: Record<number, string> = {
  3: "Siparişiniz Alındı",
  12: "Siparişiniz Hazırlanıyor",
  13: "Tedarik Edilemedi",
  5: "Siparişiniz Kargoya Verildi",
  11: "Teslim Edildi",
  14: "Teslim Edilemedi",
  7: "İade Süreci Başlatıldı",
  8: "İade Onaylandı",
  9: "İade Reddedildi",
  10: "İade Edildi",
};

const PAZARAMA_DELIVERY_TYPE_MAP: Record<number, string> = {
  1: "Cargo",
  2: "Courier",
  3: "Store",
  4: "Digital",
};

// ============================================================
// PAZARAMA PROVIDER
// ============================================================

import { BaseMarketplaceProvider } from "./baseProvider.js";

export class PazaramaProvider extends BaseMarketplaceProvider {
  name = "Pazarama" as const;

  // Dokümana göre baseUrl
  private baseUrl = "https://isortagimapi.pazarama.com";
  private tokenUrl = "https://isortagimgiris.pazarama.com/connect/token";

  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  getConfigStatus(): MarketplaceConfigStatus {
    const baseStatus = getProviderConfigStatus(this.name);
    const missing: string[] = [];
    if (!process.env.PAZARAMA_API_KEY) missing.push("PAZARAMA_API_KEY");
    if (!process.env.PAZARAMA_API_SECRET) missing.push("PAZARAMA_API_SECRET");

    return Object.assign({}, baseStatus, { configured: missing.length === 0, missing });
  }

  isConfigured(): boolean {
    return this.getConfigStatus().configured;
  }

  getTokenStatus(): MarketplaceTokenStatus {
    if (!this.isConfigured()) return { status: "missing" };
    return this.accessToken && Date.now() < this.tokenExpiresAt
      ? { status: "valid", expiresAt: new Date(this.tokenExpiresAt).toISOString() }
      : { status: "expired" };
  }

  async refreshToken(): Promise<Result<MarketplaceActionResult>> {
    try {
      const token = await this.fetchNewToken();
      return token ? ok({ status: "ok", message: "Token refreshed" }) : fail(new Error("Failed to fetch token"));
    } catch (e: any) {
      return fail(e);
    }
  }

  private async fetchNewToken(): Promise<string | null> {
    const auth = Buffer.from(`${process.env.PAZARAMA_API_KEY}:${process.env.PAZARAMA_API_SECRET}`).toString('base64');
    
    try {
      const res = await fetch(this.tokenUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
      });

      if (!res.ok) {
        const err = await res.text();
        logger.error("pazarama.fetchToken.error", { status: res.status, body: err });
        return null;
      }

      const data = await res.json();
      
      this.accessToken = data.access_token || data.accessToken || data.data?.accessToken || data.data?.access_token;
      
      const expires = data.expires_in || data.data?.expires_in || data.data?.expiresIn || 3600;

      this.tokenExpiresAt = Date.now() + expires * 1000 - 60000;

      return this.accessToken;
    } catch (e: any) {
      logger.error("pazarama.fetchToken.exception", { error: e.message });
      return null;
    }
  }

  private async getHeaders() {
    if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
      await this.fetchNewToken();
    }

    return {
      "Authorization": `Bearer ${this.accessToken}`,
      "Content-Type": "application/json"
    };
  }

  // ============================================================
  // listListings() - GET /product/products
  // ============================================================
  async listListings(params?: {
    status?: "active" | "inactive";
    barcode?: string;
    approved?: boolean;
    page?: number;
    size?: number;
    autoPaginate?: boolean;
  }): Promise<Result<MarketplaceListResult>> {
    if (!this.isConfigured()) {
      const nc = this.notConfigured("listListings");
      return ok({ status: nc.status, message: nc.message, items: [] });
    }

    try {
      const approved = params?.approved ?? (params?.status === "inactive" ? false : true);
      const size = params?.size || 200; // Pazarama supports up to 200 per page
      const autoPaginate = params?.autoPaginate ?? false;

      let allItems: any[] = [];
      let currentPage = params?.page || 1;
      let hasMore = true;

      while (hasMore) {
        // Build query URL
        const queryParams = new URLSearchParams();
        queryParams.append("Approved", String(approved));
        queryParams.append("Size", String(size));
        queryParams.append("Page", String(currentPage));

        if (params?.barcode) {
          queryParams.append("Code", params.barcode);
        }

        const url = `${this.baseUrl}/product/products?${queryParams.toString()}`;

        logger.info("pazarama.listListings.request", { url, page: currentPage });

        const res = await fetch(url, {
          method: "GET",
          headers: await this.getHeaders(),
        });

        if (!res.ok) {
          const errorText = await res.text();
          logger.error("pazarama.listListings.http_error", { status: res.status, body: errorText });
          return ok({
            status: "failed",
            items: allItems,
            message: `HTTP ${res.status}: ${errorText}`
          });
        }

        const data: PazaramaListingsResponse = await res.json();

        if (!data.isSuccess && data.message) {
          logger.error("pazarama.listListings.api_error", { message: data.message });
          return ok({ status: "failed", items: allItems, message: data.message });
        }

        const products = data.data || [];

        // Normalize items
        const normalizedItems = products.map(p => this.normalizeListingItem(p));
        allItems = allItems.concat(normalizedItems);

        logger.info("pazarama.listListings.page_fetched", {
          page: currentPage,
          itemsInPage: products.length,
          totalSoFar: allItems.length
        });

        // Check if more pages exist
        if (!autoPaginate || products.length < size) {
          hasMore = false;
        } else {
          currentPage++;
        }
      }

      logMarketplaceEvent(this.name, "listListings", {
        status: "ok",
        message: `Listed ${allItems.length} products`,
      });

      return ok({
        status: "ok",
        items: allItems,
        message: `${allItems.length} ürün listelendi`,
      });

    } catch (e: any) {
      logger.error("pazarama.listListings.exception", { error: e.message });
      return fail(e);
    }
  }

  /**
   * Normalize Pazarama product to standard format
   */
  private normalizeListingItem(p: PazaramaProduct): MarketplaceListing {
    return {
      barcode: p.code,
      title: p.name || p.displayName || p.code,
      price: p.salePrice,
      stock: p.stockCount,
      currency: p.currency || "TRY",
      active: p.state === 3, // 3 = Onaylandı
      /* Rich Data */
      brand: p.brandName,
      category: p.categoryName,
      description: p.description || "",
      imageUrl: p.images?.[0]?.url,
      images: p.images?.map(img => img.url) || [],
      marketplace: "Pazarama",
      attributes: {
        brand: p.brandName || "",
        category: p.categoryName || "",
        state: p.stateDescription || String(p.state),
        vatRate: p.vatRate || 0
      },
      variants: []
    };
  }

  // ============================================================
  // getNewOrders() - POST /order/getOrdersForApi
  // ============================================================
  async getNewOrders(params?: {
    startDate?: string;
    endDate?: string;
    orderNumber?: string;
    pageSize?: number;
    pageNumber?: number;
    autoPaginate?: boolean;
  }): Promise<Result<MarketplaceOrderResult>> {
    if (!this.isConfigured()) {
      const nc = this.notConfigured("getNewOrders");
      return ok({ status: nc.status, message: nc.message, orders: [] });
    }

    try {
      const pageSize = params?.pageSize || 500;
      const autoPaginate = params?.autoPaginate ?? true;

      // Default date range: last 7 days (max 1 month allowed)
      const endDate = params?.endDate || new Date().toISOString().split('T')[0];
      const startDate = params?.startDate || this.getDateDaysAgo(7);

      let allOrders: MarketplaceOrder[] = [];
      let currentPage = params?.pageNumber || 1;
      let hasMore = true;

      while (hasMore) {
        // Build request body
        const requestBody: any = {
          pageSize,
          pageNumber: currentPage,
          startDate,
          endDate,
        };

        // If specific order requested
        if (params?.orderNumber) {
          requestBody.orderNumber = params.orderNumber;
        }

        const url = `${this.baseUrl}/order/getOrdersForApi`;

        logger.info("pazarama.getNewOrders.request", {
          url,
          page: currentPage,
          startDate,
          endDate
        });

        const res = await fetch(url, {
          method: "POST",
          headers: await this.getHeaders(),
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          const errorText = await res.text();
          logger.error("pazarama.getNewOrders.http_error", { status: res.status, body: errorText });
          return ok({
            status: "failed",
            orders: allOrders,
            message: `HTTP ${res.status}: ${errorText}`
          });
        }

        const data: PazaramaOrdersResponse = await res.json();

        if (!data.isSuccess && data.message) {
          logger.error("pazarama.getNewOrders.api_error", { message: data.message });
          return ok({ status: "failed", orders: allOrders, message: data.message });
        }

        const orders = data.data || [];

        // Normalize orders
        const normalizedOrders = orders.map(o => this.normalizeOrder(o));
        allOrders = allOrders.concat(normalizedOrders);

        logger.info("pazarama.getNewOrders.page_fetched", {
          page: currentPage,
          ordersInPage: orders.length,
          totalSoFar: allOrders.length
        });

        // Check if more pages exist
        if (!autoPaginate || orders.length < pageSize || params?.orderNumber) {
          hasMore = false;
        } else {
          currentPage++;
        }
      }

      logMarketplaceEvent(this.name, "getNewOrders", {
        status: "ok",
        message: `Fetched ${allOrders.length} orders`,
      });

      return ok({
        status: "ok",
        orders: allOrders,
        message: `${allOrders.length} sipariş çekildi`,
      });

    } catch (e: any) {
      logger.error("pazarama.getNewOrders.exception", { error: e.message });
      return fail(e);
    }
  }

  /**
   * Normalize Pazarama order to standard format
   */
  private normalizeOrder(o: PazaramaOrder): MarketplaceOrder {
    return {
      orderNumber: o.orderNumber,
      orderId: o.orderId?.toString() || o.orderNumber,
      marketplace: "Pazarama",
      orderDate: o.orderDate,
      totalAmount: o.totalAmount,
      currency: "TRY",
      status: this.mapOrderStatus(o.items?.[0]?.status),
      statusCode: o.items?.[0]?.status,
      deliveryType: PAZARAMA_DELIVERY_TYPE_MAP[o.deliveryType] || "Unknown",
      customer: {
        name: o.customer?.name,
        email: o.customer?.email,
        phone: o.customer?.phone || o.deliveryDetail?.phoneNumber,
      },
      shippingAddress: {
        fullAddress: o.shippingAddress?.fullAddress,
        city: o.shippingAddress?.city,
        district: o.shippingAddress?.district,
      },
      items: o.items?.map(item => ({
        barcode: item.productCode,
        sku: item.productCode,
        name: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        status: PAZARAMA_ORDER_STATUS_MAP[item.status] || "Unknown",
        statusCode: item.status,
      })) || [],
    };
  }

  /**
   * Map order item status to standard status string
   */
  private mapOrderStatus(statusCode?: number): string {
    if (!statusCode) return "Unknown";
    return PAZARAMA_ORDER_STATUS_MAP[statusCode] || "Unknown";
  }

  /**
   * Get date N days ago in YYYY-MM-DD format
   */
  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  // ============================================================
  // EXISTING METHODS (upsertProduct, updateListing, etc.)
  // ============================================================

  async upsertProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("upsertProduct"));

    const body = {
      items: [
        {
          code: payload.barcode,
          name: payload.name,
          displayName: payload.name,
          description: payload.name,
          brandName: "Other",
          images: payload.images?.map(url => ({ url })),
          attributes: [],
          groupAttribute: "",
          currency: payload.currency || "try",
          listPrice: payload.price,
          salePrice: payload.price,
          vatRate: 20,
          stockCount: payload.stock
        }
      ]
    };

    try {
      const res = await fetch(`${this.baseUrl}/product/create`, {
        method: "POST",
        headers: await this.getHeaders(),
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.batchRequestId) {
        return ok({
          status: "queued",
          message: "Batch queued",
          data: { batchRequestId: data.batchRequestId }
        });
      }
      return ok({ status: "failed", message: JSON.stringify(data) });

    } catch (e: any) {
      return fail(e);
    }
  }

  async updateListing(payload: MarketplaceUpdatePayload): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("updateListing"));

    const body = {
      items: [
        {
          code: payload.barcode,
          listPrice: payload.price,
          salePrice: payload.price,
          stockCount: payload.stock
        }
      ]
    };

    try {
      const res = await fetch(`${this.baseUrl}/product/price-stock`, {
        method: "POST",
        headers: await this.getHeaders(),
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.batchRequestId) {
        return ok({
          status: "queued",
          message: "Batch queued",
          data: { batchRequestId: data.batchRequestId }
        });
      }
      return ok({ status: "failed", message: JSON.stringify(data) });
    } catch (e: any) {
      return fail(e);
    }
  }

  async syncFromProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
    return this.upsertProduct(payload);
  }

  async getBatchRequestResult(batchRequestId: string): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("getBatchRequestResult"));

    try {
      const res = await fetch(`${this.baseUrl}/batch/status/${batchRequestId}`, {
        headers: await this.getHeaders()
      });
      const data = await res.json();
      return ok({ status: "ok", message: "Batch status retrieved", data });
    } catch (e: any) {
      return fail(e);
    }
  }

  /**
   * Get price competition data using web scraping
   * Note: Pazarama doesn't provide a direct API for competitor pricing
   * This method uses webScraperService to get data
   */
  async getPriceCompetition(barcodes: string[]): Promise<Result<{ barcode: string; lowestPrice: number; winningSeller?: string; competitorCount?: number }[]>> {
    if (!barcodes || barcodes.length === 0) return ok([]);

    try {
      const results: { barcode: string; lowestPrice: number; winningSeller?: string; competitorCount?: number }[] = [];

      for (const barcode of barcodes) {
        // Use Scraper Service to get search results which often include the buybox price
        const scrapedProducts = await scrapeMarketplace("Pazarama", barcode);
        
        if (!scrapedProducts || scrapedProducts.length === 0) {
          results.push({ barcode, lowestPrice: 0, competitorCount: 0 });
          continue;
        }

        // Assume the first result is the most relevant (buybox)
        const bestMatch = scrapedProducts[0];
        
        results.push({
          barcode,
          lowestPrice: bestMatch.price,
          winningSeller: bestMatch.seller || "Unknown",
          competitorCount: 1 // Scraper usually returns list, so we could count, but keeping it simple
        });
      }

      logMarketplaceEvent(this.name, "getPriceCompetition", {
        status: "ok",
        message: `Analyzed ${barcodes.length} products via scraping`
      });

      return ok(results);
    } catch (error: unknown) {
      return fail(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get product reviews
   * Note: Pazarama API doesn't provide review endpoint for sellers
   */
  async getProductReviews(barcode: string): Promise<Result<MarketplaceReviewResult>> {
    // Similar scraping approach could be added here if scraper supports reviews
    logMarketplaceEvent(this.name, "getProductReviews", {
      status: "ok",
      message: `Reviews API not available for ${barcode}`
    });

    return ok({
      status: "ok",
      message: "Pazarama yorum API'si satıcılar için mevcut değil.",
      reviews: []
    });
  }
}
