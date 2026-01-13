import { fal } from "@fal-ai/client";
import { ImageProvider, ImageRequest, ImageResponse, ProviderContext } from "../interfaces.js";
import { logger } from "../../../logger.js";
import { InternalError } from "../../../errors/AppError.js";

const FLUX_MODEL = "fal-ai/flux/dev";

export class FalImageProvider implements ImageProvider {
  readonly name = "fal-image";

  async generateImage(request: ImageRequest, ctx?: ProviderContext): Promise<ImageResponse> {
    const startTime = Date.now();
    try {
      logger.info("fal.image.start", { prompt: request.prompt, requestId: ctx?.requestId });

      // Build enhanced prompt
      let enhancedPrompt = request.prompt;
      const meta = [];
      if (request.options?.origin) meta.push(`${request.options.origin} origin`);
      if (request.options?.appearance) meta.push(`${request.options.appearance} appearance`);
      if (request.options?.mood) meta.push(`${request.options.mood} mood`);
      
      if (meta.length > 0) {
        enhancedPrompt = `Professional fashion photo of a ${meta.join(", ")} model, ${enhancedPrompt}`;
      }

      const sizeMap: Record<string, string> = {
        "9:16": "portrait_16_9",
        "16:9": "landscape_16_9",
        "1:1": "square",
        "4:3": "landscape_4_3",
        "3:4": "portrait_4_3"
      };
      const imageSize = (sizeMap[request.options?.aspectRatio || "9:16"] || "portrait_16_9") as any;

      const result = await fal.subscribe(FLUX_MODEL, {
        input: {
          prompt: enhancedPrompt,
          image_size: imageSize,
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: request.options?.numOutputs || 1,
          enable_safety_checker: true,
        },
        logs: true,
        onQueueUpdate: (update) => {
          logger.debug("fal.image.queue", { status: update.status, requestId: ctx?.requestId });
        },
      });

      const outputImageUrl = (result.data as any).images?.[0]?.url;
      if (!outputImageUrl) {
        throw new InternalError("No image URL in Fal response");
      }

      return {
        outputImageUrl,
        meta: {
          provider: "fal",
          model: FLUX_MODEL,
          latencyMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      logger.error("fal.image.failed", { error: String(error), requestId: ctx?.requestId });
      throw error;
    }
  }
}
