import { MarketplaceName } from "../marketplace/types.js";

export interface SearchResultItem {
  marketplace: MarketplaceName;
  title: string;
  price: number;
  currency: string;
  url: string;
  imageUrl?: string;
  image?: string; // Alias for frontend compatibility
  barcode?: string;
  rating?: number;
  reviewCount?: number;
  
  // Detaylı Bilgiler
  description?: string;
  brand?: string;
  category?: string;
  inStock?: boolean;
  stockCount?: number;
  seller?: {
    name: string;
    rating?: number;
  };
  attributes?: Record<string, any>;
  variants?: {
    barcode: string;
    sku?: string;
    price: number;
    stock: number;
    attributes: Record<string, string>;
  }[];
  
  // Competitive Data (Phase 3)
  buyBoxPrice?: number;
  isWinningBuyBox?: boolean;
  competitorCount?: number;
  marketPosition?: "lowest" | "average" | "highest" | "competitive";
}

export interface SearchAdapter {
  name: MarketplaceName;
  search(query: string): Promise<SearchResultItem[]>;
}
