import { TryOnProvider, TryOnRequest, TryOnResponse, ProviderContext } from '../interfaces.js';

export class WiroTryOnProvider implements TryOnProvider {
  readonly name: string;
  tryOn(request: TryOnRequest, ctx?: ProviderContext): Promise<TryOnResponse>;
  createTryOnTask(humanImage: string, garmentImage: string, category?: string): Promise<any>;
  generateBaseModelWithFlux(prompt: string): Promise<any>;
  pollFluxTaskForImage(taskToken: string, maxAttempts?: number, intervalMs?: number): Promise<string | null>;
  createImageToVideoTask(inputImage: string, prompt: string): Promise<any>;
  getTaskDetail(taskToken: string): Promise<any>;
  killTask(taskId: string): Promise<any>;
  cancelTask(taskId: string): Promise<any>;
  runChatCompletion(prompt: string, options?: any): Promise<string>;
  chat(prompt: string): Promise<string>;
}

export function getWiroTryOnProvider(): WiroTryOnProvider;
