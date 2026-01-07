import { logger } from "../logger.js";

export type ImageSearchResult = {
  title: string;
  price: number;
  currency: string;
  url: string;
  thumbnail: string;
  source: string;
  similarity?: number;
};

// Mock response for now
// Accepts a Buffer (file content)
export async function searchByImage(imageBuffer: Buffer): Promise<ImageSearchResult[]> {
  logger.info("imageSearch.search_started", { size: imageBuffer.length });

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Determine "mock" results based on random chance or file size hash
  // just to return something different sometimes
  const randomFactor = Math.random();

  if (randomFactor > 0.9) {
    return []; // Simulate no results
  }

  // Return mock products
  return [
    {
      title: "Kirmizi Elbise (Tespit Edilen)",
      price: 599.99,
      currency: "TRY",
      url: "https://www.trendyol.com/brand/p-123456",
      thumbnail: "https://loremflickr.com/150/150/dress",
      source: "trendyol",
      similarity: 0.95,
    },
    {
      title: "Benzer Urun - Mavi Elbise",
      price: 450.0,
      currency: "TRY",
      url: "https://www.hepsiburada.com/product-xyz",
      thumbnail: "https://loremflickr.com/150/150/clothing",
      source: "hepsiburada",
      similarity: 0.88,
    },
    {
      title: "Amazon Alternatif",
      price: 620.5,
      currency: "TRY",
      url: "https://www.amazon.com.tr/dp/B00000",
      thumbnail: "https://loremflickr.com/150/150/fashion",
      source: "amazon",
      similarity: 0.75,
    },
  ];
}
