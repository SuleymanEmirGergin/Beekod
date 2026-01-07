import { getAllProducts, updatePrice, updateStock } from "./productService.js";
import { logger } from "../logger.js";

export interface BatchUpdateParams {
  percent?: number;
  amount?: number;
  category?: string;
  marketplace?: string;
}

export interface BatchUpdateResult {
  updated: number;
  failed: number;
  errors: Array<{ barcode: string; error: string }>;
}

/**
 * Batch update prices for multiple products
 * @param params Update parameters (percent or amount, optional category filter)
 * @returns Result with success/failure counts
 */
export async function batchUpdatePrice(params: BatchUpdateParams): Promise<BatchUpdateResult> {
  const products = await getAllProducts();
  let filtered = products;

  // Filter by category if specified
  const categoryQuery = params.category;
  if (categoryQuery) {
    filtered = products.filter((p) => p.category?.toLowerCase() === categoryQuery.toLowerCase());
  }

  let updated = 0;
  let failed = 0;
  const errors: Array<{ barcode: string; error: string }> = [];

  for (const product of filtered) {
    try {
      let delta = 0;

      if (params.percent != null) {
        delta = (product.price * params.percent) / 100;
      } else if (params.amount != null) {
        delta = params.amount;
      }

      const newPrice = Math.max(0, product.price + delta);

      await updatePrice(product.barcode, newPrice);
      updated++;
    } catch (error) {
      failed++;
      errors.push({
        barcode: product.barcode,
        error: error instanceof Error ? error.message : String(error),
      });
      logger.warn("batch.price_update_failed", {
        barcode: product.barcode,
        err: error,
      });
    }
  }

  logger.info("batch.price_update_completed", { updated, failed, total: filtered.length });

  return { updated, failed, errors };
}

/**
 * Batch update stock for multiple products
 * @param params Update parameters (percent or amount, optional category filter)
 * @returns Result with success/failure counts
 */
export async function batchUpdateStock(params: BatchUpdateParams): Promise<BatchUpdateResult> {
  const products = await getAllProducts();
  let filtered = products;

  // Filter by category if specified
  const categoryQuery = params.category;
  if (categoryQuery) {
    filtered = products.filter((p) => p.category?.toLowerCase() === categoryQuery.toLowerCase());
  }

  let updated = 0;
  let failed = 0;
  const errors: Array<{ barcode: string; error: string }> = [];

  for (const product of filtered) {
    try {
      let delta = 0;

      if (params.percent != null) {
        delta = Math.round((product.stock * params.percent) / 100);
      } else if (params.amount != null) {
        delta = Math.round(params.amount);
      }

      const newStock = Math.max(0, Math.round(product.stock + delta));

      await updateStock(product.barcode, newStock);
      updated++;
    } catch (error) {
      failed++;
      errors.push({
        barcode: product.barcode,
        error: error instanceof Error ? error.message : String(error),
      });
      logger.warn("batch.stock_update_failed", {
        barcode: product.barcode,
        err: error,
      });
    }
  }

  logger.info("batch.stock_update_completed", { updated, failed, total: filtered.length });

  return { updated, failed, errors };
}

/**
 * Set absolute price for all products in a category
 * @param params Update parameters with amount (new price)
 * @returns Result with success/failure counts
 */
export async function batchSetPrice(params: BatchUpdateParams & { amount: number }): Promise<BatchUpdateResult> {
  const products = await getAllProducts();
  let filtered = products;

  const categoryQuery = params.category;
  if (categoryQuery) {
    filtered = products.filter((p) => p.category?.toLowerCase() === categoryQuery.toLowerCase());
  }

  let updated = 0;
  let failed = 0;
  const errors: Array<{ barcode: string; error: string }> = [];

  const newPrice = Math.max(0, params.amount);

  for (const product of filtered) {
    try {
      await updatePrice(product.barcode, newPrice);
      updated++;
    } catch (error) {
      failed++;
      errors.push({
        barcode: product.barcode,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { updated, failed, errors };
}

/**
 * Set absolute stock for all products in a category
 * @param params Update parameters with amount (new stock)
 * @returns Result with success/failure counts
 */
export async function batchSetStock(params: BatchUpdateParams & { amount: number }): Promise<BatchUpdateResult> {
  const products = await getAllProducts();
  let filtered = products;

  const categoryQuery = params.category;
  if (categoryQuery) {
    filtered = products.filter((p) => p.category?.toLowerCase() === categoryQuery.toLowerCase());
  }

  let updated = 0;
  let failed = 0;
  const errors: Array<{ barcode: string; error: string }> = [];

  const newStock = Math.max(0, Math.round(params.amount));

  for (const product of filtered) {
    try {
      await updateStock(product.barcode, newStock);
      updated++;
    } catch (error) {
      failed++;
      errors.push({
        barcode: product.barcode,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { updated, failed, errors };
}
