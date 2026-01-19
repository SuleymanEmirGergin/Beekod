
import { MarketplaceListing, MarketplaceActionResult, MarketplaceListResult, MarketplaceOrderResult, MarketplaceReviewResult, MarketplaceConfigStatus, MarketplaceTokenStatus, MarketplaceProductPayload, MarketplaceUpdatePayload } from "../../types.js";
import { Result } from "../../../utils/result.js";

// Add Health Check Result Type
export interface AdapterHealthResult {
    marketplace: string;
    status: "healthy" | "degraded" | "unhealthy" | "not_configured";
    latencyMs?: number;
    details?: string;
    timestamp: string;
}

export type MarketplaceProvider = {
  name: string; // Use string loosely or specific union if strict
  getConfigStatus: () => MarketplaceConfigStatus;
  getTokenStatus: () => MarketplaceTokenStatus;
  isConfigured: () => boolean;

  // New Health Check Method
  healthCheck: () => Promise<AdapterHealthResult>;

  refreshToken: () => Promise<Result<MarketplaceActionResult>>;
  upsertProduct: (payload: MarketplaceProductPayload) => Promise<Result<MarketplaceActionResult>>;
  updateListing: (payload: MarketplaceUpdatePayload) => Promise<Result<MarketplaceActionResult>>;
  syncFromProduct: (payload: MarketplaceProductPayload) => Promise<Result<MarketplaceActionResult>>;
  listListings: (params?: { status?: "active" | "inactive"; barcode?: string; autoPaginate?: boolean; page?: number; size?: number }) => Promise<Result<MarketplaceListResult>>;
  getNewOrders: (params?: { startDate?: string; endDate?: string }) => Promise<Result<MarketplaceOrderResult>>;
  getPriceCompetition?: (barcodes: string[]) => Promise<Result<{ barcode: string; lowestPrice: number; winningSeller?: string; competitorCount?: number }[]>>;
  getProductReviews?: (barcode: string) => Promise<Result<MarketplaceReviewResult>>;
  getBatchRequestResult?: (batchRequestId: string) => Promise<Result<MarketplaceActionResult>>;
  setCredentials?: (credentials: Record<string, any>) => void;
};
