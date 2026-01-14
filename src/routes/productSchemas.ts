/**
 * Product Routes - Zod Validation Schemas
 * Extracted from productRoutes.ts for reusability
 */

import { z } from "zod";

// NumberLike transformer for query params
export const numberLike = z.preprocess((value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return value;
}, z.number());

// Boolean transformer for query params  
export const booleanLike = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }
  return value;
}, z.boolean());

// Product import schema
export const productImportSchema = z.object({
  path: z.string().trim().optional(),
});

// Product create schema
export const productCreateSchema = z.object({
  barcode: z.string().trim().min(1),
  name: z.string().trim().min(1),
  category: z.string().trim().optional(),
  description: z.string().trim().optional(),
  price: numberLike,
  stock: numberLike,
  currency: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  product_code: z.string().trim().optional(),
  vat_rate: numberLike.optional(),
  preparation_days: numberLike.optional(),
  product_type: z.enum(["standard", "packet", "digital"]).optional(),
  alert_threshold: numberLike.optional(),
  image: z.string().trim().optional(),
});

// Product update schema
export const productUpdateSchema = z.object({
  name: z.string().trim().optional(),
  category: z.string().trim().optional(),
  description: z.string().trim().optional(),
  price: numberLike.optional(),
  stock: numberLike.optional(),
  currency: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  alert_threshold: numberLike.optional(),
});

// Price update schema
export const priceUpdateSchema = z.object({
  action: z.enum(["set", "increase", "decrease"]).optional(),
  value: numberLike,
  isPercent: booleanLike.optional(),
});

// Stock update schema
export const stockUpdateSchema = z.object({
  action: z.enum(["set", "increase", "decrease"]).optional(),
  value: numberLike,
  isPercent: booleanLike.optional(),
});

// Product query schema
export const productQuerySchema = z
  .object({
    search: z.string().trim().optional(),
    barcode: z.string().trim().optional(),
    limit: numberLike.optional(),
  })
  .passthrough();

// Low stock query schema
export const lowStockQuerySchema = z
  .object({
    threshold: numberLike.optional(),
    limit: numberLike.optional(),
  })
  .passthrough();

// Product export query schema
export const productExportQuerySchema = z
  .object({
    limit: numberLike.optional(),
    format: z.enum(["csv", "json"]).optional(),
  })
  .passthrough();

// Barcode params schema
export const barcodeParamsSchema = z.object({
  barcode: z.string().trim().min(1),
});

// Sync to marketplace schema
export const syncMarketplaceSchema = z.object({
  marketplace: z.string().trim().optional(),
  marketplaces: z.array(z.string()).optional(),
});

// Price analysis schema
export const priceAnalysisSchema = z.object({
  barcode: z.string().trim(),
  marketplace: z.string().trim().optional(),
});

// AI generation schema
export const aiGenerationSchema = z.object({
  name: z.string().trim(),
  category: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  tone: z.enum(["professional", "casual", "fun"]).optional(),
});

// Background removal schema
export const backgroundRemovalSchema = z.object({
  imageUrl: z.string().url(),
});

// Virtual try-on schema
export const virtualTryOnSchema = z.object({
  productImage: z.string().url(),
  modelImage: z.string().url().optional(),
  modelId: z.string().optional(),
});
