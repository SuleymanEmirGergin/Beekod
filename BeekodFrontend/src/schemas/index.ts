/**
 * Zod Validation Schemas
 * Runtime type validation for API responses
 */

import { z } from 'zod';

// ============================================
// Common Schemas
// ============================================

export const IdSchema = z.string().min(1);
export const TimestampSchema = z.string().datetime().or(z.date());
export const CurrencySchema = z.enum(['TRY', 'USD', 'EUR', 'TL', '₺']);

// ============================================
// Product Schemas
// ============================================

export const ProductSchema = z.object({
    id: IdSchema,
    name: z.string().min(1),
    barcode: z.string().optional(),
    price: z.number().positive(),
    stock: z.number().int().nonnegative(),
    category: z.string().optional(),
    image: z.string().url().optional(),
    currency: CurrencySchema.default('TRY'),
    createdAt: TimestampSchema.optional(),
    updatedAt: TimestampSchema.optional(),
});

export const ProductListSchema = z.array(ProductSchema);

export type Product = z.infer<typeof ProductSchema>;

// ============================================
// Order Schemas
// ============================================

export const OrderStatusSchema = z.enum(['pending', 'processing', 'completed', 'cancelled', 'NEW', 'YENİ', 'HAZIRLANIYOR', 'SHIPPED']);

export const MarketplaceSchema = z.object({
    id: IdSchema,
    name: z.string(),
    icon: z.string().url().optional(),
});

export const OrderSchema = z.object({
    id: IdSchema,
    orderNumber: z.string(),
    productName: z.string(),
    marketplace: MarketplaceSchema,
    date: z.string(),
    price: z.number().positive(),
    currency: CurrencySchema.default('TRY'),
    status: OrderStatusSchema,
    createdAt: TimestampSchema.optional(),
});

export const OrderListSchema = z.array(OrderSchema);

export type Order = z.infer<typeof OrderSchema>;
export type Marketplace = z.infer<typeof MarketplaceSchema>;

// ============================================
// Dashboard Schemas
// ============================================

export const DashboardStatsSchema = z.object({
    totalRevenue: z.number().nonnegative(),
    totalOrders: z.number().int().nonnegative(),
    totalProducts: z.number().int().nonnegative(),
    lowStockCount: z.number().int().nonnegative().optional(),
});

export const MarketplaceOrderSchema = z.object({
    id: IdSchema,
    orderNumber: z.string(),
    productName: z.string(),
    marketplace: MarketplaceSchema,
    date: z.string(),
    price: z.number(),
    currency: CurrencySchema,
    status: OrderStatusSchema,
});

export const DashboardDataSchema = z.object({
    stats: DashboardStatsSchema,
    recentOrders: z.array(MarketplaceOrderSchema).default([]),
    topProducts: ProductListSchema.optional(),
});

export type DashboardData = z.infer<typeof DashboardDataSchema>;

// ============================================
// Notification Schemas
// ============================================

export const NotificationSchema = z.object({
    id: IdSchema,
    title: z.string(),
    message: z.string(),
    type: z.enum(['info', 'warning', 'error', 'success']).default('info'),
    read: z.boolean().default(false),
    createdAt: TimestampSchema,
});

export const NotificationListSchema = z.array(NotificationSchema);

export type Notification = z.infer<typeof NotificationSchema>;

// ============================================
// Chat/AI Schemas
// ============================================

export const ChatMessageSchema = z.object({
    role: z.enum(['user', 'ai', 'assistant']),
    message: z.string(),
    data: z.any().optional(),
    isError: z.boolean().optional(),
});

export const ChatHistorySchema = z.array(ChatMessageSchema);

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// ============================================
// API Response Wrappers
// ============================================

export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        success: z.literal(true),
        data: dataSchema,
        message: z.string().optional(),
    });

export const ApiErrorResponseSchema = z.object({
    success: z.literal(false),
    error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.any().optional(),
    }),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.union([ApiSuccessResponseSchema(dataSchema), ApiErrorResponseSchema]);

// ============================================
// Helper Functions
// ============================================

/**
 * Safely validates data against a schema
 * Returns validated data or throws error
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data);
}

/**
 * Safely validates data against a schema
 * Returns validated data or default value on error
 */
export function validateSafe<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    defaultValue: T
): T {
    const result = schema.safeParse(data);
    if (result.success) {
        return result.data;
    }
    console.warn('Validation failed:', result.error);
    return defaultValue;
}

/**
 * Creates a validator function for API responses
 */
export function createApiValidator<T>(dataSchema: z.ZodSchema<T>) {
    return (response: unknown) => {
        const validated = ApiResponseSchema(dataSchema).parse(response);
        if (validated.success) {
            return validated.data;
        }
        throw new Error(validated.error.message);
    };
}
