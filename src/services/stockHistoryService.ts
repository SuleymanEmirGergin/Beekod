import { pool } from "../db.js";
import { logger } from "../logger.js";
import { IStockHistory, mapStockHistory } from "../models/StockHistory.js";

/**
 * Log a stock change event
 */
export async function logStockChange(data: {
  barcode: string;
  productName: string;
  oldStock: number;
  newStock: number;
  reason: string;
  source: string;
}) {
  try {
    await pool.query(
      `INSERT INTO stock_history (barcode, product_name, old_stock, new_stock, reason, source)
             VALUES (?, ?, ?, ?, ?, ?)`,
      [data.barcode, data.productName, data.oldStock, data.newStock, data.reason, data.source],
    );
    return true;
  } catch (error) {
    logger.error("stock.log_failed", { barcode: data.barcode, err: error });
    return false;
  }
}

/**
 * Get stock history logs
 */
export async function getStockHistory(barcode?: string, limit: number = 200): Promise<IStockHistory[]> {
  try {
    const query = barcode
      ? "SELECT * FROM stock_history WHERE barcode = ? ORDER BY created_at DESC LIMIT ?"
      : "SELECT * FROM stock_history ORDER BY created_at DESC LIMIT ?";

    const params = barcode ? [barcode, limit] : [limit];
    const [rows] = await pool.query(query, params);

    return (rows as any[]).map(mapStockHistory);
  } catch (error) {
    logger.error("stock.history_get_failed", { barcode, err: error });
    return [];
  }
}

/**
 * Cleanup old logs (optional utility)
 */
export async function cleanupStockHistory(daysOld: number = 90): Promise<number> {
  try {
    const [result] = await pool.query("DELETE FROM stock_history WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)", [
      daysOld,
    ]);
    return (result as any).affectedRows || 0;
  } catch (error) {
    logger.error("stock.history_cleanup_failed", { err: error });
    return 0;
  }
}
