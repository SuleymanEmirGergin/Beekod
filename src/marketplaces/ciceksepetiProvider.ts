import { getProviderConfigStatus, isMarketplaceDryRun } from "./config.js";
import { requestJson } from "./httpClient.js";
import { logMarketplaceEvent } from "./logger.js";
import {
  MarketplaceActionResult,
  MarketplaceConfigStatus,
  MarketplaceListResult,
  MarketplaceProductPayload,
  MarketplaceProvider,
  MarketplaceOrderResult,
  MarketplaceTokenStatus,
  MarketplaceUpdatePayload,
} from "./types.js";
import { logger } from "../logger.js";

// -- Ciceksepeti API Response Types --
interface CiceksepetiProduct {
  stockCode: string; // Used as barcode
  productName: string;
  salesPrice: number;
  stockQuantity: number;
  productStatus?: number;
  // ... add other fields as needed
}

interface CiceksepetiProductListResponse {
  products: CiceksepetiProduct[];
  // pageCount etc.
}

interface CiceksepetiOrder {
  orderNumber: string;
  customerName: string;
  orderDate: string;
  status: string;
  totalPrice: number;
  currency: string;
  orderItems: Array<{
    stockCode: string;
    productName: string;
    quantity: number;
    salesPrice: number;
  }>;
  // ...
}

interface CiceksepetiOrderListResponse {
  orders: CiceksepetiOrder[];
}

/** JSON array veya CSV şeklinde gelen image listesini parse eder */
function parseImages(raw?: string): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v))
      return v
        .map(String)
        .map((s) => s.trim())
        .filter(Boolean);
  } catch {
    // JSON değilse CSV kabul
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** env string -> number */
function num(raw?: string): number | undefined {
  if (!raw) return undefined;
  const v = Number(raw);
  return Number.isFinite(v) ? v : undefined;
}

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

/** base URL normalize: trailing slash kaldır */
function normalizeBaseUrl(u: string): string {
  return u.replace(/\/+$/, "");
}

export class CiceksepetiProvider implements MarketplaceProvider {
  name = "Ciceksepeti" as const;

  getConfigStatus(): MarketplaceConfigStatus {
    return getProviderConfigStatus(this.name);
  }

  getTokenStatus(): MarketplaceTokenStatus {
    if (!this.isConfigured()) return { status: "missing" };
    return { status: "unknown" };
  }

  isConfigured() {
    return this.getConfigStatus().configured;
  }

  async refreshToken(): Promise<MarketplaceActionResult> {
    return {
      status: "failed",
      message: "Ciceksepeti uses API key. Token refresh is not supported.",
    };
  }

  /**
   * Ürün yükleme: POST {base}/Products
   * Body: { products: [...] }
   *
   * Not: Çiçeksepeti ürün oluşturma payload'ı kategoriye göre genişleyebiliyor.
   * Biz minimum “genelde gereken” alanları env ile destekliyoruz.
   */
  async upsertProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
    if (!this.isConfigured()) return this.notConfigured("upsertProduct");

    const apiKey = process.env.CICEKSEPETI_API_KEY;
    if (!apiKey) return { status: "not_configured", message: "CICEKSEPETI_API_KEY missing" };

    const base = normalizeBaseUrl(process.env.CICEKSEPETI_API_ENDPOINT || "https://apis.ciceksepeti.com/api/v1");

    const categoryId = num(process.env.CICEKSEPETI_CATEGORY_ID);
    const deliveryType = num(process.env.CICEKSEPETI_DELIVERY_TYPE);
    const deliveryMessageType = num(process.env.CICEKSEPETI_DELIVERY_MESSAGE_TYPE);
    const images = parseImages(process.env.CICEKSEPETI_IMAGES);

    // Ürün yükleme için pratik minimum set (senin modelin bazı alanları taşımıyor)
    if (!categoryId || !deliveryType || !deliveryMessageType || images.length === 0) {
      return {
        status: "not_configured",
        message:
          "Missing required envs for product upload: CICEKSEPETI_CATEGORY_ID, CICEKSEPETI_DELIVERY_TYPE, CICEKSEPETI_DELIVERY_MESSAGE_TYPE, CICEKSEPETI_IMAGES",
      };
    }

    const description = process.env.CICEKSEPETI_DEFAULT_DESCRIPTION?.trim() || payload.name;

    const listPriceFromEnv = num(process.env.CICEKSEPETI_DEFAULT_LIST_PRICE);

    const body = {
      products: [
        {
          productName: payload.name,
          // Çiçeksepeti tarafında bunlar “tedarikçi kodları”; sende barcode ile gidiyoruz.
          mainProductCode: payload.barcode,
          stockCode: payload.barcode,

          categoryId,
          description,

          supplierDescription: process.env.CICEKSEPETI_SUPPLIER_DESCRIPTION || "",
          mediaLink: process.env.CICEKSEPETI_MEDIA_LINK || "",

          deliveryMessageType,
          deliveryType,

          stockQuantity: payload.stock ?? 0,
          salesPrice: payload.price ?? 0,

          ...(listPriceFromEnv ? { listPrice: listPriceFromEnv } : {}),

          barcode: payload.barcode,
          images,

          // İleri seviye: attributes / operatorContacts / safetyInfo vb.
          // Gerekirse bunları da env veya payload genişletmesiyle ekleriz.
        },
      ],
    };

    return this.request("POST", `${base}/Products`, body, payload.barcode);
  }

  /**
   * Stok/Fiyat: PUT {base}/Products/price-and-stock
   * Body: { items: [{ stockCode, StockQuantity?, salesPrice?, listPrice? }] }
   */
  async updateListing(payload: MarketplaceUpdatePayload): Promise<MarketplaceActionResult> {
    if (!this.isConfigured()) return this.notConfigured("updateListing");
    if (!payload.barcode) return { status: "failed", message: "barcode_required" };

    const apiKey = process.env.CICEKSEPETI_API_KEY;
    if (!apiKey) return { status: "not_configured", message: "CICEKSEPETI_API_KEY missing" };

    const base = normalizeBaseUrl(process.env.CICEKSEPETI_API_ENDPOINT || "https://apis.ciceksepeti.com/api/v1");

    if (payload.price === undefined && payload.stock === undefined) {
      return { status: "failed", message: "price_or_stock_required" };
    }

    const item: Record<string, any> = {
      stockCode: payload.barcode,
    };

    // Doküman örneklerinde StockQuantity bu şekilde geçiyor.
    if (payload.stock !== undefined) item.StockQuantity = payload.stock;

    // salesPrice alanı genelde küçük harf ile kullanılıyor
    if (payload.price !== undefined) item.salesPrice = payload.price;

    // listPrice göndereceksen salesPrice ile birlikte gönder (biz de öyle yapıyoruz)
    const listPriceFromEnv = num(process.env.CICEKSEPETI_DEFAULT_LIST_PRICE);
    if (listPriceFromEnv && payload.price !== undefined) item.listPrice = listPriceFromEnv;

    const body = { items: [item] };

    return this.request("PUT", `${base}/Products/price-and-stock`, body, payload.barcode);
  }

  async syncFromProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
    if (!this.isConfigured()) return this.notConfigured("syncFromProduct");
    return this.updateListing({
      barcode: payload.barcode,
      price: payload.price,
      stock: payload.stock,
      title: payload.name,
    });
  }

  /**
   * Listeleme: GET {base}/Products
   * Şimdilik sadece StockCode filtresi ekliyoruz (barcode ile).
   */
  async listListings(params?: { status?: "active" | "inactive"; barcode?: string }): Promise<MarketplaceListResult> {
    if (!this.isConfigured()) {
      return { status: "not_configured", message: `${this.name} provider not configured.`, items: [] };
    }

    const apiKey = process.env.CICEKSEPETI_API_KEY;
    if (!apiKey) return { status: "not_configured", message: "CICEKSEPETI_API_KEY missing", items: [] };

    const base = normalizeBaseUrl(process.env.CICEKSEPETI_API_ENDPOINT || "https://apis.ciceksepeti.com/api/v1");

    const query = new URLSearchParams();
    if (params?.barcode) query.set("StockCode", params.barcode);

    // status mapping dokümanda integer ProductStatus ile olabilir; elinde net mapping yoksa yanlış göndermeyelim.
    // if (params?.status) query.set("ProductStatus", "...");

    const url = `${base}/Products${query.toString() ? `?${query.toString()}` : ""}`;

    if (isMarketplaceDryRun()) {
      return { status: "ok", message: "dry_run", items: [] };
    }

    try {
      const response = await requestJson<CiceksepetiProductListResponse>({
        method: "GET",
        url,
        headers: { "x-api-key": apiKey, accept: "application/json" },
        metrics: { target: `marketplace:${this.name}` },
      });

      if (!response.ok) {
        return { status: "failed", message: response.raw || "request_failed", items: [] };
      }

      // Safe access using typed response
      const rawProducts = response.data?.products || [];
      const items = rawProducts.map((p) => ({
        marketplace: this.name,
        barcode: p.stockCode,
        title: p.productName,
        price: p.salesPrice,
        stock: p.stockQuantity,
        currency: "TRY", // Assuming TRY as default for TR marketplace
        active: true, // Simplified active check
      }));

      return { status: "ok", message: "ok", items };
    } catch (error: any) {
      return { status: "failed", message: error.message, items: [] };
    }
  }

  async getNewOrders(_params?: { startDate?: string; endDate?: string }): Promise<MarketplaceOrderResult> {
    if (!this.isConfigured()) {
      return { status: "not_configured", message: `${this.name} provider not configured.`, orders: [] };
    }

    const apiKey = process.env.CICEKSEPETI_API_KEY;
    if (!apiKey) return { status: "not_configured", message: "CICEKSEPETI_API_KEY missing", orders: [] };

    const base = normalizeBaseUrl(process.env.CICEKSEPETI_API_ENDPOINT || "https://apis.ciceksepeti.com/api/v1");

    const path = process.env.CICEKSEPETI_ORDERS_PATH || "/Order/GetOrders";
    const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;

    const pageSize = num(process.env.CICEKSEPETI_ORDERS_PAGE_SIZE) ?? 50;
    const page = num(process.env.CICEKSEPETI_ORDERS_PAGE) ?? 0;
    const statusId = num(process.env.CICEKSEPETI_ORDERS_STATUS_ID);

    const body: Record<string, any> = {
      startDate: _params?.startDate,
      endDate: _params?.endDate,
      pageSize,
      page,
    };
    if (statusId != null) body.statusId = statusId;

    if (isMarketplaceDryRun()) {
      return { status: "ok", message: "dry_run", orders: [] };
    }

    try {
      const response = await requestJson<any>({
        method: "POST",
        url,
        headers: { "x-api-key": apiKey, accept: "application/json" },
        body,
        metrics: { target: `marketplace:${this.name}` },
      });

      if (!response.ok) {
        return { status: "failed", message: response.raw || "request_failed", orders: [] };
      }

      const rawOrders = response.data?.orders ?? response.data?.items ?? response.data?.data ?? response.data ?? [];

      const orders = asArray(rawOrders)
        .map((order: any) => {
          const itemsRaw = order?.items ?? order?.products ?? order?.orderItems ?? [];
          const items = asArray(itemsRaw).map((item: any) => ({
            sku: String(item?.sku ?? item?.stockCode ?? item?.sellerStockCode ?? item?.barcode ?? ""),
            barcode: String(item?.barcode ?? item?.stockCode ?? item?.sellerStockCode ?? item?.sku ?? ""),
            name: String(item?.name ?? item?.productName ?? item?.title ?? ""),
            price: Number(item?.price ?? item?.salePrice ?? item?.unitPrice ?? 0),
            quantity: Number(item?.quantity ?? item?.amount ?? 0),
            image: item?.image ?? item?.imageUrl,
          }));

          const address =
            order?.address ??
            order?.shippingAddress?.address ??
            order?.shippingAddress?.fullAddress ??
            order?.customerAddress ??
            "";

          return {
            marketplace: this.name,
            orderNumber: String(order?.orderNumber ?? order?.orderId ?? order?.id ?? ""),
            customerName: String(order?.customerName ?? order?.recipientName ?? order?.fullName ?? ""),
            customerEmail: order?.customerEmail ?? order?.email,
            customerPhone: order?.customerPhone ?? order?.phone,
            customerAddress: String(address || ""),
            items,
            totalAmount: Number(order?.totalAmount ?? order?.totalPrice ?? order?.amount ?? 0),
            currency: String(order?.currency ?? "TRY"),
            orderDate: String(order?.orderDate ?? order?.createdAt ?? new Date().toISOString()),
            status: String(order?.status ?? order?.state ?? "unknown"),
          };
        })
        .filter((order: any) => order.orderNumber);

      return { status: "ok", message: `ok (${orders.length})`, orders };
    } catch (error: any) {
      return { status: "failed", message: error.message, orders: [] };
    }
  }

  private async request(
    method: "POST" | "PUT",
    url: string,
    body: unknown,
    barcode?: string,
  ): Promise<MarketplaceActionResult> {
    const apiKey = process.env.CICEKSEPETI_API_KEY;

    if (isMarketplaceDryRun()) {
      const requestId = `dry_ciceksepeti_${Date.now()}`;
      logMarketplaceEvent({
        provider: this.name,
        action: method,
        status: "ok",
        message: "dry_run",
        barcode,
        requestId,
      });
      return { status: "ok", message: "dry_run", requestId };
    }

    logger.info("[Ciceksepeti] request", { method, url });

    try {
      const response = await requestJson<any>({
        method,
        url,
        headers: {
          "x-api-key": apiKey || "",
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body,
        metrics: { target: `marketplace:${this.name}` },
      });

      if (!response.ok) {
        const msg = response.raw || "request_failed";
        logMarketplaceEvent({
          provider: this.name,
          action: method,
          status: "failed",
          message: msg,
          barcode,
        });
        return { status: "failed", message: msg };
      }

      logMarketplaceEvent({
        provider: this.name,
        action: method,
        status: "ok",
        message: "ok",
        barcode,
      });

      return { status: "ok", message: "ok" };
    } catch (error: any) {
      logMarketplaceEvent({
        provider: this.name,
        action: method,
        status: "failed",
        message: error.message,
        barcode,
      });
      return { status: "failed", message: error.message };
    }
  }

  private notConfigured(action: string): MarketplaceActionResult {
    const result = {
      status: "not_configured",
      message: `${this.name} provider not configured for ${action}.`,
    } satisfies MarketplaceActionResult;

    logMarketplaceEvent({
      provider: this.name,
      action,
      status: result.status,
      message: result.message,
    });

    return result;
  }
}
