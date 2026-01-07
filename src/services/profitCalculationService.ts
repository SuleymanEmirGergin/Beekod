import { query } from '../db.js';
import { logger } from '../logger.js';

export interface ProfitableProduct {
    barcode: string;
    name: string;
    category: string;
    totalSold: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    profitMargin: number; // percentage
}

export const profitCalculationService = {
    /**
     * Get most profitable products
     */
    async getMostProfitable(limit: number = 10, days: number = 30): Promise<ProfitableProduct[]> {
        logger.info('profitCalculationService.getMostProfitable', { limit, days });

        const rows = await query<any[]>(`
            SELECT 
                p.barcode,
                p.name,
                p.category,
                COALESCE(SUM(s.quantity), 0) as total_sold,
                COALESCE(SUM(s.quantity * s.unit_price), 0) as total_revenue,
                COALESCE(SUM(s.quantity * p.cost_price), 0) as total_cost,
                COALESCE(SUM(s.quantity * (s.unit_price - p.cost_price)), 0) as total_profit,
                CASE 
                    WHEN SUM(s.quantity * s.unit_price) > 0 
                    THEN (SUM(s.quantity * (s.unit_price - p.cost_price)) / SUM(s.quantity * s.unit_price)) * 100
                    ELSE 0
                END as profit_margin
            FROM products p
            LEFT JOIN sales_records s ON p.barcode = s.barcode
            WHERE s.order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY p.barcode, p.name, p.category
            HAVING total_sold > 0
            ORDER BY total_profit DESC
            LIMIT ?
        `, [days, limit]);

        return rows.map(row => ({
            barcode: row.barcode,
            name: row.name,
            category: row.category || 'Uncategorized',
            totalSold: parseInt(row.total_sold),
            totalRevenue: parseFloat(row.total_revenue),
            totalCost: parseFloat(row.total_cost),
            totalProfit: parseFloat(row.total_profit),
            profitMargin: parseFloat(row.profit_margin)
        }));
    },

    /**
     * Calculate overall profit summary
     */
    async getProfitSummary(days: number = 30): Promise<{
        totalRevenue: number;
        totalCost: number;
        totalProfit: number;
        profitMargin: number;
    }> {
        const rows = await query<any[]>(`
            SELECT 
                COALESCE(SUM(s.quantity * s.unit_price), 0) as total_revenue,
                COALESCE(SUM(s.quantity * p.cost_price), 0) as total_cost
            FROM sales_records s
            JOIN products p ON s.barcode = p.barcode
            WHERE s.order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        `, [days]);

        const totalRevenue = parseFloat(rows[0]?.total_revenue || 0);
        const totalCost = parseFloat(rows[0]?.total_cost || 0);
        const totalProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        return {
            totalRevenue,
            totalCost,
            totalProfit,
            profitMargin
        };
    }
};
