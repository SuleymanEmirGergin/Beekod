import { query, QueryResult } from "../../../db.js";
import { RowDataPacket } from "mysql2";
import { Product } from "../../../types.js";
import { logger } from "../../../logger.js";
import { ok, fail, Result } from "../../../utils/result.js";
import { auditService } from "../auditService.js";

/**
 * Stock Management Service Module
 */

/**
 * Update stock incrementally (+/-)
 */
export async function updateStock(
  barcode: string,
  quantityChange: number,
  source = "Manual Update",
  reason = "Stok güncellemesi",
  userId?: number
): Promise<Result<Product>> {
  try {
    // 1. Get current
    const rows = await query<RowDataPacket[]>("SELECT * FROM products WHERE barcode = ?", [barcode]);
    if (!rows.length) return fail(new Error("Ürün bulunamadı"));
    
    const currentStock = (rows[0] as Product).stock;
    const newStock = Math.max(0, currentStock + quantityChange);

    // 2. Update
    await query("UPDATE products SET stock = ?, updated_at = NOW() WHERE barcode = ?", [newStock, barcode]);

    // 3. History
    await query(
      "INSERT INTO stock_history (barcode, quantity_change, new_stock, source, reason, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [barcode, quantityChange, newStock, source, reason, userId || null]
    );

    auditService.log({
        userId,
        action: 'UPDATE_STOCK',
        entityType: 'product',
        entityId: barcode,
        details: { quantityChange, newStock, source, reason }
    });

    return ok({ ...(rows[0] as Product), stock: newStock });
  } catch (error) {
    logger.error("updateStock.error", { error, barcode });
    return fail(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Set stock to exact value
 */
export async function setStock(
  barcode: string,
  newStockValue: number,
  source = "Manual Update",
  reason = "Stok set edildi",
  userId?: number
): Promise<Result<Product>> {
  try {
    const rows = await query<RowDataPacket[]>("SELECT * FROM products WHERE barcode = ?", [barcode]);
    if (!rows.length) return fail(new Error("Ürün bulunamadı"));
    
    const currentStock = (rows[0] as Product).stock;
    const change = newStockValue - currentStock;

    if (change === 0) return ok(rows[0] as Product);

    await query("UPDATE products SET stock = ?, updated_at = NOW() WHERE barcode = ?", [newStockValue, barcode]);

    await query(
      "INSERT INTO stock_history (barcode, quantity_change, new_stock, source, reason, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [barcode, change, newStockValue, source, reason, userId || null]
    );

    return ok({ ...(rows[0] as Product), stock: newStockValue });
  } catch (error) {
    logger.error("setStock.error", { error, barcode });
    return fail(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Get products that are below their alert threshold
 */
export async function getLowStockProducts(threshold: number, limit = 50): Promise<Result<Product[]>> {
  try {
    const sql = `
      SELECT * FROM products 
      WHERE stock <= COALESCE(alert_threshold, ?) 
      AND stock >= 0
      ORDER BY stock ASC 
      LIMIT ?
    `;
    const rows = await query<RowDataPacket[]>(sql, [threshold, limit]);
    return ok(rows as Product[]);
  } catch (error) {
    return fail(error instanceof Error ? error : new Error(String(error)));
  }
}
