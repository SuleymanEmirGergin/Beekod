import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { query } from "../db.js";
import { ImageProfile } from "./imageProfiles.js";
import * as Storage from "./storage.js";
import * as Processor from "./processor.js";

type ImageRow = {
  id: number;
  barcode: string | null;
  original_path: string;
  processed_path: string;
  profile: string;
  marketplace: string | null;
  original_hash: string | null;
  meta_json: string | null;
  created_at: string;
};

export type ImageMeta = {
  profile: string;
  original: {
    width?: number;
    height?: number;
    format?: string;
    size?: number;
  };
  processed: {
    width?: number;
    height?: number;
    format?: string;
    size?: number;
  };
};

export type ImageRecord = {
  id: number;
  barcode: string | null;
  profile: string;
  marketplace: string | null;
  originalUrl: string;
  processedUrl: string;
  meta: ImageMeta | null;
  createdAt: string;
};

function computeHash(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function parseMeta(value: string | null): ImageMeta | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as ImageMeta;
  } catch {
    return null;
  }
}

function mapRowToResult(row: ImageRow) {
  return {
    imageId: row.id,
    barcode: row.barcode,
    profile: row.profile,
    originalPath: row.original_path,
    processedPath: row.processed_path,
    originalUrl: Storage.toPublicUrl(row.original_path),
    processedUrl: Storage.toPublicUrl(row.processed_path),
  };
}

async function findDuplicateImage(input: { barcode: string | null; profile: string; originalHash: string }) {
  const rows = await query<ImageRow[]>(
    `SELECT id, barcode, original_path, processed_path, profile, marketplace, original_hash, meta_json, created_at
     FROM product_images
     WHERE original_hash = ? AND profile = ? AND barcode <=> ?
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [input.originalHash, input.profile, input.barcode],
  );
  return rows[0] ?? null;
}

async function insertImageRecord(input: {
  barcode: string | null;
  originalPath: string;
  processedPath: string;
  profile: string;
  marketplace: string | null;
  originalHash: string;
  meta: ImageMeta;
}) {
  const result = await query<{ insertId: number }>(
    `INSERT INTO product_images (barcode, original_path, processed_path, profile, marketplace, original_hash, meta_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.barcode,
      input.originalPath,
      input.processedPath,
      input.profile,
      input.marketplace,
      input.originalHash,
      JSON.stringify(input.meta),
    ],
  );
  return (result as unknown as { insertId: number }).insertId ?? 0;
}

export async function readLatestProcessedBuffer(input: { barcode: string; profile?: string | null }) {
  const params: Array<string> = [input.barcode];
  let sql = "SELECT id, processed_path, profile FROM product_images WHERE barcode = ?";
  if (input.profile) {
    sql += " AND profile = ?";
    params.push(input.profile);
  }
  sql += " ORDER BY created_at DESC, id DESC LIMIT 1";
  const rows = await query<{ id: number; processed_path: string; profile: string }[]>(sql, params);
  if (!rows.length) return null;

  const processedRelative = rows[0].processed_path;
  const processedAbsolute = Storage.resolveStoragePath(processedRelative);
  const buffer = await fs.readFile(processedAbsolute);
  return { buffer, processedPath: processedRelative, profile: rows[0].profile, imageId: rows[0].id };
}

export async function readLatestOriginalBuffer(barcode: string) {
  const rows = await query<{ id: number; original_path: string }[]>(
    "SELECT id, original_path FROM product_images WHERE barcode = ? ORDER BY created_at DESC, id DESC LIMIT 1",
    [barcode],
  );
  if (!rows.length) return null;

  const originalRelative = rows[0].original_path;
  const originalAbsolute = Storage.resolveStoragePath(originalRelative);
  const buffer = await fs.readFile(originalAbsolute);
  return { buffer, originalPath: originalRelative, imageId: rows[0].id };
}

export async function processUploadedImage(input: {
  buffer: Buffer;
  originalName: string;
  barcode: string | null;
  marketplace: string | null;
  profile: ImageProfile;
}) {
  try {
    const originalHash = computeHash(input.buffer);
    const duplicate = await findDuplicateImage({
      barcode: input.barcode,
      profile: input.profile.name,
      originalHash,
    });
    if (duplicate) {
      return { ...mapRowToResult(duplicate), duplicate: true };
    }

    await Storage.ensureStorage();
    const unique = `${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
    const originalRelative = path.posix.join(
      Storage.ORIGINAL_DIR,
      `${unique}${Storage.safeExtFromName(input.originalName)}`,
    );
    const originalAbsolute = Storage.resolveStoragePath(originalRelative);

    await fs.writeFile(originalAbsolute, input.buffer);

    const originalMeta = await sharp(input.buffer).metadata();
    const { outputBuffer, outputMeta, outputExt } = await Processor.buildProcessedBuffer(input.buffer, input.profile);

    const processedRelative = path.posix.join(Storage.PROCESSED_DIR, `${unique}_${input.profile.name}${outputExt}`);
    const processedAbsolute = Storage.resolveStoragePath(processedRelative);
    await fs.writeFile(processedAbsolute, outputBuffer);

    const meta: ImageMeta = {
      profile: input.profile.name,
      original: {
        width: originalMeta.width,
        height: originalMeta.height,
        format: originalMeta.format,
        size: input.buffer.length,
      },
      processed: {
        width: outputMeta.width,
        height: outputMeta.height,
        format: outputMeta.format,
        size: outputBuffer.length,
      },
    };

    const imageId = await insertImageRecord({
      barcode: input.barcode,
      originalPath: originalRelative,
      processedPath: processedRelative,
      profile: input.profile.name,
      marketplace: input.marketplace,
      originalHash,
      meta,
    });

    return {
      imageId,
      barcode: input.barcode,
      profile: input.profile.name,
      originalPath: originalRelative,
      processedPath: processedRelative,
      originalUrl: Storage.toPublicUrl(originalRelative),
      processedUrl: Storage.toPublicUrl(processedRelative),
      duplicate: false,
    };
  } catch (error) {
    import("../logger.js").then(({ logger }) => {
      logger.error("image_service.process_uploaded_failed", { barcode: input.barcode, err: error });
    });
    throw error;
  }
}

export async function listImagesByBarcode(barcode: string): Promise<ImageRecord[]> {
  const rows = await query<ImageRow[]>(
    `SELECT id, barcode, original_path, processed_path, profile, marketplace, meta_json, created_at
     FROM product_images WHERE barcode = ? ORDER BY created_at DESC, id DESC`,
    [barcode],
  );
  return rows.map((row) => ({
    id: row.id,
    barcode: row.barcode,
    profile: row.profile,
    marketplace: row.marketplace,
    originalUrl: Storage.toPublicUrl(row.original_path),
    processedUrl: Storage.toPublicUrl(row.processed_path),
    meta: parseMeta(row.meta_json),
    createdAt: row.created_at,
  }));
}

export async function reprocessLatestOriginal(input: {
  barcode: string;
  marketplace: string | null;
  profile: ImageProfile;
}) {
  try {
    await Storage.ensureStorage();
    const rows = await query<{ original_path: string }[]>(
      "SELECT original_path FROM product_images WHERE barcode = ? ORDER BY created_at DESC, id DESC LIMIT 1",
      [input.barcode],
    );
    if (!rows.length) return null;

    const originalRelative = rows[0].original_path;
    const originalAbsolute = Storage.resolveStoragePath(originalRelative);
    const buffer = await fs.readFile(originalAbsolute);
    const originalHash = computeHash(buffer);

    const duplicate = await findDuplicateImage({
      barcode: input.barcode,
      profile: input.profile.name,
      originalHash,
    });
    if (duplicate) {
      return { ...mapRowToResult(duplicate), duplicate: true };
    }

    const originalMeta = await sharp(buffer).metadata();
    const { outputBuffer, outputMeta, outputExt } = await Processor.buildProcessedBuffer(buffer, input.profile);

    const unique = `${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
    const processedRelative = path.posix.join(Storage.PROCESSED_DIR, `${unique}_${input.profile.name}${outputExt}`);
    const processedAbsolute = Storage.resolveStoragePath(processedRelative);
    await fs.writeFile(processedAbsolute, outputBuffer);

    const meta: ImageMeta = {
      profile: input.profile.name,
      original: {
        width: originalMeta.width,
        height: originalMeta.height,
        format: originalMeta.format,
        size: buffer.length,
      },
      processed: {
        width: outputMeta.width,
        height: outputMeta.height,
        format: outputMeta.format,
        size: outputBuffer.length,
      },
    };

    const imageId = await insertImageRecord({
      barcode: input.barcode,
      originalPath: originalRelative,
      processedPath: processedRelative,
      profile: input.profile.name,
      marketplace: input.marketplace,
      originalHash,
      meta,
    });

    return {
      imageId,
      barcode: input.barcode,
      profile: input.profile.name,
      originalPath: originalRelative,
      processedPath: processedRelative,
      originalUrl: Storage.toPublicUrl(originalRelative),
      processedUrl: Storage.toPublicUrl(processedRelative),
      duplicate: false,
    };
  } catch (error) {
    import("../logger.js").then(({ logger }) => {
      logger.error("image_service.reprocess_original_failed", { barcode: input.barcode, err: error });
    });
    throw error;
  }
}

export async function scanBarcodeFromBuffer(buffer: Buffer) {
  try {
    const module = await import("@zxing/library");
    const { BarcodeFormat, BinaryBitmap, DecodeHintType, HybridBinarizer, MultiFormatReader, RGBLuminanceSource } =
      module;

    const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const luminanceSource = new RGBLuminanceSource(new Uint8ClampedArray(data), info.width, info.height);
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
    ]);

    const reader = new MultiFormatReader();
    reader.setHints(hints);
    const result = reader.decode(binaryBitmap);
    return {
      text: result.getText(),
      format: BarcodeFormat[result.getBarcodeFormat()],
    };
  } catch (error) {
    import("../logger.js").then(({ logger }) => {
      logger.warn("image_service.scan_barcode_failed", { err: error });
    });
    return null;
  }
}
