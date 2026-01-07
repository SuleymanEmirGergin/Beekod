import { MarketplaceName } from "../../marketplaces/types.js";

export interface SearchResultItem {
  marketplace: MarketplaceName;
  title: string;
  price: number;
  currency: string;
  url: string;
  imageUrl?: string;
  image?: string; // Alias for frontend compatibility
  barcode?: string; // Optional, hard to find on search pages
  rating?: number;
  reviewCount?: number;
}

export interface SearchAdapter {
  name: MarketplaceName;
  search(query: string): Promise<SearchResultItem[]>;
}
