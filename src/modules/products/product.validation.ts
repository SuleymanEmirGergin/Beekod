/**
 * Product Validation Schemas
 * @module modules/products/product.validation
 */

import { z } from "zod";

/**
 * Coerce string to number
 */
const numberLike = z.preprocess((value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) return parsed;
  }
  return value;
}, z.number());

/**
 * Coerce string to boolean
 */
const booleanLike = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }
  return value;
}, z.boolean());

/**
 * Product creation schema
 */
export const productCreateSchema = z.object({
  barcode: z.string().trim().min(1),
  name: z.string().trim().min(1),
  category: z.string().trim().optional(),
  description: z.string().trim().optional(),
  price: numberLike,
  stock: numberLike,
  currency: z.string().trim().default("TRY"),
  brand: z.string().trim().optional(),
  product_code: z.string().trim().optional(),
  vat_rate: numberLike.optional(),
  unit: z.string().trim().optional(),
  images: z.array(z.string()).optional(),
  attributes: z.record(z.union([z.string(), z.number()])).optional(),
  cargo_company: z.string().trim().optional(),
  cargo_desi: numberLike.optional(),
  max_order_limit: numberLike.optional(),
  auto_stock_update: booleanLike.optional(),
  parent_barcode: z.string().trim().optional(),
  width: numberLike.optional(),
  height: numberLike.optional(),
  length: numberLike.optional(),
  weight: numberLike.optional(),
  variants: z.array(z.object({
    sku: z.string(),
    description: z.string(),
    price: numberLike,
    stock: numberLike,
    attributes: z.record(z.string()),
  })).optional(),
  alert_threshold: numberLike.optional(),
  cost_price: numberLike.optional(),
  sourceUrl: z.string().trim().optional(),
  sourceSite: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  preparation_days: numberLike.optional(),
  product_type: z.enum(["standard", "packet", "digital"]).optional(),
  translations: z.record(z.unknown()).optional(),
});

/**
 * Product update schema
 */
export const productUpdateSchema = z.object({
  price: numberLike.optional(),
  stock: numberLike.optional(),
  name: z.string().trim().optional(),
  description: z.string().trim().optional(),
  category: z.string().trim().optional(),
  alert_threshold: numberLike.optional(),
});

/**
 * Price update schema
 */
export const priceUpdateSchema = z.object({
  action: z.enum(["set", "increase", "decrease"]).optional(),
  value: numberLike,
  isPercent: booleanLike.optional(),
});

/**
 * Stock update schema
 */
export const stockUpdateSchema = z.object({
  action: z.enum(["set", "increase", "decrease"]).optional(),
  value: numberLike,
  isPercent: booleanLike.optional(),
});

/**
 * Product query schema
 */
export const productQuerySchema = z
  .object({
    search: z.string().trim().optional(),
    barcode: z.string().trim().optional(),
    limit: numberLike.optional(),
  })
  .passthrough();

/**
 * Low stock query schema
 */
export const lowStockQuerySchema = z
  .object({
    threshold: numberLike.optional(),
    limit: numberLike.optional(),
  })
  .passthrough();

/**
 * Product import schema
 */
export const productImportSchema = z.object({
  path: z.string().trim().optional(),
});

/**
 * Price creation schema
 */
export const priceCreateSchema = z.object({
  barcode: z.string().trim().min(1),
  price: numberLike,
  currency: z.string().trim().optional().default("TRY"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  price_type: z.enum(["STANDARD", "SALE", "VIP", "WHOLESALE"]).optional().default("STANDARD"),
  priority: numberLike.optional().default(0),
});

// Inferred types from schemas (with Schema suffix to avoid conflicts)
export type ProductCreateSchema = z.infer<typeof productCreateSchema>;
export type ProductUpdateSchema = z.infer<typeof productUpdateSchema>;
export type PriceUpdateSchema = z.infer<typeof priceUpdateSchema>;
export type StockUpdateSchema = z.infer<typeof stockUpdateSchema>;
export type ProductQuerySchema = z.infer<typeof productQuerySchema>;

