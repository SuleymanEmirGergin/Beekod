import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../logger.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface OptimizedContent {
    optimizedTitle: string;
    optimizedDescription: string;
    keywords: string[];
    suggestions?: string[];
}

/**
 * Optimize product content using Gemini AI
 */
export async function optimizeProductContent(
    title: string,
    description: string
): Promise<OptimizedContent> {
    logger.info('geminiClient.optimizeProductContent', { title });

    // Fallback to mock if no API key
    if (!process.env.GEMINI_API_KEY) {
        logger.warn('geminiClient.no_api_key', { message: 'Using mock response' });
        return mockOptimizeContent(title, description);
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `Sen bir e-ticaret ürün optimizasyon uzmanısın. Aşağıdaki ürün bilgilerini SEO ve satış odaklı olarak optimize et.

Mevcut Başlık: ${title}
Mevcut Açıklama: ${description}

Lütfen şu formatta JSON döndür:
{
  "optimizedTitle": "SEO ve satış odaklı optimize edilmiş başlık (max 100 karakter)",
  "optimizedDescription": "Detaylı, ikna edici ve SEO uyumlu açıklama (200-500 kelime)",
  "keywords": ["anahtar", "kelime", "listesi"],
  "suggestions": ["iyileştirme önerileri"]
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid JSON response from Gemini');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            optimizedTitle: parsed.optimizedTitle || title,
            optimizedDescription: parsed.optimizedDescription || description,
            keywords: parsed.keywords || [],
            suggestions: parsed.suggestions || []
        };
    } catch (error) {
        logger.error('geminiClient.optimize_failed', { error });
        // Fallback to mock on error
        return mockOptimizeContent(title, description);
    }
}

/**
 * Generate product recommendations using Gemini AI
 */
export async function generateRecommendations(
    productData: any
): Promise<string[]> {
    if (!process.env.GEMINI_API_KEY) {
        return ['Stok seviyesini artırın', 'Fiyatı %10 düşürün', 'Ürün görseli ekleyin'];
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `Aşağıdaki ürün için satış artırıcı öneriler sun:
Ürün: ${productData.name}
Fiyat: ${productData.price} TL
Stok: ${productData.stock}
Kategori: ${productData.category || 'Genel'}

3-5 pratik öneri döndür (JSON array olarak):`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return ['Ürün açıklamasını zenginleştirin', 'Kampanya oluşturun'];
    } catch (error) {
        logger.error('geminiClient.recommendations_failed', { error });
        return ['Ürün açıklamasını zenginleştirin'];
    }
}

/**
 * Mock fallback for when API key is not available
 */
function mockOptimizeContent(title: string, description: string): OptimizedContent {
    return {
        optimizedTitle: `✨ ${title} - Hızlı Kargo & Güvenli Alışveriş`,
        optimizedDescription: `${description}\n\n🚀 Öne Çıkan Özellikler:\n• Kaliteli malzeme\n• Hızlı teslimat\n• Güvenli ödeme\n• Müşteri memnuniyeti garantisi\n\n📦 Aynı gün kargo seçeneği ile hemen sipariş verin!`,
        keywords: ['kaliteli', 'uygun fiyat', 'hızlı kargo', 'güvenli alışveriş'],
        suggestions: [
            'Ürün görseli ekleyin',
            'Fiyat karşılaştırması yapın',
            'Müşteri yorumları ekleyin'
        ]
    };
}
