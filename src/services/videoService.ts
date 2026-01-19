import { getProductByBarcode } from "./product/productService.js";
import { logger } from "../logger.js";
import { runVirtualTryOn, generateProductVideo } from "./visualIntelligenceService.js";
import { NotFoundError, InternalError } from "../errors/AppError.js";
import { getGeminiProvider } from "../ai/providers/gemini/GeminiProvider.js";
import { modelService } from "./media/modelService.js";
import { qualityGateService, QualityRejectedError } from "./media/qualityGateService.js";

export class VideoFailedError extends InternalError {
  constructor(message: string) {
    super(message);
    this.name = "VideoFailedError";
    this.statusCode = 503;
  }
}

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
    cinematicCamera?: string;
    voiceTone?: string;
  }[];
  hashtags: string[];
  bgMusicStyle?: string;
  overlayText?: string;
}

/**
 * Helper: Detect gender from product category
 */
function detectGenderFromCategory(category?: string): 'male' | 'female' | 'neutral' {
  if (!category) return 'neutral';
  const cat = category.toLowerCase();
  if (cat.includes('kadın') || cat.includes('women') || cat.includes('female') || cat.includes('bayan')) return 'female';
  if (cat.includes('erkek') || cat.includes('men') || cat.includes('male') || cat.includes('bay')) return 'male';
  return 'neutral';
}

/**
 * Helper: Build motion prompt for video generation
 */
function buildMotionPrompt(vibe: string, _category?: string): string {
  const basePrompt = "Professional fashion model showcase, commercial photography";

  const vibeMap: Record<string, string> = {
    dynamic: "energetic confident walk, dynamic camera movement",
    elegant: "graceful smooth rotation, sophisticated pose transition",
    casual: "relaxed natural motion, subtle movements",
    sporty: "athletic active poses, energetic lifestyle",
    professional: "corporate confident stance, minimal motion"
  };

  const motion = vibeMap[vibe.toLowerCase()] || vibeMap.dynamic;
  return `${basePrompt}, ${motion}, studio lighting, high quality commercial`;
}

/**
 * Main function: Generate video using Fal.ai virtual try-on workflow
 * 
 * Flow:
 * 1. Select mannequin based on product category (or ID)
 * 2. Run virtual try-on using Fal.ai IDM-VTON
 * 3. Validate Quality (Quality Gate)
 * 4. Convert try-on result to video using Fal.ai Kling
 * 5. Return video URL
 */
export const generateTryOnVideo = async (
  barcode: string,
  options?: {
    gender?: 'male' | 'female' | 'neutral';
    vibe?: string;
  }
): Promise<{ videoUrl: string }> => {
  logger.info("video.try_on_video_start", { barcode, options });

  // 1. Get product details
  const productResult = await getProductByBarcode(barcode);
  if (!productResult.ok) throw new NotFoundError("Product not found");
  const product = productResult.value;

  // 2. Select appropriate mannequin
  let mannequinUrl: string;

  if (options?.baseModelId) {
    const model = await modelService.getBaseModel(options.baseModelId);
    if (!model) throw new NotFoundError(`Base model ${options.baseModelId} not found`);
    mannequinUrl = model.imageUrl;
  } else {
    const gender = options?.gender || detectGenderFromCategory(product.category);
    const model = await modelService.getDefaultModel(gender);
    mannequinUrl = model?.imageUrl || "https://via.placeholder.com/800x1200?text=Default+Model"; // Fallback
  }

  logger.info("video.mannequin_selected", { mannequinUrl });

  // 3. Get product image
  const productImage = (product.images && product.images.length > 0)
    ? product.images[0]
    : product.imageUrl;

  if (!productImage) {
    throw new NotFoundError("Product has no images to generate video from");
  }

  // 4. Run virtual try-on using Fal.ai (synchronous)
  logger.info("video.try_on_start", { barcode, mannequin: mannequinUrl, product: productImage });
  const tryOnImageUrl = await runVirtualTryOn(mannequinUrl, productImage, "tops");

  // 5. Quality Gate
  try {
    await qualityGateService.validate(tryOnImageUrl);
  } catch (error: any) {
    if (error.name === "QualityRejectedError") {
      logger.warn("video.quality_rejected", { score: error.score, url: tryOnImageUrl });
      // Retry logic could go here (e.g. try different seed), for now we fail or just log
      // Requirement says: retry up to 1 time.
      // Simple retry logic implementation:
      logger.info("video.quality_retry", { barcode });
      const retryUrl = await runVirtualTryOn(mannequinUrl, productImage, "tops"); // Ideally pass new seed
      await qualityGateService.validate(retryUrl); // If fails again, it throws
    } else {
      throw error;
    }
  }

  // 6. Build motion prompt based on vibe
  const vibe = options?.vibe || "dynamic";
  const motionPrompt = buildMotionPrompt(vibe, product.category);
  logger.info("video.motion_prompt", { vibe, prompt: motionPrompt });

  // 7. Convert try-on image to video using Fal.ai Kling
  logger.info("video.image_to_video_start", { tryOnImage: tryOnImageUrl });
  const videoResult = await generateProductVideo(tryOnImageUrl, motionPrompt);

  logger.info("video.try_on_video_complete", { videoUrl: videoResult.videoUrl });

  return {
    videoUrl: videoResult.videoUrl
  };
};

export const generateVideoScript = async (
  barcode: string,
  vibe: string,
  platform: "instagram" | "tiktok" | "youtube_shorts",
): Promise<VideoScript> => {
  const productResult = await getProductByBarcode(barcode);
  if (!productResult.ok) throw new NotFoundError("Product not found");
  const product = productResult.value;

  const apiKey = (process.env.GEMINI_API_KEY ?? "").trim();

  // MOCK FALLBACK DATA
  const mockScript: VideoScript = {
    title: product.name,
    hook: `Discover the new ${product.name}!`,
    description: `Experience the difference with ${product.name}. #fashion #style`,
    estimatedDuration: "15",
    scenes: [
      {
        sceneNumber: 1,
        visualParams: "Cinematic close up of the product texture",
        audioScript: `This is the new ${product.name}.`,
        duration: 3,
        voiceTone: "Excited"
      },
      {
        sceneNumber: 2,
        visualParams: "Model wearing the product in a lifestyle setting",
        audioScript: "Designed for your lifestyle.",
        duration: 4,
        voiceTone: "Confident"
      },
      {
        sceneNumber: 3,
        visualParams: "Product overlay with price tag",
        audioScript: "Get yours today.",
        duration: 3,
        voiceTone: "Professional"
      }
    ],
    hashtags: ["#trend", "#newarrival", "#fashion"],
    bgMusicStyle: "Upbeat Pop",
    overlayText: "Shop Now"
  };

  if (!apiKey) {
    logger.warn("video.script_gen_no_key", { msg: "GEMINI_API_KEY missing, using mock script" });
    return mockScript;
  }

  try {
    const provider = getGeminiProvider();

    const prompt = `
        Sen ödüllü bir Sosyal Medya İçerik Yönetmeni ve Viral Pazarlama Dehasısın.
        Görevin, aşağıdaki ürün için her saniyesi izleyiciyi ekrana kilitleyecek, ${vibe} modunda bir video senaryosu hazırlamak.
        Platform: ${platform} (Dikey format, 9:16, ultra dinamik kurgu)

        ÜRÜN BİLGİLERİ:
        Ad: ${product.name}
        Kategori: ${product.category}
        Detaylar: ${product.description}
        Fiyat: ${product.price} ${product.currency}

        STRATEJİK YÖNERGELER:
        1. "Hook" (Kanca) ilk 1.5 saniyede merak uyandırmalı.
        2. "Visuals": Sahne tarifleri video motorunun anlayacağı şekilde sinematik olmalı.
        3. "Audio": Samimi, ikna edici ve profesyonel bir TTS tonu tarif et.
        4. "Dinamik Katmanlar": Ekranda görünecek fiyat, indirim veya özellik metinlerini belirle.

        JSON Formatı:
        {
            "title": "Ürün Başlığı",
            "hook": "Güçlü Kanca",
            "description": "Caption ve Hashtagler",
            "estimatedDuration": "15",
            "scenes": [
                {
                    "sceneNumber": 1,
                    "visualParams": "Detaylı görsel tarif",
                    "cinematicCamera": "Kamera hareketi",
                    "audioScript": "Seslendirme metni",
                    "voiceTone": "Ses tonu tarifi",
                    "duration": 3
                }
            ],
            "hashtags": ["#marketing"],
            "bgMusicStyle": "Müzik tarzı",
            "overlayText": "Ekranda görünecek ana metin"
        }
    `;

    const text = (await provider.generate(prompt)) || "";

    // Clean markdown code blocks if present
    const jsonStr = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(jsonStr);

  } catch (error) {
    logger.error("video.script_generation_failed", { err: error, msg: "Falling back to mock script" });
    return mockScript;
  }
};

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "563492ad6f917000010000019056d3d4554247898864315264875321";

export const generateVideoMedia = async (barcode: string, _script: VideoScript): Promise<{ url: string }> => {
  // Check Feature Flag
  if (process.env.ENABLE_STOCK_VIDEO_FALLBACK !== 'true') {
      throw new VideoFailedError("Stock video fallback is disabled");
  }

  const productResult = await getProductByBarcode(barcode);
  if (!productResult.ok) throw new NotFoundError("Product not found");
  const product = productResult.value;

  let query = product.category || product.name.split(" ").slice(0, 2).join(" ");

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

    const data = (await response.json()) as {
      videos: Array<{
        video_files: Array<{
          quality: string;
          link: string;
          id: number;
        }>;
      }>;
    };

    if (data.videos && data.videos.length > 0) {
      const bestVideo = data.videos[0].video_files.find((f) => f.quality === "hd") || data.videos[0].video_files[0];
      return { url: bestVideo.link };
    }

    logger.warn("video.no_stock_found", { query });
    return {
      url: "https://assets.mixkit.co/videos/preview/mixkit-tech-animation-with-glowing-lines-48356-preview.mp4",
    };

  } catch (error) {
    logger.error("video.media_generation_failed", { err: error });
    return {
      url: "https://assets.mixkit.co/videos/preview/mixkit-tech-animation-with-glowing-lines-48356-preview.mp4",
    };
  }
};

/**
 * Generates a high-quality video using Fal.ai based on a product image and an AI-generated script.
 */
export const generateAIDrivenVideo = async (barcode: string, vibe: string, customPrompt?: string): Promise<{ videoUrl: string }> => {
  const productResult = await getProductByBarcode(barcode);
  if (!productResult.ok) throw new NotFoundError("Product not found");
  const product = productResult.value;

  const imageUrl = (product.images && product.images.length > 0) ? product.images[0] : product.imageUrl;
  if (!imageUrl) {
    throw new NotFoundError("Product has no images to generate video from");
  }

  let videoPrompt = "";

  if (customPrompt) {
    videoPrompt = customPrompt;
  } else {
    const script = await generateVideoScript(barcode, vibe, "instagram");
    const firstScene = script.scenes[0] || { visualParams: script.hook, cinematicCamera: "cinematic product reveal" };
    videoPrompt = `${firstScene.visualParams}. Camera movement: ${firstScene.cinematicCamera || "dynamic reveal"}. Style: ${vibe}, high quality, commercial look.`;
  }

  logger.info("video.ai_driven_start", { barcode, imageUrl, videoPrompt, isCustom: !!customPrompt });

  const result = await generateProductVideo(imageUrl, videoPrompt);

  return {
    videoUrl: result.videoUrl
  };
};
