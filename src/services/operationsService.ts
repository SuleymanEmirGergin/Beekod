import { getAllProducts } from "./product/productService.js";
import { getMarketplaceListings, upsertMarketplaceListings, resetMarketplaceCache } from "./marketplace/marketplaceStore.js";
import { resetSalesCache } from "./salesStore.js";

export type SyncAllResult = {
  ok: boolean;
  totalListings: number;
  changed: number;
  missingProduct: number;
  reason?: string;
};

export type SyncFilter = {
  minStock?: number;
  maxStock?: number;
  onlyCritical?: boolean;
};

export async function syncAllMarketplaceListings(filter?: SyncFilter): Promise<SyncAllResult> {
  if (process.env.MARKETPLACE_MODE === "live") {
    return {
      ok: false,
      totalListings: 0,
      changed: 0,
      missingProduct: 0,
      reason: "live_mode_not_supported",
    };
  }

  const productsResult = await getAllProducts(5000);
  if (!productsResult.ok) throw productsResult.error;
  const products = productsResult.value;
  const productMap = new Map(products.map((product) => [product.barcode, product]));
  const listings = await getMarketplaceListings();
  let changed = 0;
  let missingProduct = 0;

  const updatedListings = listings
    .filter((listing) => {
      if (!filter) return true;
      const product = productMap.get(listing.barcode);
      if (!product) return true; // Keep for missing report
      
      if (filter.onlyCritical && product.stock <= 5) return true;
      if (filter.minStock !== undefined && product.stock < filter.minStock) return false;
      if (filter.maxStock !== undefined && product.stock > filter.maxStock) return false;
      
      return filter.onlyCritical ? false : true;
    })
    .map((listing) => {
      const product = productMap.get(listing.barcode);
      if (!product) {
        missingProduct += 1;
        return listing;
      }
    const next = {
      ...listing,
      price: product.price,
      stock: product.stock,
      currency: product.currency,
      title: product.name,
    };
    const isChanged =
      next.price !== listing.price ||
      next.stock !== listing.stock ||
      next.currency !== listing.currency ||
      next.title !== listing.title;
    if (isChanged) {
      changed += 1;
    }
    return next;
  });

  if (updatedListings.length) {
    await upsertMarketplaceListings(updatedListings);
  }

  return {
    ok: true,
    totalListings: updatedListings.length,
    changed,
    missingProduct,
  };
}

export function refreshCaches() {
  resetMarketplaceCache();
  resetSalesCache();
  return { ok: true };
}
