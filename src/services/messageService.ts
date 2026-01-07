import { pool } from "../db.js";
import { RowDataPacket } from "mysql2";

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: Date;
  sender_name?: string;
  receiver_name?: string;
}

export const messageService = {
  async sendMessage(senderId: number, receiverId: number, content: string) {
    if (!content || !content.trim()) {
      throw new Error("Message content cannot be empty");
    }
    const [result] = await pool.query("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)", [
      senderId,
      receiverId,
      content,
    ]);
    return (result as any).insertId;
  },

  async getConversation(userId: number, partnerId: number, limit = 50, offset = 0) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT m.*, 
             s.name as sender_name, 
             r.name as receiver_name
      FROM messages m
      JOIN wholesalers s ON m.sender_id = s.id
      JOIN wholesalers r ON m.receiver_id = r.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) 
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [userId, partnerId, partnerId, userId, limit, offset],
    );
    return rows.reverse() as Message[];
  },

  async getInbox(userId: number) {
    // Get latest message for each conversation
    // This is a bit complex in SQL, typical greatest-n-per-group problem
    // Simplified: Get list of distinct partners, then fetch latest message for each
    const [partners] = await pool.query<RowDataPacket[]>(
      `
      SELECT DISTINCT 
        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as partner_id
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
      `,
      [userId, userId, userId],
    );

    const inbox = [];
    for (const p of partners) {
      const partnerId = p.partner_id;
      const [rows] = await pool.query<RowDataPacket[]>(
        `
        SELECT m.*, w.name as partner_name
        FROM messages m
        JOIN wholesalers w ON w.id = ?
        WHERE (m.sender_id = ? AND m.receiver_id = ?) 
           OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at DESC
        LIMIT 1
        `,
        [partnerId, userId, partnerId, partnerId, userId],
      );
      if (rows.length > 0) {
        inbox.push(rows[0]);
      }
    }

    // Sort by latest message
    return inbox.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async markAsRead(userId: number, senderId: number) {
    await pool.query("UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ? AND is_read = 0", [
      userId,
      senderId,
    ]);
  },

  async getUnreadCount(userId: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0",
      [userId],
    );
    return rows[0].count;
  },
};
