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
  ProductReview,
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

  isConfigured() {
    return this.getConfigStatus().configured;
  }

  async refreshToken(): Promise<Result<MarketplaceActionResult>> {
    return fail(new Error("Hepsiburada uses API key. Token refresh is not supported."));
  }

  async upsertProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("upsertProduct"));
    return this.updateListing(payload);
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
    } catch (error: any) {
      return fail(error);
    }
  }

  async listListings(params?: { status?: "active" | "inactive"; barcode?: string }): Promise<Result<MarketplaceListResult>> {
    if (!this.isConfigured()) {
      const nc = this.notConfigured("listListings");
      return ok({ status: nc.status, message: nc.message, items: [] });
    }
    if (isMarketplaceDryRun()) return ok({ status: "ok", message: "dry_run", items: [] });

    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID;
    const path = `/listings/merchantid/${merchantId}?limit=10&offset=0`;

    try {
      const response = await this.requestRaw("GET", path);
      if (!response.ok) return ok({ status: response.status, message: response.message, items: [] });

      const rawList = (response.data as any)?.listings || [];
      const items = rawList
        .map((item: any) => ({
          marketplace: this.name,
          barcode: item.merchantItemId || item.sku,
          title: item.productName || item.sku,
          price: Number(item.price),
          stock: Number(item.availableStock),
          currency: "TRY",
          active: item.isSalable,
        }))
        .filter((item: any) => {
          if (params?.barcode && item.barcode !== params.barcode) return false;
          return true;
        });

      return ok({ status: "ok", message: "ok", items });
    } catch (error: any) {
      return fail(error);
    }
  }

  async getProductReviews(barcode: string): Promise<Result<MarketplaceReviewResult>> {
    if (!this.isConfigured()) return fail(new Error("Not configured"));

    if (isMarketplaceDryRun()) {
       return ok({
        status: "ok",
        message: "dry_run",
        reviews: [
          {
            reviewerName: "Buse Y.",
            rating: 5,
            comment: "Hepsiburada farkı, paketleme harikaydı.",
            date: new Date().toISOString(),
            platform: this.name
          }
        ]
      });
    }

    return ok({
      status: "ok",
      message: "Syncing reviews from marketplace...",
      reviews: []
    });
  }

  async getNewOrders(params?: { startDate?: string; endDate?: string }): Promise<Result<MarketplaceOrderResult>> {
    if (!this.isConfigured()) {
      const nc = this.notConfigured("getNewOrders");
      return ok({ status: nc.status, message: nc.message, orders: [] });
    }

    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID;
    const path = `/packages/merchantid/${merchantId}`;

    try {
      const response = await this.requestRaw("GET", path + "?status=Open");
      if (!response.ok) return ok({ status: "failed", message: response.message, orders: [] });

      const rawList = (response.data as any) || [];
      const packages = Array.isArray(rawList) ? rawList : (rawList.packages || []);

      const orders: MarketplaceOrder[] = packages.map((pkg: any) => ({
        marketplace: this.name,
        orderNumber: pkg.orderNumber,
        customerName: pkg.customerName,
        customerEmail: "",
        customerPhone: "",
        customerAddress: [pkg.deliveryAddress?.address, pkg.deliveryAddress?.city].filter(Boolean).join(", "),
        items: (pkg.lines || []).map((line: any) => ({
          barcode: line.barcode,
          name: line.productName,
          price: Number(line.price?.amount || 0),
          quantity: line.quantity,
        })),
        totalAmount: Number(pkg.totalPrice?.amount || 0),
        currency: pkg.totalPrice?.currency || "TRY",
        orderDate: new Date(pkg.orderDate).toISOString(),
        status: pkg.status,
      }));

      return ok({ status: "ok", message: `Synced ${orders.length} orders`, orders });
    } catch (error: any) {
      return fail(error);
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

  private notSupported(action: string): MarketplaceActionResult {
    const result: MarketplaceActionResult = {
      status: "failed",
      message: `${this.name} provider action not supported: ${action}.`,
    };
    logMarketplaceEvent({
      provider: this.name,
      action,
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
    const baseUrl = process.env.HEPSIBURADA_BASE_URL || "https://listing-external.hepsiburada.com";
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
      const responseData = await requestJson<any>(endpoint, {
        method,
        headers: {
          "Authorization": `Basic ${Buffer.from(merchantId + ":" + apiKey).toString("base64")}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: body && method !== "GET" ? JSON.stringify(body) : undefined,
      });

      return { ok: true, status: "ok", message: "ok", data: responseData };
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || String(error);
      logMarketplaceEvent(this.name, "request_error", {
        status: "failed",
        message: errorMsg,
        barcode,
        path
      });
      return { ok: false, status: "failed", message: errorMsg };
    }
  }
}
