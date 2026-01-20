
import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateTryOnVideo, generateVideoMedia, VideoFailedError } from "../../../../src/services/videoService";
import { modelService } from "../../../../src/services/media/modelService";
import { qualityGateService } from "../../../../src/services/media/qualityGateService";
import * as visualIntelligenceService from "../../../../src/services/visualIntelligenceService";
import * as productService from "../../../../src/services/product/productService";

// We need the REAL Error class, but mock the service methods
import { QualityRejectedError } from "../../../../src/services/media/qualityGateService";

vi.mock("../../../../src/services/media/modelService");
vi.mock("../../../../src/services/media/qualityGateService", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../../../src/services/media/qualityGateService")>();
    return {
        ...actual,
        qualityGateService: {
            validate: vi.fn(),
            scoreImage: vi.fn()
        }
    };
});
vi.mock("../../../../src/services/visualIntelligenceService");
vi.mock("../../../../src/services/product/productService");

describe("Media Pipeline", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.ENABLE_STOCK_VIDEO_FALLBACK = 'false';
    });

    describe("Determinism", () => {
        it("uses explicit baseModelId when provided", async () => {
            const mockProduct = { ok: true, value: { category: "Tops", images: ["img.jpg"] } };
            const mockModel = { imageUrl: "model.jpg" };

            vi.spyOn(productService, "getProductByBarcode").mockResolvedValue(mockProduct as any);
            vi.spyOn(modelService, "getBaseModel").mockResolvedValue(mockModel as any);
            vi.spyOn(visualIntelligenceService, "runVirtualTryOn").mockResolvedValue("result.jpg");
            vi.spyOn(qualityGateService, "validate").mockResolvedValue(true);
            vi.spyOn(visualIntelligenceService, "generateProductVideo").mockResolvedValue({ videoUrl: "vid.mp4" } as any);

            await generateTryOnVideo("123", { baseModelId: 99 });

            expect(modelService.getBaseModel).toHaveBeenCalledWith(99);
            expect(visualIntelligenceService.runVirtualTryOn).toHaveBeenCalledWith("model.jpg", "img.jpg", "tops");
        });

        it("selects deterministic random model by gender if no ID provided", async () => {
            const mockProduct = { ok: true, value: { category: "Kadın Elbise", images: ["img.jpg"] } };
            const mockModel = { imageUrl: "female_model.jpg" };

            vi.spyOn(productService, "getProductByBarcode").mockResolvedValue(mockProduct as any);
            vi.spyOn(modelService, "getRandomModel").mockResolvedValue(mockModel as any);
            vi.spyOn(visualIntelligenceService, "runVirtualTryOn").mockResolvedValue("result.jpg");
            vi.spyOn(qualityGateService, "validate").mockResolvedValue(true);
            vi.spyOn(visualIntelligenceService, "generateProductVideo").mockResolvedValue({ videoUrl: "vid.mp4" } as any);

            await generateTryOnVideo("123");

            expect(modelService.getRandomModel).toHaveBeenCalledWith("female");
        });
    });

    describe("Quality Gate", () => {
        it("retries once if quality check fails then passes", async () => {
            const mockProduct = { ok: true, value: { category: "Tops", images: ["img.jpg"] } };
            vi.spyOn(productService, "getProductByBarcode").mockResolvedValue(mockProduct as any);
            vi.spyOn(modelService, "getRandomModel").mockResolvedValue({ imageUrl: "m.jpg" } as any);
            vi.spyOn(visualIntelligenceService, "generateProductVideo").mockResolvedValue({ videoUrl: "vid.mp4" } as any);

            vi.spyOn(visualIntelligenceService, "runVirtualTryOn")
                .mockResolvedValueOnce("bad.jpg")
                .mockResolvedValueOnce("good.jpg");

            // Mock implementation to return different results
            vi.spyOn(qualityGateService, "validate")
                .mockRejectedValueOnce(new QualityRejectedError("Low score", 40))
                .mockResolvedValueOnce(true);

            await generateTryOnVideo("123");

            expect(qualityGateService.validate).toHaveBeenCalledTimes(2);
            expect(visualIntelligenceService.runVirtualTryOn).toHaveBeenCalledTimes(2);
        });

        it("throws if quality check fails twice", async () => {
            const mockProduct = { ok: true, value: { category: "Tops", images: ["img.jpg"] } };
            vi.spyOn(productService, "getProductByBarcode").mockResolvedValue(mockProduct as any);
            vi.spyOn(modelService, "getRandomModel").mockResolvedValue({ imageUrl: "m.jpg" } as any);

            vi.spyOn(visualIntelligenceService, "runVirtualTryOn").mockResolvedValue("bad.jpg");
            vi.spyOn(qualityGateService, "validate").mockRejectedValue(new QualityRejectedError("Low score", 40));

            await expect(generateTryOnVideo("123")).rejects.toThrow("Low score");
            expect(qualityGateService.validate).toHaveBeenCalledTimes(2);
        });
    });

    describe("Stock Video Fallback", () => {
        it("throws VideoFailedError if fallback disabled", async () => {
            process.env.ENABLE_STOCK_VIDEO_FALLBACK = 'false';
            await expect(generateVideoMedia("123", {} as any)).rejects.toThrow(/Stock video fallback is disabled/);
        });

        it("proceeds if fallback enabled", async () => {
            process.env.ENABLE_STOCK_VIDEO_FALLBACK = 'true';
            const mockProduct = { ok: true, value: { category: "Tops", name: "Shirt" } };
            vi.spyOn(productService, "getProductByBarcode").mockResolvedValue(mockProduct as any);

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ videos: [] })
            } as any);

            await generateVideoMedia("123", {} as any);
            expect(global.fetch).toHaveBeenCalled();
        });
    });
});
