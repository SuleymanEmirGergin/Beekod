/**
 * Inventory Analytics Module
 */
import { query } from "../../../db.js";

export async function getInventoryHealth(): Promise<{
  critical: number;
  outOfStock: number;
  low: number;
  normal: number;
  overstocked: number;
}> {
  try {
    // Logic:
    // OutOfStock: stock = 0
    // Critical: stock <= 5
    // Low: stock <= 20
    // Normal: stock > 20 AND stock < 100
    // Overstocked: stock >= 100
    
    const rows = await query(`
       SELECT 
         SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as outOfStock,
         SUM(CASE WHEN stock > 0 AND stock <= 5 THEN 1 ELSE 0 END) as critical,
         SUM(CASE WHEN stock > 5 AND stock <= 20 THEN 1 ELSE 0 END) as low,
         SUM(CASE WHEN stock > 20 AND stock < 100 THEN 1 ELSE 0 END) as normal,
         SUM(CASE WHEN stock >= 100 THEN 1 ELSE 0 END) as overstocked
       FROM products
    `);
    
    return (rows as any[])[0] || { critical:0, outOfStock:0, low:0, normal:0, overstocked:0 };
  } catch (e) {
    return { critical:0, outOfStock:0, low:0, normal:0, overstocked:0 };
  }
}

export async function getInventoryForecast(): Promise<any[]> {
    try {
        // Calculate daily velocity (avg sales per day over last 30 days)
        // Then estimate days remaining
        const sql = `
            WITH SalesVelocity AS (
                SELECT 
                    barcode, 
                    SUM(quantity) / 30.0 as daily_velocity
                FROM order_items oi
                JOIN orders o ON o.id = oi.order_id
                WHERE o.created_at >= NOW() - INTERVAL 30 DAY
                GROUP BY barcode
            )
            SELECT 
                p.barcode, 
                p.name as product_name, 
                p.stock,
                COALESCE(sv.daily_velocity, 0) as daily_velocity,
                CASE 
                    WHEN COALESCE(sv.daily_velocity, 0) = 0 THEN 999 
                    ELSE p.stock / sv.daily_velocity 
                END as days_remaining
            FROM products p
            LEFT JOIN SalesVelocity sv ON p.barcode = sv.barcode
            WHERE p.stock > 0
            ORDER BY days_remaining ASC
            LIMIT 50
        `;
        return (await query(sql)) as any[];
    } catch (e) {
        return [];
    }
}
