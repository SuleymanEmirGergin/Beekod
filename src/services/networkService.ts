import { pool } from "../db.js";
import { RowDataPacket } from "mysql2";

export type NetworkStockInfo = {
  wholesalerName: string;
  phone: string;
  email: string;
  stock: number;
  price: number;
  currency: string;
};

export async function searchNetwork(barcode: string): Promise<NetworkStockInfo[]> {
  // Assuming wholesaler_id = 1 is "My Company" (Beekod Ana Depo)
  // We want to find OTHER wholesalers who have this product in stock
  const sql = `
        SELECT w.name as wholesalerName, w.phone, w.email, p.stock, p.price, p.currency
        FROM products p
        JOIN wholesalers w ON p.wholesaler_id = w.id
        WHERE p.barcode = ? 
          AND p.stock > 0 
          AND p.wholesaler_id != 1
          AND w.is_visible = 1
        ORDER BY p.price ASC
    `;

  const [rows] = await pool.query<RowDataPacket[]>(sql, [barcode]);

  return rows.map((row) => ({
    wholesalerName: row.wholesalerName,
    phone: row.phone || "-",
    email: row.email || "-",
    stock: row.stock,
    price: Number(row.price),
    currency: row.currency || "TL",
  }));
}
