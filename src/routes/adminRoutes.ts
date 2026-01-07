import path from "path";
import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { ADMIN_COOKIE, resolveAdminKey } from "../middleware/adminKey.js";
import { validateQuery } from "../validation.js";
import { pool } from "../db.js";

const router = Router();

const adminQuerySchema = z
  .object({
    key: z.preprocess((value) => {
      if (typeof value !== "string") {
        return undefined;
      }
      const trimmed = value.trim();
      return trimmed ? trimmed : undefined;
    }, z.string().optional()),
  })
  .passthrough();

router.use(validateQuery(adminQuerySchema));

function ensureAdminPageAccess(req: Request, res: Response) {
  const expected = config.admin.apiKey;
  if (!expected) {
    return true;
  }
  const queryKey = typeof req.query.key === "string" ? req.query.key.trim() : "";
  if (queryKey) {
    if (queryKey === expected) {
      const ttlHours = Number(process.env.ADMIN_SESSION_TTL_HOURS ?? 24);
      const maxAge = Number.isFinite(ttlHours) && ttlHours > 0 ? ttlHours * 60 * 60 * 1000 : undefined;
      res.cookie(ADMIN_COOKIE, queryKey, { httpOnly: true, sameSite: "lax", maxAge });
      return true;
    }
    res.status(401).send("admin_key_invalid");
    return false;
  }
  const provided = resolveAdminKey(req as any);
  if (provided && provided === expected) {
    return true;
  }
  res.status(401).send("admin_key_required");
  return false;
}

router.get("/admin/content-config", (req, res) => {
  if (!ensureAdminPageAccess(req, res)) {
    return;
  }
  res.sendFile(path.resolve("public", "content-config.html"));
});

router.get("/admin/api", (req, res) => {
  if (!ensureAdminPageAccess(req, res)) {
    return;
  }
  res.sendFile(path.resolve("public", "api-ui.html"));
});

router.get("/admin/image-qa", (req, res) => {
  if (!ensureAdminPageAccess(req, res)) {
    return;
  }
  res.sendFile(path.resolve("public", "image-qa.html"));
});

router.get("/admin", (req, res) => {
  if (!ensureAdminPageAccess(req, res)) {
    return;
  }
  res.sendFile(path.resolve("public", "admin.html"));
});

router.get("/chat-ui", (_req, res) => {
  res.sendFile(path.resolve("public", "chat-ui.html"));
});

router.post("/admin/logout", (_req, res) => {
  res.clearCookie(ADMIN_COOKIE, { sameSite: "lax" });
  res.json({ status: "ok" });
});

router.post("/admin/privacy/toggle", async (req, res) => {
  const { visible } = req.body;
  // Assume ID 1 is the main tenant
  try {
    await pool.query("UPDATE wholesalers SET is_visible = ? WHERE id = 1", [visible ? 1 : 0]);
    res.json({ success: true, visible });
  } catch (err) {
    res.status(500).json({ error: "Failed to update privacy" });
  }
});

router.get("/admin/privacy/status", async (_req, res) => {
  try {
    const [rows] = await pool.query<any[]>("SELECT is_visible FROM wholesalers WHERE id = 1");
    res.json({ visible: !!rows[0]?.is_visible });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch privacy status" });
  }
});

export { router as adminRouter };
