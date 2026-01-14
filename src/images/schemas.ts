/**
 * Image Routes - Zod Validation Schemas
 * Extracted from imageRoutes.ts to reduce file size
 */

import { z } from "zod";

// NumberLike transformer for query params
export const numberLike = z.preprocess((value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    if (!Number.isNaN(parsed)) return parsed;
  }
  return value;
}, z.number());

// Boolean transformer for query params
export const booleanLike = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }
  return value;
}, z.boolean());

// Image processing body schema
export const imageProcessBodySchema = z
  .object({
    barcode: z.string().trim().optional(),
    marketplace: z.string().trim().optional(),
    profile: z.string().trim().optional(),
  })
  .passthrough();

// Image reprocess body schema
export const imageReprocessBodySchema = z
  .object({
    barcode: z.string().trim().optional(),
    marketplace: z.string().trim().optional(),
    profile: z.string().trim().optional(),
  })
  .passthrough();

// Image inspect body schema
export const imageInspectBodySchema = z
  .object({
    barcode: z.string().trim().optional(),
    marketplace: z.string().trim().optional(),
    profile: z.string().trim().optional(),
    source: z.string().trim().optional(),
    images: z.array(z.string()).optional(),
  })
  .passthrough();

// Web inspect body schema
export const webInspectBodySchema = z
  .object({
    url: z.string().trim(),
    limit: numberLike.optional(),
    profile: z.string().trim().optional(),
    marketplace: z.string().trim().optional(),
    site: z.string().trim().optional(),
    languageHints: z.string().trim().optional(),
  })
  .passthrough();

// Image search query schema
export const imageSearchQuerySchema = z
  .object({
    num: numberLike.optional(),
    site: z.string().trim().optional(),
  })
  .passthrough();

// Profile set query schema
export const profileSetQuerySchema = z
  .object({
    marketplace: z.string().trim().optional(),
  })
  .passthrough();

// Inspect list query schema
export const inspectListQuerySchema = z
  .object({
    barcode: z.string().trim().optional(),
    profile: z.string().trim().optional(),
    marketplace: z.string().trim().optional(),
    source: z.string().trim().optional(),
    limit: numberLike.optional(),
    includeReport: booleanLike.optional(),
  })
  .passthrough();

// Inspect summary query schema
export const inspectSummaryQuerySchema = z
  .object({
    barcode: z.string().trim().optional(),
    profile: z.string().trim().optional(),
    marketplace: z.string().trim().optional(),
    source: z.string().trim().optional(),
    days: numberLike.optional(),
    fill: booleanLike.optional(),
  })
  .passthrough();

// Barcode params schema
export const barcodeParamsSchema = z.object({
  barcode: z
    .string()
    .trim()
    .min(1)
    .transform((value) => value.toLowerCase()),
});
