import { fal } from "@fal-ai/client";
import { VideoProvider, VideoRequest, VideoResponse, ProviderContext } from "../interfaces.js";
import { logger } from "../../../logger.js";
import { InternalError } from "../../../errors/AppError.js";

const KLING_MODEL = "fal-ai/kling-video/v1.5/pro/image-to-video";

export class FalVideoProvider implements VideoProvider {
  readonly name = "fal-video";

  async generateVideo(request: VideoRequest, ctx?: ProviderContext): Promise<VideoResponse> {
    const startTime = Date.now();
    try {
      logger.info("fal.video.start", { prompt: request.prompt, requestId: ctx?.requestId });

      const result = await fal.subscribe(KLING_MODEL, {
        input: {
          image_url: request.imageUrl,
          prompt: request.prompt,
          aspect_ratio: request.options?.aspectRatio || "9:16",
        },
        logs: true,
      });

      const outputVideoUrl = (result.data as any).video?.url;
      if (!outputVideoUrl) {
        throw new InternalError("No video URL in Fal response");
      }

      return {
        outputVideoUrl,
        meta: {
          provider: "fal",
          model: KLING_MODEL,
          latencyMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      logger.error("fal.video.failed", { error: String(error), requestId: ctx?.requestId });
      throw error;
    }
  }
}
