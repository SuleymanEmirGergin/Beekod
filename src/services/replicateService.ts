/**
 * Replicate Service - Thin Wrapper
 *
 * Maintains backward compatibility while delegating to providers.
 */

import fs from "fs";
import path from "path";
import { logger } from "../logger.js";
import { InternalError } from "../errors/AppError.js";
import { getWiroTryOnProvider } from "../ai/providers/tryon/WiroTryOnProvider.js";
import { getReplicateVideoProvider } from "../ai/providers/video/ReplicateVideoProvider.js";

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
 * Virtual Try-On via Wiro (preferred) or Replicate (fallback)
 * @deprecated Use WiroTryOnProvider.tryOn() instead
 */
export async function runVirtualTryOn(
  humanImage: string,
  garmentImage: string,
  description: string = "",
): Promise<string> {
  try {
    logger.info("replicate.idm_vton.start", { hasHuman: !!humanImage, hasGarment: !!garmentImage });

    if (process.env.WIRO_API_KEY) {
      const provider = getWiroTryOnProvider();
      const result = await provider.tryOn({
        productImageUrl: fileToDataUri(garmentImage),
        modelImageUrl: fileToDataUri(humanImage),
        options: { category: "upper_body" },
      });
      return result.outputImageUrl;
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      throw new InternalError("REPLICATE_API_TOKEN is missing");
    }

    const input = {
      garm_img: fileToDataUri(garmentImage),
      human_img: fileToDataUri(humanImage),
      garment_des: description || "clothing item",
      crop: false,
      seed: 42,
      steps: 30,
      category: "upper_body",
    };

    const provider = getReplicateVideoProvider();
    const output = await provider.runModel<string | string[]>(
      "cuuupid/idm-vton:c871bb9b046607e58045aafa6f1c403be9530d71b8b747d96433e-000000000",
      input,
    );

    if (Array.isArray(output)) {
      return output[0];
    }
    return String(output);
  } catch (error) {
    logger.error("replicate.idm_vton.error", { error });
    throw new InternalError("Failed to generate VTON with Replicate");
  }
}

/**
 * Generate a realistic human model based on attributes
 * @deprecated Consider using an ImageProvider for model generation
 */
export async function generateBaseModel(prompt: string): Promise<string> {
  try {
    logger.info("replicate.generate_model.start", { prompt });

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
  } catch (error) {
    logger.error("replicate.generate_model.error", { error });
    throw new InternalError("Failed to generate base model");
  }
}
