import { logger } from "../logger.js";
import { Locale } from "../types.js";
import { getClient } from "./geminiClient.js";

const DEFAULT_MODEL = "gemini-1.5-flash";

/**
 * Uses Gemini to optimize a raw user search query into a clean product name.
 * Example: "en ucuz siyah iphone 15 128gb fiyatı" -> "iPhone 15 128GB Black"
 */
export async function optimizeSearchQuery(rawQuery: string, locale: Locale = "tr"): Promise<string> {
    const apiKey = (process.env.GEMINI_API_KEY ?? "").trim();
    if (!apiKey || rawQuery.length < 3) return rawQuery;

    try {
        const client = getClient(apiKey);
        const model = DEFAULT_MODEL;

        const prompt = locale === "tr"
            ? `GÖREV: Kullanıcı mesajından SADECE ürün adını ve özelliklerini çıkar.
               KURALLAR: 
               1. GİRİŞ, ÖZET, AÇIKLAMA EKLEME. 
               2. SADECE arama terimini dön (örn: "iPhone 15 128GB"). 
               3. "Özet:", "Cevap:", "Onay gerekmiyor", "Adımlar:" gibi eklemeler ASLA yapma.
               4. Düşünce sürecini veya adımları yazma, sadece saf çıktıyı ver.
               
               Mesaj: "${rawQuery}"
               Temiz Terim:`
            : `TASK: Extract ONLY the product name and attributes from the user message.
               RULES:
               1. NO INTRO, NO SUMMARY, NO EXPLANATION.
               2. Return ONLY the search term (e.g., "iPhone 15 128GB").
               3. NEVER add prefixes like "Summary:", "Answer:", "Steps:" or technical notes.
               4. Do not write your thought process, return only the clean product name.
               
               Message: "${rawQuery}"
               Clean Term:`;

        const genModel = client.getGenerativeModel({
            model: model,
            generationConfig: { temperature: 0.1, maxOutputTokens: 50 },
        });

        const response = await genModel.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        let optimized = response.response.text().trim().replace(/["']/g, "") || rawQuery;

        // FAIL-SAFE CLEANUP:
        // If the model ignores instructions and includes ANY technical prefixes, 
        // it's safer to discard the whole response and use the raw query than to try and regex-parse the garbage.
        if (
            optimized.includes("Özet:") ||
            optimized.includes("Summary:") ||
            optimized.includes("Adımlar:") ||
            optimized.includes("Anahtar kelimeler:") ||
            optimized.includes("Onay gerekmiyor") ||
            optimized.length > 80 // Product names shouldn't be excessively long paragraphs
        ) {
            logger.warn("search.optimizer_garbage_detected", { raw: rawQuery, garbage: optimized });
            // Fallback: Use raw query but strip common command verbs
            return rawQuery.replace(/\b(bul|ara|fiyat|fiyatı|ne kadar)\b/gi, "").trim();
        }

        // Extra safety: take the last line if it's short and looks like a product name
        const lines = optimized.split('\n').filter((l: string) => l.trim());
        if (lines.length > 1) {
            const last = lines[lines.length - 1].trim();
            if (last.length > 2 && last.length < 100) {
                optimized = last;
            }
        }

        logger.info("search.optimize_query", { raw: rawQuery, optimized });
        return optimized;
    } catch (error) {
        logger.warn("search.optimize_query_failed", { error });
        return rawQuery;
    }
}
