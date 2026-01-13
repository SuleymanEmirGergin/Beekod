/**
 * Wiro Service - Thin Wrapper
 *
 * This file keeps backward compatibility for existing callers while
 * delegating logic to the Wiro provider.
 */
import { getWiroTryOnProvider, } from "../ai/providers/tryon/WiroTryOnProvider.js";
export async function runVirtualTryOn(humanImage, clothesImages, category) {
    const provider = getWiroTryOnProvider();
    const clothesArray = Array.isArray(clothesImages) ? clothesImages : [clothesImages];
    return provider.createTryOnTask(humanImage, clothesArray[0], category);
}
export async function generateBaseModelWithFlux(prompt) {
    const provider = getWiroTryOnProvider();
    return provider.generateBaseModelWithFlux(prompt);
}
export async function pollFluxTaskForImage(taskToken, maxAttempts = 30, intervalMs = 1000) {
    const provider = getWiroTryOnProvider();
    return provider.pollFluxTaskForImage(taskToken, maxAttempts, intervalMs);
}
export async function runImageToVideo(inputImage, prompt) {
    const provider = getWiroTryOnProvider();
    return provider.createImageToVideoTask(inputImage, prompt);
}
export async function getTaskDetail(taskToken) {
    const provider = getWiroTryOnProvider();
    return provider.getTaskDetail(taskToken);
}
export async function killTask(taskId) {
    const provider = getWiroTryOnProvider();
    return provider.killTask(taskId);
}
export async function cancelTask(taskId) {
    const provider = getWiroTryOnProvider();
    return provider.cancelTask(taskId);
}
export async function runChatCompletion(prompt, options = {}) {
    const provider = getWiroTryOnProvider();
    return provider.runChatCompletion(prompt, options);
}
export async function chat(prompt) {
    const provider = getWiroTryOnProvider();
    return provider.chat(prompt);
}
