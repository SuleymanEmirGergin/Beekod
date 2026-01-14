/**
 * Replicate Service - Thin Wrapper
 *
 * Maintains backward compatibility while delegating to Fal.ai providers.
 */

import fs from "fs";
import path from "path";
import { logger } from "../../logger.js";
import { InternalError } from "../../errors/AppError.js";
import { getFalTryOnProvider, getFalImageProvider } from "../../ai/providers/index.js";
import { getReplicateVideoProvider } from "../../ai/providers/video/ReplicateVideoProvider.js";

function fileToDataUri(input: string): string {
  if (input.startsWith("http") || input.startsWith("data:")) return input;

  if (fs.existsSync(input)) {
    const ext = path.extname(input).toLowerCase();
    const mime = ext === ".png" ? "image/png" : "image/jpeg";
    const b64 = fs.readFileSync(input, "base64");
    return `data:${mime};base64,${b64}`;
  }
  return input;
}

/**
 * Virtual Try-On via Fal.ai IDM-VTON
 * @deprecated Use visualIntelligenceService.runVirtualTryOn() instead
 */
export async function runVirtualTryOn(
  humanImage: string,
  garmentImage: string,
  _description: string = "",
): Promise<string> {
  try {
    logger.info("replicate.idm_vton.start", { hasHuman: !!humanImage, hasGarment: !!garmentImage });

    // Use Fal.ai for Virtual Try-On
    const provider = getFalTryOnProvider();
    const result = await provider.tryOn({
      productImageUrl: fileToDataUri(garmentImage),
      modelImageUrl: fileToDataUri(humanImage),
      options: { category: "tops" },
    });
    return result.outputImageUrl;
  } catch (error) {
    logger.error("replicate.idm_vton.error", { error });
    throw new InternalError("Failed to generate VTON with Fal.ai");
  }
}

/**
 * Generate a realistic human model based on attributes
 * @deprecated Use visualIntelligenceService.generateAIModel() instead
 */
export async function generateBaseModel(prompt: string): Promise<string> {
  try {
    logger.info("replicate.generate_model.start", { prompt });

    // Use Fal.ai FLUX for model generation
    const provider = getFalImageProvider();
    const result = await provider.generateImage({
      prompt: `professional full body photo of a ${prompt}, standing pose, white background, studio lighting, high quality, 8k, realistic texture`,
      options: { aspectRatio: "9:16" }
    });
    
    return result.outputImageUrl;
  } catch (falError) {
    // Fallback to Replicate if Fal.ai fails and REPLICATE_API_TOKEN exists
    if (process.env.REPLICATE_API_TOKEN) {
      logger.warn("replicate.generate_model.fal_failed_using_replicate", { error: falError });
      
      const input = {
        prompt:
          "professional full body photo of a " +
          prompt +
          ", standing pose, white background, studio lighting, high quality, 8k, realistic texture",
        num_outputs: 1,
        aspect_ratio: "9:16",
        output_format: "png",
      };

      const provider = getReplicateVideoProvider();
      const output = await provider.runModel<string | string[]>("black-forest-labs/flux-schnell", input);

      if (Array.isArray(output)) {
        return output[0];
      }
      return String(output);
    }
    
    logger.error("replicate.generate_model.error", { error: falError });
    throw new InternalError("Failed to generate base model");
  }
}
