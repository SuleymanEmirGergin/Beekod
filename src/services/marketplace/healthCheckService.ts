import { getMarketplaceProviders } from "./index.js";
import { credentialService } from "../credentialService.js";
import { logger } from "../../logger.js";
import { notificationService } from "../notificationService.js";

export interface HealthCheckResult {
    marketplace: string;
    configured: boolean;
    tokenStatus: string;
    connectivity: "ok" | "failed" | "untested";
    message?: string;
    critical: boolean;
}

export class HealthCheckService {
    /**
     * Executes health checks for all registered marketplace providers.
     */
    async runAllChecks(): Promise<HealthCheckResult[]> {
        const providers = getMarketplaceProviders();
        const results: HealthCheckResult[] = [];

        for (const provider of providers) {
            const result: HealthCheckResult = {
                marketplace: provider.name,
                configured: provider.isConfigured(),
                tokenStatus: provider.getTokenStatus().status,
                connectivity: "untested",
                critical: false
            };

            if (result.configured) {
                // 1. Verify credential format
                const credStatus = credentialService.inspect(provider.name);
                if (!credStatus.isValid) {
                    result.connectivity = "failed";
                    result.message = "Invalid credential format detected.";
                    result.critical = true;
                } else {
                    // 2. Perform connectivity check (lightweight)
                    try {
                        const listResult = await provider.listListings({ size: 1 });
                        if (listResult.ok && listResult.value.status === "ok") {
                            result.connectivity = "ok";
                        } else {
                            result.connectivity = "failed";
                            result.message = listResult.ok ? listResult.value.message : listResult.error.message;
                            // Expired tokens are critical for operational stability
                            if (result.tokenStatus === "expired") {
                                result.critical = true;
                                
                                // AUTO-FIX: If it's Pazarama, try to refresh immediately
                                if (provider.name === "Pazarama" && typeof (provider as any).refreshToken === "function") {
                                    logger.info("marketplace.health_check.auto_refresh_pazarama");
                                    const refreshRes = await (provider as any).refreshToken();
                                    if (refreshRes.ok) {
                                        result.connectivity = "ok";
                                        result.message = "Token was expired but successfully auto-refreshed.";
                                        result.critical = false;
                                        result.tokenStatus = "valid";
                                    } else {
                                        result.message = `Auto-refresh failed: ${refreshRes.error.message}`;
                                    }
                                }
                            }
                        }
                    } catch (err: any) {
                        result.connectivity = "failed";
                        result.message = err.message;
                        result.critical = true;
                    }
                }
            }

            results.push(result);
        }

        // Report critical failures
        const criticalFailures = results.filter(r => r.critical);
        if (criticalFailures.length > 0) {
            await this.reportFailures(criticalFailures);
        }

        return results;
    }

    private async reportFailures(failures: HealthCheckResult[]) {
        const summary = failures.map(f => `${f.marketplace}: ${f.message}`).join("\n");
        logger.error("marketplace.health_check.critical_failures", { failures });
        
        await notificationService.notify({
            type: "system",
            title: "Marketplace API Critical Failure",
            message: `One or more marketplace APIs are down or misconfigured:\n${summary}`
        });
    }
}

export const healthCheckService = new HealthCheckService();
