import { getProviderConfigStatus } from "./config.js";
import { logMarketplaceEvent } from "./logger.js";
import {
  MarketplaceActionResult,
  MarketplaceConfigStatus,
  MarketplaceListResult,
  MarketplaceName,
  MarketplaceProductPayload,
  MarketplaceProvider,
  MarketplaceTokenStatus,
  MarketplaceUpdatePayload,
} from "./types.js";

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

  abstract refreshToken(): Promise<MarketplaceActionResult>;
  abstract upsertProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult>;
  abstract updateListing(payload: MarketplaceUpdatePayload): Promise<MarketplaceActionResult>;
  abstract syncFromProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult>;
  abstract listListings(params?: { status?: "active" | "inactive"; barcode?: string }): Promise<MarketplaceListResult>;
  abstract getNewOrders(params?: { startDate?: string; endDate?: string }): Promise<any>; // using any for now or I can use the type I defined

  // Optional method, can be overridden
  async getBatchRequestResult(_batchRequestId: string): Promise<MarketplaceActionResult> {
    return {
      status: "failed",
      message: "Batch operations not supported by this provider.",
    };
  }

  protected notConfigured(action: string): MarketplaceActionResult {
    const configStatus = this.getConfigStatus();
    const missingEnv = configStatus.missing.length > 0 ? ` Missing env vars: ${configStatus.missing.join(", ")}.` : "";
    const modeInfo = configStatus.mode === "mock" ? " Currently in mock mode." : "";
    const result = {
      status: "not_configured" as const,
      message: `${this.name} provider not configured for ${action}.${modeInfo}${missingEnv}`,
    };
    logMarketplaceEvent({
      provider: this.name,
      action,
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
