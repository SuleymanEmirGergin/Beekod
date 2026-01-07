import { MarketplaceProvider, MarketplaceConfigStatus, MarketplaceActionResult, MarketplaceProductPayload, MarketplaceTokenStatus, MarketplaceListResult, MarketplaceUpdatePayload, MarketplaceOrderResult } from "./types.js";
import { getProviderConfigStatus } from "./config.js";
import { logMarketplaceEvent } from "./logger.js";

interface PazaramaConfig {
  apiKey: string;
  apiSecret: string;
  apiUrl: string;
}

export class PazaramaProvider implements MarketplaceProvider {
  name = "Pazarama" as const;

  getConfigStatus(): MarketplaceConfigStatus {
    const baseStatus = getProviderConfigStatus(this.name);
    // Assuming PAZARAMA_API_KEY / SECRET
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
    // Assume API Key based, no refresh needed or it's handled internally
    return { status: "failed", message: "Not applicable" };
  }

  private getHeaders() {
    return {
      "Authorization": `Basic ${Buffer.from(process.env.PAZARAMA_API_KEY + ":" + process.env.PAZARAMA_API_SECRET).toString('base64')}`,
      "Content-Type": "application/json"
    };
  }

  async upsertProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
    if (!this.isConfigured()) return { status: "not_configured", message: "Config missing" };

    const body = {
      items: [
        {
          code: payload.barcode,
          name: payload.name,
          displayName: payload.name,
          description: payload.name,
          brandName: "Other", // Needs mapping
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
      // Pazarama Batch Create Endpoint
      const res = await fetch("https://api.pazarama.com/v1/product/create", {
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
    // Similar batch logic for updates
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
      const res = await fetch("https://api.pazarama.com/v1/product/price-stock", { // Hypothetical endpoint
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

  async listListings(): Promise<MarketplaceListResult> {
    return { status: "ok", items: [], message: "Not implemented" };
  }

  async getNewOrders(): Promise<MarketplaceOrderResult> {
    return { status: "ok", orders: [], message: "Not implemented" };
  }

  // Pazarama Specific: Check Batch Status
  async getBatchRequestResult(batchRequestId: string): Promise<MarketplaceActionResult> {
    if (!this.isConfigured()) return { status: "not_configured", message: "Config missing" };

    try {
      const res = await fetch(`https://api.pazarama.com/v1/batch/status/${batchRequestId}`, {
        headers: this.getHeaders()
      });
      const data = await res.json();
      return { status: "ok", message: "Batch status retrieved", data };
    } catch (e: any) {
      return { status: "failed", message: e.message };
    }
  }
}
