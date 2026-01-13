import { MarketplaceProvider } from "./types.js";
import { TrendyolProvider } from "./providers/trendyolProvider.js";
import { N11Provider } from "./providers/n11Provider.js";
import { HepsiburadaProvider } from "./providers/hepsiburadaProvider.js";
import { PazaramaProvider } from "./providers/pazaramaProvider.js";
import { PttavmProvider } from "./providers/pttavmProvider.js";
import { CiceksepetiProvider } from "./providers/ciceksepetiProvider.js";
import { logger } from "../../logger.js";

export type SyncTarget = "Trendyol" | "N11" | "Hepsiburada" | "Pazarama" | "PttAVM" | "Ciceksepeti" | "all";

export interface SyncPriceInput {
  barcode: string;
  price: number;
  stock?: number;
  targets?: SyncTarget[];
  requireConfirmation?: boolean;
}

export interface SyncResult {
  success: boolean;
  results: Array<{
    marketplace: string;
    status: "ok" | "failed" | "not_configured" | "skipped";
    message: string;
  }>;
}

const providers: MarketplaceProvider[] = [
  new TrendyolProvider(),
  new N11Provider(),
  new HepsiburadaProvider(),
  new PazaramaProvider(),
  new PttavmProvider(),
  new CiceksepetiProvider(),
];

/**
 * Sync price and stock across multiple marketplaces
 * @param input - Sync configuration
 * @returns Sync results for each marketplace
 */
export async function syncPriceStock(input: SyncPriceInput): Promise<SyncResult> {
  const { barcode, price, stock, targets = ["all"] } = input;

  logger.info("sync.start", { barcode, price, stock, targets });

  const results: SyncResult["results"] = [];
  const shouldSyncAll = targets.includes("all");

  // Determine which providers to sync
  const selectedProviders = providers.filter((provider) => {
    if (shouldSyncAll) return true;
    return targets.includes(provider.name as SyncTarget);
  });

  // Execute updates in parallel with retry logic
  const promises = selectedProviders.map(async (provider) => {
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: unknown = null;

    while (attempts < maxAttempts) {
      try {
        attempts++;

        // Check if provider is configured
        if (!provider.isConfigured()) {
          return {
            marketplace: provider.name,
            status: "not_configured" as const,
            message: `${provider.name} is not configured`,
          };
        }

        // Attempt update
        const result = await provider.updateListing({
          barcode,
          price,
          stock,
        });

        // Map MarketplaceActionStatus to SyncResult status
        const mappedStatus: "ok" | "failed" | "not_configured" | "skipped" =
          result.status === "ok" ? "ok" : result.status === "not_configured" ? "not_configured" : "failed";

        if (mappedStatus === "ok") {
          return {
            marketplace: provider.name,
            status: mappedStatus,
            message: result.message,
          };
        }

        // If it failed, we might want to retry depending on the message
        // For now, retry all failures until maxAttempts
        lastError = new Error(result.message);

        if (attempts < maxAttempts) {
          logger.warn("sync.retry", { provider: provider.name, barcode, attempt: attempts });
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts)); // Backoff
        }
      } catch (error) {
        lastError = error;
        logger.error("sync.provider_error", { provider: provider.name, barcode, attempt: attempts, error });

        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
        }
      }
    }

    return {
      marketplace: provider.name,
      status: "failed" as const,
      message: lastError instanceof Error ? lastError.message : "Sync failed after multiple attempts",
    };
  });

  results.push(...(await Promise.all(promises)));

  const successCount = results.filter((r) => r.status === "ok").length;
  const failedCount = results.filter((r) => r.status === "failed").length;

  logger.info("sync.complete", { barcode, successCount, failedCount, total: results.length });

  return {
    success: failedCount === 0,
    results,
  };
}

/**
 * Sync multiple products across marketplaces
 * @param barcodes - List of barcodes to sync
 * @returns Combined sync results
 */
export async function bulkSyncPriceStock(barcodes: string[]): Promise<SyncResult[]> {
  const { getProductByBarcode } = await import("../product/productService.js");

  const syncPromises = barcodes.map(async (barcode) => {
    try {
      const product = await getProductByBarcode(barcode);
      if (!product) {
        return {
          success: false,
          results: [{ marketplace: "all", status: "failed" as const, message: "Product not found" }],
        };
      }
      return await syncPriceStock({
        barcode,
        price: product.price,
        stock: product.stock,
        targets: ["all"],
      });
    } catch (error) {
      return {
        success: false,
        results: [
          {
            marketplace: "all",
            status: "failed" as const,
            message: error instanceof Error ? error.message : "Sync failed",
          },
        ],
      };
    }
  });

  return await Promise.all(syncPromises);
}
/**
 * Returns marketplace names that are currently configured (credentials present)
 * Used by routes/UI to show which marketplaces are active.
 */
export function getConfiguredMarketplaces(): SyncTarget[] {
  return providers
    .filter((p) => {
      try {
        return p.isConfigured();
      } catch {
        return false;
      }
    })
    .map((p) => p.name as SyncTarget);
}
