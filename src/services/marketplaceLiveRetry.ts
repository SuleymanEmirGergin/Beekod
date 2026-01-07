import { getMarketplaceProvider } from "../marketplaces/index.js";
import { MarketplaceActionResult } from "../marketplaces/types.js";
import { resolveMarketplaceImageUrls } from "./marketplaceImages.js";
import { reconcileMarketplaceListing } from "./marketplaceStore.js";
import { getProductByBarcode } from "./productService.js";

export type LiveUpdatePayload = {
  marketplace: string;
  action: "add" | "sync" | "price" | "stock" | "activate" | "deactivate";
  barcode: string;
  name?: string;
  price?: number;
  stock?: number;
  currency?: string;
};

type PersistValues = {
  title?: string;
  price?: number;
  stock?: number;
  currency?: string;
  active?: boolean;
};

function missingValue(message: string): MarketplaceActionResult {
  return { status: "failed", message };
}

export async function performLiveUpdate(payload: LiveUpdatePayload): Promise<MarketplaceActionResult> {
  const provider = getMarketplaceProvider(payload.marketplace);
  if (!provider) {
    return { status: "failed", message: "marketplace_not_supported" };
  }

  const configStatus = provider.getConfigStatus();
  if (!configStatus.configured) {
    const missing = configStatus.missing.length ? configStatus.missing.join(", ") : "-";
    return { status: "not_configured", message: `missing: ${missing}` };
  }

  const barcode = payload.barcode.trim().toLowerCase();
  if (!barcode) {
    return missingValue("barcode_required");
  }

  const product = await getProductByBarcode(barcode);
  const persist: PersistValues = {};
  let result: MarketplaceActionResult;

  if (payload.action === "add") {
    const name = payload.name ?? product?.name;
    const price = payload.price ?? product?.price;
    const stock = payload.stock ?? product?.stock;
    const currency = payload.currency ?? product?.currency ?? "TRY";
    if (!name) {
      return missingValue("product_name_required");
    }
    if (price == null) {
      return missingValue("price_required");
    }
    if (stock == null) {
      return missingValue("stock_required");
    }
    persist.title = name;
    persist.price = price;
    persist.stock = stock;
    persist.currency = currency;
    persist.active = true;
    const images = await resolveMarketplaceImageUrls({ barcode, marketplace: provider.name });
    result = await provider.upsertProduct({
      barcode,
      name,
      price,
      stock,
      currency,
      images: images.length ? images : undefined,
    });
  } else if (payload.action === "sync") {
    if (!product) {
      return missingValue("product_not_found");
    }
    persist.title = product.name;
    persist.price = product.price;
    persist.stock = product.stock;
    persist.currency = product.currency;
    result = await provider.syncFromProduct({
      barcode: product.barcode,
      name: product.name,
      price: product.price,
      stock: product.stock,
      currency: product.currency,
    });
  } else if (payload.action === "price") {
    if (payload.price == null) {
      return missingValue("price_required");
    }
    persist.price = payload.price;
    result = await provider.updateListing({
      barcode,
      price: payload.price,
      title: product?.name,
    });
  } else if (payload.action === "stock") {
    if (payload.stock == null) {
      return missingValue("stock_required");
    }
    persist.stock = payload.stock;
    result = await provider.updateListing({
      barcode,
      stock: payload.stock,
      title: product?.name,
    });
  } else if (payload.action === "activate" || payload.action === "deactivate") {
    const active = payload.action === "activate";
    persist.active = active;
    result = await provider.updateListing({
      barcode,
      active,
      title: product?.name,
    });
  } else {
    return { status: "failed", message: "invalid_action" };
  }

  if (result.status === "ok") {
    await reconcileMarketplaceListing({
      marketplace: provider.name,
      barcode,
      title: persist.title,
      price: persist.price,
      stock: persist.stock,
      currency: persist.currency,
      active: persist.active,
      product,
    });
  }

  return result;
}
