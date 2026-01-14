/**
 * Product Service Façade
 * Aggregates specific product modules into a single service interface
 */

import QRCode from "qrcode";
import { query } from "../../db.js";
import { Product } from "../../types.js";
import { logger } from "../../logger.js";
import { ok, fail, Result } from "../../utils/result.js";

// Re-export specific modules
export * from "./modules/productSearchService.js";
export * from "./modules/productStockService.js";
export * from "./modules/productPricingService.js";

// Import for internal usage in CRUD
import { getProductByBarcode, searchProductsByName as searchProducts } from "./modules/productSearchService.js";
export { searchProducts };

/**
 * Create or update product (Upsert)
 * Contains complex logic combining search, creation, and updates
 */
export async function upsertProduct(input: {
  barcode: string;
  name: string;
  category?: string;
  description?: string;
  price: number;
  cost_price?: number;
  stock: number;
  currency: string;
  brand?: string;
  product_code?: string;
  vat_rate?: number;
  image?: string;
  imageUrl?: string;
  preparation_days?: number;
  product_type?: 'standard' | 'packet' | 'digital';
  alert_threshold?: number;
}): Promise<Result<Product>> {
  try {
    const existing = await getProductByBarcode(input.barcode);
    const imageUrl = input.image || input.imageUrl;

    if (existing.ok) {
      // Update
      const updates: any = {};
      if (input.name) updates.name = input.name;
      if (input.category) updates.category = input.category;
      if (input.description) updates.description = input.description;
      if (input.price !== undefined) updates.price = input.price;
      if (input.stock !== undefined) updates.stock = input.stock;
      if (input.currency) updates.currency = input.currency;
      if (imageUrl) updates.image = imageUrl;
      if (input.alert_threshold) updates.alert_threshold = input.alert_threshold;

      await updateProduct(input.barcode, updates);
      return getProductByBarcode(input.barcode);
    } else {
      // Insert
      const sql = `
        INSERT INTO products 
        (barcode, name, category, description, price, stock, currency, brand, image, alert_threshold, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      const params = [
        input.barcode,
        input.name,
        input.category || null,
        input.description || null,
        input.price,
        input.stock,
        input.currency || "TRY",
        input.brand || null,
        imageUrl || null,
        input.alert_threshold || 10
      ];
      
      await query(sql, params);
      return getProductByBarcode(input.barcode);
    }
  } catch (error) {
    logger.error("upsertProduct.error", { error, barcode: input.barcode });
    return fail(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Basic Update Product
 */
export async function updateProduct(
  barcode: string,
  updates: Partial<Product>
): Promise<boolean> {
  const keys = Object.keys(updates).filter(k => k !== 'barcode' && k !== 'id' && (updates as any)[k] !== undefined);
  if (keys.length === 0) return false;

  const setClause = keys.map(k => `${k} = ?`).join(", ");
  const values = keys.map(k => (updates as any)[k]);
  values.push(barcode);

  const sql = `UPDATE products SET ${setClause}, updated_at = NOW() WHERE barcode = ?`;
  try {
    const result = await query(sql, values);
    return (result as any).affectedRows > 0;
  } catch (error) {
    logger.error("updateProduct.error", { error, barcode });
    return false;
  }
}

/**
 * Delete Product
 */
export async function deleteProduct(barcode: string, userId?: number): Promise<Result<boolean>> {
  try {
    const result = await query("DELETE FROM products WHERE barcode = ?", [barcode]);
    if (userId) {
        logger.info("Product deleted by user", {barcode, userId});
    }
    return ok((result as any).affectedRows > 0);
  } catch (error) {
    return fail(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Bulk Delete
 */
export async function bulkDeleteProducts(barcodes: string[]): Promise<number> {
  if (!barcodes.length) return 0;
  try {
    const placeholders = barcodes.map(() => "?").join(",");
    const result = await query(`DELETE FROM products WHERE barcode IN (${placeholders})`, barcodes);
    return (result as any).affectedRows;
  } catch (error) {
    logger.error("bulkDeleteProducts.error", { error });
    return 0;
  }
}

/**
 * Generate QR Code
 */
export async function generateQRCode(barcode: string): Promise<string> {
  try {
    return await QRCode.toDataURL(barcode);
  } catch (err) {
    logger.error("generateQRCode.error", { err, barcode });
    throw err;
  }
}

// ==========================================
// Consoldated Inventory Logic (Legacy migration)
// ==========================================
import { ConsolidatedInventoryItem } from "../../types.js";

export async function getConsolidatedInventory(): Promise<Result<ConsolidatedInventoryItem[]>> {
    // This joins local products with marketplace data
    // Improved query using LEFT JOIN to get everything
    try {
        const sql = `
            SELECT 
                p.barcode, p.name as title, p.price, p.stock, p.image,
                p.category, p.brand
            FROM products p
            ORDER BY p.updated_at DESC
        `;
        const rows = await query(sql);
        
        // Map to ConsolidatedInventoryItem
        const items: ConsolidatedInventoryItem[] = (rows as any[]).map(r => ({
            barcode: r.barcode,
            title: r.title,
            marketplaces: [], // Populated by separate marketplace sync logic if needed
            details: [], // Formerly marketplace_data
            minPrice: r.price, // Default to local price
            maxPrice: r.price, // Default to local price
            totalStock: r.stock,
            // image: r.image // Not in interface but useful?
        }));
        
        return ok(items);
    } catch (e) {
        return fail(e instanceof Error ? e : new Error(String(e)));
    }
}
