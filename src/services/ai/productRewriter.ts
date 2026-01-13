<<<<<<< HEAD
import { getClient } from "./geminiClient.js";
=======
import { getClient } from "../geminiClient.js";
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
import { logger } from "../../logger.js";
import { ScrapedProduct } from "../productScraper.js";

const DEFAULT_MODEL = "gemini-2.0-flash";

export interface OptimizedContent {
    title: string;
    description: string;
    suggestedCategory?: string;
    insights?: string;
    socialPosts?: {
        instagram: string;
        twitter: string;
        tiktokTitle: string;
    };
}

export async function rewriteProductContent(product: ScrapedProduct, locale: string = 'tr'): Promise<OptimizedContent> {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
        return {
            title: product.name || "",
            description: product.description || ""
        };
    }

    try {
        const genAI = getClient(apiKey);
        const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

        const prompt = `
        Aşağıdaki ham pazaryeri ürün verilerini analiz et ve SEO uyumlu, profesyonel bir içerik oluştur.
        
        HAM VERİLER:
        Başlık: ${product.name}
        Açıklama: ${product.description}
        Kategori: ${product.category}
        Özellikler: ${JSON.stringify(product.attributes)}
        Müşteri Yorumları: ${product.reviews?.join(" | ")}
        
        GÖREVLER:
        1. Başlığı marka ve model içerecek şekilde temiz ve profesyonel hale getir (max 70 karakter).
        2. Açıklamayı akıcı, bilgilendirici ve profesyonel bir tonda yeniden yaz.
        3. Bu ürün için en uygun tek kelimelik genel kategoriyi suger et.
        4. Müşteri yorumlarını analiz et ve ürünün güçlü/zayıf yanlarını özetleyen tek bir cümlelik "içgörü" oluştur.
        5. Bu ürün için kısa bir Instagram postu, bir Tweet ve bir TikTok video başlığı oluştur.
        
        Dönüş formatı SADECE JSON olmalıdır:
        {
            "title": "Temizlenmiş Başlık",
            "description": "Profesyonel Açıklama",
            "suggestedCategory": "Kategori",
            "insights": "Yorum Analizi Özeti",
            "socialPosts": {
                "instagram": "Post metni + hashtagler",
                "twitter": "Tweet metni",
                "tiktokTitle": "Video fikri/başlığı"
            }
        }
        
        DİL: ${locale === 'tr' ? 'Türkçe' : 'İngilizce'}
        `;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const text = result.response.text().trim();
        const optimized = JSON.parse(text) as OptimizedContent;

        // Ensure we don't return empty values if AI fails to give good ones
        return {
            title: optimized.title || product.name || "",
            description: optimized.description || product.description || "",
            suggestedCategory: optimized.suggestedCategory,
            insights: optimized.insights,
            socialPosts: optimized.socialPosts
        };

    } catch (error) {
        logger.error("ai.product_rewrite_failed", { error: String(error) });
        return {
            title: product.name || "",
            description: product.description || ""
        };
    }
}

export function generateHtmlSpecTable(attributes: Record<string, string>): string {
    if (!attributes || Object.keys(attributes).length === 0) return "";

    let html = `
    <div class="product-specs-container" style="margin-top: 20px; border: 1px solid #eee; border-radius: 8px; padding: 15px; background: #f9f9f9;">
        <h3 style="margin-top: 0; font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 5px;">Teknik Özellikler</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tbody>
    `;

    Object.entries(attributes).forEach(([key, value], index) => {
        const bgColor = index % 2 === 0 ? "#ffffff" : "#f5f5f5";
        html += `
            <tr style="background-color: ${bgColor};">
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 40%;">${key}</td>
                <td style="padding: 10px; border: 1px solid #ddd; width: 60%;">${value}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    </div>
    `;

    return html;
}
