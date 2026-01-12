/**
 * Wiro Service - Thin Wrapper
 *
 * This file keeps backward compatibility for existing callers while
 * delegating logic to the Wiro provider.
 */

import {
  getWiroTryOnProvider,
  WiroChatOptions,
} from "../ai/providers/tryon/WiroTryOnProvider.js";

export async function runVirtualTryOn(
  humanImage: string,
  clothesImages: string | string[],
  category?: string,
): Promise<any> {
  const provider = getWiroTryOnProvider();
  const clothesArray = Array.isArray(clothesImages) ? clothesImages : [clothesImages];
  return provider.createTryOnTask(humanImage, clothesArray[0], category);
}

export async function generateBaseModelWithFlux(prompt: string): Promise<any> {
  const provider = getWiroTryOnProvider();
  return provider.generateBaseModelWithFlux(prompt);
}

export async function pollFluxTaskForImage(
  taskToken: string,
  maxAttempts = 30,
  intervalMs = 1000,
): Promise<string> {
  const provider = getWiroTryOnProvider();
  return provider.pollFluxTaskForImage(taskToken, maxAttempts, intervalMs);
}

export async function runImageToVideo(inputImage: string, prompt: string): Promise<any> {
  const provider = getWiroTryOnProvider();
  return provider.createImageToVideoTask(inputImage, prompt);
}

export async function getTaskDetail(taskToken: string): Promise<any> {
  const provider = getWiroTryOnProvider();
  return provider.getTaskDetail(taskToken);
}

export async function killTask(taskId: string): Promise<any> {
  const provider = getWiroTryOnProvider();
  return provider.killTask(taskId);
}

export async function cancelTask(taskId: string): Promise<any> {
  const provider = getWiroTryOnProvider();
  return provider.cancelTask(taskId);
}

export async function runChatCompletion(
  prompt: string,
  options: WiroChatOptions = {},
): Promise<string> {
  const provider = getWiroTryOnProvider();
  return provider.runChatCompletion(prompt, options);
}

export async function chat(prompt: string): Promise<string> {
  const provider = getWiroTryOnProvider();
  return provider.chat(prompt);
}
