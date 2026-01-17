export type Locale = "tr" | "en" | "de" | "fr" | "es" | "ar";


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
  variants?: {
    sku: string;
    description: string;
    price: number;
    stock: number;
    attributes: Record<string, string>;
  }[];
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
  product_type?: 'standard' | 'packet' | 'digital';
};

export interface ProductPrice {
  id: number;
  barcode: string;
  price: number;
  currency: string;
  price_type: 'standard' | 'campaign' | 'discount';
  start_date?: Date;
  end_date?: Date;
  priority: number;
  campaign_id?: string;
  platform?: string;
  created_at?: Date;
};

export type MarketplaceListing = {
  marketplace: string;
  barcode: string;
  price: number;
  stock: number;
  currency: string;
  title: string;
  active: boolean;
  /* Rich Data */
  brand?: string;
  category?: string;
  imageUrl?: string;
  images?: string[];
  description?: string;
  attributes?: Record<string, string | number>;
  variants?: {
    barcode: string;
    sku?: string;
    price: number;
    stock: number;
    attributes: Record<string, string>;
  }[];
  /* Competitive Data (Phase 3) */
  buyBoxPrice?: number;
  isWinningBuyBox?: boolean;
  competitorCount?: number;
  marketPosition?: "lowest" | "average" | "highest" | "competitive";
};

export type MarketplaceStats = {
  marketplace: string;
  total: number;
  active: number;
  inactive: number;
};

export type SalesRecord = {
  orderId: string;
  date: Date;
  barcode: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  marketplace: string;
};

export type ApiResponse<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export interface IDbRow {
  id: number;
  created_at?: Date;
  updated_at?: Date;
  [key: string]: string | number | boolean | Date | null | undefined | any; // Keep any as fallout for now but add common types
}

export interface ConsolidatedInventoryDetail {
  marketplace: string;
  price: number;
  stock: number;
  active: boolean;
}

export interface ConsolidatedInventoryItem {
  barcode: string;
  title: string;
  marketplaces: string[];
  details: ConsolidatedInventoryDetail[];
  minPrice: number;
  maxPrice: number;
  totalStock: number;
}
