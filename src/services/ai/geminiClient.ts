import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeminiProvider, getGeminiProvider } from "../../ai/providers/gemini/GeminiProvider.js";
import { logger } from "../../logger.js";
import { SearchResultItem } from "../search/types.js";

/**
 * @deprecated Use getGeminiProvider() instead
 */
export function getClient(apiKey?: string) {
  return new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY || "");
}

/**
 * Get the new GeminiProvider instance
 */
export function getProvider(apiKey?: string): GeminiProvider {
  return getGeminiProvider(apiKey);
}

/**
 * @deprecated Use GeminiProvider.generate() instead
 */
export async function generateGeminiReply({
  message,
}: {
  message: string;
  locale?: string;
}): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    return "";
  }
  try {
    const provider = getGeminiProvider();
    return await provider.generate(message);
  } catch (error) {
    logger.error("geminiClient.generateGeminiReply_failed", { error });
    return "";
  }
}

/**
 * Analyze image using Gemini Vision
 */
export async function analyzeImage({
  buffer,
  mimeType,
  prompt,
}: {
  buffer: Buffer;
  mimeType: string;
  prompt: string;
  locale?: string;
}): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    return "";
  }
  try {
    const provider = getGeminiProvider();
    return await provider.analyzeImage(prompt, buffer, mimeType);
  } catch (error) {
    logger.error("geminiClient.analyzeImage_failed", { error });
    return "";
  }
}

export async function filterSearchResults(query: string, results: SearchResultItem[]): Promise<number[]> {
  if (!process.env.GEMINI_API_KEY) {
    return results.map((_, i) => i);
  }
  try {
    const context = results.map((r, i) => `${i}: ${r.title}`).join("\n");
    const prompt = `User query: "${query}"

Return the indexes of the most relevant items from the list below as a JSON array like [0, 1, 2].
${context}`;

    const provider = getGeminiProvider();
    const text = await provider.generate(prompt);
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : results.map((_, i) => i);
  } catch (error) {
    logger.error("geminiClient.filterSearchResults_failed", { error });
    return results.map((_, i) => i);
  }
}

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
  description: string,
): Promise<OptimizedContent> {
  logger.info("geminiClient.optimizeProductContent", { title });

  if (!process.env.GEMINI_API_KEY) {
    logger.warn("geminiClient.no_api_key", { message: "Using mock response" });
    return mockOptimizeContent(title, description);
  }

  try {
    const prompt = `You are an ecommerce content optimizer. Improve the product title and description for SEO and sales.

Title: ${title}
Description: ${description}

Return JSON:
{
  "optimizedTitle": "optimized title (max 100 chars)",
  "optimizedDescription": "persuasive, SEO friendly description",
  "keywords": ["keyword", "list"],
  "suggestions": ["improvement ideas"]
}`;

    const provider = getGeminiProvider();
    const text = await provider.generate(prompt);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid JSON response from Gemini");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      optimizedTitle: parsed.optimizedTitle || title,
      optimizedDescription: parsed.optimizedDescription || description,
      keywords: parsed.keywords || [],
      suggestions: parsed.suggestions || [],
    };
  } catch (error) {
    logger.error("geminiClient.optimize_failed", { error });
    return mockOptimizeContent(title, description);
  }
}

export interface RecommendableProduct {
  name: string;
  price: number;
  stock: number;
  category?: string;
}

/**
 * Generate product recommendations using Gemini AI
 */
export async function generateRecommendations(productData: RecommendableProduct): Promise<string[]> {
  if (!process.env.GEMINI_API_KEY) {
    return ["Increase stock", "Adjust pricing", "Add product images"];
  }

  try {
    const prompt = `Provide 3-5 actionable recommendations to improve sales:
Product: ${productData.name}
Price: ${productData.price}
Stock: ${productData.stock}
Category: ${productData.category || "General"}

Return a JSON array of strings.`;

    const provider = getGeminiProvider();
    const text = await provider.generate(prompt);

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return ["Improve description", "Create promotion"];
  } catch (error) {
    logger.error("geminiClient.recommendations_failed", { error });
    return ["Improve description"];
  }
}

function mockOptimizeContent(title: string, description: string): OptimizedContent {
  return {
    optimizedTitle: `${title} - Fast Shipping & Secure Checkout`,
    optimizedDescription: `${description}\n\nKey highlights:\n- Quality materials\n- Fast delivery\n- Secure payment\n- Customer satisfaction guarantee`,
    keywords: ["quality", "affordable", "fast shipping", "secure checkout"],
    suggestions: ["Add more images", "Compare pricing", "Add reviews"],
  };
}
