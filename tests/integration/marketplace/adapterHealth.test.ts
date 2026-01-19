
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adapterTestRunner } from "../../../src/services/marketplace/health/healthCheckRunner";
import { getMarketplaceProviders } from "../../../src/services/marketplace/index";

// Mock providers to avoid real index which might load db/config
vi.mock("../../../src/services/marketplace/index", () => ({
    getMarketplaceProviders: vi.fn()
}));

describe("AdapterTestRunner", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("runs health checks for all providers", async () => {
        const mockTrendyol = {
            name: "Trendyol",
            healthCheck: vi.fn().mockResolvedValue({
                marketplace: "Trendyol",
                status: "healthy",
                timestamp: "now"
            })
        };
        const mockBadProvider = {
            name: "BadOne",
            healthCheck: vi.fn().mockRejectedValue(new Error("Connection failed"))
        };
        const mockLegacyProvider = {
            name: "Legacy",
            // no healthCheck
        };

        (getMarketplaceProviders as any).mockReturnValue([mockTrendyol, mockBadProvider, mockLegacyProvider]);

        const results = await adapterTestRunner.runAllChecks();

        expect(results).toHaveLength(3);

        const trendyol = results.find(r => r.marketplace === "Trendyol");
        expect(trendyol?.status).toBe("healthy");

        const bad = results.find(r => r.marketplace === "BadOne");
        expect(bad?.status).toBe("unhealthy");
        expect(bad?.details).toContain("Connection failed");

        const legacy = results.find(r => r.marketplace === "Legacy");
        expect(legacy?.status).toBe("degraded");
    });
});
