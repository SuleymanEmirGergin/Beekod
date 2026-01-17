/**
 * Analytics Service Façade
 */

import { query } from "../db.js";
import { logger } from "../logger.js";

// Re-export modules
export * from "./analytics/modules/dashboardService.js";
export * from "./analytics/modules/inventoryAnalyticsService.js";
export { searchProducts } from "./product/productService.js";

// Timeline types
export interface TimelineEntry {
  date: string;
  orderCount: number;
  revenue: number;
}

export interface ProfitMarginEntry {
  barcode: string;
  name: string;
  category: string;
  price: number;
  cost_price: number;
  profit: number;
  profit_margin_percent: number;
  total_sold: number;
}

export async function getRevenueTimeline(days: number = 30): Promise<TimelineEntry[]> {
  try {
    const rows = await query(`
        SELECT 
            DATE(created_at) as date, 
            COUNT(*) as orderCount, 
            SUM(total_amount) as revenue
        FROM orders
        WHERE status != 'cancelled' 
        AND created_at >= NOW() - INTERVAL ? DAY
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    `, [days]);
    
    return rows as TimelineEntry[];
  } catch (error) {
    logger.error("getRevenueTimeline.error", { error });
    return [];
  }
}

export async function getProfitMargins(): Promise<ProfitMarginEntry[]> {
    try {
        const rows = await query(`
            SELECT 
                p.barcode, p.name, p.category, p.price, 
                COALESCE(p.cost_price, 0) as cost_price,
                (p.price - COALESCE(p.cost_price, 0)) as profit,
                CASE WHEN p.price > 0 THEN ((p.price - COALESCE(p.cost_price, 0)) / p.price) * 100 ELSE 0 END as profit_margin_percent,
                (SELECT COALESCE(SUM(quantity), 0) FROM order_items WHERE barcode = p.barcode) as total_sold
            FROM products p
            WHERE p.stock > 0
            ORDER BY profit DESC
            LIMIT 100
        `);
        return rows as ProfitMarginEntry[];
    } catch (e) {
        return [];
    }
}

export async function getProductPerformance(barcode: string): Promise<any | null> {
    try {
        const rows = await query(`
            SELECT 
                p.barcode, p.name,
                COUNT(DISTINCT o.id) as orderCount,
                SUM(oi.quantity) as totalUnits,
                SUM(oi.price * oi.quantity) as totalRevenue
            FROM products p
            LEFT JOIN order_items oi ON p.barcode = oi.barcode
            LEFT JOIN orders o ON oi.order_id = o.id
            WHERE p.barcode = ?
            GROUP BY p.barcode
        `, [barcode]);
        
        return (rows as any[])[0] || null;
    } catch (e) {
        return null;
    }
}

export async function getMarketplacePerformance(): Promise<any[]> {
    try {
        const rows = await query(`
            SELECT 
                CASE 
                    WHEN marketplace LIKE '%trendyol%' THEN 'Trendyol'
                    WHEN marketplace LIKE '%hepsiburada%' THEN 'Hepsiburada'
                    WHEN marketplace LIKE '%n11%' THEN 'N11'
                    WHEN marketplace LIKE '%pazarama%' THEN 'Pazarama'
                    ELSE 'Diğer'
                END as platform,
                COUNT(*) as orders,
                SUM(total_amount) as revenue
            FROM orders
            WHERE status != 'cancelled'
            GROUP BY platform
            ORDER BY revenue DESC
        `);
        return rows as any[];
    } catch (e) {
        // Fallback mock data if query fails or table structure is different
        return [
            { platform: 'Trendyol', revenue: 0, orders: 0 },
            { platform: 'Hepsiburada', revenue: 0, orders: 0 },
            { platform: 'N11', revenue: 0, orders: 0 }
        ];
    }
}
