import { config } from "../../config.js";
import { MarketplaceListing, MarketplaceStats, Product } from "../../types.js";
import * as db from "./marketplaceStoreDb.js";
import * as mock from "./marketplaceMock.js";

const store = config.stores.marketplace;

export function isMarketplaceStoreDb() {
  return store === "db";
}

export async function getMarketplaceListings(barcode?: string): Promise<MarketplaceListing[]> {
  return store === "db" ? db.getMarketplaceListings(barcode) : mock.getMarketplaceListings(barcode);
}

export async function getMarketplaceListing(barcode: string, marketplace: string): Promise<MarketplaceListing | null> {
  return store === "db"
    ? db.getMarketplaceListing(barcode, marketplace)
    : mock.getMarketplaceListing(barcode, marketplace);
}

export async function getMarketplaceStats(): Promise<MarketplaceStats[]> {
  return store === "db" ? db.getMarketplaceStats() : mock.getMarketplaceStats();
}

export async function upsertMarketplaceListing(listing: MarketplaceListing): Promise<MarketplaceListing> {
  return store === "db" ? db.upsertMarketplaceListing(listing) : mock.upsertMarketplaceListing(listing);
}

export async function upsertMarketplaceListings(listings: MarketplaceListing[]): Promise<MarketplaceListing[]> {
  return store === "db" ? db.upsertMarketplaceListings(listings) : mock.upsertMarketplaceListings(listings);
}

export async function clearMarketplaceListings() {
  if (store === "db") {
    await db.clearMarketplaceListings();
  }
}

export function resetMarketplaceCache() {
  if (store === "db") {
    void db.resetMarketplaceCache();
    return;
  }
  mock.resetMarketplaceCache();
}

export async function reconcileMarketplaceListing(input: {
  marketplace: string;
  barcode: string;
  title?: string;
  price?: number;
  stock?: number;
  currency?: string;
  active?: boolean;
  product?: Product | null;
}) {
  if (store !== "db") {
    return;
  }
  const existing = await getMarketplaceListing(input.barcode, input.marketplace);
  const listing = {
    marketplace: input.marketplace,
    barcode: input.barcode,
    title: input.title ?? existing?.title ?? input.product?.name ?? input.barcode,
    price: input.price ?? existing?.price ?? input.product?.price ?? 0,
    stock: input.stock ?? existing?.stock ?? input.product?.stock ?? 0,
    currency: input.currency ?? existing?.currency ?? input.product?.currency ?? "TRY",
    active: input.active ?? existing?.active ?? true,
  };
  await upsertMarketplaceListing(listing);
}
