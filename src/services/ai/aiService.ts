import { logger } from "../../logger.js";
import { optimizeProductContent, generateRecommendations, generateGeminiReply, analyzeImage } from './geminiClient.js';

/**
 * AI servislerinin (İçerik optimizasyonu, araçlar ve tarama) 
 * birleştirildiği ana servis dosyası.
 */

export interface AIOptimizeResult {
    title: string;
    description: string;
    keywords: string[];
}

export interface ScannedInvoiceData {
    invoiceNumber?: string;
    customer: {
        name: string;
        taxId?: string;
        taxOffice?: string;
        address?: string;
        email?: string;
        phone?: string;
    };
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate?: number;
    }[];
    date?: string;
    currency?: string;
    totalAmount?: number;
    category?: string;
}

export const aiService = {
    /**
     * Optimize product content using Gemini AI
     */
    async optimizeProductContent(currentTitle: string, currentDescription: string): Promise<AIOptimizeResult> {
        logger.info('aiService.optimizeProductContent', { title: currentTitle });
        try {
            const result = await optimizeProductContent(currentTitle, currentDescription);
            return {
                title: result.optimizedTitle,
                description: result.optimizedDescription,
                keywords: result.keywords
            };
        } catch (error) {
            logger.error('aiService.optimize_failed', { error });
            return {
                title: `${currentTitle} - Premium`,
                description: `${currentDescription}\n\nÖne Çıkanlar:\n• Kalite\n• Güvence`,
                keywords: ['kaliteli']
            };
        }
    },

    /**
     * Generates product description
     */
    async generateProductDescription(name: string, category: string, brand?: string, tone = "professional"): Promise<string> {
        const toneMap: Record<string, string> = {
            professional: "profesyonel ve resmi",
            friendly: "samimi ve arkadaşça",
            seo: "SEO odaklı",
            creative: "yaratıcı",
        };
        const selectedTone = toneMap[tone] || "profesyonel";
        const systemInstruction = `Sen e-ticaret uzmanısın. HTML formatında ${selectedTone} bir açıklama yaz. Türkçe olsun.`;
        const prompt = `Ürün: ${name}. Kategori: ${category}. Marka: ${brand || "-"}. Açıklama yaz.`;

        const description = await generateGeminiReply({
            message: systemInstruction + "\n\n" + prompt,
            locale: "tr",
        });

        if (!description) throw new Error("Description generation failed");
        return description;
    },

    /**
     * Suggests category 
     */
    async suggestCategory(name: string, brand?: string): Promise<string> {
        const prompt = `Ürün: ${name} ${brand || ""}. En uygun e-ticaret kategorisini sadece ad olarak yaz.`;
        const category = await generateGeminiReply({
            message: prompt,
            locale: "tr",
        });
        return category?.trim() || "Genel";
    },

    /**
     * Background removal (simulated/placeholder)
     */
    async removeBackground(imageUrl: string): Promise<string> {
        logger.info('aiService.removeBackground', { imageUrl });
        // Simulation: Return a placeholder representing successful background removal
        return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop";
    },

    /**
     * Scan Invoice Image 
     */
    async scanInvoiceImage(buffer: Buffer, mimeType: string): Promise<ScannedInvoiceData | null> {
        const prompt = `Alış faturası verilerini JSON formatında ayıkla.
        Yapı: { "invoiceNumber": "...", "customer": { ... }, "items": [ { "description": "...", "quantity": 1, "unitPrice": 10 } ], "totalAmount": 100 }`;
        
        try {
            const result = await analyzeImage({
                buffer,
                mimeType,
                prompt,
                locale: "tr",
            });
            if (!result) return null;
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch (error) {
            logger.error("aiService.scanInvoiceFailed", { err: error });
            return null;
        }
    }
};

// Aliases for direct exports too if needed
export const { 
    generateProductDescription, 
    suggestCategory, 
    removeBackground, 
    scanInvoiceImage 
} = aiService;
