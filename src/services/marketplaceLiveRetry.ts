import { getMarketplaceProvider } from "./marketplace/index.js";
import { MarketplaceActionResult } from "./marketplace/types.js";
import { resolveMarketplaceImageUrls } from "./marketplaceImages.js";
import { reconcileMarketplaceListing } from "./marketplace/marketplaceStore.js";
import { getProductByBarcode } from "./product/productService.js";
import { ok, Result } from "../utils/result.js";

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

export async function performLiveUpdate(payload: LiveUpdatePayload): Promise<Result<MarketplaceActionResult>> {
  const provider = getMarketplaceProvider(payload.marketplace);
  if (!provider) {
    return ok({ status: "failed", message: "marketplace_not_supported" });
  }

  const configStatus = provider.getConfigStatus();
  if (!configStatus.configured) {
    const missing = configStatus.missing.length ? configStatus.missing.join(", ") : "-";
    return ok({ status: "not_configured", message: `missing: ${missing}` } as any);
  }

  const barcode = payload.barcode.trim().toLowerCase();
  if (!barcode) {
    return ok(missingValue("barcode_required"));
  }

  const productResult = await getProductByBarcode(barcode);
  const product = productResult.ok ? productResult.value : null;
  const persist: PersistValues = {};
  let result: MarketplaceActionResult;

  if (payload.action === "add") {
    const name = payload.name ?? product?.name;
    const price = payload.price ?? product?.price;
    const stock = payload.stock ?? product?.stock;
    const currency = payload.currency ?? product?.currency ?? "TRY";
    if (!name) {
      return ok(missingValue("product_name_required"));
    }
    if (price == null) {
      return ok(missingValue("price_required"));
    }
    if (stock == null) {
      return ok(missingValue("stock_required"));
    }
    persist.title = name;
    persist.price = price;
    persist.stock = stock;
    persist.currency = currency;
    persist.active = true;
    const images = await resolveMarketplaceImageUrls({ barcode, marketplace: provider.name });
    const resultResult = await provider.upsertProduct({
      barcode,
      name,
      price,
      stock,
      currency,
      images: images.length ? images : undefined,
    });
    if (!resultResult.ok) return resultResult;
    result = resultResult.value;
  } else if (payload.action === "sync") {
    if (!product) {
      return ok(missingValue("product_not_found"));
    }
    persist.title = product.name;
    persist.price = product.price;
    persist.stock = product.stock;
    persist.currency = product.currency;
    const resultResult = await provider.syncFromProduct({
      barcode: product.barcode,
      name: product.name,
      price: product.price,
      stock: product.stock,
      currency: product.currency,
    });
    if (!resultResult.ok) return resultResult;
    result = resultResult.value;
  } else if (payload.action === "price") {
    if (payload.price == null) {
      return ok(missingValue("price_required"));
    }
    persist.price = payload.price;
    const resultResult = await provider.updateListing({
      barcode,
      price: payload.price,
      title: product?.name,
    });
    if (!resultResult.ok) return resultResult;
    result = resultResult.value;
  } else if (payload.action === "stock") {
    if (payload.stock == null) {
      return ok(missingValue("stock_required"));
    }
    persist.stock = payload.stock;
    const resultResult = await provider.updateListing({
      barcode,
      stock: payload.stock,
      title: product?.name,
    });
    if (!resultResult.ok) return resultResult;
    result = resultResult.value;
  } else if (payload.action === "activate" || payload.action === "deactivate") {
    const active = payload.action === "activate";
    persist.active = active;
    const resultResult = await provider.updateListing({
      barcode,
      active,
      title: product?.name,
    });
    if (!resultResult.ok) return resultResult;
    result = resultResult.value;
  } else {
    return ok({ status: "failed", message: "invalid_action" });
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

  return ok(result);
}
