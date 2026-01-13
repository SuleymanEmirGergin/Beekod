import { logger } from "../logger.js";
<<<<<<< HEAD
import { runVirtualTryOn } from "./visualIntelligenceService.js";

=======
import { runVirtualTryOn, getTaskDetail } from "./wiroService.js";

interface TryOnRequest {
  humanImage: string;
  clothingImages: string | string[];
}
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e

interface TryOnResult {
  taskId: string;
  token: string;
  status: string;
  imageUrl?: string;
}

/**
<<<<<<< HEAD
 * Generates a Virtual Try-On task using Fal.ai (via Visual Intelligence Service).
=======
 * Generates a Virtual Try-On task using Wiro AI.
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
 */
export async function generateVirtualTryOn(
  humanImage: string,
  clothingImages: string | string[],
): Promise<TryOnResult> {
<<<<<<< HEAD
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
=======
  logger.info("vto.generate_request_real", { humanImage: humanImage.substring(0, 50), clothesCount: Array.isArray(clothingImages) ? clothingImages.length : 1 });

  const result = await runVirtualTryOn(humanImage, clothingImages);

  return {
    taskId: result.taskid,
    token: result.socketaccesstoken,
    status: result.status || "queued"
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
  };
}

/**
<<<<<<< HEAD
 * Polls for the result. (For Fal.ai, it is usually finished when generateVirtualTryOn returns)
 */
export async function pollTryOnResult(token: string): Promise<string | null> {
  // Since we are using the subscription model in generateVirtualTryOn,
  // there's no real polling needed if we store the result.
  // But for backward compatibility with existing callers, we return null or the stored result if we had a cache.
  logger.info("vto.poll_request_fal", { token });
  return null; 
=======
 * Polls for the result of a VTO task.
 */
export async function pollTryOnResult(token: string): Promise<string | null> {
  try {
    const detail = await getTaskDetail(token);
    if (detail && detail.status === "done" && detail.output && detail.output.length > 0) {
      return detail.output[0];
    }
    return null;
  } catch (error) {
    logger.error("vto.poll_failed", { token, error });
    return null;
  }
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
}
