import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../logger.js";
import type { Locale } from "../types.js";

const DEFAULT_MODEL = "gemini-2.0-flash";

let cachedClient: GoogleGenerativeAI | null = null;
let cachedKey: string | null = null;

export function getClient(apiKey: string) {
  if (!cachedClient || cachedKey !== apiKey) {
    cachedClient = new GoogleGenerativeAI(apiKey);
    cachedKey = apiKey;
  }
  return cachedClient;
}

export function normalizeGeminiText(raw: string) {
  return raw.replace(/[\r\n]{3,}/g, "\n\n").trim();
}

export async function filterSearchResults(
  query: string,
  results: Array<{ title: string; price?: number; snippet?: string }>
): Promise<number[]> {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey || results.length <= 1) return results.map((_, i) => i);

  try {
    const genAI = getClient(apiKey);
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

    const prompt = `
        Kullanıcı sorgusu: "${query}"
        Aşağıdaki arama sonuçlarından hangileri bu sorguyla doğrudan alakalıdır? 
        Cihaz arıyorsa aksesuarları (kılıf, cam vb.) ele.
        SADECE alakalı olanların indekslerini JSON dizisi olarak dön. Örn: [0, 2]
        
        Sonuçlar:
        ${results.map((r, i) => `${i}. ${r.title} - ${r.price || "N/A"}`).join("\n")}
        `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    const text = result.response.text().trim();
    return JSON.parse(text);
  } catch (error) {
    logger.warn("gemini.filter_failed", { error: String(error) });
  }
  return results.map((_, i) => i);
}

export async function generateGeminiReply(input: {
  message: string;
  locale: Locale;
  history?: any[];
  image?: { buffer: Buffer; mimeType: string };
}): Promise<string | null> {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return null;

  try {
    const genAI = getClient(apiKey);
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

    // If image is present, use generateContent (multimodal) instead of chat history for now
    // or properly construct chat with image. For simplicity, if image exists, we do single turn or include it in message parts.
    if (input.image) {
      const result = await model.generateContent([
        input.message,
        { inlineData: { data: input.image.buffer.toString("base64"), mimeType: input.image.mimeType } }
      ]);
      return result.response.text();
    }

    const chat = model.startChat({
      history: input.history || [],
      generationConfig: { maxOutputTokens: 1024 }
    });

    const result = await chat.sendMessage(input.message);
    return result.response.text();
  } catch (error) {
    logger.error("gemini.chat_failed", { error });
    return null;
  }
}

export async function analyzeImage(input: {
  buffer: Buffer;
  mimeType: string;
  prompt: string;
  locale: Locale;
}) {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return null;

  try {
    const genAI = getClient(apiKey);
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

    const result = await model.generateContent([
      input.prompt,
      { inlineData: { data: input.buffer.toString("base64"), mimeType: input.mimeType } }
    ]);
    return result.response.text();
  } catch (error) {
    logger.error("gemini.analyze_image_failed", { error });
    return null;
  }
}
