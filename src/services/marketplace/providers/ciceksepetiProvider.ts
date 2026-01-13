import { getProviderConfigStatus, isMarketplaceDryRun, logMarketplaceEvent } from "../../../config.js";
import { requestJson } from "../httpClient.js";
import {
  MarketplaceActionResult,
  MarketplaceConfigStatus,
  MarketplaceListResult,
  MarketplaceListing,
  MarketplaceOrder,
  MarketplaceOrderResult,
  MarketplaceProductPayload,
  MarketplaceTokenStatus,
  MarketplaceUpdatePayload,
} from "../types.js";
import { logger } from "../../../logger.js";
import { BaseMarketplaceProvider } from "./baseProvider.js";
import { ok, fail, Result } from "../../../utils/result.js";

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

export class CiceksepetiProvider extends BaseMarketplaceProvider {
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

  async refreshToken(): Promise<Result<MarketplaceActionResult>> {
    return fail(new Error("Ciceksepeti uses API key. Token refresh is not supported."));
  }

  /**
   * Ürün yükleme: POST {base}/Products
   * Body: { products: [...] }
   *
   * Not: Çiçeksepeti ürün oluşturma payload'ı kategoriye göre genişleyebiliyor.
   * Biz minimum “genelde gereken” alanları env ile destekliyoruz.
   */
  async upsertProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("upsertProduct"));

    const apiKey = process.env.CICEKSEPETI_API_KEY;
    if (!apiKey) return ok({ status: "not_configured", message: "CICEKSEPETI_API_KEY missing" });

    const base = normalizeBaseUrl(process.env.CICEKSEPETI_API_ENDPOINT || "https://apis.ciceksepeti.com/api/v1");

    const categoryId = num(process.env.CICEKSEPETI_CATEGORY_ID);
    const deliveryType = num(process.env.CICEKSEPETI_DELIVERY_TYPE);
    const deliveryMessageType = num(process.env.CICEKSEPETI_DELIVERY_MESSAGE_TYPE);
    const images = parseImages(process.env.CICEKSEPETI_IMAGES);

    // Ürün yükleme için pratik minimum set (senin modelin bazı alanları taşımıyor)
    if (!categoryId || !deliveryType || !deliveryMessageType || images.length === 0) {
      return ok({
        status: "not_configured",
        message:
          "Missing required envs for product upload: CICEKSEPETI_CATEGORY_ID, CICEKSEPETI_DELIVERY_TYPE, CICEKSEPETI_DELIVERY_MESSAGE_TYPE, CICEKSEPETI_IMAGES",
      });
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
  async updateListing(payload: MarketplaceUpdatePayload): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("updateListing"));
    if (!payload.barcode) return ok({ status: "failed", message: "barcode_required" });

    const apiKey = process.env.CICEKSEPETI_API_KEY;
    if (!apiKey) return ok({ status: "not_configured", message: "CICEKSEPETI_API_KEY missing" });

    const base = normalizeBaseUrl(process.env.CICEKSEPETI_API_ENDPOINT || "https://apis.ciceksepeti.com/api/v1");

    if (payload.price === undefined && payload.stock === undefined) {
      return ok({ status: "failed", message: "price_or_stock_required" });
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

  async syncFromProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("syncFromProduct"));
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
  async listListings(params?: { status?: "active" | "inactive"; barcode?: string; size?: number }): Promise<Result<MarketplaceListResult>> {
    if (!this.isConfigured()) {
      const nc = this.notConfigured("listListings");
      return ok({ status: nc.status, message: nc.message, items: [] });
    }

    const apiKey = process.env.CICEKSEPETI_API_KEY;
    if (!apiKey) return ok({ status: "not_configured", message: "CICEKSEPETI_API_KEY missing", items: [] });

    const base = normalizeBaseUrl(process.env.CICEKSEPETI_API_ENDPOINT || "https://apis.ciceksepeti.com/api/v1");

    if (isMarketplaceDryRun()) {
      return ok({ status: "ok", message: "dry_run", items: [] });
    }

    const pageSize = params?.size ?? 100;
    const maxPages = 50; // Safety limit
    const allItems: MarketplaceListing[] = [];
    let currentPage = 1;
    let hasMore = true;

    try {
      while (hasMore && currentPage <= maxPages) {
        const query = new URLSearchParams();
        query.set("Page", String(currentPage));
        query.set("PageSize", String(pageSize));
        if (params?.barcode) query.set("StockCode", params.barcode);

        const url = `${base}/Products?${query.toString()}`;

        const responseData = await requestJson<CiceksepetiProductListResponse>(url, {
          method: "GET",
          headers: { "x-api-key": apiKey, accept: "application/json" },
        });

        const rawProducts = responseData?.products || [];
        const pageItems = rawProducts.map((p: any) => ({
          marketplace: this.name,
          barcode: p.stockCode,
          title: p.productName,
          price: p.salesPrice,
          stock: p.stockQuantity,
          currency: "TRY", 
          active: true, 
          brand: p.brandName || "",
          category: p.categoryName || "",
          description: "",
          imageUrl: "",
          images: [],
          attributes: {
            brand: p.brandName || "",
            category: p.categoryName || "",
            productStatus: p.productStatus
          },
          variants: []
        }));

        allItems.push(...pageItems);

        // Check if more pages exist
        currentPage++;
        hasMore = pageItems.length === pageSize;
      }

      return ok({ status: "ok", message: `${allItems.length} ürün (${currentPage - 1} sayfa)`, items: allItems });
    } catch (error: any) {
      return fail(error);
    }
  }

  async getNewOrders(_params?: { startDate?: string; endDate?: string }): Promise<Result<MarketplaceOrderResult>> {
    if (!this.isConfigured()) {
      const nc = this.notConfigured("getNewOrders");
      return ok({ status: nc.status, message: nc.message, orders: [] });
    }

    const apiKey = process.env.CICEKSEPETI_API_KEY;
    if (!apiKey) return ok({ status: "not_configured", message: "CICEKSEPETI_API_KEY missing", orders: [] });

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
      return ok({ status: "ok", message: "dry_run", orders: [] });
    }

    try {
      const responseData = await requestJson<any>(url, {
        method: "POST",
        headers: { "x-api-key": apiKey, accept: "application/json" },
        body: JSON.stringify(body),
      });

      const rawOrders = responseData?.orders ?? responseData?.items ?? responseData?.data ?? responseData ?? [];

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

      return ok({ status: "ok", message: `ok (${orders.length})`, orders });
    } catch (error: any) {
      return fail(error);
    }
  }

  private async request(
    method: "POST" | "PUT",
    url: string,
    body: unknown,
    barcode?: string,
  ): Promise<Result<MarketplaceActionResult>> {
    const apiKey = process.env.CICEKSEPETI_API_KEY;

    if (isMarketplaceDryRun()) {
      const requestId = `dry_ciceksepeti_${Date.now()}`;
      logMarketplaceEvent(this.name, method, {
        status: "ok",
        message: "dry_run",
        barcode,
        requestId,
      });
      return ok({ status: "ok", message: "dry_run", requestId });
    }

    logger.info("[Ciceksepeti] request", { method, url });

    try {
      await requestJson<any>(url, {
        method,
        headers: {
          "x-api-key": apiKey || "",
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      logMarketplaceEvent(this.name, method, {
        status: "ok",
        message: "ok",
        barcode,
      });

      return ok({ status: "ok", message: "ok" });
    } catch (error: any) {
      logMarketplaceEvent(this.name, method, {
        status: "failed",
        message: error.message,
        barcode,
      });
      return ok({ status: "failed", message: error.message });
    }
  }
}
