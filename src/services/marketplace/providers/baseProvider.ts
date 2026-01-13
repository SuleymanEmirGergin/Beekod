import { getProviderConfigStatus, logMarketplaceEvent } from "../../../config.js";
import {
  MarketplaceActionResult,
  MarketplaceConfigStatus,
  MarketplaceListResult,
  MarketplaceName,
  MarketplaceOrderResult,
  MarketplaceProductPayload,
  MarketplaceProvider,
  MarketplaceTokenStatus,
  MarketplaceUpdatePayload,
} from "../types.js";
import { ok, fail, Result } from "../../../utils/result.js";

export abstract class BaseMarketplaceProvider implements MarketplaceProvider {
  abstract name: MarketplaceName;

  getConfigStatus(): MarketplaceConfigStatus {
    return getProviderConfigStatus(this.name);
  }

  getTokenStatus(): MarketplaceTokenStatus {
    if (!this.isConfigured()) {
      return { status: "missing" };
    }
    return { status: "unknown" };
  }

  isConfigured(): boolean {
    return this.getConfigStatus().configured;
  }

  abstract refreshToken(): Promise<Result<MarketplaceActionResult>>;
  abstract upsertProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>>;
  abstract updateListing(payload: MarketplaceUpdatePayload): Promise<Result<MarketplaceActionResult>>;
  abstract syncFromProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>>;
  abstract listListings(params?: {
    status?: "active" | "inactive";
    barcode?: string;
  }): Promise<Result<MarketplaceListResult>>;
  abstract getNewOrders(params?: { startDate?: string; endDate?: string }): Promise<Result<MarketplaceOrderResult>>;

  // Optional method, can be overridden
  async getBatchRequestResult(_batchRequestId: string): Promise<Result<MarketplaceActionResult>> {
    return fail(new Error("Batch operations not supported by this provider."));
  }

  protected notConfigured(action: string): MarketplaceActionResult {
    const configStatus = this.getConfigStatus();
    const missingEnv = configStatus.missing.length > 0 ? ` Missing env vars: ${configStatus.missing.join(", ")}.` : "";
    const modeInfo = configStatus.mode === "mock" ? " Currently in mock mode." : "";
    const result = {
      status: "not_configured" as const,
      message: `${this.name} provider not configured for ${action}.${modeInfo}${missingEnv}`,
    };
    logMarketplaceEvent(this.name, action, {
      status: result.status,
      message: result.message,
      mode: configStatus.mode,
      missing: configStatus.missing,
    });
    return result;
  }

  protected parseEnvNumber(raw: string | undefined, fallback: number, min: number): number {
    if (!raw || !raw.trim()) {
      return fallback;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.max(min, Math.trunc(value));
  }
}
