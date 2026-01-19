
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adapterTestRunner } from "../../../src/services/marketplace/health/healthCheckRunner";
import { getMarketplaceProviders } from "../../../src/services/marketplace/index";
import { AdapterHealthResult } from "../../../src/services/marketplace/types";

// Mock providers to avoid real index which might load db/config
vi.mock("../../../src/services/marketplace/index", () => ({
    getMarketplaceProviders: vi.fn()
}));

describe("AdapterTestRunner", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("runs health checks for all providers and sorts them deterministically", async () => {
        const mockTrendyol = {
            name: "Trendyol",
            healthCheck: vi.fn().mockResolvedValue({
                marketplace: "Trendyol",
                status: "READY",
                configStatus: "READY",
                capabilityStatus: "READY",
                checks: [{ name: "Config", ok: true }],
                timestamp: "now"
            } as AdapterHealthResult)
        };

        const mockBadProvider = {
            name: "Hepsiburada", // Starts with H, should be before Trendyol
            healthCheck: vi.fn().mockRejectedValue(new Error("Connection failed"))
        };

        const mockLegacyProvider = {
            name: "ZLegacy", // Starts with Z, should be last
            // no healthCheck
        };

        // Return unsorted
        (getMarketplaceProviders as any).mockReturnValue([mockTrendyol, mockLegacyProvider, mockBadProvider]);

        const results = await adapterTestRunner.runAllChecks();

        expect(results).toHaveLength(3);

        // Verify Sorting
        expect(results[0].marketplace).toBe("Hepsiburada");
        expect(results[1].marketplace).toBe("Trendyol");
        expect(results[2].marketplace).toBe("ZLegacy");

        // Verify Statuses
        const trendyol = results.find(r => r.marketplace === "Trendyol");
        expect(trendyol?.status).toBe("READY");

        const bad = results.find(r => r.marketplace === "Hepsiburada");
        expect(bad?.status).toBe("NOT_READY");
        expect(bad?.checks?.[0]?.message).toContain("Exception: Connection failed");

        const legacy = results.find(r => r.marketplace === "ZLegacy");
        expect(legacy?.status).toBe("NOT_READY");
        expect(legacy?.checks?.[0]?.message).toContain("healthCheck method missing");
    });
});
