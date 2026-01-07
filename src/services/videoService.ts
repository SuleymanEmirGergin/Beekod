import { GoogleGenAI } from "@google/genai";
import { getProductByBarcode } from "./productService.js";
import { logger } from "../logger.js";
import { runImageToVideo } from "./wiroService.js";

export interface VideoScript {
  title: string;
  hook: string;
  description: string;
  estimatedDuration: string;
  scenes: {
    sceneNumber: number;
    visualParams: string;
    audioScript: string;
    duration: number;
  }[];
  hashtags: string[];
}

export const generateVideoScript = async (
  barcode: string,
  vibe: string,
  platform: "instagram" | "tiktok" | "youtube_shorts",
): Promise<VideoScript> => {
  const product = await getProductByBarcode(barcode);
  if (!product) throw new Error("Product not found");

  const apiKey = (process.env.GEMINI_API_KEY ?? "").trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required for video script generation");
  }
  const genAI = new GoogleGenAI({ apiKey });
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  const prompt = `
        Sen ödüllü bir Sosyal Medya İçerik Yönetmenisin. Görevin, aşağıdaki ürün için viral olma potansiyeli yüksek, ${vibe} modunda bir video senaryosu hazırlamak.
        Platform: ${platform} (Dikey format, hızlı kurgu)

        ÜRÜN BİLGİLERİ:
        Ad: ${product.name}
        Kategori: ${product.category}
        Açıklama: ${product.description}
        Fiyat: ${product.price} ${product.currency}

        SENARYO KURALLARI:
        1. "Hook" (Kanca) çok güçlü olmalı, ilk 3 saniyede izleyiciyi yakalamalı.
        2. Görsel öneriler (Visuals) çok detaylı ve sinematik olmalı (örn: "Yavaş çekimde ürüne su sıçraması", "Hızlı zoom-in").
        3. Seslendirme (Audio) samimi, akıcı ve platforma uygun olmalı orjinal ses tonunda.
        4. Çıktı sadece ve sadece geçerli bir JSON formatında olmalı. Markdown veya başka bir metin içermemeli.

        İstenen JSON Formatı:
        {
            "title": "Videonun Başlığı (Clickbait olabilir)",
            "hook": "Videoyu satıracak tek cümlelik kanca",
            "description": "Video açıklaması ve caption önerisi",
            "estimatedDuration": "Tahmini süre (sn)",
            "scenes": [
                {
                    "sceneNumber": 1,
                    "visualParams": "Detaylı görsel sahne tarifi",
                    "audioScript": "Seslendirme metni veya ekranda görünecek yazı",
                    "duration": 3
                }
            ],
            "hashtags": ["#hashtag1", "#hashtag2"]
        }
    `;

  try {
    const response = await genAI.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    const text = response.text || "";
    // Clean markdown code blocks if present
    const jsonStr = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    logger.error("video.script_generation_failed", { err: error });
    throw new Error("Video senaryosu oluşturulamadı.");
  }
};

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "563492ad6f917000010000019056d3d4554247898864315264875321"; // Free tier key for demo

export const generateVideoMedia = async (barcode: string, script: VideoScript): Promise<{ url: string }> => {
  const product = await getProductByBarcode(barcode);
  if (!product) throw new Error("Product not found");

  // Extract simple search terms from product name (e.g., "iPhone 15" -> "smartphone", "Nike Air" -> "running shoes")
  // For now, we take the first 2 words or category fallback
  let query = product.category || product.name.split(" ").slice(0, 2).join(" ");

  // Refine query based on common electronic terms to get better stock footage
  if (query.toLowerCase().includes("iphone") || query.toLowerCase().includes("samsung")) query = "smartphone";
  if (query.toLowerCase().includes("kulaklık")) query = "headphones";
  if (query.toLowerCase().includes("laptop") || query.toLowerCase().includes("bilgisayar")) query = "laptop working";
  if (query.toLowerCase().includes("saat")) query = "smartwatch";

  logger.info("video.media_generation_start", { barcode, query });

  try {
    const response = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=3&orientation=portrait&size=medium`, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.videos && data.videos.length > 0) {
      // Return the best quality video file link (usually the first one's video file)
      const bestVideo = data.videos[0].video_files.find((f: any) => f.quality === "hd") || data.videos[0].video_files[0];
      return { url: bestVideo.link };
    }

    logger.warn("video.no_stock_found", { query });
    // Fallback to abstract tech background if no specific video found
    return {
      url: "https://assets.mixkit.co/videos/preview/mixkit-tech-animation-with-glowing-lines-48356-preview.mp4",
    };

  } catch (error) {
    logger.error("video.media_generation_failed", { err: error });
    // Graceful fallback on error
    return {
      url: "https://assets.mixkit.co/videos/preview/mixkit-tech-animation-with-glowing-lines-48356-preview.mp4",
    };
  }
};

/**
 * Generates a high-quality video using Wiro AI based on a product image and an AI-generated script.
 */
export const generateAIDrivenVideo = async (barcode: string, vibe: string): Promise<{ taskId: string; token: string }> => {
  const product = await getProductByBarcode(barcode);
  if (!product) throw new Error("Product not found");

  // 1. Generate a viral script
  const script = await generateVideoScript(barcode, vibe, "instagram");

  // 2. Select product image
  const imageUrl = (product.images && product.images.length > 0) ? product.images[0] : product.imageUrl;
  if (!imageUrl) {
    throw new Error("Product has no images to generate video from");
  }

  // 3. Trigger Wiro AI task
  // We use the 'hook' or the first scene's visual params as the prompt for the video generator
  const videoPrompt = `${script.hook}. ${script.scenes[0]?.visualParams || ""}`;

  logger.info("video.ai_driven_start", { barcode, imageUrl, videoPrompt });

  const result = await runImageToVideo(imageUrl, videoPrompt);

  return {
    taskId: result.taskid,
    token: result.socketaccesstoken
  };
};
