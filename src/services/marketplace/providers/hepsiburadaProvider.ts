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
import { BaseMarketplaceProvider } from "./baseProvider.js";
import { ok, fail, Result } from "../../../utils/result.js";

export class HepsiburadaProvider extends BaseMarketplaceProvider {
  name = "Hepsiburada" as const;

  getConfigStatus(): MarketplaceConfigStatus {
    return getProviderConfigStatus(this.name);
  }

  getTokenStatus(): MarketplaceTokenStatus {
    if (!this.isConfigured()) {
      return { status: "missing" };
    }
    return { status: "unknown" };
  }

  async healthCheck(): Promise<AdapterHealthResult> {
    const start = Date.now();
    const checks: Array<{ name: string; ok: boolean; message?: string }> = [];

    // 1. Config Check
    const config = this.getConfigStatus();
    const isConfigured = config.configured;
    checks.push({
      name: "Configuration",
      ok: isConfigured,
      message: isConfigured ? "Settings loaded" : `Missing: ${config.missing?.join(", ")}`
    });

    // 2. Credentials
    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID;
    if (isConfigured) {
      checks.push({ name: "Merchant ID", ok: !!merchantId, message: merchantId ? "Present" : "Missing Merchant ID" });
    }

    const configStatus = isConfigured ? "READY" : "NOT_READY";
    const capabilityStatus = "READY";

    const overallStatus = (configStatus === "READY" && capabilityStatus === "READY" && checks.every(c => c.ok))
      ? "READY"
      : (configStatus === "READY" ? "PARTIAL" : "NOT_READY");

    return {
      marketplace: this.name,
      status: overallStatus,
      configStatus,
      capabilityStatus,
      checks,
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString()
    };
  }

  isConfigured() {
    return this.getConfigStatus().configured;
  }

  async refreshToken(): Promise<Result<MarketplaceActionResult>> {
    return fail(new Error("Hepsiburada uses API key. Token refresh is not supported."));
  }

  async upsertProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("upsertProduct"));
    
    // If product exists (has HB SKU), update it. Otherwise, create new.
    if (payload.sku && payload.sku.startsWith("HB")) {
      return this.updateListing(payload);
    }
    
    // Create new product via import API
    return this.createProduct(payload);
  }

  /**
   * Create a new product on Hepsiburada using the product import API
   * POST /product/api/products/import
   */
  async createProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("createProduct"));
    if (!payload.barcode) return fail(new Error("barcode_required"));
    if (!payload.categoryId) return fail(new Error("categoryId_required"));

    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID;
    const apiKey = process.env.HEPSIBURADA_API_KEY;
    
    // Build product payload for Hepsiburada
    const productData = {
      merchantSku: payload.barcode,
      barcode: payload.barcode,
      productName: payload.name,
      categoryId: Number(payload.categoryId),
      brand: payload.brand || "Diğer",
      price: payload.price,
      listPrice: payload.listPrice || payload.price,
      vat: payload.vat ?? 20,
      stock: payload.stock ?? 0,
      description: payload.description || payload.name,
      images: payload.images?.map((url, i) => ({ 
        url, 
        order: i + 1 
      })) || [],
      attributes: payload.attributes ? Object.entries(payload.attributes).map(([key, value]) => ({
        name: key,
        value: String(value)
      })) : [],
    };

    try {
      // Hepsiburada uses mpmp.hepsiburada.com for product operations
      const endpoint = `https://mpmp.hepsiburada.com/product/api/products/import`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(merchantId + ":" + apiKey).toString("base64")}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify([productData]), // API expects array
      });

      const responseData = (await response.json()) as { trackingId?: string; errors?: unknown[] };
      
      if (!response.ok) {
        return fail(new Error(`HB API Error: ${response.status} - ${JSON.stringify(responseData)}`));
      }

      logMarketplaceEvent(this.name, "createProduct", {
        status: "ok",
        message: `Product created with trackingId: ${responseData.trackingId}`,
        barcode: payload.barcode,
      });

      return ok({
        status: "ok",
        message: "Product import started",
        requestId: responseData.trackingId,
        data: responseData,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return fail(new Error(`createProduct failed: ${errorMsg}`));
    }
  }

  /**
   * Check the status of a product import by tracking ID
   * GET /product/api/products/trackingId/{trackingId}
   */
  async checkProductStatus(trackingId: string): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("checkProductStatus"));

    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID;
    const apiKey = process.env.HEPSIBURADA_API_KEY;

    try {
      const endpoint = `https://mpmp.hepsiburada.com/product/api/products/trackingId/${trackingId}`;
      
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Authorization": `Basic ${Buffer.from(merchantId + ":" + apiKey).toString("base64")}`,
          "Accept": "application/json",
        },
      });

      const responseData = await response.json();
      
      return ok({
        status: "ok",
        message: "Status retrieved",
        data: responseData,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return fail(new Error(`checkProductStatus failed: ${errorMsg}`));
    }
  }

  async syncFromProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
    return this.upsertProduct(payload);
  }

  async updateListing(payload: MarketplaceUpdatePayload): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("updateListing"));
    if (!payload.barcode) return fail(new Error("barcode_required"));

    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID;
    const path = `/listings/merchantid/${merchantId}/inventory-uploads`;

    try {
      const result = await this.request(
        "POST",
        path,
        {
          sku: payload.barcode,
          price: payload.price,
          stock: payload.stock,
          status: payload.active ? "Active" : "Suspended",
        },
        payload.barcode,
      );
      return ok(result);
    } catch (error: unknown) {
      return fail(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async listListings(params?: { status?: "active" | "inactive"; barcode?: string; deep?: boolean; page?: number; pageSize?: number }): Promise<Result<MarketplaceListResult>> {
    if (!this.isConfigured()) {
      const nc = this.notConfigured("listListings");
      return ok({ status: nc.status, message: nc.message, items: [] });
    }
    if (isMarketplaceDryRun()) return ok({ status: "ok", message: "dry_run", items: [] });

    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID;
    const allItems: MarketplaceListing[] = [];
    const pageSize = params?.pageSize ?? 100;
    const maxPages = 100; // 100 * 100 = 10,000 products
    let offset = 0;
    let hasMore = true;
    let totalElements = 0;

    try {
      while (hasMore && (offset / pageSize) < maxPages) {
        const path = `/listings/merchantid/${merchantId}?limit=${pageSize}&offset=${offset}`;
        const response = await this.requestRaw("GET", path);
        
        if (!response.ok) {
          if (offset === 0) return ok({ status: response.status, message: response.message, items: [] });
          break;
        }

        const data = response.data as { listings?: Record<string, unknown>[]; totalElements?: number };
        const rawList = data?.listings || [];
        totalElements = data?.totalElements || 0;

        const pageItems: MarketplaceListing[] = rawList
          .map((item) => ({
            marketplace: this.name,
            barcode: String(item.merchantItemId || item.sku || ""),
            title: String(item.productName || item.sku || ""),
            price: Number(item.price || 0),
            stock: Number(item.availableStock || 0),
            currency: "TRY",
            active: Boolean(item.isSalable),
          }))
          .filter((item) => {
            if (params?.barcode && item.barcode !== params.barcode) return false;
            return true;
          });

        allItems.push(...pageItems);
        offset += pageSize;
        hasMore = rawList.length === pageSize && allItems.length < totalElements;
      }

      return ok({ status: "ok", message: `Fetched ${allItems.length} products`, items: allItems });
    } catch (error: unknown) {
      return fail(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get price competition data for given barcodes
   * Merchant SKU based price analysis across sellers
   */
  async getPriceCompetition(barcodes: string[]): Promise<Result<{ barcode: string; lowestPrice: number; winningSeller?: string; competitorCount?: number }[]>> {
    if (!this.isConfigured()) return fail(new Error("Not configured"));
    if (!barcodes || barcodes.length === 0) return ok([]);

    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID;
    if (!merchantId) return fail(new Error("Missing merchant ID"));

    try {
      const results: { barcode: string; lowestPrice: number; winningSeller?: string; competitorCount?: number }[] = [];

      for (const barcode of barcodes) {
        // Query listings for this SKU
        const path = `/listings/merchantid/${merchantId}?sku=${encodeURIComponent(barcode)}&size=20`;
        const response = await this.requestRaw("GET", path);

        if (!response.ok || !response.data) {
          results.push({ barcode, lowestPrice: 0, competitorCount: 0 });
          continue;
        }

        const data = response.data as { listings?: Array<{ price?: number; merchantId?: string }> };
        const listings = data.listings || [];

        if (listings.length === 0) {
          results.push({ barcode, lowestPrice: 0, competitorCount: 0 });
          continue;
        }

        const prices = listings
          .map(l => l.price || 0)
          .filter(p => p > 0);

        const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const winningListing = listings.find(l => l.price === lowestPrice);

        results.push({
          barcode,
          lowestPrice,
          winningSeller: winningListing?.merchantId,
          competitorCount: listings.length
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

  async getProductReviews(barcode: string): Promise<Result<MarketplaceReviewResult>> {
    if (!this.isConfigured()) return fail(new Error("Not configured"));
    if (!barcode) return fail(new Error("Barcode required"));

    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID;
    if (!merchantId) return fail(new Error("Missing merchant ID"));

    if (isMarketplaceDryRun()) {
       return ok({
        status: "ok",
        message: "dry_run",
        reviews: [
          {
            id: "dry_hb_1",
            reviewerName: "Buse Y.",
            rating: 5,
            comment: "Hepsiburada farkı, paketleme harikaydı.",
            date: new Date().toISOString(),
            platform: this.name
          },
          {
            id: "dry_hb_2",
            reviewerName: "Mehmet K.",
            rating: 4,
            comment: "Ürün güzel ama kargo biraz yavaştı.",
            date: new Date(Date.now() - 86400000).toISOString(),
            platform: this.name
          }
        ]
      });
    }

    try {
      // First, get the product listing to find the Hepsiburada product  ID
      const listPath = `/listings/merchantid/${merchantId}?sku=${encodeURIComponent(barcode)}&size=1`;
      const listResponse = await this.requestRaw("GET", listPath);

      if (!listResponse.ok || !listResponse.data) {
        return ok({ status: "failed", message: "Product not found", reviews: [] });
      }

      const listData = listResponse.data as { listings?: Array<{ hbSKU?: string; productId?: string }> };
      const product = listData.listings?.[0];
      const productId = product?.hbSKU || product?.productId;

      if (!productId) {
        return ok({ status: "failed", message: "Product ID not found", reviews: [] });
      }

      // Attempt to fetch reviews (Note: Hepsiburada doesn't provide a direct review API for sellers)
      // This is a placeholder for when/if the API becomes available
      logMarketplaceEvent(this.name, "getProductReviews", {
        status: "ok",
        message: `Review API not available for product ${barcode}`
      });

      return ok({
        status: "ok",
        message: "Hepsiburada yorum API'si seller hesaplar için mevcut değil",
        reviews: []
      });
    } catch (error: unknown) {
      return fail(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async getNewOrders(_params?: { startDate?: string; endDate?: string }): Promise<Result<MarketplaceOrderResult>> {
    if (!this.isConfigured()) {
      const nc = this.notConfigured("getNewOrders");
      return ok({ status: nc.status, message: nc.message, orders: [] });
    }

    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID;
    const path = `/packages/merchantid/${merchantId}`;

    try {
      const response = await this.requestRaw("GET", path + "?status=Open");
      if (!response.ok) return ok({ status: "failed", message: response.message, orders: [] });

      const rawData = response.data;
      const packages = Array.isArray(rawData) ? rawData : (rawData && typeof rawData === "object" && "packages" in rawData ? (rawData as { packages: Record<string, unknown>[] }).packages : []);

      const orders: MarketplaceOrder[] = (packages as any[]).map((pkg) => ({
        marketplace: this.name,
        orderNumber: String(pkg.orderNumber),
        customerName: String(pkg.customerName || ""),
        customerEmail: "",
        customerPhone: "",
        customerAddress: [pkg.deliveryAddress?.address, pkg.deliveryAddress?.city].filter(Boolean).join(", "),
        items: ((pkg.lines || []) as any[]).map((line) => ({
          barcode: String(line.barcode),
          name: String(line.productName),
          price: Number(line.price?.amount || 0),
          quantity: Number(line.quantity),
        })),
        totalAmount: Number(pkg.totalPrice?.amount || 0),
        currency: String(pkg.totalPrice?.currency || "TRY"),
        orderDate: new Date(pkg.orderDate).toISOString(),
        status: String(pkg.status),
      }));

      return ok({ status: "ok", message: `Synced ${orders.length} orders`, orders });
    } catch (error: unknown) {
      return fail(error instanceof Error ? error : new Error(String(error)));
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

  private notSupported(action: string): MarketplaceActionResult {
    const result: MarketplaceActionResult = {
      status: "failed",
      message: `${this.name} provider action not supported: ${action}.`,
    };
    logMarketplaceEvent(this.name, action, {
      status: result.status,
      message: result.message,
    });
    return result;
  }

  private async request(
    method: "POST" | "PUT",
    path: string,
    body: unknown,
    barcode?: string,
  ): Promise<MarketplaceActionResult> {
    const response = await this.requestRaw(method, path, body, barcode);
    if (!response.ok) return { status: response.status, message: response.message };
    return {
      status: "ok",
      message: response.message,
      requestId: response.requestId,
    };
  }

  private async requestRaw(
    method: "GET" | "POST" | "PUT",
    path: string,
    body?: unknown,
    barcode?: string,
  ): Promise<{
    ok: boolean;
    status: "ok" | "failed" | "not_configured";
    message: string;
    data?: unknown;
    requestId?: string;
  }> {
    const apiKey = process.env.HEPSIBURADA_API_KEY;
    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID;
    const baseUrl = process.env.HEPSIBURADA_API_BASE || process.env.HEPSIBURADA_BASE_URL || "https://listing-external.hepsiburada.com";
    const endpoint = `${baseUrl}${path}`;

    if (!apiKey || !merchantId) {
      return { 
        ok: false, 
        status: "not_configured", 
        message: `Hepsiburada configuration missing (${!apiKey ? 'API_KEY' : 'MERCHANT_ID'})` 
      };
    }
    
    if (isMarketplaceDryRun()) return { ok: true, status: "ok", message: "dry_run", data: { dryRun: true } };

    try {
      const responseData = await requestJson<Record<string, unknown>>(endpoint, {
        method,
        headers: {
          Authorization: `Basic ${Buffer.from(merchantId + ":" + apiKey).toString("base64")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: body && method !== "GET" ? JSON.stringify(body) : undefined,
      });

      return { ok: true, status: "ok", message: "ok", data: responseData };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg = err.response?.data?.message || err.message || String(error);
      logMarketplaceEvent(this.name, "request_error", {
        status: "failed",
        message: errorMsg,
        barcode,
        path,
      });
      return { ok: false, status: "failed", message: errorMsg };
    }
  }
}
