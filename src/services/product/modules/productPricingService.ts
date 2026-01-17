import { query, QueryResult } from "../../../db.js";
import { RowDataPacket } from "mysql2";
import { Product, ProductPrice } from "../../../types.js";
import { logger } from "../../../logger.js";
import { ok, fail, Result } from "../../../utils/result.js";
import { auditService } from "../auditService.js";

/**
 * Add a new price history record
 */
export async function addProductPrice(price: Omit<ProductPrice, "id" | "created_at">): Promise<number> {
  const sql = `
    INSERT INTO product_prices 
    (barcode, price, price_type, start_date, end_date, priority, campaign_id, platform)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    price.barcode,
    price.price,
    price.price_type || "standard",
    price.start_date || null,
    price.end_date || null,
    price.priority || 0,
    price.campaign_id || null,
    price.platform || "all"
  ];
  
  try {
    const result = await query(sql, params);
    return (result as any).insertId;
  } catch (error) {
    logger.error("addProductPrice.error", { error, barcode: price.barcode });
    throw error;
  }
}

/**
 * Get active prices for a product
 */
export async function getProductPrices(barcode: string): Promise<ProductPrice[]> {
  const sql = `
    SELECT * FROM product_prices 
    WHERE barcode = ? 
    ORDER BY priority DESC, start_date DESC
  `;
  try {
    const rows = await query<RowDataPacket[]>(sql, [barcode]);
    return rows as ProductPrice[];
  } catch (error) {
    logger.error("getProductPrices.error", { error, barcode });
    return [];
  }
}

/**
 * Delete a price record
 */
export async function deleteProductPrice(id: updatePrice_id_type): Promise<boolean> {
   // Fix type: id should be number
   const priceId = Number(id);
   if(isNaN(priceId)) return false;

  const sql = "DELETE FROM product_prices WHERE id = ?";
  try {
    const result = await query(sql, [priceId]);
    return (result as any).affectedRows > 0;
  } catch (error) {
    logger.error("deleteProductPrice.error", { error, id });
    return false;
  }
}

/**
 * Update product listing price (main price)
 */
export async function updatePrice(barcode: string, price: number, userId?: number): Promise<Result<Product>> {
  try {
    const sql = "UPDATE products SET price = ?, updated_at = NOW() WHERE barcode = ?";
    const result = await query(sql, [price, barcode]);
    
    if ((result as any).affectedRows === 0) {
      return fail(new Error("Product not found"));
    }

    // Log update
    if (userId) {
       await query(
        "INSERT INTO stock_history (barcode, quantity_change, new_stock, source, reason, user_id) VALUES (?, 0, (SELECT stock FROM products WHERE barcode = ?), 'Start Price Update', ?, ?)",
        [barcode, barcode, `Price updated to ${price}`, userId]
      );
    }

    auditService.log({
      userId,
      action: 'UPDATE_PRICE',
      entityType: 'product',
      entityId: barcode,
      details: { price }
    });
    
    // Return updated product
    const rows = await query<RowDataPacket[]>("SELECT * FROM products WHERE barcode = ?", [barcode]);
    return ok(rows[0] as Product);
  } catch (error) {
    logger.error("updatePrice.error", { error, barcode });
    return fail(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Bulk update price for multiple marketplaces (stub implementation for now)
 */
export async function updateBulkPrice(barcode: string, newPrice: number, marketplaces: string[]): Promise<Result<number>> {
    try {
        // 1. Update local price
        await updatePrice(barcode, newPrice);
        
        // 2. TODO: Trigger marketplace sync jobs
        
        return ok(marketplaces.length);
    } catch (e) {
        return fail(e instanceof Error ? e : new Error(String(e)));
    }
}

// Internal type helper
type updatePrice_id_type = number | string;
