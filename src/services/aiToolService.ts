import { generateGeminiReply } from "./geminiClient.js";

/**
 * Generates product description using Gemini AI.
 */
export async function generateProductDescription(
  name: string,
  category: string,
  brand?: string,
  tone = "professional",
): Promise<string> {
  const toneMap: Record<string, string> = {
    professional: "profesyonel ve resmi",
    friendly: "samimi ve arkadaşça",
    seo: "SEO odaklı ve anahtar kelime zengin",
    creative: "yaratıcı ve ilgi çekici",
  };

  const selectedTone = toneMap[tone] || "profesyonel";
  const brandInfo = brand ? ` Marka: ${brand}.` : "";
  const categoryInfo = category ? ` Kategori: ${category}.` : "";

  const systemInstruction = `Sen bir e-ticaret ürün açıklaması yazan uzmansın.
      Görevin verilen ürün için ${selectedTone} bir açıklama yazmak.
      Açıklama HTML formatında olmalı ve <p>, <ul>, <li>, <strong> gibi temel HTML etiketleri kullanmalı.
      Açıklama 150-300 kelime arasında olmalı.
      Türkçe yaz.`;

  const prompt = `Ürün adı: ${name}${brandInfo}${categoryInfo}
      
      Bu ürün için kapsamlı ve satış odaklı bir açıklama yaz.`;

  const description = await generateGeminiReply({
    message: systemInstruction + "\n\n" + prompt,
    locale: "tr",
  });

  if (!description) {
    throw new Error("Description generation failed");
  }

  return description;
}

/**
 * Suggests category using Gemini AI.
 */
export async function suggestCategory(name: string, brand?: string): Promise<string> {
  const brandInfo = brand ? ` Marka: ${brand}.` : "";
  const systemInstruction = `Sen bir e-ticaret kategori uzmansın. Verilen ürün için en uygun kategoriyi öner. Sadece kategori adını yaz, başka açıklama ekleme.`;
  const prompt = `Ürün: ${name}${brandInfo}\n\nBu ürün hangi kategoriye aittir? Sadece kategori adını söyle.`;

  const category = await generateGeminiReply({
    message: systemInstruction + "\n\n" + prompt,
    locale: "tr",
  });

  if (!category) {
    throw new Error("Category suggestion failed");
  }

  return category.trim();
}

/**
 * Generates catchy social media posts for various platforms.
 */
export async function generateSocialPost(
  productName: string,
  platform: "instagram" | "tiktok" | "linkedin" | "twitter",
): Promise<string> {
  const platformInst = {
    instagram: "Instagram için görsel odaklı, emojili ve popüler hashtag içeren bir post hazırla.",
    tiktok: "TikTok için kısa, enerjik, merak uyandıran ve 'hook' içeren bir açıklama hazırla.",
    linkedin: "LinkedIn için profesyonel, B2B odaklı ve sektör analizi içeren bir metin hazırla.",
    twitter: "Twitter (X) için kısa, öz ve etkileşim odaklı bir tweet hazırla.",
  };

  const systemInstruction = `Sen profesyonel bir sosyal medya yöneticisisin. ${platformInst[platform]} Dil: Türkçe.`;

  const response = await generateGeminiReply({
    message: systemInstruction + "\n\n" + `Ürün: ${productName}. Lütfen bu platform için dikkat çekici bir paylaşım hazırla.`,
    locale: "tr",
  });

  return response || "İçerik üretilemedi.";
}

/**
 * Simulates AI background removal.
 * Returns a semi-transparent placeholder image for demonstration.
 */
export async function removeBackground(imageUrl: string): Promise<string> {
  // Simulated background removal: In a real app, this would use Gemini or remove.bg
  // For demo purposes, we return a high-quality placeholder if it fails or simulate success
  return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop";
}
