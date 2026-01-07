import { query } from "../db.js";
import { ResultSetHeader } from "mysql2";
import { randomUUID } from "crypto";

export type PendingTask = {
  intent: string;
  params: Record<string, any>;
  expiresAt: number;
};

const PENDING_TTL_MS = 2 * 60 * 1000;
const CONTEXT_TTL_MS = 10 * 60 * 1000; // 10 minutes context memory
const pendingBySession = new Map<string, PendingTask>();
const contextBySession = new Map<string, Record<string, any>>();

export function getSessionKey(req: any): string {
  const fromBody = typeof req.body?.sessionId === "string" ? req.body.sessionId : "";
  const fromHeader = typeof req.headers?.["x-session-id"] === "string" ? req.headers["x-session-id"] : "";
  const key = (fromBody || fromHeader || req.ip || "anon").toString();
  return key;
}

// Ensure session exists in DB
export async function ensureSession(sessionKey: string, userId?: string) {
  // Check if exists
  const existing = await query<any[]>("SELECT id FROM chat_sessions WHERE id = ?", [sessionKey]);
  if (existing.length === 0) {
    await query("INSERT INTO chat_sessions (id, user_id, is_active) VALUES (?, ?, true)", [sessionKey, userId || null]);
  } else if (userId) {
    // Update userId if provided and different
    await query("UPDATE chat_sessions SET user_id = ? WHERE id = ? AND user_id IS NULL", [userId, sessionKey]);
  }
}

export async function saveMessage(sessionKey: string, role: string, content: string, metadata?: any) {
  await ensureSession(sessionKey);
  const metaJson = metadata ? JSON.stringify(metadata) : null;
  await query("INSERT INTO chat_messages (session_id, role, content, metadata) VALUES (?, ?, ?, ?)", [
    sessionKey,
    role,
    content,
    metaJson,
  ]);
}

export async function getHistory(sessionKey: string, limit = 50): Promise<any[]> {
  const rows = await query<any[]>(
    "SELECT role, content, metadata, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT ?",
    [sessionKey, limit],
  );
  return rows.map((r) => ({
    role: r.role,
    message: r.content,
    data: typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata,
    timestamp: r.created_at,
  }));
}

export function getPending(sessionKey: string): PendingTask | null {
  const p = pendingBySession.get(sessionKey);
  if (!p) return null;
  if (Date.now() > p.expiresAt) {
    pendingBySession.delete(sessionKey);
    return null;
  }
  return p;
}

export function setPending(sessionKey: string, intent: string, params: Record<string, any>) {
  const now = Date.now();
  // Cleanup expired entries periodically or on set
  for (const [k, v] of pendingBySession.entries()) {
    if (now > v.expiresAt) pendingBySession.delete(k);
  }

  pendingBySession.set(sessionKey, {
    intent,
    params,
    expiresAt: now + PENDING_TTL_MS,
  });
}

export async function getActiveBarcode(sessionKey: string): Promise<string | null> {
  const rows = await query<any[]>(
    "SELECT metadata FROM chat_messages WHERE session_id = ? AND metadata IS NOT NULL ORDER BY created_at DESC",
    [sessionKey],
  );

  for (const row of rows) {
    const meta = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
    if (meta?.barcode) return meta.barcode;
  }
  return null;
}

export function clearPending(sessionKey: string) {
  pendingBySession.delete(sessionKey);
}

// Generic Context Management
export function setContext(sessionKey: string, key: string, value: any) {
  let context = contextBySession.get(sessionKey);
  if (!context) {
    context = {};
    contextBySession.set(sessionKey, context);
  }
  context[key] = value;

  // Set simple cleanup timeout if fresh
  setTimeout(() => {
    const current = contextBySession.get(sessionKey);
    if (current && current[key]) {
      delete current[key];
      if (Object.keys(current).length === 0) contextBySession.delete(sessionKey);
    }
  }, CONTEXT_TTL_MS);
}

export function getContext(sessionKey: string, key: string): any {
  const context = contextBySession.get(sessionKey);
  return context ? context[key] : undefined;
}
