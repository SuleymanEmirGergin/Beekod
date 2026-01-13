import { getFalImageProvider, getFalTryOnProvider, getFalVideoProvider } from "../ai/providers/index.js";

/**
 * Visual Intelligence Service
 * Powered by Fal.ai (FLUX + IDM-VTON + Kling)
 */

export async function generateAIModel(
  prompt: string, 
  options?: { appearance?: string; mood?: string; origin?: string }
) {
  const provider = getFalImageProvider();
  const result = await provider.generateImage({
    prompt,
    options: {
      aspectRatio: "9:16",
      ...options
    }
  });
  return result.outputImageUrl;
}

export async function runVirtualTryOn(
  humanImageUrl: string,
  clothImageUrl: string,
  category: "tops" | "bottoms" | "one-pieces",
  options?: { appearance?: string; mood?: string; origin?: string }
) {
  const provider = getFalTryOnProvider();
  const result = await provider.tryOn({
    modelImageUrl: humanImageUrl,
    productImageUrl: clothImageUrl,
    options: {
      category,
      ...options
    }
  });
  return result.outputImageUrl;
}

export async function generateProductVideo(
  imageUrl: string,
  prompt: string
) {
  const provider = getFalVideoProvider();
  const result = await provider.generateVideo({
    imageUrl,
    prompt,
    options: {
      aspectRatio: "9:16"
    }
  });
  return {
    videoUrl: result.outputVideoUrl,
    coverUrl: imageUrl,
    duration: 5,
    provider: "fal-kling"
  };
}
