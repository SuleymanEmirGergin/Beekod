import { Router } from "express";
import { messageService } from "../services/messageService.js";
import { pool } from "../db.js";

const router = Router();

// Middleware to simulate authentication (Since we are single tenant ID=1 mainly, but need to support testing)
// For now, we assume headers 'x-user-id' or default to 1
const getUserId = (req: any) => {
  const header = req.headers["x-user-id"];
  return header ? parseInt(header as string) : 1;
};

router.post("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { to, content } = req.body;
    if (!to || !content) {
      return res.status(400).json({ error: "Missing 'to' or 'content'" });
    }
    const id = await messageService.sendMessage(userId, parseInt(to), content);
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/inbox", async (req, res) => {
  try {
    const userId = getUserId(req);
    const inbox = await messageService.getInbox(userId);
    res.json(inbox);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/conversation/:partnerId", async (req, res) => {
  try {
    const userId = getUserId(req);
    const partnerId = parseInt(req.params.partnerId);
    if (!partnerId) {
      return res.status(400).json({ error: "Invalid partner ID" });
    }
    const messages = await messageService.getConversation(userId, partnerId);

    // Mark as read when fetching conversation? Maybe optional
    await messageService.markAsRead(userId, partnerId);

    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/unread", async (req, res) => {
  try {
    const userId = getUserId(req);
    const count = await messageService.getUnreadCount(userId);
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper to list all wholesalers for starting a chat
router.get("/contacts", async (req, res) => {
  try {
    // Return all visible wholesalers except self
    const userId = getUserId(req);
    const [rows] = await pool.query("SELECT id, name, phone, email FROM wholesalers WHERE id != ? AND is_visible = 1", [
      userId,
    ]);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as messageRouter };
