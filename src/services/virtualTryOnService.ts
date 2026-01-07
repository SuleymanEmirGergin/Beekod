import { logger } from "../logger.js";

interface TryOnRequest {
  clothingImage: string;
  modelImage: string;
  category: string;
}

interface TryOnResult {
  imageUrl: string;
  debug?: any;
}

/**
 * Mock implementation of Virtual Try-On.
 * In a real scenario, this would call an external API like Replicate, OpenAI, or a custom model.
 * Currently, it waits a bit to simulate processing and returns the clothing image as the "result"
 * to demonstrate the flow in the UI without requiring actual GPU inference.
 */
export async function generateVirtualTryOn(
  clothingImage: string,
  modelImage: string,
  category: string,
): Promise<TryOnResult> {
  logger.info("vto.generate_request", { category, clothingImage, modelImage });

  // Simulate processing time (2-4 seconds) to give the "AI is thinking" feel
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Return the clothing image as the result.
  // In a real VTO, this would be the merged image.
  // We return the input as output to ensuring validity of the URL.
  return {
    imageUrl: clothingImage,
  };
}
