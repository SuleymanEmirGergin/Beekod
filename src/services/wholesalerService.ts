import { pool } from "../db.js";
import { logger } from "../logger.js";
import { WholesalerStockHolder } from "../chatbot/types.js";
<<<<<<< HEAD
import { RowDataPacket } from "mysql2";

interface WholesalerProductRow extends RowDataPacket {
  id: number;
  wholesaler_id: number;
  barcode: string;
  product_name: string;
  stock_quantity: number;
  price: number;
  currency: string;
  is_available: number; // 0 or 1
  company_name: string;
  city: string;
}

interface WholesalerStockRow extends RowDataPacket {
  wholesaler_id: number;
  company_name: string;
  city: string;
  stock_quantity: number;
  is_available: number;
}

interface WholesalerMessageRow extends RowDataPacket {
  id: number;
  from_wholesaler_id: number;
  to_wholesaler_id: number;
  barcode: string | null;
  product_name: string | null;
  requested_qty: number | null;
  message_text: string | null;
  include_phone: number;
  sender_phone: string | null;
  is_read: number;
  read_at: Date | null;
  created_at: Date;
  sender_name: string;
  receiver_name: string;
}

interface WholesalerRow extends RowDataPacket {
  id: number;
  user_id: number;
  company_name: string;
  city: string;
  is_active: number;
  // Add other fields as per table definition if needed
}
=======
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e

/**
 * Wholesaler Service
 * 
 * Toptancı ağı operasyonları
 * Visibility Rules: Kendi stoku -> adet göster, başkası -> VAR/YOK
 */
export class WholesalerService {
    /**
     * Barkod ile ürün sorgula (tüm toptancılarda)
     */
<<<<<<< HEAD
    async getProduct(barcode: string): Promise<WholesalerProductRow[]> {
=======
    async getProduct(barcode: string): Promise<any[]> {
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
        try {
            const query = `
        SELECT 
          wp.id,
          wp.wholesaler_id,
          wp.barcode,
          wp.product_name,
          wp.stock_quantity,
          wp.price,
          wp.currency,
          wp.is_available,
          w.company_name,
          w.city
        FROM wholesaler_products wp
        JOIN wholesalers w ON w.id = wp.wholesaler_id
        WHERE wp.barcode = ? AND w.is_active = TRUE
        ORDER BY wp.stock_quantity DESC
      `;

<<<<<<< HEAD
            const [rows] = await pool.execute<WholesalerProductRow[]>(query, [barcode]);
            return rows;
=======
            const [rows] = await pool.execute(query, [barcode]);
            return rows as any[];
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
        } catch (error) {
            logger.error("wholesalerService.getProduct_failed", { error, barcode });
            return [];
        }
    }

    /**
     * Ürün ara (semantic search ile desteklenebilir)
     */
<<<<<<< HEAD
    async searchProducts(query: string): Promise<WholesalerProductRow[]> {
=======
    async searchProducts(query: string): Promise<any[]> {
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
        try {
            const searchQuery = `
        SELECT 
          wp.id,
          wp.wholesaler_id,
          wp.barcode,
          wp.product_name,
          wp.stock_quantity,
          wp.price,
          wp.currency,
          wp.is_available,
          w.company_name,
          w.city
        FROM wholesaler_products wp
        JOIN wholesalers w ON w.id = wp.wholesaler_id
        WHERE 
          (wp.product_name LIKE ? OR wp.barcode LIKE ?)
          AND w.is_active = TRUE
        ORDER BY wp.stock_quantity DESC
        LIMIT 50
      `;

            const searchPattern = `%${query}%`;
<<<<<<< HEAD
            const [rows] = await pool.execute<WholesalerProductRow[]>(searchQuery, [searchPattern, searchPattern]);
            return rows;
=======
            const [rows] = await pool.execute(searchQuery, [searchPattern, searchPattern]);
            return rows as any[];
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
        } catch (error) {
            logger.error("wholesalerService.searchProducts_failed", { error, query });
            return [];
        }
    }

    /**
     * Kimde var? - Visibility rules uygulanır
     * 
     * @param barcode - Ürün barkodu
     * @param viewerWholesalerId - Sorgulayan toptancının ID'si (kendi stoğunu görebilir)
     */
    async listStockHolders(
        barcode: string,
        viewerWholesalerId?: number
    ): Promise<WholesalerStockHolder[]> {
        try {
            const query = `
        SELECT 
          wp.wholesaler_id,
          w.company_name,
          w.city,
          wp.stock_quantity,
          wp.is_available
        FROM wholesaler_products wp
        JOIN wholesalers w ON w.id = wp.wholesaler_id
        WHERE wp.barcode = ? AND w.is_active = TRUE
        ORDER BY wp.is_available DESC, wp.stock_quantity DESC
      `;

<<<<<<< HEAD
            const [rows] = await pool.execute<WholesalerStockRow[]>(query, [barcode]);

            return rows.map((row, index) => {
=======
            const [rows] = await pool.execute(query, [barcode]);
            const data = rows as any[];

            return data.map((row, index) => {
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
                const isOwnStock = viewerWholesalerId && row.wholesaler_id === viewerWholesalerId;

                return {
                    wholesalerId: row.wholesaler_id,
                    displayName: `Toptancı #${String.fromCharCode(65 + index)}${row.wholesaler_id}`, // "Toptancı #A12"
                    availability: row.is_available ? "VAR" : "YOK",
                    stockQuantity: isOwnStock ? row.stock_quantity : undefined, // Sadece kendi stoku ise göster
                    city: row.city,
                    canMessage: true,
                };
            });
        } catch (error) {
            logger.error("wholesalerService.listStockHolders_failed", { error, barcode });
            return [];
        }
    }

    /**
     * Platform içi mesaj gönder
     */
    async sendMessage(payload: {
        fromWholesalerId: number;
        toWholesalerId: number;
        barcode?: string;
        productName?: string;
        requestedQty?: number;
        messageText?: string;
        includePhone?: boolean;
        senderPhone?: string;
    }): Promise<void> {
        try {
            const query = `
        INSERT INTO wholesaler_messages (
          from_wholesaler_id,
          to_wholesaler_id,
          barcode,
          product_name,
          requested_qty,
          message_text,
          include_phone,
          sender_phone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

            const values = [
                payload.fromWholesalerId,
                payload.toWholesalerId,
                payload.barcode || null,
                payload.productName || null,
                payload.requestedQty || null,
                payload.messageText || null,
                payload.includePhone || false,
                payload.includePhone ? payload.senderPhone : null,
            ];

            await pool.execute(query, values);

            logger.info("wholesalerService.message_sent", {
                from: payload.fromWholesalerId,
                to: payload.toWholesalerId,
                barcode: payload.barcode,
                includePhone: payload.includePhone,
            });
        } catch (error) {
            logger.error("wholesalerService.sendMessage_failed", { error, payload });
            throw error;
        }
    }

    /**
     * Mesajları getir (gelen veya giden)
     */
<<<<<<< HEAD
    async getMessages(wholesalerId: number, type: "inbox" | "sent" = "inbox", limit = 50): Promise<WholesalerMessageRow[]> {
=======
    async getMessages(wholesalerId: number, type: "inbox" | "sent" = "inbox", limit = 50): Promise<any[]> {
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
        try {
            const query = type === "inbox"
                ? `
          SELECT 
            wm.*,
            w_from.company_name as sender_name,
            w_to.company_name as receiver_name
          FROM wholesaler_messages wm
          JOIN wholesalers w_from ON w_from.id = wm.from_wholesaler_id
          JOIN wholesalers w_to ON w_to.id = wm.to_wholesaler_id
          WHERE wm.to_wholesaler_id = ?
          ORDER BY wm.created_at DESC
          LIMIT ?
        `
                : `
          SELECT 
            wm.*,
            w_from.company_name as sender_name,
            w_to.company_name as receiver_name
          FROM wholesaler_messages wm
          JOIN wholesalers w_from ON w_from.id = wm.from_wholesaler_id
          JOIN wholesalers w_to ON w_to.id = wm.to_wholesaler_id
          WHERE wm.from_wholesaler_id = ?
          ORDER BY wm.created_at DESC
          LIMIT ?
        `;

<<<<<<< HEAD
            const [rows] = await pool.execute<WholesalerMessageRow[]>(query, [wholesalerId, limit]);
            return rows;
=======
            const [rows] = await pool.execute(query, [wholesalerId, limit]);
            return rows as any[];
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
        } catch (error) {
            logger.error("wholesalerService.getMessages_failed", { error, wholesalerId, type });
            return [];
        }
    }

    /**
     * Mesajı okundu olarak işaretle
     */
    async markAsRead(messageId: number, wholesalerId: number): Promise<void> {
        try {
            const query = `
        UPDATE wholesaler_messages
        SET is_read = TRUE, read_at = NOW()
        WHERE id = ? AND to_wholesaler_id = ?
      `;

            await pool.execute(query, [messageId, wholesalerId]);

            logger.info("wholesalerService.message_read", { messageId, wholesalerId });
        } catch (error) {
            logger.error("wholesalerService.markAsRead_failed", { error, messageId });
        }
    }

    /**
     * Toptancı bilgisi getir
     */
<<<<<<< HEAD
    async getWholesaler(id: number): Promise<WholesalerRow | null> {
=======
    async getWholesaler(id: number): Promise<any | null> {
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
        try {
            const query = `
        SELECT * FROM wholesalers WHERE id = ? AND is_active = TRUE
      `;

<<<<<<< HEAD
            const [rows] = await pool.execute<WholesalerRow[]>(query, [id]);
            return rows[0] || null;
=======
            const [rows] = await pool.execute(query, [id]);
            const data = rows as any[];
            return data[0] || null;
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
        } catch (error) {
            logger.error("wholesalerService.getWholesaler_failed", { error, id });
            return null;
        }
    }

    /**
     * User ID'den toptancı ID'si al (eğer user bir toptancı ise)
     */
<<<<<<< HEAD
    async getWholesalerByUserId(userId: number): Promise<WholesalerRow | null> {
=======
    async getWholesalerByUserId(userId: number): Promise<any | null> {
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
        try {
            const query = `
        SELECT * FROM wholesalers WHERE user_id = ? AND is_active = TRUE
      `;

<<<<<<< HEAD
            const [rows] = await pool.execute<WholesalerRow[]>(query, [userId]);
            return rows[0] || null;
=======
            const [rows] = await pool.execute(query, [userId]);
            const data = rows as any[];
            return data[0] || null;
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
        } catch (error) {
            logger.error("wholesalerService.getWholesalerByUserId_failed", { error, userId });
            return null;
        }
    }

    /**
     * Toptancı stok güncelle/ekle
     */
    async upsertProduct(data: {
        wholesalerId: number;
        barcode: string;
        productName?: string;
        stockQuantity: number;
        price?: number;
        currency?: string;
    }): Promise<void> {
        try {
            const query = `
        INSERT INTO wholesaler_products (
          wholesaler_id,
          barcode,
          product_name,
          stock_quantity,
          price,
          currency
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          product_name = COALESCE(VALUES(product_name), product_name),
          stock_quantity = VALUES(stock_quantity),
          price = COALESCE(VALUES(price), price),
          currency = COALESCE(VALUES(currency), currency),
          updated_at = CURRENT_TIMESTAMP
      `;

            const values = [
                data.wholesalerId,
                data.barcode,
                data.productName || null,
                data.stockQuantity,
                data.price || null,
                data.currency || "TRY",
            ];

            await pool.execute(query, values);

            logger.info("wholesalerService.product_upserted", {
                wholesalerId: data.wholesalerId,
                barcode: data.barcode,
                stockQuantity: data.stockQuantity,
            });
        } catch (error) {
            logger.error("wholesalerService.upsertProduct_failed", { error, data });
            throw error;
        }
    }
}

// Singleton instance
export const wholesalerService = new WholesalerService();
