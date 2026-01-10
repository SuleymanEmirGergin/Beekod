import { logger } from "../logger.js";
import { runVirtualTryOn, getTaskDetail } from "./wiroService.js";

interface TryOnRequest {
  humanImage: string;
  clothingImages: string | string[];
}

interface TryOnResult {
  taskId: string;
  token: string;
  status: string;
  imageUrl?: string;
}

/**
 * Generates a Virtual Try-On task using Wiro AI.
 */
export async function generateVirtualTryOn(
  humanImage: string,
  clothingImages: string | string[],
): Promise<TryOnResult> {
  logger.info("vto.generate_request_real", { humanImage: humanImage.substring(0, 50), clothesCount: Array.isArray(clothingImages) ? clothingImages.length : 1 });

  const result = await runVirtualTryOn(humanImage, clothingImages);

  return {
    taskId: result.taskid,
    token: result.socketaccesstoken,
    status: result.status || "queued"
  };
}

/**
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
}
