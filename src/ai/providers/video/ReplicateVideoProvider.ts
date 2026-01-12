/**
 * Replicate Video Provider
 *
 * Wraps Replicate for image-to-video generation.
 */

import Replicate from "replicate";
import { VideoProvider, VideoRequest, VideoResponse, ProviderContext } from "../interfaces.js";
import { logger } from "../../../logger.js";
import { redactSecrets } from "../../audit/redact.js";
import { InternalError } from "../../../errors/AppError.js";

export class ReplicateVideoProvider implements VideoProvider {
  readonly name = "replicate-video";
  private client: Replicate;
  private model: string;
  private imageKey: string;
  private promptKey: string;

  constructor(
    apiToken?: string,
    model?: string,
    imageKey?: string,
    promptKey?: string,
  ) {
    const token = apiToken || process.env.REPLICATE_API_TOKEN || "";
    this.model = model || process.env.REPLICATE_VIDEO_MODEL || "";
    this.imageKey = imageKey || process.env.REPLICATE_VIDEO_IMAGE_KEY || "image";
    this.promptKey = promptKey || process.env.REPLICATE_VIDEO_PROMPT_KEY || "prompt";

    if (!token) {
      logger.warn("replicate.provider.no_api_token");
    }
    if (!this.model) {
      logger.warn("replicate.provider.no_model");
    }

    this.client = new Replicate({ auth: token });
  }

  async generateVideo(request: VideoRequest, ctx?: ProviderContext): Promise<VideoResponse> {
    const startTime = Date.now();

    if (!process.env.REPLICATE_API_TOKEN) {
      throw new InternalError("REPLICATE_API_TOKEN is not configured");
    }
    if (!this.model) {
      throw new InternalError("REPLICATE_VIDEO_MODEL is not configured");
    }

    try {
      const input: Record<string, unknown> = {};
      if (request.imageUrl) {
        input[this.imageKey] = request.imageUrl;
      }
      if (request.prompt) {
        input[this.promptKey] = request.prompt;
      }

      logger.info("replicate.video.start", {
        model: this.model,
        hasImage: !!request.imageUrl,
        promptLength: request.prompt.length,
        requestId: ctx?.requestId,
      });

      // Cast model to expected Replicate type format
      const output = await this.client.run(this.model as `${string}/${string}:${string}`, { input });

      let outputVideoUrl = "";
      if (Array.isArray(output)) {
        outputVideoUrl = String(output[0] || "");
      } else {
        outputVideoUrl = String(output || "");
      }

      const latencyMs = Date.now() - startTime;

      logger.info("replicate.video.success", { latencyMs, requestId: ctx?.requestId });

      return {
        outputVideoUrl,
        meta: {
          provider: this.name,
          latencyMs,
        },
      };
    } catch (error) {
      logger.error("replicate.video.error", { error: redactSecrets(String(error)) });
      throw new InternalError("Failed to generate video with Replicate");
    }
  }

  async runModel<T = unknown>(model: string, input: Record<string, unknown>): Promise<T> {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new InternalError("REPLICATE_API_TOKEN is not configured");
    }
    if (!model) {
      throw new InternalError("Replicate model is required");
    }
    return (await this.client.run(model as `${string}/${string}:${string}`, { input })) as T;
  }
}

let defaultProvider: ReplicateVideoProvider | null = null;

export function getReplicateVideoProvider(): ReplicateVideoProvider {
  if (!defaultProvider) {
    defaultProvider = new ReplicateVideoProvider();
  }
  return defaultProvider;
}
