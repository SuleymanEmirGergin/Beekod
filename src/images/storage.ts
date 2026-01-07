import path from "path";
import fs from "fs/promises";
import { config } from "../config.js";

export const ORIGINAL_DIR = "originals";
export const PROCESSED_DIR = "processed";

export function normalizeRelativePath(relativePath: string): string {
  return relativePath.replace(/\\/g, "/");
}

export function resolveStoragePath(relativePath: string): string {
  return path.resolve(config.images.storagePath, relativePath);
}

export function toPublicUrl(relativePath: string): string {
  const base = config.images.publicBase.replace(/\/+$/, "");
  const normalized = normalizeRelativePath(relativePath).replace(/^\/+/, "");
  return `${base}/${normalized}`;
}

export async function ensureStorage() {
  await fs.mkdir(resolveStoragePath(ORIGINAL_DIR), { recursive: true });
  await fs.mkdir(resolveStoragePath(PROCESSED_DIR), { recursive: true });
}

export function safeExtFromName(name: string): string {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".webp") {
    return ext === ".jpeg" ? ".jpg" : ext;
  }
  return ".jpg";
}
