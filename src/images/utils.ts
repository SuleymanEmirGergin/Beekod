/**
 * Image Routes - Utility Functions
 * Extracted from imageRoutes.ts for reusability
 */

import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { createRequire } from "module";
import { config } from "../config.js";

const require = createRequire(import.meta.url);
const archiver = require("archiver");

// Constants
export const MAX_BATCH_FILES = 20;
export const MAX_PATH_FILES = 100;
export const EXPORT_DIR = "exports";

/**
 * Normalize relative path for storage
 */
export function normalizeRelativePath(relativePath: string): string {
  return relativePath.replace(/\\/g, "/");
}

/**
 * Convert relative path to public URL
 */
export function toPublicUrl(relativePath: string): string {
  const normalized = normalizeRelativePath(relativePath);
  const publicBase = config.images.publicBase || "/images";
  return `${publicBase}/${normalized}`;
}

/**
 * Resolve storage path for relative path
 */
export function resolveStoragePath(relativePath: string): string {
  return path.join(config.images.storagePath, relativePath);
}

/**
 * Parse boolean value from request
 */
export function parseBooleanValue(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }
    if (normalized === "false" || normalized === "0" || normalized === "no") {
      return false;
    }
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return undefined;
}

/**
 * Parse zip include option
 */
export function parseZipInclude(value: unknown): "original" | "processed" | "both" {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "original" || normalized === "processed") {
      return normalized;
    }
  }
  return "both";
}

/**
 * Create a zip archive from file entries
 */
export async function createZipArchive(
  entries: { absolutePath: string; name: string }[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    for (const entry of entries) {
      if (fs.existsSync(entry.absolutePath)) {
        archive.file(entry.absolutePath, { name: entry.name });
      }
    }

    archive.finalize();
  });
}

/**
 * Collect image files from a directory
 */
export async function collectImageFiles(
  rootPath: string,
  recursive: boolean
): Promise<string[]> {
  const results: string[] = [];
  const entries = await fsPromises.readdir(rootPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(rootPath, entry.name);
    if (entry.isDirectory() && recursive) {
      const subFiles = await collectImageFiles(fullPath, recursive);
      results.push(...subFiles);
    } else if (entry.isFile() && isAllowedImagePath(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Check if file path is an allowed image type
 */
export function isAllowedImagePath(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff"].includes(ext);
}

// Types
export interface BatchItem {
  source: string;
  ok: boolean;
  imageId?: number;
  originalUrl?: string;
  processedUrl?: string;
  duplicate?: boolean;
  error?: string;
}
