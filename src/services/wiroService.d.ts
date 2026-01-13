export function runImageToVideo(imageUrl: string, prompt: string): Promise<any>;
export function runVirtualTryOn(humanImage: string, garmentImage: string | string[], category?: string): Promise<any>;
export function getTaskDetail(token: string): Promise<any>;
export function killTask(id: string): Promise<any>;
export function cancelTask(id: string): Promise<any>;
export function runChatCompletion(prompt: string, options?: any): Promise<string>;
export function generateBaseModelWithFlux(prompt: string): Promise<any>;
export function pollFluxTaskForImage(token: string): Promise<string | null>;
export function generateVirtualTryOn(params: {
  garmentImage: string;
  modelImage: string;
  category?: string;
}): Promise<{ resultUrl: string }>;
