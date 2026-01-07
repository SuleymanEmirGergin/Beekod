import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDailyBrief } from "../../src/services/intelligenceService";
import { generateGeminiReply } from "../../src/services/geminiService";
import { query } from "../../src/db";

// Mocks
vi.mock("../../src/services/geminiService");
vi.mock("../../src/db");

describe("IntelligenceService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getDailyBrief", () => {
        it("should return parsed AI response when Gemini succeeds", async () => {
            // Mock DB responses
            (query as any)
                .mockResolvedValueOnce([{ count: 10, revenue: 5000 }]) // Today stats
                .mockResolvedValueOnce([{ count: 8, revenue: 4000 }])  // Yesterday stats
                .mockResolvedValueOnce([{ count: 2 }]);                // Low stock

            // Mock Gemini response
            const mockAiResponse = JSON.stringify({
                title: "Harika Gün",
                subtitle: "Ciro artışta",
                narrative: "Bugün satışlar çok iyi gitti.",
                metrics: []
            });
            (generateGeminiReply as any).mockResolvedValue(mockAiResponse);

            const result = await getDailyBrief();

            expect(result.title).toBe("Harika Gün");
            expect(result.narrative).toBe("Bugün satışlar çok iyi gitti.");
            expect(generateGeminiReply).toHaveBeenCalled();
        });

        it("should return fallback data when Gemini fails or returns empty", async () => {
            // Mock DB responses
            (query as any)
                .mockResolvedValueOnce([{ count: 0, revenue: 0 }])
                .mockResolvedValueOnce([{ count: 0, revenue: 0 }])
                .mockResolvedValueOnce([{ count: 0 }]);

            // Mock Gemini failure
            (generateGeminiReply as any).mockResolvedValue(null);

            const result = await getDailyBrief();

            expect(result.title).toBe("Veri Alınamadı");
            expect(result.subtitle).toBe("AI bağlantı hatası");
            // Should still have metrics populated by manual logic
            expect(result.metrics).toHaveLength(2);
            expect(result.metrics[0].label).toBe("Bugünkü Ciro");
        });

        it("should handle JSON parse errors from AI gracefully", async () => {
            // Mock DB responses
            (query as any)
                .mockResolvedValueOnce([{ count: 10, revenue: 5000 }])
                .mockResolvedValueOnce([{ count: 8, revenue: 4000 }])
                .mockResolvedValueOnce([{ count: 2 }]);

            // Mock Bad JSON
            (generateGeminiReply as any).mockResolvedValue("This is not JSON");

            const result = await getDailyBrief();

            expect(result.title).toBe("Günlük Özet");
            expect(result.narrative).toContain("This is not JSON");
        });
    });
});
