import { MarketplaceProvider, MarketplaceConfigStatus, MarketplaceActionResult, MarketplaceProductPayload, MarketplaceTokenStatus, MarketplaceListResult, MarketplaceUpdatePayload, MarketplaceOrderResult, MarketplaceOrder } from "./types.js";
import { getProviderConfigStatus } from "./config.js";
import { logMarketplaceEvent } from "./logger.js";
import { logger } from "../logger.js";

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

export class PazaramaProvider implements MarketplaceProvider {
  name = "Pazarama" as const;

  // Dokümana göre baseUrl
  private baseUrl = "https://sortagimapi.pazarama.com";

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
    return this.isConfigured() ? { status: "unknown" } : { status: "missing" };
  }

  async refreshToken(): Promise<MarketplaceActionResult> {
    return { status: "failed", message: "Not applicable - API Key based" };
  }

  private getHeaders() {
    return {
      "Authorization": `Basic ${Buffer.from(process.env.PAZARAMA_API_KEY + ":" + process.env.PAZARAMA_API_SECRET).toString('base64')}`,
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
  }): Promise<MarketplaceListResult> {
    if (!this.isConfigured()) {
      return { status: "not_configured", items: [], message: "Config missing" };
    }

    try {
      const approved = params?.approved ?? (params?.status === "inactive" ? false : true);
      const size = params?.size || 100;
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
          headers: this.getHeaders(),
        });

        if (!res.ok) {
          const errorText = await res.text();
          logger.error("pazarama.listListings.http_error", { status: res.status, body: errorText });
          return {
            status: "failed",
            items: allItems,
            message: `HTTP ${res.status}: ${errorText}`
          };
        }

        const data: PazaramaListingsResponse = await res.json();

        if (!data.isSuccess && data.message) {
          logger.error("pazarama.listListings.api_error", { message: data.message });
          return { status: "failed", items: allItems, message: data.message };
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

      logMarketplaceEvent({
        provider: this.name,
        action: "listListings",
        status: "ok",
        message: `Listed ${allItems.length} products`,
      });

      return {
        status: "ok",
        items: allItems,
        message: `${allItems.length} ürün listelendi`,
      };

    } catch (e: any) {
      logger.error("pazarama.listListings.exception", { error: e.message });
      return { status: "failed", items: [], message: e.message };
    }
  }

  /**
   * Normalize Pazarama product to standard format
   */
  private normalizeListingItem(p: PazaramaProduct): any {
    return {
      barcode: p.code,
      sku: p.code,
      name: p.name || p.displayName,
      brand: p.brandName,
      price: p.salePrice,
      listPrice: p.listPrice,
      stock: p.stockCount,
      currency: p.currency || "TRY",
      state: p.state,
      stateDescription: p.stateDescription || PAZARAMA_STATE_MAP[p.state] || "Unknown",
      category: p.categoryName,
      images: p.images?.map(img => img.url) || [],
      marketplace: "Pazarama",
      isActive: p.state === 3, // 3 = Onaylandı
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
  }): Promise<MarketplaceOrderResult> {
    if (!this.isConfigured()) {
      return { status: "not_configured", orders: [], message: "Config missing" };
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
          headers: this.getHeaders(),
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          const errorText = await res.text();
          logger.error("pazarama.getNewOrders.http_error", { status: res.status, body: errorText });
          return {
            status: "failed",
            orders: allOrders,
            message: `HTTP ${res.status}: ${errorText}`
          };
        }

        const data: PazaramaOrdersResponse = await res.json();

        if (!data.isSuccess && data.message) {
          logger.error("pazarama.getNewOrders.api_error", { message: data.message });
          return { status: "failed", orders: allOrders, message: data.message };
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

      logMarketplaceEvent({
        provider: this.name,
        action: "getNewOrders",
        status: "ok",
        message: `Fetched ${allOrders.length} orders`,
      });

      return {
        status: "ok",
        orders: allOrders,
        message: `${allOrders.length} sipariş çekildi`,
      };

    } catch (e: any) {
      logger.error("pazarama.getNewOrders.exception", { error: e.message });
      return { status: "failed", orders: [], message: e.message };
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

  async upsertProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
    if (!this.isConfigured()) return { status: "not_configured", message: "Config missing" };

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
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.batchRequestId) {
        return {
          status: "queued",
          message: "Batch queued",
          data: { batchRequestId: data.batchRequestId }
        };
      }
      return { status: "failed", message: JSON.stringify(data) };

    } catch (e: any) {
      return { status: "failed", message: e.message };
    }
  }

  async updateListing(payload: MarketplaceUpdatePayload): Promise<MarketplaceActionResult> {
    if (!this.isConfigured()) return { status: "not_configured", message: "Config missing" };

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
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.batchRequestId) {
        return {
          status: "queued",
          message: "Batch queued",
          data: { batchRequestId: data.batchRequestId }
        };
      }
      return { status: "failed", message: JSON.stringify(data) };
    } catch (e: any) {
      return { status: "failed", message: e.message };
    }
  }

  async syncFromProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
    return this.upsertProduct(payload);
  }

  async getBatchRequestResult(batchRequestId: string): Promise<MarketplaceActionResult> {
    if (!this.isConfigured()) return { status: "not_configured", message: "Config missing" };

    try {
      const res = await fetch(`${this.baseUrl}/batch/status/${batchRequestId}`, {
        headers: this.getHeaders()
      });
      const data = await res.json();
      return { status: "ok", message: "Batch status retrieved", data };
    } catch (e: any) {
      return { status: "failed", message: e.message };
    }
  }
}
