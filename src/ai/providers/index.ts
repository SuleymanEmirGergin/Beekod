/**
 * AI Providers - Central Export
 * 
 * All provider implementations and interfaces
 */

// Interfaces
export * from './interfaces.js';

// LLM Providers
export { GeminiProvider, getGeminiProvider } from './gemini/GeminiProvider.js';

// Image Providers
import { FalImageProvider } from './image/FalImageProvider.js';
export { FalImageProvider };

import { FalTryOnProvider } from './tryon/FalTryOnProvider.js';
export { FalTryOnProvider };

// Video Providers
import { FalVideoProvider } from './video/FalVideoProvider.js';
import { ReplicateVideoProvider, getReplicateVideoProvider } from './video/ReplicateVideoProvider.js';
export { FalVideoProvider, ReplicateVideoProvider, getReplicateVideoProvider };

/**
 * Getters
 */
let falImageProviderInstance: FalImageProvider | null = null;
export function getFalImageProvider(): FalImageProvider {
  if (!falImageProviderInstance) falImageProviderInstance = new FalImageProvider();
  return falImageProviderInstance;
}

let falTryOnProviderInstance: FalTryOnProvider | null = null;
export function getFalTryOnProvider(): FalTryOnProvider {
  if (!falTryOnProviderInstance) falTryOnProviderInstance = new FalTryOnProvider();
  return falTryOnProviderInstance;
}

let falVideoProviderInstance: FalVideoProvider | null = null;
export function getFalVideoProvider(): FalVideoProvider {
  if (!falVideoProviderInstance) falVideoProviderInstance = new FalVideoProvider();
  return falVideoProviderInstance;
}
