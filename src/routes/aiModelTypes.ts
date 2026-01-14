/**
 * AI Model Routes - Type Definitions
 * Extracted to provide type safety and reduce `any` usage
 */

import { Request, Response } from "express";

// Model generation attributes
export interface ModelAttributes {
  gender?: 'male' | 'female' | 'model';
  ethnicity?: string;
  bodyType?: 'slim' | 'athletic' | 'curvy' | string;
  hairColor?: string;
  hairLength?: 'short' | 'medium' | 'long' | string;
  eyeColor?: string;
  height?: 'short' | 'average' | 'tall' | string;
  pose?: string;
  appearance?: string;
  mood?: string;
  category?: 'tops' | 'bottoms' | 'dresses' | 'outerwear' | string;
}

// Request body for AI model generation
export interface GenerateModelRequestBody {
  inputImageHuman?: string;
  inputImageClothes?: string | string[];
  attributes?: string; // JSON string
}

// Request body for animation
export interface AnimateRequestBody {
  imageUrl: string;
  prompt?: string;
}

// Request body for queue-based virtual try-on
export interface QueueVirtualTryOnBody {
  productId?: string;
  barcode?: string;
  modelType?: string;
  garmentImageUrl?: string;
  modelImageUrl?: string;
  category?: string;
  userId?: string;
}

// Request body for queue-based model generation
export interface QueueModelGenerationBody {
  attributes: ModelAttributes;
  garmentImageUrl?: string;
  modelImageUrl?: string;
  userId?: string;
}

// Request body for queue-based video generation
export interface QueueVideoGenerationBody {
  modelImageUrl: string;
  prompt?: string;
  settings?: VideoSettings;
  userId?: string;
}

export interface VideoSettings {
  duration?: number;
  fps?: number;
  resolution?: string;
}

// Multer file structure
export interface MulterFiles {
  inputImageHuman?: Express.Multer.File[];
  inputImageClothes?: Express.Multer.File[];
}

// Response types
export interface GenerateModelResponse {
  status: 'complete' | 'error';
  result?: string;
  outputs?: string[];
  error?: string;
  details?: string;
}

export interface QueueResponse {
  ok: boolean;
  jobId?: string;
  message?: string;
  error?: string;
}

// Type-safe request handlers
export type GenerateModelRequest = Request<{}, {}, GenerateModelRequestBody> & {
  files?: MulterFiles;
};

export type AnimateRequest = Request<{}, {}, AnimateRequestBody>;
export type QueueVirtualTryOnRequest = Request<{}, {}, QueueVirtualTryOnBody>;
export type QueueModelGenerationRequest = Request<{}, {}, QueueModelGenerationBody>;
export type QueueVideoGenerationRequest = Request<{}, {}, QueueVideoGenerationBody>;

// Typed response helper
export type TypedResponse<T> = Response<T>;
