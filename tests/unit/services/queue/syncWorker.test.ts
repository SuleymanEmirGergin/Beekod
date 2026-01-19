
import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncProcessor } from "../../../../src/queue/syncProcessor";
import * as syncService from "../../../../src/services/marketplace/syncService";

// Mock dependencies
vi.mock("../../../../src/services/marketplace/syncService");
vi.mock("../../../../src/logger", () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        child: vi.fn().mockReturnThis()
    }
}));

describe("Sync Worker Processor", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("processes job and calls syncPriceStock", async () => {
        const jobData = { barcode: "123", price: 100, targets: ["Trendyol"] };
        const mockJob = { id: "job-1", data: jobData } as any;

        const syncSpy = vi.spyOn(syncService, "syncPriceStock").mockResolvedValue({
            success: true,
            results: [{ marketplace: "Trendyol", status: "ok", message: "Updated" }]
        });

        const result = await syncProcessor(mockJob);

        expect(syncSpy).toHaveBeenCalledWith({
            barcode: "123",
            price: 100,
            stock: undefined,
            targets: ["Trendyol"]
        });
        expect(result.success).toBe(true);
    });

    it("logs partial failures but does not throw if at least one succeeded", async () => {
        const jobData = { barcode: "123", price: 100, targets: ["Trendyol", "Hepsiburada"] };
        const mockJob = { id: "job-2", data: jobData } as any;

        vi.spyOn(syncService, "syncPriceStock").mockResolvedValue({
            success: true,
            results: [
                { marketplace: "Trendyol", status: "ok", message: "Updated" },
                { marketplace: "Hepsiburada", status: "failed", message: "Network Error" }
            ]
        });

        const result = await syncProcessor(mockJob);
        expect(result.success).toBe(true);
    });

    it("throws if all targets fail", async () => {
        const jobData = { barcode: "123", price: 100, targets: ["Trendyol"] };
        const mockJob = { id: "job-3", data: jobData } as any;

        vi.spyOn(syncService, "syncPriceStock").mockResolvedValue({
            success: false,
            results: [{ marketplace: "Trendyol", status: "failed", message: "Fatal Error" }]
        });

        await expect(syncProcessor(mockJob)).rejects.toThrow("All targets failed sync");
    });
});
