/**
 * AI Provider Interfaces
 * 
 * Common interfaces for all AI providers to ensure consistent behavior
 * and easy swapping of implementations.
 */

// ============================================
// Common Types
// ============================================

export interface ProviderContext {
  tenantId?: string;
  userId?: string;
  requestId?: string;
  locale?: string;
}

export interface ProviderMeta {
  model?: string;
  provider: string;
  latencyMs?: number;
  tokenCount?: number;
  cost?: number;
}

// ============================================
// LLM Provider Interface
// ============================================

export interface ActionToolCall {
  tool: string;
  args: Record<string, unknown>;
}

export interface ActionPlan {
  intent: string;
  toolCalls: ActionToolCall[];
  responseStyle: 'short' | 'normal' | 'detailed';
}

export interface PlanRequest {
  message: string;
  context?: {
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    tenantContext?: Record<string, unknown>;
    availableTools?: string[];
  };
  systemPrompt?: string;
}

export interface PlanResponse {
  plan: ActionPlan;
  rawOutput?: string;
  meta: ProviderMeta;
}

export interface RespondRequest {
  message: string;
  toolResults: Array<{
    tool: string;
    result: unknown;
    error?: string;
  }>;
  style: 'short' | 'normal' | 'detailed';
  context?: {
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    tenantContext?: Record<string, unknown>;
  };
  systemPrompt?: string;
}

export interface RespondResponse {
  answer: string;
  meta: ProviderMeta;
}

export interface LLMProvider {
  readonly name: string;
  
  /**
   * Step A: Generate an action plan (JSON) from user message
   */
  plan(request: PlanRequest, ctx?: ProviderContext): Promise<PlanResponse>;
  
  /**
   * Step C: Generate final response grounded in tool results
   */
  respond(request: RespondRequest, ctx?: ProviderContext): Promise<RespondResponse>;
  
  /**
   * Simple text generation (for backward compatibility)
   */
  generate?(prompt: string, ctx?: ProviderContext): Promise<string>;
}

// ============================================
// Try-On Provider Interface
// ============================================

export interface TryOnRequest {
  productImageUrl: string;
  modelImageUrl: string;
  options?: {
    category?: 'upper_body' | 'lower_body' | 'full_body' | 'dress' | 'tops' | 'bottoms' | 'one-pieces';
    style?: string;
    pose?: string;
    mood?: string;
    appearance?: string;
    origin?: string;
    outputFormat?: 'png' | 'jpeg' | 'webp';
  };
}

export interface TryOnResponse {
  outputImageUrl: string;
  taskId?: string;
  meta: ProviderMeta;
}

export interface TryOnProvider {
  readonly name: string;
  
  tryOn(request: TryOnRequest, ctx?: ProviderContext): Promise<TryOnResponse>;
  
  /**
   * Check status of async try-on task
   */
  getTaskStatus?(taskId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    outputImageUrl?: string;
    error?: string;
  }>;
}

// ============================================
// Video Provider Interface
// ============================================

export interface VideoRequest {
  imageUrl: string;
  prompt: string;
  options?: {
    duration?: number;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    fps?: number;
    style?: string;
  };
}

export interface VideoResponse {
  outputVideoUrl: string;
  taskId?: string;
  duration?: number;
  meta: ProviderMeta;
}

export interface VideoProvider {
  readonly name: string;
  
  generateVideo(request: VideoRequest, ctx?: ProviderContext): Promise<VideoResponse>;
  
  getTaskStatus?(taskId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    outputVideoUrl?: string;
    progress?: number;
    error?: string;
  }>;
}

// ============================================
// Image Provider Interface
// ============================================

export interface ImageRequest {
  prompt: string;
  refImages?: string[];
  options?: {
    width?: number;
    height?: number;
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    style?: string;
    mood?: string;
    appearance?: string;
    origin?: string;
    negativePrompt?: string;
    numOutputs?: number;
    outputFormat?: 'png' | 'jpeg' | 'webp';
  };
}

export interface ImageResponse {
  outputImageUrl: string;
  additionalImages?: string[];
  taskId?: string;
  meta: ProviderMeta;
}

export interface ImageProvider {
  readonly name: string;
  
  generateImage(request: ImageRequest, ctx?: ProviderContext): Promise<ImageResponse>;
  
  getTaskStatus?(taskId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    outputImageUrl?: string;
    error?: string;
  }>;
}
