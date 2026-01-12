/**
 * Core Entity Types
 * @module shared/types/entities
 */

export type Locale = "tr" | "en" | "de" | "fr" | "es" | "ar";

/**
 * Product Entity
 */
export type Product = {
  id: number;
  barcode: string;
  name: string;
  category?: string;
  description?: string;
  price: number;
  stock: number;
  currency: string;
  /* Expanded */
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
  cost_price?: number;
  /* Import Metadata */
  sourceUrl?: string;
  sourceSite?: string;
  snapshotCurrency?: string;
  snapshotAt?: Date;
  imageUrl?: string;
  /* Advanced Edit Fields */
  preparation_days?: number;
  translations?: Record<string, string>;
  product_type?: "standard" | "packet" | "digital";
};

/**
 * Product Variant
 */
export type ProductVariant = {
  sku: string;
  description: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
};

/**
 * Product Price Entry
 */
export type ProductPrice = {
  id: number;
  barcode: string;
  price: number;
  currency: string;
  start_date?: Date;
  end_date?: Date;
  price_type: "STANDARD" | "SALE" | "VIP" | "WHOLESALE";
  priority: number;
  created_at?: Date;
};

/**
 * Marketplace Listing
 */
export type MarketplaceListing = {
  marketplace: string;
  barcode: string;
  price: number;
  stock: number;
  currency: string;
  title: string;
  active: boolean;
};

/**
 * Marketplace Statistics
 */
export type MarketplaceStats = {
  marketplace: string;
  total: number;
  active: number;
  inactive: number;
};

/**
 * Sales Record
 */
export type SalesRecord = {
  orderId: string;
  date: Date;
  barcode: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  marketplace: string;
};

/**
 * Base database row interface
 */
export interface IDbRow {
  id: number;
  created_at?: Date;
  updated_at?: Date;
  [key: string]: string | number | boolean | Date | null | undefined | unknown;
}
