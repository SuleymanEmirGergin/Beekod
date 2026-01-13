import { logger } from "../logger.js";
import { runVirtualTryOn } from "./visualIntelligenceService.js";


interface TryOnResult {
  taskId: string;
  token: string;
  status: string;
  imageUrl?: string;
}

/**
 * Generates a Virtual Try-On task using Fal.ai (via Visual Intelligence Service).
 */
export async function generateVirtualTryOn(
  humanImage: string,
  clothingImages: string | string[],
): Promise<TryOnResult> {
  logger.info("vto.generate_request_fal", { 
    humanImage: humanImage.substring(0, 50), 
    clothesCount: Array.isArray(clothingImages) ? clothingImages.length : 1 
  });

  const clothImage = Array.isArray(clothingImages) ? clothingImages[0] : clothingImages;
  
  // Fal.ai subscribe waits for the result, so we get the result immediately here
  const resultUrl = await runVirtualTryOn(humanImage, clothImage, "tops");

  return {
    taskId: "fal-" + Date.now(),
    token: "fal-" + Date.now(),
    status: "completed",
    imageUrl: resultUrl
  };
}

/**
 * Polls for the result. (For Fal.ai, it is usually finished when generateVirtualTryOn returns)
 */
export async function pollTryOnResult(token: string): Promise<string | null> {
  // Since we are using the subscription model in generateVirtualTryOn,
  // there's no real polling needed if we store the result.
  // But for backward compatibility with existing callers, we return null or the stored result if we had a cache.
  logger.info("vto.poll_request_fal", { token });
  return null; 
}
