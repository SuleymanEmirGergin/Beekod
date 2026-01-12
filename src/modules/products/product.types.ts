/**
 * Product Types
 * @module modules/products/product.types
 */

import type { Product, ProductPrice, ProductVariant } from "../../shared/types/index.js";

// Re-export for convenience
export type { Product, ProductPrice, ProductVariant };

/**
 * Product creation input
 */
export interface CreateProductInput {
  barcode: string;
  name: string;
  category?: string;
  description?: string;
  price: number;
  cost_price?: number;
  stock: number;
  currency: string;
  brand?: string;
  product_code?: string;
  vat_rate?: number;
  unit?: string;
  images?: string[];
  attributes?: Record<string, string | number>;
  cargo_company?: string;
  cargo_desi?: number;
  width?: number;
  height?: number;
  length?: number;
  weight?: number;
  max_order_limit?: number;
  auto_stock_update?: boolean;
  parent_barcode?: string;
  variants?: ProductVariant[];
  alert_threshold?: number;
  sourceUrl?: string;
  sourceSite?: string;
  snapshotPrice?: number;
  snapshotCurrency?: string;
  snapshotAt?: Date;
  imageUrl?: string;
  preparation_days?: number;
  product_type?: "standard" | "packet" | "digital";
  translations?: Record<string, unknown>;
}

/**
 * Product update input
 */
export interface UpdateProductInput {
  price?: number;
  stock?: number;
  name?: string;
  description?: string;
  category?: string;
  alert_threshold?: number;
}

/**
 * Stock update input
 */
export interface StockUpdateInput {
  barcode: string;
  quantityChange: number;
  source?: string;
  reason?: string;
  userId?: number;
}

/**
 * Product filter options
 */
export interface ProductFilterOptions {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Product performance data
 */
export interface ProductPerformance {
  barcode: string;
  name: string;
  totalSales: number;
  totalRevenue: number;
  averagePrice: number;
  category?: string;
}

/**
 * Price creation input
 */
export interface CreatePriceInput {
  barcode: string;
  price: number;
  currency?: string;
  start_date?: Date;
  end_date?: Date;
  price_type?: "STANDARD" | "SALE" | "VIP" | "WHOLESALE";
  priority?: number;
}
