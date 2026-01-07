import { getStockHistory } from "./stockHistoryService.js";
import { getAllProducts } from "./productService.js";
import { logger } from "../logger.js";

export interface ProductPrediction {
  barcode: string;
  salesVelocity: number; // units per day
  daysRemaining: number;
  estimatedStockoutDate: string | null;
}

export async function calculateInventoryPredictions(): Promise<ProductPrediction[]> {
  const products = await getAllProducts(1000);
  const history = await getStockHistory();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const predictions: ProductPrediction[] = [];

  for (const product of products) {
    // Filter history for this product in the last 7 days
    // Only count negative changes (sales/outgoings)
    const productSales = history.filter(
      (log) => log.barcode === product.barcode && (log.createdAt && log.createdAt >= sevenDaysAgo) && log.change < 0,
    );

    const totalUnitsSold = Math.abs(productSales.reduce((sum, log) => sum + log.change, 0));
    const salesVelocity = totalUnitsSold / 7;

    let daysRemaining = Infinity;
    let estimatedStockoutDate = null;

    if (salesVelocity > 0) {
      daysRemaining = Math.floor(product.stock / salesVelocity);
      const stockoutDate = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
      estimatedStockoutDate = stockoutDate.toISOString();
    }

    predictions.push({
      barcode: product.barcode,
      salesVelocity,
      daysRemaining,
      estimatedStockoutDate,
    });
  }

  return predictions;
}

export async function getPredictionForProduct(barcode: string): Promise<ProductPrediction | null> {
  const all = await calculateInventoryPredictions();
  return all.find((p) => p.barcode === barcode) || null;
}
