import { query } from "../db.js";
import { logger } from "../logger.js";

export interface ProductPrediction {
  barcode: string;
  salesVelocity: number; // Average daily sales last 30 days
  daysRemaining: number;
  estimatedStockoutDate: string | null;
}

export const calculateProductPredictions = async (): Promise<ProductPrediction[]> => {
  try {
    // 1. Get all products with current stock
    const products = await query<any[]>("SELECT barcode, stock FROM products");

    // 2. Calculate daily sales velocity for each product (last 30 days)
    // We join order_items with orders to filter by created_at
    const velocityRows = await query<any[]>(`
            SELECT 
                oi.sku, 
                SUM(oi.quantity) as total_qty,
                COUNT(DISTINCT DATE(o.created_at)) as days_with_sales
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.created_at >= NOW() - INTERVAL 30 DAY
            GROUP BY oi.sku
        `);

    // Create a map for quick lookup
    const velocityMap = new Map<string, number>();
    velocityRows.forEach((row) => {
      // Average over 30 days, even if some days had 0 sales
      const dailyVelocity = (row.total_qty || 0) / 30;
      velocityMap.set(row.sku, dailyVelocity);
    });

    // 3. Project stockout dates
    const predictions: ProductPrediction[] = products.map((p) => {
      const velocity = velocityMap.get(p.barcode) || 0;
      let daysRemaining = 999;
      let estimatedStockoutDate: string | null = null;

      if (velocity > 0) {
        daysRemaining = Math.floor(p.stock / velocity);
        const stockoutDate = new Date();
        stockoutDate.setDate(stockoutDate.getDate() + daysRemaining);
        estimatedStockoutDate = stockoutDate.toISOString();
      }

      return {
        barcode: p.barcode,
        salesVelocity: Number(velocity.toFixed(2)),
        daysRemaining: daysRemaining > 365 ? 365 : daysRemaining, // Cap at 1 year
        estimatedStockoutDate,
      };
    });

    return predictions;
  } catch (error) {
    logger.error("prediction.calculate_failed", { error });
    throw error;
  }
};
