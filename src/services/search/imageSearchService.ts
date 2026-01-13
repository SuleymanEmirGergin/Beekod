import { searchImages } from "./searchService.js";
import { logger } from "../../logger.js";

/**
 * Görsel arama işlemlerini yöneten birleştirilmiş servis.
 */

export type ImageSearchResult = {
  title: string;
  price: number;
  currency: string;
  url: string;
  thumbnail: string;
  source: string;
  similarity?: number;
};

export type ImageSearchContext = {
  query: string;
  siteSearch?: string;
  num: number;
};

/**
 * Resolves context for image search
 */
export function resolveImageSearchContext(input: {
  query: string;
  message?: string;
  siteSearch?: string;
  num?: number;
}): ImageSearchContext {
  return {
    query: input.query || input.message || "",
    siteSearch: input.siteSearch,
    num: input.num || 5,
  };
}

/**
 * Mock image search response (for backward compatibility/testing)
 */
export async function searchByImage(imageBuffer: Buffer): Promise<ImageSearchResult[]> {
  logger.info("imageSearch.mock_search_triggered", { bufferSize: imageBuffer.length });
  
  // Return mock results as it was in imageSearch.ts
  return [
    {
      title: "Sample Product from Mock Search",
      price: 299.99,
      currency: "TRY",
      url: "https://example.com/p1",
      thumbnail: "https://picsum.photos/200",
      source: "Mock Search",
      similarity: 0.95,
    },
  ];
}

/**
 * Runs a real image search using the search service context
 */
export async function runImageSearch(input: {
  query: string;
  message?: string;
  siteSearch?: string;
  num?: number;
}): Promise<{ 
    context: ImageSearchContext; 
    result: { query: string; items: any[]; totalResults?: number; searchTime?: number } 
}> {
  const context = resolveImageSearchContext(input);
  const items = await searchImages(context.query, {
    maxResults: context.num,
  });
  
  return { 
    context, 
    result: { query: context.query, items } 
  };
}
