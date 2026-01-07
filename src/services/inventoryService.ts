import { query } from "../db.js";
import { MarketplaceListing } from "../types.js";
import { logger } from "../logger.js";

export const inventoryService = {
    async getConsolidatedInventory(): Promise<any[]> {
        // This query groups by barcode to show all marketplace presences for a single product
        const rows = await query<any[]>(`
            SELECT 
                barcode, 
                title, 
                GROUP_CONCAT(marketplace) as marketplaces,
                GROUP_CONCAT(CONCAT(marketplace, ':', price, ':', stock, ':', active)) as marketplace_data,
                MIN(price) as min_price,
                MAX(price) as max_price,
                SUM(stock) as total_stock
            FROM marketplace_listings
            GROUP BY barcode, title
            ORDER BY title ASC
        `);

        return rows.map(row => ({
            barcode: row.barcode,
            title: row.title,
            marketplaces: row.marketplaces.split(','),
            details: row.marketplace_data.split(',').map((d: string) => {
                const [mp, price, stock, active] = d.split(':');
                return {
                    marketplace: mp,
                    price: parseFloat(price),
                    stock: parseInt(stock),
                    active: active === '1'
                };
            }),
            minPrice: row.min_price,
            maxPrice: row.max_price,
            totalStock: row.total_stock
        }));
    },

    async updateBulkPrice(barcode: string, newPrice: number, marketplaces: string[]) {
        logger.info("inventory.bulk_price_update", { barcode, newPrice, marketplaces });

        const placeholders = marketplaces.map(() => "?").join(",");
        await query(
            `UPDATE marketplace_listings SET price = ? WHERE barcode = ? AND marketplace IN (${placeholders})`,
            [newPrice, barcode, ...marketplaces]
        );

        // In a real scenario, we would also enqueue jobs to update the live marketplaces
        // For this phase, we sync the DB first.
    }
};
