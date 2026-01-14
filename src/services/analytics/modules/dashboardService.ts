/**
 * Analytics Dashboard Service Module
 */
import { query } from "../../../db.js";
import { logger } from "../../../logger.js";

export interface DashboardStats {
  totalProducts: number;
  totalRevenue: number;
  lowStockCount: number;
  topPerformers: any[];
  categoryBreakdown: any[];
  recentActivity: any[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const productsCount = await query("SELECT COUNT(*) as c FROM products");
    const ordersSum = await query("SELECT SUM(total_amount) as s FROM orders WHERE status != 'cancelled'");
    const lowStock = await query("SELECT COUNT(*) as c FROM products WHERE stock <= COALESCE(alert_threshold, 10)");
    
    // Top performers (last 30 days)
    const topPerformers = await query(`
        SELECT p.name, SUM(oi.quantity) as units, SUM(oi.price * oi.quantity) as revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.barcode = oi.barcode
        WHERE o.created_at >= NOW() - INTERVAL 30 DAY
        GROUP BY p.barcode
        ORDER BY revenue DESC
        LIMIT 5
    `);

    // Category breakdown
    const categoryBreakdown = await query(`
        SELECT category, COUNT(*) as count, SUM(price * stock) as revenue 
        FROM products 
        GROUP BY category
    `);

    // Recent activity
    const recentActivity = await query(`
        SELECT DATE(created_at) as date, COUNT(*) as sales, SUM(total_amount) as revenue
        FROM orders
        WHERE created_at >= NOW() - INTERVAL 7 DAY
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    `);

    // Helper types for DB results
    type CountResult = { c: number };
    type SumResult = { s: number };

    // Use unknown first, then assert
    const productsCountRows = productsCount as unknown as CountResult[];
    const ordersSumRows = ordersSum as unknown as SumResult[];
    const lowStockRows = lowStock as unknown as CountResult[];

    return {
      totalProducts: productsCountRows[0]?.c || 0,
      totalRevenue: ordersSumRows[0]?.s || 0,
      lowStockCount: lowStockRows[0]?.c || 0,
      topPerformers: topPerformers as any[] || [],
      categoryBreakdown: categoryBreakdown as any[] || [],
      recentActivity: recentActivity as any[] || []
    };
  } catch (error) {
    logger.error("getDashboardStats.error", { error });
    return {
        totalProducts: 0, totalRevenue: 0, lowStockCount: 0,
        topPerformers: [], categoryBreakdown: [], recentActivity: []
    };
  }
}

// ... (existing imports)

export async function getTopSellers(limit = 5, days = 30): Promise<any[]> {
    try {
        const topPerformers = await query(`
            SELECT p.barcode as product_id, p.name as product_name, SUM(oi.quantity) as units_sold, SUM(oi.price * oi.quantity) as revenue
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            JOIN products p ON p.barcode = oi.barcode
            WHERE o.created_at >= NOW() - INTERVAL ? DAY
            GROUP BY p.barcode
            ORDER BY revenue DESC
            LIMIT ?
        `, [days, limit]);
        return topPerformers as any[];
    } catch (e) {
        return [];
    }
}

export async function getProductSalesDetail(productId: string): Promise<{
  product_id: string;
  product_name: string;
  units_sold: number;
  revenue: number;
} | null> {
    try {
        const rows = await query(`
            SELECT 
                p.barcode as product_id, p.name as product_name,
                COALESCE(SUM(oi.quantity), 0) as units_sold,
                COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
            FROM products p
            LEFT JOIN order_items oi ON p.barcode = oi.barcode
            LEFT JOIN orders o ON o.id = oi.order_id AND o.created_at >= NOW() - INTERVAL 30 DAY
            WHERE p.barcode = ?
            GROUP BY p.barcode
        `, [productId]);
        return (rows as any[])[0] || null;
    } catch (e) {
        return null;
    }
}

export async function getSalesSummary(days = 30): Promise<{ orders: number; units: number; revenue: number }> {
    try {
        const rows = await query(`
            SELECT 
                COUNT(DISTINCT o.id) as orders,
                SUM(oi.quantity) as units,
                SUM(oi.price * oi.quantity) as revenue
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.created_at >= NOW() - INTERVAL ? DAY
        `, [days]);
        
        const r = (rows as any[])[0];
        return {
            orders: r?.orders || 0,
            units: r?.units || 0,
            revenue: r?.revenue || 0
        };
    } catch (e) {
        return { orders: 0, units: 0, revenue: 0 };
    }
}
