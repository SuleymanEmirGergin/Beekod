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
  days: z.number().int().min(1).max(365).default(7),
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
  nl: z.string().min(1).max(500),
});

export type AnalyticsQueryArgs = z.infer<typeof analyticsQueryArgsSchema>;

/**
 * getProductByBarcode arguments
 */
export const getProductByBarcodeArgsSchema = z.object({
  barcode: barcodeSchema,
});

export type GetProductByBarcodeArgs = z.infer<typeof getProductByBarcodeArgsSchema>;
