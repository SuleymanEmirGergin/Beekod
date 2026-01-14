import { getProviderConfigStatus, logMarketplaceEvent } from "../../../config.js";
import { ok, fail, Result } from "../../../utils/result.js";
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
} from "../types.js";

export class StubMarketplaceProvider implements MarketplaceProvider {
  constructor(public name: MarketplaceName) {}

  getConfigStatus(): MarketplaceConfigStatus {
    return getProviderConfigStatus(this.name);
  }

  getTokenStatus(): MarketplaceTokenStatus {
    return { status: "unknown" };
  }

  async getNewOrders(params?: { startDate?: string; endDate?: string }): Promise<Result<MarketplaceOrderResult>> {
    return ok({ status: "ok", message: "Mock order sync", orders: [] });
  }

  isConfigured() {
    return this.getConfigStatus().configured;
  }

  async refreshToken(): Promise<Result<MarketplaceActionResult>> {
    return ok(this.notConfigured("refreshToken"));
  }

  async upsertProduct(_payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
    return ok(this.notConfigured("upsertProduct"));
  }

  async updateListing(_payload: MarketplaceUpdatePayload): Promise<Result<MarketplaceActionResult>> {
    return ok(this.notConfigured("updateListing"));
  }

  async syncFromProduct(_payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
    return ok(this.notConfigured("syncFromProduct"));
  }

  async listListings(_params?: { status?: "active" | "inactive"; barcode?: string }): Promise<Result<MarketplaceListResult>> {
    return ok({
      status: "not_configured",
      message: `${this.name} provider not configured for listListings.`,
      items: [],
    });
  }

  private notConfigured(action: string): MarketplaceActionResult {
    const result: MarketplaceActionResult = {
      status: "not_configured",
      message: `${this.name} provider not configured for ${action}.`,
    };
    logMarketplaceEvent(this.name, action, {
      status: result.status,
      message: result.message,
    });
    return result;
  }
}
