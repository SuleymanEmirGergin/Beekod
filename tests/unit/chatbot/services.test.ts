import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("../../src/db", () => ({
    pool: {
        execute: vi.fn(),
    },
}));

vi.mock("../../src/logger", () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));

vi.mock("../../src/services/wiroService", () => ({
    runChatCompletion: vi.fn(),
}));

// Import services
import { semanticSearchService } from "../../../src/services/semanticSearchService";
import { accessoryFilterService } from "../../../src/services/accessoryFilterService";

// ============================================================
// SEMANTIC SEARCH SERVICE TESTS
// ============================================================

describe("SemanticSearchService", () => {
    it("should generate hash-based embedding for text", () => {
        // Access private method via prototype
        const embedding = (semanticSearchService as any).hashBasedEmbedding("iPhone 15 Pro Max");

        expect(embedding).toBeInstanceOf(Array);
        expect(embedding.length).toBe(64);
        expect(embedding.every((v: number) => v >= -1 && v <= 1)).toBe(true);
    });

    it("should calculate cosine similarity correctly", () => {
        const similarity = (semanticSearchService as any).cosineSimilarity(
            [1, 0, 0],
            [1, 0, 0]
        );
        expect(similarity).toBeCloseTo(1.0, 5);

        const orthogonal = (semanticSearchService as any).cosineSimilarity(
            [1, 0, 0],
            [0, 1, 0]
        );
        expect(orthogonal).toBeCloseTo(0.0, 5);

        const opposite = (semanticSearchService as any).cosineSimilarity(
            [1, 0, 0],
            [-1, 0, 0]
        );
        expect(opposite).toBeCloseTo(-1.0, 5);
    });

    it("should handle empty embeddings", () => {
        const similarity = (semanticSearchService as any).cosineSimilarity([], []);
        expect(similarity).toBe(0);
    });

    it("should pad shorter arrays for similarity", () => {
        const similarity = (semanticSearchService as any).cosineSimilarity(
            [1, 0],
            [1, 0, 0, 0]
        );
        expect(similarity).toBeGreaterThan(0);
    });
});

// ============================================================
// ACCESSORY FILTER SERVICE TESTS
// ============================================================

describe("AccessoryFilterService", () => {
    describe("isAccessory", () => {
        it("should identify kılıf as accessory", () => {
            expect(accessoryFilterService.isAccessory("iPhone 15 Kılıf Şeffaf")).toBe(true);
            expect(accessoryFilterService.isAccessory("Samsung Galaxy Case")).toBe(true);
        });

        it("should identify screen protector as accessory", () => {
            expect(accessoryFilterService.isAccessory("Tempered Glass Cam Koruyucu")).toBe(true);
            expect(accessoryFilterService.isAccessory("Ekran Koruyucu Film")).toBe(true);
        });

        it("should identify charger as accessory", () => {
            expect(accessoryFilterService.isAccessory("USB-C Şarj Kablosu")).toBe(true);
            expect(accessoryFilterService.isAccessory("20W Hızlı Şarj Adaptör")).toBe(true);
        });

        it("should identify main products correctly", () => {
            expect(accessoryFilterService.isAccessory("iPhone 15 Pro Max 256GB")).toBe(false);
            expect(accessoryFilterService.isAccessory("Samsung Galaxy S24 Ultra")).toBe(false);
            expect(accessoryFilterService.isAccessory("MacBook Pro 14 M3")).toBe(false);
        });

        it("should handle case category", () => {
            expect(accessoryFilterService.isAccessory("Ürün", "Aksesuar")).toBe(true);
            expect(accessoryFilterService.isAccessory("Ürün", "Telefon")).toBe(false);
        });
    });

    describe("filterProducts", () => {
        const products = [
            { name: "iPhone 15 Pro", category: "Telefon" },
            { name: "iPhone 15 Kılıf", category: "Aksesuar" },
            { name: "Samsung Galaxy S24", category: "Telefon" },
            { name: "Şarj Kablosu", category: "Aksesuar" },
        ];

        it("should group products by main/accessory", () => {
            const result = accessoryFilterService.filterProducts(products, {
                groupByMainProduct: true
            });

            expect(result).toHaveProperty("main");
            expect(result).toHaveProperty("accessories");
            expect((result as any).main.length).toBe(2);
            expect((result as any).accessories.length).toBe(2);
        });

        it("should filter out accessories", () => {
            const result = accessoryFilterService.filterProducts(products, {
                excludeAccessories: true
            });

            expect((result as any[]).length).toBe(2);
            expect((result as any[]).every((p: any) => !accessoryFilterService.isAccessory(p.name, p.category))).toBe(true);
        });

        it("should return only accessories", () => {
            const result = accessoryFilterService.filterProducts(products, {
                onlyAccessories: true
            });

            expect((result as any[]).length).toBe(2);
            expect((result as any[]).every((p: any) => accessoryFilterService.isAccessory(p.name, p.category))).toBe(true);
        });
    });

    describe("extractKeywords", () => {
        it("should extract brand/model from product name", () => {
            const keywords = (accessoryFilterService as any).extractKeywords("iPhone 15 Pro Max Kılıf");

            expect(keywords.length).toBeGreaterThan(0);
            expect(keywords.some((k: string) => k.includes("iphone"))).toBe(true);
        });

        it("should extract Samsung model", () => {
            const keywords = (accessoryFilterService as any).extractKeywords("Samsung Galaxy S24 Ekran Koruyucu");

            expect(keywords.some((k: string) => k.includes("samsung"))).toBe(true);
        });
    });
});
