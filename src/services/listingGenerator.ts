import { generateGeminiReply } from "./geminiClient.js";
import { CanonicalProduct } from "./canonicalProductService.js";
import { logger } from "../logger.js";

export interface ListingDraft {
    title: string;
    description: string;
    attributes: Record<string, string>;
    keywords: string[];
}

export class ListingGeneratorService {

    /**
     * Generates a listing draft for a specific marketplace based on canonical product data.
     */
    async generateDraft(product: CanonicalProduct, targetMarketplace: string, locale: string = "tr"): Promise<ListingDraft> {

        // Construct a prompt for Gemini
        const systemPrompt = `You are an expert e-commerce copywriter specializing in ${targetMarketplace} SEO.
    Your task is to create a high-converting product listing based on the provided raw product data.
    
    Rules:
    1. Title: Must be optimized for ${targetMarketplace} search, typically "Brand + Model + Key Specs + Color". Max 100 chars.
    2. Description: HTML formatted (minimal tags: <p>, <ul>, <li>, <b>). Persuasive, highlighting benefits.
    3. Attributes: Extract relevant technical specs from the description JSON.
    4. Language: ${locale === 'tr' ? 'Turkish' : 'English'}.
    5. Output JSON only.`;

        const userMessage = `Product Data:
    Title: ${product.title}
    Brand: ${product.brand}
    Description: ${product.description}
    Attributes: ${JSON.stringify(product.attributes)}
    
    Generate a JSON response with keys: title, description (html), attributes (key-value pair object), keywords (array of strings).`;

        try {
            const response = await generateGeminiReply({
                message: systemPrompt + "\n\n" + userMessage,
                locale: locale as "tr" | "en"
            });

            if (!response) {
                throw new Error("AI returned empty response");
            }

            // Try to parse the markdown code block if present
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/{[\s\S]*}/);
            const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;

            const parsed = JSON.parse(jsonStr);

            return {
                title: parsed.title || product.title,
                description: parsed.description || product.description || "",
                attributes: parsed.attributes || {},
                keywords: parsed.keywords || []
            };

        } catch (error) {
            logger.error("listing_generator.failed", { err: error });
            // Fallback
            return {
                title: product.title,
                description: product.description || "",
                attributes: {},
                keywords: []
            };
        }
    }

    /**
     * Improves a specific field of a listing
     */
    async improveContent(content: string, goal: string, locale: string = "tr"): Promise<string> {
        const response = await generateGeminiReply({
            message: `Improve this content: "${content}". Goal: ${goal}. Keep it concise.`,
            locale: locale as "tr" | "en"
        });
        return response || content;
    }
}

export const listingGenerator = new ListingGeneratorService();
