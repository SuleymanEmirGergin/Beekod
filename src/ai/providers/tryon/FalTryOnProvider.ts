import { fal } from "@fal-ai/client";
import { TryOnProvider, TryOnRequest, TryOnResponse, ProviderContext } from "../interfaces.js";
import { logger } from "../../../logger.js";
import { InternalError } from "../../../errors/AppError.js";

const VTON_MODEL = "fal-ai/idm-vton";

interface FalVTONResponse {
  image: {
    url: string;
  };
}

export class FalTryOnProvider implements TryOnProvider {
  readonly name = "fal-tryon";

  async tryOn(request: TryOnRequest, ctx?: ProviderContext): Promise<TryOnResponse> {
    const startTime = Date.now();
    try {
      logger.info("fal.tryon.start", { requestId: ctx?.requestId });

      // Build description from metadata if available
      const meta = [];
      if (request.options?.origin) meta.push(`${request.options.origin} origin`);
      if (request.options?.appearance) meta.push(`${request.options.appearance} appearance`);
      if (request.options?.mood) meta.push(`${request.options.mood} mood`);
      
      const description = meta.length > 0 
        ? `Model with ${meta.join(", ")} characteristics wearing the garment.`
        : "Fashion model wearing the garment.";

      const result = await fal.subscribe(VTON_MODEL, {
        input: {
          human_image_url: request.modelImageUrl,
          garm_img: request.productImageUrl,
          description: description,
          category: request.options?.category || "tops",
        },
        logs: true,
      });

      const data = result.data as unknown as FalVTONResponse;
      const outputImageUrl = data.image?.url;
      
      if (!outputImageUrl) {
        throw new InternalError("No image URL in Fal try-on response");
      }

      return {
        outputImageUrl,
        meta: {
          provider: "fal",
          model: VTON_MODEL,
          latencyMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      logger.error("fal.tryon.failed", { error: String(error), requestId: ctx?.requestId });
      throw error;
    }
  }
}
