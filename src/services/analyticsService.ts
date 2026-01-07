import { query } from "../db.js";
import { logger } from "../logger.js";
import { NotFoundError, InternalError } from "../errors/AppError.js";

export type ProductPerformance = {
  barcode: string;
  name: string;
  totalSales: number;
  totalRevenue: number;
  averagePrice: number;
  category?: string;
};

export type DashboardStats = {
  totalProducts: number;
  totalRevenue: number;
  lowStockCount: number;
  topPerformers: ProductPerformance[];
  categoryBreakdown: Array<{ category: string; count: number; revenue: number }>;
  recentActivity: Array<{ date: string; sales: number; revenue: number }>;
};

export type TimelineEntry = {
  date: string;
  orderCount: number;
  revenue: number;
};

export type ProfitMarginEntry = {
  barcode: string;
  name: string;
  category: string;
  price: number;
  cost_price: number;
  profit: number;
  profit_margin_percent: number;
  total_sold: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Total products
    const countRows = await query<{ total: number }[]>("SELECT COUNT(*) as total FROM products");
    const totalProducts = countRows[0]?.total || 0;

    // Low stock count (< 10)
    const lowStockRows = await query<{ total: number }[]>("SELECT COUNT(*) as total FROM products WHERE stock < 10");
    const lowStockCount = lowStockRows[0]?.total || 0;

    // Total revenue (from real orders using the new numeric column)
    const revenueRows = await query<{ total: number }[]>(
      "SELECT SUM(total_amount_numeric) as total FROM orders WHERE status_label != 'Cancelled'",
    );
    const totalRevenue = revenueRows[0]?.total || 0;

    // Top performers (Actual revenue from order items)
    const topProducts = await query<
      {
        barcode: string;
        name: string;
        category: string | null;
        price: number;
        stock: number;
        totalSales: string | number;
        totalRevenue: string | number;
      }[]
    >(`
      SELECT 
        p.barcode, 
        p.name, 
        p.category,
        p.price,
        p.stock,
        SUM(oi.quantity) as totalSales,
        SUM(oi.price_numeric * oi.quantity) as totalRevenue
      FROM products p
      JOIN order_items oi ON p.barcode = oi.sku
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status_label != 'Cancelled'
      GROUP BY p.barcode, p.name, p.category, p.price, p.stock
      ORDER BY totalRevenue DESC 
      LIMIT 10
    `);

    const topPerformers: ProductPerformance[] = topProducts.map((p) => ({
      barcode: p.barcode,
      name: p.name,
      category: p.category ?? undefined,
      totalSales: Number(p.totalSales) || 0,
      totalRevenue: Number(p.totalRevenue) || 0,
      averagePrice: Number(p.price) || 0,
      stock: Number(p.stock) || 0,
    }));

    // Category breakdown (Actual revenue)
    const categoryData = await query<
      {
        category: string;
        count: number;
        revenue: string | number;
      }[]
    >(`
      SELECT 
        COALESCE(p.category, 'Kategorisiz') as category,
        COUNT(DISTINCT p.barcode) as count,
        SUM(oi.price_numeric * oi.quantity) as revenue
      FROM products p
      LEFT JOIN order_items oi ON p.barcode = oi.sku
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status_label != 'Cancelled'
      GROUP BY p.category
      ORDER BY revenue DESC
      LIMIT 10
    `);

    const categoryBreakdown = categoryData.map((c) => ({
      category: c.category,
      count: Number(c.count),
      revenue: Number(c.revenue) || 0,
    }));

    // Recent activity (last 7 days - simulated for now)
    const recentActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split("T")[0],
        sales: Math.floor(Math.random() * 50) + 10,
        revenue: Math.floor(Math.random() * 10000) + 1000,
      };
    });

    return {
      totalProducts,
      totalRevenue,
      lowStockCount,
      topPerformers,
      categoryBreakdown,
      recentActivity,
    };
  } catch (error) {
    logger.error("analytics.get_dashboard_stats_failed", { err: error });
    throw new InternalError("Dashboard verileri alınamadı", { originalError: error });
  }
}

export async function getProductPerformance(barcode: string): Promise<ProductPerformance | null> {
  try {
    const rows = await query<
      {
        barcode: string;
        name: string;
        category: string | null;
        price: number;
        stock: number;
        totalValue: number;
      }[]
    >(
      `SELECT 
        barcode, 
        name, 
        category,
        price,
        stock,
        (price * stock) as totalValue
      FROM products 
      WHERE barcode = ?`,
      [barcode],
    );

    const product = rows[0];
    if (!product) {
      throw new NotFoundError(`Barcode ${barcode} ile ürün bulunamadı`);
    }

    return {
      barcode: product.barcode,
      name: product.name,
      category: product.category ?? undefined,
      totalSales: Number(product.stock),
      totalRevenue: Number(product.totalValue),
      averagePrice: Number(product.price),
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error("analytics.get_product_performance_failed", { err: error, barcode });
    throw new InternalError("Ürün performans verisi alınamadı", { barcode, originalError: error });
  }
}

export async function getRevenueTimeline(days: number = 30): Promise<TimelineEntry[]> {
  try {
    const rows = await query<TimelineEntry[]>(
      `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orderCount,
        SUM(total_amount_numeric) as revenue
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND status_label != 'Cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
      `,
      [days],
    );

    return rows;
  } catch (error) {
    logger.error("analytics.get_revenue_timeline_failed", { err: error, days });
    throw new InternalError("Gelir çizelgesi alınamadı", { originalError: error });
  }
}

export async function getProfitMargins(): Promise<ProfitMarginEntry[]> {
  try {
    const rows = await query<ProfitMarginEntry[]>(`
      SELECT 
        p.barcode,
        p.name,
        p.category,
        p.price,
        p.cost_price,
        (p.price - p.cost_price) as profit,
        ROUND(((p.price - p.cost_price) / p.price) * 100, 2) as profit_margin_percent,
        COALESCE(SUM(oi.quantity), 0) as total_sold
      FROM products p
      LEFT JOIN order_items oi ON p.barcode = oi.sku
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status_label != 'Cancelled'
      WHERE p.cost_price > 0 AND p.price > 0
      GROUP BY p.barcode, p.name, p.category, p.price, p.cost_price
      HAVING total_sold > 0
      ORDER BY profit_margin_percent DESC
      LIMIT 20
    `);

    return rows;
  } catch (error) {
    logger.error("analytics.get_profit_margins_failed", { err: error });
    throw error;
  }
}

export async function getInventoryHealth(): Promise<{
  critical: number;
  outOfStock: number;
  low: number;
  normal: number;
  overstocked: number;
}> {
  try {
    const criticalRows = await query<{ count: number }[]>(`
      SELECT COUNT(*) as count
      FROM products
      WHERE stock <= COALESCE(alert_threshold, 10)
        AND stock > 0
    `);

    const outOfStockRows = await query<{ count: number }[]>(`
      SELECT COUNT(*) as count FROM products WHERE stock = 0
    `);

    const lowRows = await query<{ count: number }[]>(`
      SELECT COUNT(*) as count
      FROM products
      WHERE stock > COALESCE(alert_threshold, 10)
        AND stock <= COALESCE(alert_threshold, 10) * 2
    `);

    const normalRows = await query<{ count: number }[]>(`
      SELECT COUNT(*) as count
      FROM products
      WHERE stock > COALESCE(alert_threshold, 10) * 2
        AND stock <= COALESCE(alert_threshold, 10) * 10
    `);

    const overstockedRows = await query<{ count: number }[]>(`
      SELECT COUNT(*) as count
      FROM products
      WHERE stock > COALESCE(alert_threshold, 10) * 10
    `);

    return {
      critical: criticalRows[0].count,
      outOfStock: outOfStockRows[0].count,
      low: lowRows[0].count,
      normal: normalRows[0].count,
      overstocked: overstockedRows[0].count,
    };
  } catch (error) {
    logger.error("analytics.get_inventory_health_failed", { err: error });
    throw error;
  }
}

export async function getMarketplacePerformance(): Promise<
  { marketplace: string; orderCount: number; revenue: number }[]
> {
  try {
    const rows = await query<{ marketplace: string; orderCount: number; revenue: number }[]>(`
      SELECT 
        source_name as marketplace,
        COUNT(*) as orderCount,
        SUM(total_amount_numeric) as revenue
      FROM orders
      WHERE status_label != 'Cancelled'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY source_name
      ORDER BY revenue DESC
    `);

    return rows;
  } catch (error) {
    logger.error("analytics.get_marketplace_performance_failed", { err: error });
    throw error;
  }
}

/**
 * UPDATED: Get top selling products (last N days)
 * - Eskiden sadece (limit) alıyordu.
 * - Artık (limit, days) alıyor.
 */
export async function getTopSellers(
  limit: number = 5,
  days: number = 30,
): Promise<
  Array<{
    product_id: string;
    product_name: string;
    units_sold: number;
    revenue: number;
  }>
> {
  try {
    const results = await query<
      {
        product_id: string;
        sku: string;
        product_name: string | null;
        units_sold: string | number;
        revenue: string | number;
      }[]
    >(
      `
      SELECT
        oi.sku as product_id,
        oi.product_name,
        SUM(oi.quantity) AS units_sold,
        SUM(oi.quantity * oi.price_numeric) AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND o.status_label != 'Cancelled'
      GROUP BY oi.sku, oi.product_name
      ORDER BY units_sold DESC
      LIMIT ?
      `,
      [days, limit],
    );

    return results.map((r) => ({
      product_id: String(r.product_id ?? r.sku ?? ""),
      product_name: r.product_name || "Unknown",
      units_sold: Number(r.units_sold) || 0,
      revenue: Number(r.revenue) || 0,
    }));
  } catch (error) {
    logger.error("analytics.top_sellers_failed", { err: error, days, limit });
    return [];
  }
}

/**
 * NEW: Sales summary (last N days)
 */
export async function getSalesSummary(days: number = 30): Promise<{ orders: number; units: number; revenue: number }> {
  try {
    const rows = await query<
      {
        orders: number;
        units: string | number;
        revenue: string | number;
      }[]
    >(
      `
      SELECT
        COUNT(DISTINCT o.id) as orders,
        COALESCE(SUM(oi.quantity), 0) as units,
        COALESCE(SUM(oi.quantity * oi.price_numeric), 0) as revenue
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND o.status_label != 'Cancelled'
      `,
      [days],
    );

    const r = rows[0] ?? { orders: 0, units: 0, revenue: 0 };
    return {
      orders: Number(r.orders) || 0,
      units: Number(r.units) || 0,
      revenue: Number(r.revenue) || 0,
    };
  } catch (error) {
    logger.error("analytics.sales_summary_failed", { err: error, days });
    return { orders: 0, units: 0, revenue: 0 };
  }
}

/**
 * Search products by name
 */
export async function searchProducts(
  searchTerm: string,
  limit: number = 10,
): Promise<
  Array<{
    id: number;
    barcode: string;
    name: string;
    price: number;
    stock: number;
  }>
> {
  try {
    const results = await query<
      {
        id: number;
        barcode: string;
        name: string;
        price: number;
        stock: number;
      }[]
    >(
      `
      SELECT id, barcode, name, price, stock
      FROM products
      WHERE name LIKE CONCAT('%', ?, '%')
      LIMIT ?
      `,
      [searchTerm, limit],
    );

    return results.map((r) => ({
      id: Number(r.id),
      barcode: r.barcode || "",
      name: r.name || "Unknown",
      price: Number(r.price) || 0,
      stock: Number(r.stock) || 0,
    }));
  } catch (error) {
    logger.error("analytics.search_products_failed", { searchTerm, err: error });
    return [];
  }
}

/**
 * Get product sales details (last 30 days)
 */
export async function getProductSalesDetail(productId: string): Promise<{
  product_id: string;
  product_name: string;
  units_sold: number;
  revenue: number;
} | null> {
  try {
    const results = await query<
      {
        product_id: string;
        sku: string;
        product_name: string | null;
        units_sold: string | number;
        revenue: string | number;
      }[]
    >(
      `
      SELECT
        oi.sku as product_id,
        oi.product_name,
        SUM(oi.quantity) units_sold,
        SUM(oi.quantity * oi.price_numeric) revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.sku = ?
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND o.status_label != 'Cancelled'
      GROUP BY oi.sku, oi.product_name
      `,
      [productId],
    );

    if (!results.length) return null;

    const r = results[0];
    return {
      product_id: r.product_id || productId,
      product_name: r.product_name || "Unknown",
      units_sold: Number(r.units_sold) || 0,
      revenue: Number(r.revenue) || 0,
    };
  } catch (error) {
    logger.error("analytics.product_sales_detail_failed", { productId, err: error });
    return null;
  }
}

export async function getInventoryForecast(): Promise<
  Array<{
    barcode: string;
    product_name: string;
    stock: number;
    daily_velocity: number;
    days_remaining: number;
    status: 'critical' | 'low' | 'healthy';
  }>
> {
  try {
    // 1. Calculate Daily Velocity (Average sales per day over last 30 days)
    const velocityRows = await query<
      {
        barcode: string;
        product_name: string | null;
        total_sold: string | number;
        stock: number;
      }[]
    >(`
      SELECT 
        p.barcode,
        p.name as product_name,
        COALESCE(SUM(oi.quantity), 0) as total_sold,
        p.stock
      FROM products p
      LEFT JOIN order_items oi ON p.barcode = oi.sku
      LEFT JOIN orders o ON oi.order_id = o.id 
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND o.status_label != 'Cancelled'
      WHERE p.stock > 0
      GROUP BY p.barcode, p.name, p.stock
      HAVING total_sold > 0
      ORDER BY total_sold DESC
    `);

    const forecast = velocityRows.map(row => {
      const sold = Number(row.total_sold);
      const stock = Number(row.stock);
      const velocity = sold / 30; // Sales per day

      const daysRemaining = velocity > 0 ? Math.floor(stock / velocity) : 999;

      let status: 'critical' | 'low' | 'healthy' = 'healthy';
      if (daysRemaining <= 7) status = 'critical';
      else if (daysRemaining <= 14) status = 'low';

      return {
        barcode: row.barcode,
        product_name: row.product_name || 'Unknown',
        stock: stock,
        daily_velocity: Number(velocity.toFixed(2)),
        days_remaining: daysRemaining,
        status
      };
    });

    // Filter only items at risk (e.g., less than 30 days coverage) and sort by urgency
    return forecast
      .filter(f => f.days_remaining <= 30)
      .sort((a, b) => a.days_remaining - b.days_remaining);

  } catch (error) {
    logger.error("analytics.forecast_failed", { err: error });
    return [];
  }
}
