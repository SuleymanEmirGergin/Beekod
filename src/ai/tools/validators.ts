/**
 * Tool Argument Validators
 * 
 * Zod schemas for validating tool arguments
 */

import { z } from 'zod';

/**
 * Common validators
 */
export const orderIdSchema = z.string().or(z.number()).transform(String);
export const barcodeSchema = z.string().min(1).max(50);

/**
 * getOrderById arguments
 */
export const getOrderByIdArgsSchema = z.object({
  orderId: orderIdSchema,
});

export type GetOrderByIdArgs = z.infer<typeof getOrderByIdArgsSchema>;

/**
 * listRecentOrders arguments
 */
export const listRecentOrdersArgsSchema = z.object({
  days: z.number().int().min(1).max(31).default(7),
  limit: z.number().int().min(1).max(100).default(20),
});

export type ListRecentOrdersArgs = z.infer<typeof listRecentOrdersArgsSchema>;

/**
 * searchCheapestProduct arguments
 */
export const searchCheapestProductArgsSchema = z.object({
  query: z.string().min(1).max(200),
});

export type SearchCheapestProductArgs = z.infer<typeof searchCheapestProductArgsSchema>;

/**
 * draftCustomerReply arguments
 */
export const draftCustomerReplyArgsSchema = z.object({
  orderId: orderIdSchema,
  customerMessage: z.string().min(1).max(2000),
  tone: z.enum(['Formal', 'Friendly', 'Apologetic']).default('Friendly'),
});

export type DraftCustomerReplyArgs = z.infer<typeof draftCustomerReplyArgsSchema>;

/**
 * createShipment arguments
 */
export const createShipmentArgsSchema = z.object({
  orderId: orderIdSchema,
  carrier: z.enum(['yurtici', 'aras', 'mng']).default('yurtici'),
});

export type CreateShipmentArgs = z.infer<typeof createShipmentArgsSchema>;

/**
 * analyticsQuery arguments - SAFE allowlisted queries only
 */
export const analyticsQueryArgsSchema = z.object({
  nl: z.string().min(1).max(500).optional(),
  queryType: z.enum(['daily_sales', 'top_products', 'revenue_trend', 'order_stats', 'stock_alerts']).optional(),
});

export type AnalyticsQueryArgs = z.infer<typeof analyticsQueryArgsSchema>;

/**
 * getProductByBarcode arguments
 */
export const getProductByBarcodeArgsSchema = z.object({
  barcode: barcodeSchema,
});

export type GetProductByBarcodeArgs = z.infer<typeof getProductByBarcodeArgsSchema>;

/**
 * getPriceCompetition arguments
 */
export const getPriceCompetitionArgsSchema = z.object({
  marketplace: z.string().describe("Marketplace name, e.g. 'Trendyol'"),
  barcodes: z.array(z.string()).describe("List of product barcodes to analyze"),
});


export type GetPriceCompetitionArgs = z.infer<typeof getPriceCompetitionArgsSchema>;

/**
 * analyzePricingStrategy arguments
 */
export const analyzePricingStrategyArgsSchema = z.object({
  barcode: barcodeSchema,
});

export type AnalyzePricingStrategyArgs = z.infer<typeof analyzePricingStrategyArgsSchema>;

/**
 * auditInventoryConsistency arguments
 */
export const auditInventoryConsistencyArgsSchema = z.object({
  barcode: barcodeSchema,
});

export type AuditInventoryConsistencyArgs = z.infer<typeof auditInventoryConsistencyArgsSchema>;

/**
 * detectStockRisks arguments (no args)
 */
export const detectStockRisksArgsSchema = z.object({});


export type DetectStockRisksArgs = z.infer<typeof detectStockRisksArgsSchema>;

/**
 * analyzeProductReviews arguments
 */
export const analyzeProductReviewsArgsSchema = z.object({
  barcode: barcodeSchema,
  marketplace: z.string().describe("Marketplace name, e.g. 'Trendyol'"),
});

export type AnalyzeProductReviewsArgs = z.infer<typeof analyzeProductReviewsArgsSchema>;

/**
 * updateMarketplacePrice arguments
 */
export const updateMarketplacePriceArgsSchema = z.object({
  barcode: barcodeSchema,
  marketplace: z.string().describe("Marketplace name, e.g. 'Trendyol'"),
  price: z.number().positive(),
});

export type UpdateMarketplacePriceArgs = z.infer<typeof updateMarketplacePriceArgsSchema>;

/**
 * updateAISettings arguments
 */
export const updateAISettingsArgsSchema = z.object({
  enableAutoPricing: z.boolean().optional().describe("Toggle AI automatic pricing update"),
  enableStockNotifications: z.boolean().optional().describe("Toggle AI inventory risk notifications"),
});


export type UpdateAISettingsArgs = z.infer<typeof updateAISettingsArgsSchema>;

/**
 * runAutonomousPricing arguments
 */
export const runAutonomousPricingArgsSchema = z.object({
  barcode: barcodeSchema.optional().describe("Eğer boş bırakılırsa tüm ürünler için çalıştırılır."),
  minMargin: z.number().min(0.01).max(0.99).default(0.15).describe("Hedeflenen minimum kâr marjı (örn. 0.15)"),
});

export type RunAutonomousPricingArgs = z.infer<typeof runAutonomousPricingArgsSchema>;

/**
 * getStockForecast arguments
 */
export const getStockForecastArgsSchema = z.object({
  barcode: barcodeSchema,
});

export type GetStockForecastArgs = z.infer<typeof getStockForecastArgsSchema>;

/**
 * checkAPIHealth arguments (no args)
 */
export const checkAPIHealthArgsSchema = z.object({});

export type CheckAPIHealthArgs = z.infer<typeof checkAPIHealthArgsSchema>;
