// src/services/teamService.ts
import { pool } from "../db.js";
import type { ITeamMember, ITeamMemberDbRow } from "../models/TeamMember.js";
import { mapTeamMember } from "../models/TeamMember.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";

const TABLE = "team_members" as const;

const ROLES = ["Owner", "Admin", "Member", "Viewer"] as const;
type Role = (typeof ROLES)[number];

const STATUSES = ["Active", "Pending"] as const;
type Status = (typeof STATUSES)[number];

// Intersection type for DB results
interface ITeamMemberRow extends ITeamMemberDbRow, RowDataPacket {}

// Interface for INFORMATION_SCHEMA result
interface ColumnRow extends RowDataPacket {
  COLUMN_NAME: string;
}

function normalizeEmail(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toLowerCase();
}

function normalizeText(v: unknown): string | undefined {
  const s = String(v ?? "").trim();
  return s.length ? s : undefined;
}

function assertRole(v: unknown): Role {
  const s = String(v ?? "").trim();
  if ((ROLES as readonly string[]).includes(s)) return s as Role;
  return "Member";
}

function assertStatus(v: unknown): Status {
  const s = String(v ?? "").trim();
  if ((STATUSES as readonly string[]).includes(s)) return s as Status;
  return "Pending";
}

// ----- Column cache (Unknown column hatalarını kökten keser) -----
let columnCache: Set<string> | null = null;

async function getColumns(): Promise<Set<string>> {
  if (columnCache) return columnCache;

  const [rows] = await pool.query<ColumnRow[]>(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
    `,
    [TABLE],
  );

  const set = new Set<string>();
  for (const r of rows) set.add(String(r.COLUMN_NAME));
  columnCache = set;
  return set;
}

async function hasCol(col: string): Promise<boolean> {
  const cols = await getColumns();
  return cols.has(col);
}

async function pickUpdatableFields(patch: Record<string, unknown>) {
  const cols = await getColumns();

  // Buraya “güncellenebilir” alan whitelist’i koyuyoruz.
  // Böylece biri body ile "role='Owner'" çakmaya çalışırsa yemiyor.
  const allow = ["name", "email", "phone", "location", "position", "bio", "company"];

  const fields: string[] = [];
  const values: (string | number)[] = [];

  for (const key of allow) {
    if (!cols.has(key)) continue;
    const val = patch[key];

    if (key === "email") {
      const email = normalizeEmail(val);
      if (email) {
        fields.push(`${key} = ?`);
        values.push(email);
      }
      continue;
    }

    const text = normalizeText(val);
    if (typeof text === "string") {
      fields.push(`${key} = ?`);
      values.push(text);
    }
  }

  // updated_at varsa otomatik bas
  if (cols.has("updated_at")) {
    fields.push(`updated_at = NOW()`);
  }

  return { fields, values };
}

// -------------------- Core Reads --------------------

export async function getAllTeamMembers(): Promise<ITeamMember[]> {
  const [rows] = await pool.query<ITeamMemberRow[]>(`SELECT * FROM ${TABLE} ORDER BY id ASC`);
  return rows.map(mapTeamMember);
}

export async function getTeamMemberById(id: number): Promise<ITeamMember | null> {
  const [rows] = await pool.query<ITeamMemberRow[]>(`SELECT * FROM ${TABLE} WHERE id = ? LIMIT 1`, [id]);
  if (!rows.length) return null;
  return mapTeamMember(rows[0]);
}

export async function getCurrentUser(): Promise<ITeamMember | null> {
  const [rows] = await pool.query<ITeamMemberRow[]>(
    `
    SELECT *
    FROM ${TABLE}
    ORDER BY
      CASE role
        WHEN 'Owner' THEN 1
        WHEN 'Admin' THEN 2
        ELSE 3
      END,
      id ASC
    LIMIT 1
    `,
  );

  if (!rows.length) return null;
  return mapTeamMember(rows[0]);
}

// -------------------- Profile Update --------------------

export async function updateTeamMemberById(
  id: number,
  patch: Partial<Pick<ITeamMember, "name" | "email" | "phone" | "location" | "position" | "bio" | "company">>,
): Promise<ITeamMember | null> {
  const { fields, values } = await pickUpdatableFields(patch as Record<string, unknown>);

  if (fields.length) {
    values.push(id);
    await pool.query(
      `
      UPDATE ${TABLE}
      SET ${fields.join(", ")}
      WHERE id = ?
      `,
      values,
    );
  }

  return getTeamMemberById(id);
}

// -------------------- Team Operations (Routes usually expect these) --------------------

export async function inviteMember(input: { name?: string; email: string; role?: Role }): Promise<ITeamMember> {
  const email = normalizeEmail(input.email);
  if (!email) throw new Error("email is required");

  const name = normalizeText(input.name) ?? email.split("@")[0] ?? "New Member";

  const role = assertRole(input.role);
  const status: Status = "Pending";

  // Önce var mı bak
  const [existing] = await pool.query<ITeamMemberRow[]>(`SELECT * FROM ${TABLE} WHERE email = ? LIMIT 1`, [email]);
  if (existing.length) return mapTeamMember(existing[0]);

  // Kolonlara göre INSERT’i dinamik kur (schema değişikliği yüzünden patlamasın)
  const cols = await getColumns();
  const insertCols: string[] = ["name", "email", "role"];
  const insertVals: (string | number | Date)[] = [name, email, role];
  const placeholders: string[] = ["?", "?", "?"];

  if (cols.has("status")) {
    insertCols.push("status");
    insertVals.push(status);
    placeholders.push("?");
  }

  if (cols.has("joined_at")) {
    insertCols.push("joined_at");
    placeholders.push("NOW()");
  }

  if (cols.has("created_at")) {
    insertCols.push("created_at");
    placeholders.push("NOW()");
  }

  if (cols.has("updated_at")) {
    insertCols.push("updated_at");
    placeholders.push("NOW()");
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `
      INSERT INTO ${TABLE} (${insertCols.join(", ")})
      VALUES (${placeholders.join(", ")})
      `,
      insertVals,
    );

    const insertId = result.insertId;
    const created = await getTeamMemberById(insertId);
    if (!created) throw new Error("Invite created but could not be fetched");
    return created;
  } catch (e: unknown) {
    // Unique index varsa duplicate key yakalayalım: tekrar SELECT dön
    const msg = String((e as any)?.message ?? "");
    if (msg.includes("Duplicate") || msg.includes("ER_DUP_ENTRY")) {
      const [rows] = await pool.query<ITeamMemberRow[]>(`SELECT * FROM ${TABLE} WHERE email = ? LIMIT 1`, [email]);
      if (rows.length) return mapTeamMember(rows[0]);
    }
    throw e;
  }
}

export async function removeMember(id: number): Promise<{ ok: true }> {
  await pool.query(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
  return { ok: true };
}

export async function updateMemberRole(id: number, roleInput: unknown): Promise<ITeamMember | null> {
  const role = assertRole(roleInput);
  await pool.query(
    `UPDATE ${TABLE} SET role = ?${(await hasCol("updated_at")) ? ", updated_at = NOW()" : ""} WHERE id = ?`,
    [role, id],
  );
  return getTeamMemberById(id);
}

export async function updateMemberStatus(id: number, statusInput: unknown): Promise<ITeamMember | null> {
  const status = assertStatus(statusInput);

  // status kolonu yoksa noop (patlamasın)
  if (!(await hasCol("status"))) return getTeamMemberById(id);

  await pool.query(
    `UPDATE ${TABLE} SET status = ?${(await hasCol("updated_at")) ? ", updated_at = NOW()" : ""} WHERE id = ?`,
    [status, id],
  );
  return getTeamMemberById(id);
}

// -------------------- Aliases (route'lar eski isim bekliyorsa) --------------------
export const listTeamMembers = getAllTeamMembers;
export const updateTeamMember = updateTeamMemberById;

// çok yaygın route isimleri:
export const deleteMember = removeMember;
export const addMember = inviteMember;
export const createInvite = inviteMember;
