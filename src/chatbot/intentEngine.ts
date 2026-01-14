import { runChatCompletion } from "../services/geminiService.js";
import { logger } from "../logger.js";
import {
    ChatIntent,
    ChatMode,
    ChatEntity,
    IntentDetectionResult,
    BeekodIntent,
    ToptanciIntent,
} from "./types.js";

/**
 * Intent Recognition Engine
 * Gemini 2.0 Flash ile intent detection ve entity extraction
 */
export class IntentEngine {
    /**
     * Ana intent detection fonksiyonu
     */
    async detectIntent(message: string, userId?: string): Promise<IntentDetectionResult> {
        try {
            logger.info("intentEngine.detecting", { message, userId });

            // 1. Mode belirleme (keyword-based heuristic)
            const mode = this.determineMode(message);

            // 2. Gemini 2.0 Flash ile intent + entity extraction
            const prompt = this.buildIntentPrompt(message, mode);

            const response = await runChatCompletion(prompt, {
                thinkingLevel: "medium",
                temperature: 0.3, // Düşük temperature = daha tutarlı JSON
                maxOutputTokens: 1000,
            });

            // 3. JSON parse
            const result = this.parseIntentResponse(response, mode);

            logger.info("intentEngine.detected", { intent: result.intent, mode: result.mode, confidence: result.confidence });

            return result;
        } catch (error) {
            logger.error("intentEngine.detection_failed", { error, message });

            // Fallback: Basit keyword matching
            return this.fallbackIntentDetection(message);
        }
    }

    /**
     * Mode selection: Pazaryeri/stok/fiyat -> BEEKOD, toptancı/kimde -> TOPTANCI
     */
    private determineMode(message: string): ChatMode {
        const lowerMsg = message.toLowerCase();

        // TOPTANCI keywords
        const toptanciKeywords = [
            "toptancı",
            "kimde var",
            "başka",
            "firmalar",
            "tedarikçi",
            "toptan",
            "mesaj gönder",
            "teklif iste",
        ];

        // BEEKOD keywords (default)
        const beekodKeywords = [
            "pazaryeri",
            "trendyol",
            "hepsiburada",
            "n11",
            "çiçeksepeti",
            "pttavm",
            "pazarama",
            "fiyat",
            "stok",
            "sipariş",
            "sat",
            "güncelle",
            "yayınla",
        ];

        // Check TOPTANCI first
        if (toptanciKeywords.some((kw) => lowerMsg.includes(kw))) {
            return "TOPTANCI";
        }

        // Default: BEEKOD
        return "BEEKOD";
    }

    /**
     * Gemini 2.0 Flash için intent detection prompt
     */
    private buildIntentPrompt(message: string, mode: ChatMode): string {
        const beekodIntents = [
            "price_query",
            "price_update",
            "stock_query",
            "stock_update",
            "stock_alert",
            "order_query",
            "sales_report",
            "marketplace_sync",
            "marketplace_publish",
            "product_search",
            "product_import",
            "listing_update",
            "batch_operation",
            "analytics_query",
            "competitor_analysis",
            "review_query",
        ];

        const toptanciIntents = [
            "wholesaler_search",
            "stock_holders_query",
            "send_message",
            "request_quote",
            "view_messages",
            "share_phone",
        ];

        const availableIntents = mode === "BEEKOD" ? beekodIntents : toptanciIntents;

        return `Sen bir e-ticaret chatbot intent detection sistemisin. Türkçe mesajları analiz edip intent ve entity çıkarıyorsun.

MOD: ${mode}
KULLANICI MESAJI: "${message}"

GÖREVİN:
1. Mesajdan intent'i belirle (aşağıdaki listeden)
2. Entity'leri çıkar (barcode, productName, price, stock, marketplace, etc.)
3. Onay gerektirip gerektirmediğini belirle

AVAILABLE INTENTS (${mode}):
${availableIntents.map((i) => `- ${i}`).join("\n")}

ONAY GEREKTİREN DURUMLAR:
- destructive: Toplu silme/güncelleme, stok sıfırlama gibi yıkıcı işlemler
- privacy: Telefon numarası paylaşımı

ENTITY EXTRACTION:
- barcode: Ürün barkodu (sayısal, genelde 8-13 haneli)
- productName: Ürün adı
- price: Fiyat (TL cinsinden)
- stock: Stok adedi
- marketplace: Pazaryeri (Trendyol, Hepsiburada, N11, Ciceksepeti, PttAVM, Pazarama)
- dateRange: Tarih aralığı (start, end)
- quantity: Adet
- wholesalerId: Toptancı ID
- requestedQty: Talep edilen adet

CEVAP FORMATI (JSON):
{
  "intent": "detected_intent",
  "entities": {
    "barcode": "...",
    "productName": "...",
    "price": 123.45,
    "queryProductType": "MAIN_PRODUCT" | "ACCESSORY" | "PARTS" | "UNKNOWN",
    "queryIntent": "BUY" | "RESEARCH" | "COMPARISON" | "SUPPORT"
  },
  "confidence": 0.95,
  "requiresConfirmation": false,
  "confirmationType": null
}

Şimdi analiz et ve SADECE JSON döndür, başka açıklama yazma:`;
    }

    /**
     * Gemini response'u parse et
     */
    private parseIntentResponse(response: string, mode: ChatMode): IntentDetectionResult {
        try {
            // JSON extraction (Gemini bazen markdown ile sarar)
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("No JSON found in response");
            }

            const parsed = JSON.parse(jsonMatch[0]);

            return {
                intent: parsed.intent as ChatIntent,
                mode,
                entities: parsed.entities || {},
                confidence: parsed.confidence || 0.8,
                requiresConfirmation: parsed.requiresConfirmation || false,
                confirmationType: parsed.confirmationType || undefined,
            };
        } catch (error) {
            logger.error("intentEngine.parse_failed", { error, response });
            throw error;
        }
    }

    /**
     * Fallback: Basit keyword-based intent detection
     */
    private fallbackIntentDetection(message: string): IntentDetectionResult {
        const lowerMsg = message.toLowerCase();

        // Simple keyword matching
        let intent: ChatIntent = "product_search"; // default
        const entities: ChatEntity = {};

        if (lowerMsg.includes("fiyat") && lowerMsg.includes("güncelle")) {
            intent = "price_update";
        } else if (lowerMsg.includes("fiyat")) {
            intent = "price_query";
        } else if (lowerMsg.includes("stok") && lowerMsg.includes("güncelle")) {
            intent = "stock_update";
        } else if (lowerMsg.includes("stok")) {
            intent = "stock_query";
        } else if (lowerMsg.includes("sipariş")) {
            intent = "order_query";
        } else if (lowerMsg.includes("kimde var") || lowerMsg.includes("toptancı")) {
            intent = "stock_holders_query";
        } else if (lowerMsg.includes("karlılık") || lowerMsg.includes("analiz")) {
            intent = "analytics_query";
        } else if (lowerMsg.includes("satış") && lowerMsg.includes("rapor")) {
            intent = "sales_report";
        } else if (
            lowerMsg.includes("rakip") ||
            lowerMsg.includes("buybox") ||
            lowerMsg.includes("diğer satıcı") ||
            lowerMsg.includes("kimler satıyor")
        ) {
            intent = "competitor_analysis";
        } else if (
            lowerMsg.includes("yorum") ||
            lowerMsg.includes("değerlendirme") ||
            lowerMsg.includes("puan") ||
            lowerMsg.includes("review")
        ) {
            intent = "review_query";
        }

        // Extract barcode (basit regex)
        const barcodeMatch = message.match(/\b\d{8,13}\b/);
        if (barcodeMatch) {
            entities.barcode = barcodeMatch[0];
        }

        // Extract price
        const priceMatch = message.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:TL|₺)/);
        if (priceMatch) {
            entities.price = parseFloat(priceMatch[1].replace(",", "."));
        }

        // Extract stock
        const stockMatch = message.match(/(\d+)\s*adet/i);
        if (stockMatch) {
            entities.stock = parseInt(stockMatch[1]);
        }

        const mode = this.determineMode(message);

        return {
            intent,
            mode,
            entities,
            confidence: 0.6, // Düşük confidence (fallback)
            requiresConfirmation: false,
        };
    }

    /**
     * Extract entities from message (yedek metod)
     */
    extractEntities(message: string, intent: ChatIntent): ChatEntity {
        const entities: ChatEntity = {};

        // Barcode extraction
        const barcodeMatch = message.match(/\b\d{8,13}\b/);
        if (barcodeMatch) {
            entities.barcode = barcodeMatch[0];
        }

        // Price extraction
        const priceMatch = message.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:TL|₺)/);
        if (priceMatch) {
            entities.price = parseFloat(priceMatch[1].replace(",", "."));
        }

        // Stock extraction
        const stockMatch = message.match(/(\d+)\s*adet/i);
        if (stockMatch) {
            entities.stock = parseInt(stockMatch[1]);
        }

        // Marketplace extraction
        const marketplaceKeywords: Record<string, any> = {
            trendyol: "Trendyol",
            hepsiburada: "Hepsiburada",
            n11: "N11",
            çiçeksepeti: "Ciceksepeti",
            ciceksepeti: "Ciceksepeti",
            pttavm: "PttAVM",
            pazarama: "Pazarama",
        };

        const lowerMsg = message.toLowerCase();
        for (const [keyword, mpName] of Object.entries(marketplaceKeywords)) {
            if (lowerMsg.includes(keyword)) {
                entities.marketplace = mpName as any;
                break;
            }
        }

        return entities;
    }
}

// Singleton instance
export const intentEngine = new IntentEngine();
