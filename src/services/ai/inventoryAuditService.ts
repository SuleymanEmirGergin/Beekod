import { query } from "../../db.js";
import { getProductByBarcode } from "../product/productService.js";
import { logger } from "../../logger.js";
import { ok, fail, Result } from "../../utils/result.js";

export interface StockAuditResult {
  barcode: string;
  productName: string;
  centralStock: number;
  totalMarketplaceStock: number;
  discrepancy: number;
  status: 'balanced' | 'over_selling_risk' | 'under_utilization' | 'sync_required';
  details: Array<{ marketplace: string; stock: number }>;
  recommendation: string;
}

export class InventoryAuditService {
  /**
   * Checks if the stock of a specific product is consistent across all marketplaces.
   */
  async auditStockConsistency(barcode: string): Promise<Result<StockAuditResult>> {
    try {
      const productRes = await getProductByBarcode(barcode);
      if (!productRes.ok) return fail(productRes.error);
      const product = productRes.value;

      const listings = await query<any[]>(
        "SELECT marketplace, stock FROM marketplace_listings WHERE barcode = ?",
        [barcode]
      );

      const totalMarketplaceStock = listings.reduce((sum, l) => sum + (l.stock || 0), 0);
      const discrepancy = totalMarketplaceStock - product.stock;

      let status: StockAuditResult['status'] = 'balanced';
      let recommendation = "Stoklar dengeli ve tutarlı görünüyor.";

      if (totalMarketplaceStock > product.stock) {
        status = 'over_selling_risk';
        recommendation = `DİKKAT: Pazaryerlerindeki toplam stok (${totalMarketplaceStock}), eldeki ana stoktan (${product.stock}) fazla! Sipariş iptali riski var.`;
      } else if (totalMarketplaceStock < product.stock && product.stock > 0) {
        status = 'under_utilization';
        recommendation = "Bazı pazaryerlerinde stoklar güncellenmemiş olabilir. Satış potansiyelini artırmak için stokları senkronize edin.";
      }

      return ok({
        barcode: product.barcode,
        productName: product.name,
        centralStock: product.stock,
        totalMarketplaceStock,
        discrepancy,
        status,
        details: listings.map(l => ({ marketplace: l.marketplace, stock: l.stock })),
        recommendation
      });
    } catch (error) {
      logger.error("inventory_audit.single_failed", { barcode, error });
      return fail(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Finds all products with over-selling risks in the entire inventory.
   */
  async detectOverSellingRisks(): Promise<Result<StockAuditResult[]>> {
    try {
      // Find products where sum of listed stocks > product stock
      const rows = await query<any[]>(`
        SELECT p.barcode, p.name, p.stock as central_stock, 
               SUM(ml.stock) as total_ml_stock
        FROM products p
        JOIN marketplace_listings ml ON p.barcode = ml.barcode
        GROUP BY p.barcode, p.name, p.stock
        HAVING SUM(ml.stock) > p.stock
      `);

      const results: StockAuditResult[] = [];
      for (const row of rows) {
        const audit = await this.auditStockConsistency(row.barcode);
        if (audit.ok) results.push(audit.value);
      }

      return ok(results);
    } catch (error) {
      logger.error("inventory_audit.risk_detect_failed", { error });
      return fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export const inventoryAuditService = new InventoryAuditService();
