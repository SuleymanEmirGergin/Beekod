export interface IStockHistory {
  id?: number;
  barcode: string;
  productName: string;
  oldStock: number;
  newStock: number;
  change: number;
  reason: string;
  source: string; // e.g. "Order", "Manual", "Marketplace Sync"
  createdAt?: Date;
}

export function mapStockHistory(row: any): IStockHistory {
  return {
    id: row.id,
    barcode: row.barcode,
    productName: row.product_name,
    oldStock: row.old_stock,
    newStock: row.new_stock,
    change: row.new_stock - row.old_stock,
    reason: row.reason,
    source: row.source,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
  };
}
