import { logger } from "../logger.js";
import { MarketplaceActionResult, MarketplaceName } from "../services/marketplace/types.js";

type MarketplaceLogEntry = {
  provider: MarketplaceName;
  action: string;
  status: MarketplaceActionResult["status"];
  message: string;
  barcode?: string;
  requestId?: string;
  mode?: "live" | "mock";
  missing?: string[];
};

export function logMarketplaceEvent(entry: MarketplaceLogEntry) {
  logger.info("marketplace.event", {
    provider: entry.provider,
    action: entry.action,
    status: entry.status,
    barcode: entry.barcode,
    requestId: entry.requestId,
    message: entry.message,
    mode: entry.mode,
    missing: entry.missing,
  });
}
