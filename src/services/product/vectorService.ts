import { GoogleGenAI } from "@google/genai";
import { logger } from "../../logger.js";
import { retry } from "../../utils/retry.js";

const DEFAULT_MODEL = "gemini-embedding-001";

let cachedClient: GoogleGenAI | null = null;
let cachedKey: string | null = null;

function getClient(apiKey: string) {
    if (!cachedClient || cachedKey !== apiKey) {
        cachedClient = new GoogleGenAI({ apiKey });
        cachedKey = apiKey;
    }
    return cachedClient;
}

/**
 * Generate a text embedding using Google's text-embedding-004 model.
 * Returns a 768-dimensional vector or null if generation fails.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
    const apiKey = (process.env.GEMINI_API_KEY ?? "").trim();
    if (!apiKey) {
        logger.warn("vector.no_api_key", { message: "GEMINI_API_KEY is not set" });
        return null;
    }

    if (!text || text.trim().length === 0) {
        return null;
    }

    try {
        const client = getClient(apiKey);
        const result = await retry(async () => {
            return await client.models.embedContent({
                model: DEFAULT_MODEL,
                contents: [{ parts: [{ text: text.trim() }] }],
            });
        });

        return result.embeddings?.[0]?.values || null;
    } catch (error) {
        logger.warn("vector.embedding_failed", { error: String(error) });
        return null;
    }
}

/**
 * Calculate cosine similarity between two vectors.
 * Returns a value between -1 and 1, where 1 means identical direction.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
        return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
}
