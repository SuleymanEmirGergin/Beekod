
import { getMarketplaceProviders } from "../index.js";
import { AdapterHealthResult, MarketplaceId } from "../types.js";
import { logger } from "../../../logger.js";

export class AdapterTestRunner {
    async runAllChecks(): Promise<AdapterHealthResult[]> {
        const providers = getMarketplaceProviders();
        // Sort providers deterministically by name to ensure consistent output order
        providers.sort((a, b) => a.name.localeCompare(b.name));

        const results: AdapterHealthResult[] = [];

        logger.info("adapter_test_runner.start", { count: providers.length });

        for (const provider of providers) {
            try {
                if (typeof provider.healthCheck === 'function') {
                    // We assume the provider returns a compliant AdapterHealthResult
                    // but we catch errors just in case.
                    const result = await provider.healthCheck();
                    results.push(result);
                } else {
                    // Fallback if healthCheck is not implemented yet
                    results.push({
                        marketplace: provider.name as MarketplaceId,
                        status: "NOT_READY",
                        configStatus: "NOT_READY",
                        capabilityStatus: "NOT_READY",
                        checks: [{ name: "Implementation", ok: false, message: "healthCheck method missing on provider" }],
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error: any) {
                // Catch unhandled exceptions during health check
                results.push({
                    marketplace: provider.name as MarketplaceId,
                    status: "NOT_READY",
                    configStatus: "NOT_READY", // Assume not ready on error
                    capabilityStatus: "NOT_READY",
                    checks: [{ name: "Execution", ok: false, message: `Exception: ${error.message || String(error)}` }],
                    details: { error: String(error), stack: error.stack },
                    timestamp: new Date().toISOString()
                });
            }
        }

        logger.info("adapter_test_runner.complete", {
            count: results.length,
            summary: results.map(r => `${r.marketplace}:${r.status}`)
        });

        return results;
    }
}

export const adapterTestRunner = new AdapterTestRunner();
