
import { getMarketplaceProviders } from "../index.js";
import { AdapterHealthResult } from "../types.js";
import { logger } from "../../../logger.js";

export class AdapterTestRunner {
    async runAllChecks(): Promise<AdapterHealthResult[]> {
        const providers = getMarketplaceProviders();
        const results: AdapterHealthResult[] = [];

        logger.info("adapter_test_runner.start", { count: providers.length });

        for (const provider of providers) {
            try {
                if (provider.healthCheck) {
                    const result = await provider.healthCheck();
                    results.push(result);
                } else {
                    results.push({
                        marketplace: provider.name,
                        status: "degraded",
                        details: "Health check not implemented",
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error: any) {
                results.push({
                    marketplace: provider.name,
                    status: "unhealthy",
                    details: error.message || String(error),
                    timestamp: new Date().toISOString()
                });
            }
        }

        logger.info("adapter_test_runner.complete", { results });
        return results;
    }
}

export const adapterTestRunner = new AdapterTestRunner();
