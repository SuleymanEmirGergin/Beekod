import { z } from "zod";

/**
 * Shared Helpers
 */
const numberLike = z.preprocess((value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return undefined;
    const parsed = parseFloat(trimmed);
    if (!isNaN(parsed)) return parsed;
  }
  return value;
}, z.number().finite());

const booleanLike = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }
  return value;
}, z.boolean());

/**
 * Shared Schema Fragments
 */
const BarcodeSchema = z.string().min(3).max(50);
const PriceSchema = z.number().nonnegative();
const StockSchema = z.number().int();

/**
 * Product Validation Schemas
 */
export const CreateProductSchema = z.object({
  barcode: BarcodeSchema,
  name: z.string().min(2).max(255),
  category: z.string().optional(),
  description: z.string().optional(),
  price: PriceSchema,
  cost_price: PriceSchema.optional(),
  stock: StockSchema.default(0),
  currency: z.string().length(3).default("TRY"),
  brand: z.string().optional(),
  product_code: z.string().optional(),
  alert_threshold: StockSchema.optional(),
  images: z.array(z.string().url()).optional(),
  attributes: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial().omit({ barcode: true });

export const UpdateStockSchema = z.object({
  quantityChange: z
    .number()
    .int()
    .refine((n) => n !== 0, { message: "quantityChange cannot be zero" }),
  reason: z.string().optional(),
  source: z.string().optional(),
});

export const PriceUpdateSchema = z.object({
  action: z.enum(["set", "increase", "decrease"]).optional(),
  value: numberLike,
  isPercent: booleanLike.optional(),
});

/**
 * Order Validation Schemas
 */
export const CreateOrderSchema = z.object({
  source: z.object({
    name: z.string(),
    icon: z.string().optional(),
    color: z.string().optional(),
    logo: z.string().optional(),
    marketplaceId: z.string().optional(),
  }),
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
  items: z
    .array(
      z.object({
        product_name: z.string(),
        sku: z.string(),
        price: z.union([z.string(), z.number()]),
        quantity: z.number().int().positive(),
        image_url: z.string().optional(),
      }),
    )
    .min(1),
  total: z.string().optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(["New", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"]),
});

/**
 * Chat Validation Schemas
 */
export const ChatBodySchema = z
  .object({
    message: z.string().trim().min(1).optional(),
    action: z.string().optional(),
    locale: z.enum(["tr", "en"]).optional(),
    barcode: z.string().optional(),
    sessionId: z.string().optional(),
    history: z.union([z.string(), z.array(z.any())]).optional(),
    limit: numberLike.optional(),
    threshold: numberLike.optional(),
    days: numberLike.optional(),
  })
  .refine((data) => data.message || data.action, {
    message: "Either 'message' or 'action' must be provided",
    path: ["message"],
  });
