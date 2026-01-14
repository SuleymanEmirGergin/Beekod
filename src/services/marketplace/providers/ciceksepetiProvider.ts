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
  MarketplaceReviewResult,
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
  brandName?: string;
  categoryName?: string;
}

interface CiceksepetiProductListResponse {
  products?: CiceksepetiProduct[];
  response?: { products?: CiceksepetiProduct[] };
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

  async upsertProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("upsertProduct"));

    const apiKey = process.env.CICEKSEPETI_API_KEY;
    if (!apiKey) return ok({ status: "not_configured", message: "CICEKSEPETI_API_KEY missing" });

    const base = normalizeBaseUrl(process.env.CICEKSEPETI_API_ENDPOINT || "https://apis.ciceksepeti.com/api/v1");

    const categoryId = num(process.env.CICEKSEPETI_CATEGORY_ID);
    const deliveryType = num(process.env.CICEKSEPETI_DELIVERY_TYPE);
    const deliveryMessageType = num(process.env.CICEKSEPETI_DELIVERY_MESSAGE_TYPE);
    const images = parseImages(process.env.CICEKSEPETI_IMAGES);

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
        },
      ],
    };

    return this.request("POST", `${base}/Products`, body, payload.barcode);
  }

  async updateListing(payload: MarketplaceUpdatePayload): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("updateListing"));
    if (!payload.barcode) return ok({ status: "failed", message: "barcode_required" });

    const apiKey = process.env.CICEKSEPETI_API_KEY;
    if (!apiKey) return ok({ status: "not_configured", message: "CICEKSEPETI_API_KEY missing" });

    const base = normalizeBaseUrl(process.env.CICEKSEPETI_API_ENDPOINT || "https://apis.ciceksepeti.com/api/v1");

    if (payload.price === undefined && payload.stock === undefined) {
      return ok({ status: "failed", message: "price_or_stock_required" });
    }

    const item: Record<string, unknown> = {
      stockCode: payload.barcode,
    };

    if (payload.stock !== undefined) item.StockQuantity = payload.stock;
    if (payload.price !== undefined) item.salesPrice = payload.price;

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

  async listListings(params?: { status?: "active" | "inactive"; barcode?: string; deep?: boolean; page?: number; pageSize?: number }): Promise<Result<MarketplaceListResult>> {
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

    const pageSize = params?.pageSize ?? 100;
    const maxPages = 50; 
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

        const resp = responseData as any;
        const rawProducts = resp?.products || resp?.response?.products || (Array.isArray(resp) ? resp : []);
        const pageItems: MarketplaceListing[] = rawProducts.map((p: CiceksepetiProduct) => ({
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
        currentPage++;
        hasMore = pageItems.length === pageSize;
      }

      return ok({ status: "ok", message: `${allItems.length} ürün`, items: allItems });
    } catch (error: unknown) {
      return fail(error instanceof Error ? error : new Error(String(error)));
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

    const body: Record<string, unknown> = {
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

      const orders: MarketplaceOrder[] = asArray(rawOrders)
        .map((order: any) => {
          const itemsRaw = order?.items ?? order?.products ?? order?.orderItems ?? [];
          const items = asArray(itemsRaw).map((item: any) => ({
            sku: String(item?.sku ?? item?.stockCode ?? item?.sellerStockCode ?? item?.barcode ?? ""),
            barcode: String(item?.barcode ?? item?.stockCode ?? item?.sellerStockCode ?? item?.sku ?? ""),
            name: String(item?.name ?? item?.productName ?? item?.title ?? ""),
            price: Number(item?.price ?? item?.salePrice ?? item?.unitPrice ?? 0),
            quantity: Number(item?.quantity ?? item?.amount ?? 0),
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
            customerEmail: String(order?.customerEmail ?? (order?.email || "")),
            customerPhone: String(order?.customerPhone ?? (order?.phone || "")),
            customerAddress: String(address || ""),
            items,
            totalAmount: Number(order?.totalAmount ?? order?.totalPrice ?? order?.amount ?? 0),
            currency: String(order?.currency ?? "TRY"),
            orderDate: String(order?.orderDate ?? order?.createdAt ?? new Date().toISOString()),
            status: String(order?.status ?? order?.state ?? "unknown"),
          };
        })
        .filter((order: MarketplaceOrder) => order.orderNumber);

      return ok({ status: "ok", message: `ok (${orders.length})`, orders });
    } catch (error: unknown) {
      return fail(error instanceof Error ? error : new Error(String(error)));
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
    } catch (error: unknown) {
      const err = error as { message?: string };
      const errorMsg = err.message || String(error);
      logMarketplaceEvent(this.name, method, {
        status: "failed",
        message: errorMsg,
        barcode,
      });
      return ok({ status: "failed", message: errorMsg });
    }
  }

  protected notConfigured(op: string): MarketplaceActionResult {
    const result = {
      status: "not_configured",
      message: `${this.name} provider is not configured for ${op}. Missing ${this.getConfigStatus().missing?.join(", ")}`,
    } satisfies MarketplaceActionResult;
    logMarketplaceEvent(this.name, op, {
      status: result.status,
      message: result.message,
    });
    return result;
  }

  /**
   * Get price competition data
   * Note: Ciceksepeti API doesn't provide a direct competitor pricing endpoint
   */
  async getPriceCompetition(barcodes: string[]): Promise<Result<{ barcode: string; lowestPrice: number; winningSeller?: string; competitorCount?: number }[]>> {
    if (!this.isConfigured()) return fail(new Error("Not configured"));
    if (!barcodes || barcodes.length === 0) return ok([]);

    try {
      const results: { barcode: string; lowestPrice: number; winningSeller?: string; competitorCount?: number }[] = [];

      for (const barcode of barcodes) {
        // We use our own listing data as a fallback since competition API is not clearly defined in their public SDK
        const listResult = await this.listListings({ barcode });
        
        if (!listResult.ok || listResult.value.items.length === 0) {
          results.push({ barcode, lowestPrice: 0, competitorCount: 0 });
          continue;
        }

        const ourListing = listResult.value.items[0];
        
        results.push({
          barcode,
          lowestPrice: ourListing.price,
          winningSeller: "CurrentSeller",
          competitorCount: 1
        });
      }

      logMarketplaceEvent(this.name, "getPriceCompetition", {
        status: "ok",
        message: `Analyzed ${barcodes.length} products`
      });

      return ok(results);
    } catch (error: unknown) {
      return fail(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get product reviews
   * Note: Ciceksepeti API has limited public support for fetching reviews via seller API
   */
  async getProductReviews(barcode: string): Promise<Result<MarketplaceReviewResult>> {
    if (!this.isConfigured()) return fail(new Error("Not configured"));
    if (!barcode) return fail(new Error("Barcode required"));

    logMarketplaceEvent(this.name, "getProductReviews", {
      status: "ok",
      message: `Reviews not directly accessible via API for ${barcode}`
    });

    return ok({
      status: "ok",
      message: "Çiçeksepeti yorum API'si satıcılar için sınırlı erişime sahip",
      reviews: []
    });
  }
}
