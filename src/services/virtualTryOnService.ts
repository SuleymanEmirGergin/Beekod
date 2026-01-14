import { logger } from "../logger.js";
import { runVirtualTryOn } from "./visualIntelligenceService.js";

interface TryOnResult {
  status: "complete" | "error";
  imageUrl?: string;
  error?: string;
}

/**
 * Generates a Virtual Try-On using Fal.ai IDM-VTON
 * 
 * Fal.ai is synchronous and returns the result directly without polling.
 */
export async function generateVirtualTryOn(
  humanImage: string,
  clothingImages: string | string[],
  category: "tops" | "bottoms" | "one-pieces" = "tops"
): Promise<TryOnResult> {
  const clothes = Array.isArray(clothingImages) ? clothingImages[0] : clothingImages;
  
  logger.info("vto.generate_request", { 
    humanImage: humanImage.substring(0, 50), 
    clothesCount: Array.isArray(clothingImages) ? clothingImages.length : 1 
  });

  try {
    const resultUrl = await runVirtualTryOn(humanImage, clothes, category);
    
    logger.info("vto.complete", { resultUrl });
    
    return {
      status: "complete",
      imageUrl: resultUrl
    };
  } catch (error) {
    logger.error("vto.failed", { error: String(error) });
    return {
      status: "error",
      error: String(error)
    };
  }
}

/**
 * Polls for the result of a VTO task.
 * @deprecated Fal.ai is synchronous, no polling needed. Kept for API compatibility.
 */
export async function pollTryOnResult(_token: string): Promise<string | null> {
  logger.warn("vto.poll_deprecated", { msg: "Fal.ai is synchronous, polling is no longer needed" });
  return null;
}
