import { getProviderConfigStatus } from "./config.js";
import { logMarketplaceEvent } from "./logger.js";
import {
  MarketplaceActionResult,
  MarketplaceConfigStatus,
  MarketplaceListResult,
  MarketplaceName,
  MarketplaceProductPayload,
  MarketplaceProvider,
  MarketplaceOrderResult,
  MarketplaceTokenStatus,
  MarketplaceUpdatePayload,
} from "./types.js";

export class StubMarketplaceProvider implements MarketplaceProvider {
  constructor(public name: MarketplaceName) {}

  getConfigStatus(): MarketplaceConfigStatus {
    return getProviderConfigStatus(this.name);
  }

  getTokenStatus(): MarketplaceTokenStatus {
    return { status: "unknown" };
  }

  async getNewOrders(params?: { startDate?: string; endDate?: string }): Promise<MarketplaceOrderResult> {
    return { status: "ok", message: "Mock order sync", orders: [] };
  }

  isConfigured() {
    return this.getConfigStatus().configured;
  }

  async refreshToken(): Promise<MarketplaceActionResult> {
    return this.notConfigured("refreshToken");
  }

  async upsertProduct(_payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
    return this.notConfigured("upsertProduct");
  }

  async updateListing(_payload: MarketplaceUpdatePayload): Promise<MarketplaceActionResult> {
    return this.notConfigured("updateListing");
  }

  async syncFromProduct(_payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
    return this.notConfigured("syncFromProduct");
  }

  async listListings(_params?: { status?: "active" | "inactive"; barcode?: string }): Promise<MarketplaceListResult> {
    return {
      status: "not_configured",
      message: `${this.name} provider not configured for listListings.`,
      items: [],
    };
  }

  private notConfigured(action: string): MarketplaceActionResult {
    const result: MarketplaceActionResult = {
      status: "not_configured",
      message: `${this.name} provider not configured for ${action}.`,
    };
    logMarketplaceEvent({
      provider: this.name,
      action,
      status: result.status,
      message: result.message,
    });
    return result;
  }
}
