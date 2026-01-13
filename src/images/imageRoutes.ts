import crypto from "crypto";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { createRequire } from "module";
import express from "express";
import multer from "multer";
import { z } from "zod";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { requireAdminKey } from "../middleware/adminKey.js";
import { validateBody, validateParams, validateQuery } from "../validation.js";
import { getImageProfile, resolveImageProfile } from "./imageProfiles.js";
import { getMarketplaceProfileSets, resolveMarketplaceProfileSet } from "./marketplaceProfileSets.js";
import {
  listImagesByBarcode,
  processUploadedImage,
  reprocessLatestOriginal,
  scanBarcodeFromBuffer,
} from "./imageService.js";
import { inspectImageBuffer } from "./imageInspect.js";
import {
  insertImageInspectReport,
  listImageInspectReports,
  getImageInspectSummary,
  getImageInspectTrends,
} from "./imageInspectStore.js";
import { googleVisionOcrFromBuffer } from "../services/ai/googleVisionService.js";
import { buildSearchQueryFromOcr } from "./imageSearch.js";
import { getProductByBarcode } from "../services/product/productService.js";
import { CseConfigError, CseRequestError } from "../services/search/searchService.js";
import { runImageSearch } from "../services/search/imageSearchService.js";

const require = createRequire(import.meta.url);
const archiver = require("archiver");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.images.maxUploadBytes },
});

export const imageRouter = express.Router();
export const productImageRouter = express.Router();

if (config.images.requireAdmin) {
  imageRouter.use(requireAdminKey);
  productImageRouter.use(requireAdminKey);
}

const numberLike = z.preprocess((value) => {
  if (value == null) {
    return undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    return Number(trimmed);
  }
  return value;
}, z.number().finite());

const booleanLike = z.preprocess((value) => {
  if (value == null) {
    return undefined;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return undefined;
    }
    if (["true", "1", "yes", "y", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "n", "off"].includes(normalized)) {
      return false;
    }
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return value;
}, z.boolean());

const imageProcessBodySchema = z
  .object({
    barcode: z.string().trim().optional(),
    marketplace: z.string().trim().optional(),
    profile: z.string().trim().optional(),
  })
  .passthrough();

const imageReprocessBodySchema = z
  .object({
    barcode: z.string().trim().optional(),
    marketplace: z.string().trim().optional(),
    profile: z.string().trim().optional(),
  })
  .passthrough();

const imageInspectBodySchema = z
  .object({
    profile: z.string().trim().optional(),
    marketplace: z.string().trim().optional(),
  })
  .passthrough();

const batchProcessBodySchema = z
  .object({
    barcode: z.string().trim().optional(),
    marketplace: z.string().trim().optional(),
    profile: z.string().trim().optional(),
    zip: booleanLike.optional(),
    zipInclude: z.string().trim().optional(),
  })
  .passthrough();

const batchProcessPathSchema = z
  .object({
    path: z.string().trim().optional(),
    paths: z.array(z.string().trim()).optional(),
    recursive: booleanLike.optional(),
    limit: numberLike.optional(),
    barcode: z.string().trim().optional(),
    marketplace: z.string().trim().optional(),
    profile: z.string().trim().optional(),
    zip: booleanLike.optional(),
    zipInclude: z.string().trim().optional(),
  })
  .passthrough();

const imageSearchBodySchema = z
  .object({
    query: z.string().trim().optional(),
    num: numberLike.optional(),
    site: z.string().trim().optional(),
    languageHints: z.string().trim().optional(),
  })
  .passthrough();

const imageSearchQuerySchema = z
  .object({
    num: numberLike.optional(),
    site: z.string().trim().optional(),
  })
  .passthrough();

const profileSetQuerySchema = z
  .object({
    marketplace: z.string().trim().optional(),
  })
  .passthrough();

const inspectListQuerySchema = z
  .object({
    barcode: z.string().trim().optional(),
    profile: z.string().trim().optional(),
    marketplace: z.string().trim().optional(),
    source: z.string().trim().optional(),
    limit: numberLike.optional(),
    includeReport: booleanLike.optional(),
  })
  .passthrough();

const inspectSummaryQuerySchema = z
  .object({
    barcode: z.string().trim().optional(),
    profile: z.string().trim().optional(),
    marketplace: z.string().trim().optional(),
    source: z.string().trim().optional(),
    days: numberLike.optional(),
    fill: booleanLike.optional(),
  })
  .passthrough();

const imageOcrBodySchema = z
  .object({
    languageHints: z.string().trim().optional(),
  })
  .passthrough();

const barcodeParamsSchema = z.object({
  barcode: z
    .string()
    .trim()
    .min(1)
    .transform((value) => value.toLowerCase()),
});

const MAX_BATCH_FILES = 20;
const MAX_PATH_FILES = 100;
const EXPORT_DIR = "exports";

type BatchItem = {
  source: string;
  ok: boolean;
  imageId?: number;
  originalUrl?: string;
  processedUrl?: string;
  duplicate?: boolean;
  error?: string;
};

function normalizeRelativePath(relativePath: string) {
  return relativePath.replace(/\\/g, "/");
}

function toPublicUrl(relativePath: string) {
  const base = config.images.publicBase.replace(/\/+$/, "");
  const normalized = normalizeRelativePath(relativePath).replace(/^\/+/, "");
  return `${base}/${normalized}`;
}

function resolveStoragePath(relativePath: string) {
  return path.resolve(config.images.storagePath, relativePath);
}

function parseBooleanValue(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "n", "off"].includes(normalized)) {
      return false;
    }
  }
  return undefined;
}

function parseZipInclude(value: unknown) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "original" || normalized === "both") {
    return normalized as "original" | "both";
  }
  return "processed";
}

async function createZipArchive(entries: { absolutePath: string; name: string }[]) {
  const stamp = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const exportRelative = path.posix.join(EXPORT_DIR, `batch_${stamp}.zip`);
  const exportAbsolute = resolveStoragePath(exportRelative);
  await fsPromises.mkdir(path.dirname(exportAbsolute), { recursive: true });
  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(exportAbsolute);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", () => resolve());
    output.on("error", (error) => reject(error));
    archive.on("error", (error: Error) => reject(error));
    archive.pipe(output);
    for (const entry of entries) {
      archive.file(entry.absolutePath, { name: entry.name });
    }
    archive.finalize();
  });
  return {
    zipPath: exportRelative,
    zipUrl: toPublicUrl(exportRelative),
  };
}

async function collectImageFiles(rootPath: string, recursive: boolean) {
  const results: string[] = [];
  const entries = await fsPromises.readdir(rootPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      if (recursive) {
        const nested = await collectImageFiles(entryPath, recursive);
        results.push(...nested);
      }
      continue;
    }
    results.push(entryPath);
  }
  return results;
}

function isAllowedImagePath(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".webp";
}

imageRouter.get("/profile-sets", validateQuery(profileSetQuerySchema), (req, res) => {
  const market = typeof req.query?.marketplace === "string" ? req.query.marketplace.trim() : "";
  if (market) {
    const set = resolveMarketplaceProfileSet(market);
    return res.json({ items: set ? [set] : [] });
  }
  return res.json({ items: getMarketplaceProfileSets() });
});

imageRouter.get("/inspects", validateQuery(inspectListQuerySchema), async (req, res) => {
  const barcode = typeof req.query?.barcode === "string" ? req.query.barcode.trim().toLowerCase() : "";
  const profile = typeof req.query?.profile === "string" ? req.query.profile.trim() : "";
  const marketplace = typeof req.query?.marketplace === "string" ? req.query.marketplace.trim() : "";
  const source = typeof req.query?.source === "string" ? req.query.source.trim() : "";
  const limitRaw = Number(req.query?.limit);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 100) : 20;
  const includeReport = parseBooleanValue(req.query?.includeReport) ?? false;

  const items = await listImageInspectReports({
    barcode: barcode || null,
    profile: profile || null,
    marketplace: marketplace || null,
    source: source || null,
    limit,
    includeReport,
  });

  return res.json({ items });
});

imageRouter.get("/inspects/summary", validateQuery(inspectSummaryQuerySchema), async (req, res) => {
  const barcode = typeof req.query?.barcode === "string" ? req.query.barcode.trim().toLowerCase() : "";
  const profile = typeof req.query?.profile === "string" ? req.query.profile.trim() : "";
  const marketplace = typeof req.query?.marketplace === "string" ? req.query.marketplace.trim() : "";
  const source = typeof req.query?.source === "string" ? req.query.source.trim() : "";
  const daysRaw = Number(req.query?.days);
  const days = Number.isFinite(daysRaw) ? Math.min(Math.max(Math.trunc(daysRaw), 1), 31) : 7;

  const summary = await getImageInspectSummary({
    barcode: barcode || null,
    profile: profile || null,
    marketplace: marketplace || null,
    source: source || null,
    days,
  });

  return res.json({ summary });
});

imageRouter.get("/inspects/trends", validateQuery(inspectSummaryQuerySchema), async (req, res) => {
  const barcode = typeof req.query?.barcode === "string" ? req.query.barcode.trim().toLowerCase() : "";
  const profile = typeof req.query?.profile === "string" ? req.query.profile.trim() : "";
  const marketplace = typeof req.query?.marketplace === "string" ? req.query.marketplace.trim() : "";
  const source = typeof req.query?.source === "string" ? req.query.source.trim() : "";
  const daysRaw = Number(req.query?.days);
  const days = Number.isFinite(daysRaw) ? Math.min(Math.max(Math.trunc(daysRaw), 1), 31) : 7;
  const fill = parseBooleanValue(req.query?.fill) ?? false;

  const items = await getImageInspectTrends({
    barcode: barcode || null,
    profile: profile || null,
    marketplace: marketplace || null,
    source: source || null,
    days,
    fillDays: fill,
  });

  return res.json({ days, fill, items });
});

imageRouter.post("/process", upload.single("image"), validateBody(imageProcessBodySchema), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "image_required" });
  }
  if (!file.mimetype.startsWith("image/")) {
    return res.status(400).json({ error: "invalid_image_type" });
  }

  const barcodeRaw = typeof req.body?.barcode === "string" ? req.body.barcode.trim() : "";
  const barcode = barcodeRaw ? barcodeRaw.toLowerCase() : null;
  const marketplace =
    typeof req.body?.marketplace === "string" && req.body.marketplace.trim() ? req.body.marketplace.trim() : null;
  const requestedProfile = typeof req.body?.profile === "string" ? req.body.profile.trim() : "";
  const profileName = requestedProfile || config.images.defaultProfile;
  const profile = getImageProfile(profileName);

  if (!profile) {
    return res.status(400).json({ error: "profile_not_found" });
  }

  if (barcode) {
    const product = await getProductByBarcode(barcode);
    if (!product) {
      return res.status(404).json({ error: "product_not_found" });
    }
  }

  try {
    const result = await processUploadedImage({
      buffer: file.buffer,
      originalName: file.originalname,
      barcode,
      marketplace,
      profile,
    });
    const inspectRequested = parseBooleanValue(req.body?.inspect ?? req.query?.inspect) ?? false;
    let inspectReport = null;
    if (inspectRequested) {
      try {
        const processedBuffer = await fsPromises.readFile(resolveStoragePath(result.processedPath));
        inspectReport = await inspectImageBuffer(processedBuffer, {
          profile,
          marketplace,
          maxBytes: config.images.maxUploadBytes,
        });
        await insertImageInspectReport({
          imageId: result.imageId,
          barcode,
          marketplace,
          profile: profile.name,
          source: "processed",
          report: inspectReport,
          requestId: res.locals?.requestId,
        });
      } catch (error) {
        logger.warn("image.inspect_failed", { requestId: res.locals?.requestId, err: error });
      }
    }
    return res.json({
      ok: true,
      barcode,
      profile: profile.name,
      originalUrl: result.originalUrl,
      processedUrl: result.processedUrl,
      imageId: result.imageId,
      duplicate: result.duplicate === true,
      inspect: inspectReport,
    });
  } catch (error) {
    logger.error("image.process_failed", { requestId: res.locals?.requestId, err: error });
    return res.status(500).json({ error: "image_process_failed" });
  }
});

imageRouter.post("/reprocess", validateBody(imageReprocessBodySchema), async (req, res) => {
  const barcodeBody = typeof req.body?.barcode === "string" ? req.body.barcode.trim() : "";
  const barcodeQuery = typeof req.query?.barcode === "string" ? req.query.barcode.trim() : "";
  const barcodeRaw = barcodeBody || barcodeQuery;
  if (!barcodeRaw) {
    return res.status(400).json({ error: "barcode_required" });
  }

  const barcode = barcodeRaw.toLowerCase();
  const marketplaceBody = typeof req.body?.marketplace === "string" ? req.body.marketplace.trim() : "";
  const marketplaceQuery = typeof req.query?.marketplace === "string" ? req.query.marketplace.trim() : "";
  const marketplace = marketplaceBody || marketplaceQuery || null;
  const profileBody = typeof req.body?.profile === "string" ? req.body.profile.trim() : "";
  const profileQuery = typeof req.query?.profile === "string" ? req.query.profile.trim() : "";
  const profileName = profileBody || profileQuery || null;

  const product = await getProductByBarcode(barcode);
  if (!product) {
    return res.status(404).json({ error: "product_not_found" });
  }

  try {
    const profile = getImageProfile(profileName || config.images.defaultProfile);
    if (!profile) {
      return res.status(400).json({ error: "profile_not_found" });
    }

    const result = await reprocessLatestOriginal({
      barcode,
      marketplace,
      profile,
    });
    if (!result) {
      return res.status(404).json({ error: "original_not_found" });
    }
    const inspectRequested = parseBooleanValue(req.body?.inspect ?? req.query?.inspect) ?? false;
    let inspectReport = null;
    if (inspectRequested) {
      try {
        const processedBuffer = await fsPromises.readFile(resolveStoragePath(result.processedPath));
        const inspectProfile = resolveImageProfile(result.profile) ?? null;
        inspectReport = await inspectImageBuffer(processedBuffer, {
          profile: inspectProfile,
          marketplace,
          maxBytes: config.images.maxUploadBytes,
        });
        await insertImageInspectReport({
          imageId: result.imageId,
          barcode,
          marketplace,
          profile: inspectProfile?.name ?? result.profile,
          source: "reprocessed",
          report: inspectReport,
          requestId: res.locals?.requestId,
        });
      } catch (error) {
        logger.warn("image.inspect_failed", { requestId: res.locals?.requestId, err: error });
      }
    }
    return res.json({
      ok: true,
      barcode,
      profile: result.profile,
      originalUrl: result.originalUrl,
      processedUrl: result.processedUrl,
      imageId: result.imageId,
      duplicate: result.duplicate === true,
      inspect: inspectReport,
    });
  } catch (error) {
    logger.error("image.reprocess_failed", { requestId: res.locals?.requestId, err: error });
    return res.status(500).json({ error: "image_reprocess_failed" });
  }
});

imageRouter.post(
  "/batch/process",
  upload.array("images", MAX_BATCH_FILES),
  validateBody(batchProcessBodySchema),
  async (req, res) => {
    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      return res.status(400).json({ error: "image_required" });
    }

    const barcodeRaw = typeof req.body?.barcode === "string" ? req.body.barcode.trim() : "";
    const barcode = barcodeRaw ? barcodeRaw.toLowerCase() : null;
    const marketplace =
      typeof req.body?.marketplace === "string" && req.body.marketplace.trim() ? req.body.marketplace.trim() : null;
    const requestedProfile = typeof req.body?.profile === "string" ? req.body.profile.trim() : "";
    const profileName = requestedProfile || config.images.defaultProfile;
    const profile = getImageProfile(profileName);
    const zipRequested = parseBooleanValue(req.body?.zip) ?? false;
    const zipInclude = parseZipInclude(req.body?.zipInclude);

    if (!profile) {
      return res.status(400).json({ error: "profile_not_found" });
    }

    if (barcode) {
      const product = await getProductByBarcode(barcode);
      if (!product) {
        return res.status(404).json({ error: "product_not_found" });
      }
    }

    const results: BatchItem[] = [];
    const zipEntries: { absolutePath: string; name: string }[] = [];

    for (const file of files) {
      const name = file.originalname;
      if (!file.mimetype.startsWith("image/")) {
        results.push({ source: name, ok: false, error: "invalid_image_type" });
        continue;
      }
      try {
        const result = await processUploadedImage({
          buffer: file.buffer,
          originalName: file.originalname,
          barcode,
          marketplace,
          profile,
        });
        results.push({
          source: name,
          ok: true,
          imageId: result.imageId,
          originalUrl: result.originalUrl,
          processedUrl: result.processedUrl,
          duplicate: result.duplicate === true,
        });
        if (zipRequested) {
          if (zipInclude !== "original") {
            zipEntries.push({
              absolutePath: resolveStoragePath(result.processedPath),
              name: normalizeRelativePath(result.processedPath),
            });
          }
          if (zipInclude !== "processed") {
            zipEntries.push({
              absolutePath: resolveStoragePath(result.originalPath),
              name: normalizeRelativePath(result.originalPath),
            });
          }
        }
      } catch (error) {
        logger.error("image.batch.process_failed", { requestId: res.locals?.requestId, source: name, err: error });
        results.push({ source: name, ok: false, error: "image_process_failed" });
      }
    }

    const processed = results.filter((item) => item.ok).length;
    const failed = results.length - processed;

    let zipUrl: string | undefined;
    if (zipRequested && zipEntries.length > 0) {
      try {
        const zip = await createZipArchive(zipEntries);
        zipUrl = zip.zipUrl;
      } catch (error) {
        logger.error("image.batch.zip_failed", { requestId: res.locals?.requestId, err: error });
        return res.status(500).json({ error: "zip_failed" });
      }
    }

    return res.json({
      ok: true,
      barcode,
      marketplace,
      profile: profile.name,
      count: results.length,
      processed,
      failed,
      zipUrl,
      items: results,
    });
  },
);

imageRouter.post("/batch/process-path", validateBody(batchProcessPathSchema), async (req, res) => {
  const bodyPath = typeof req.body?.path === "string" ? req.body.path.trim() : "";
  const bodyPaths = Array.isArray(req.body?.paths) ? req.body.paths.filter(Boolean) : [];
  const recursive = parseBooleanValue(req.body?.recursive) ?? false;
  const limitRaw = Number(req.body?.limit);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, MAX_PATH_FILES) : MAX_PATH_FILES;

  if (!bodyPath && bodyPaths.length === 0) {
    return res.status(400).json({ error: "path_required" });
  }

  const barcodeRaw = typeof req.body?.barcode === "string" ? req.body.barcode.trim() : "";
  const barcode = barcodeRaw ? barcodeRaw.toLowerCase() : null;
  const marketplace =
    typeof req.body?.marketplace === "string" && req.body.marketplace.trim() ? req.body.marketplace.trim() : null;
  const requestedProfile = typeof req.body?.profile === "string" ? req.body.profile.trim() : "";
  const profileName = requestedProfile || config.images.defaultProfile;
  const profile = getImageProfile(profileName);
  const zipRequested = parseBooleanValue(req.body?.zip) ?? false;
  const zipInclude = parseZipInclude(req.body?.zipInclude);

  if (!profile) {
    return res.status(400).json({ error: "profile_not_found" });
  }

  if (barcode) {
    const product = await getProductByBarcode(barcode);
    if (!product) {
      return res.status(404).json({ error: "product_not_found" });
    }
  }

  const inputPaths: string[] = [];

  if (bodyPath) {
    const resolved = path.resolve(bodyPath);
    const stat = await fsPromises.stat(resolved).catch(() => null);
    if (stat?.isDirectory()) {
      const files = await collectImageFiles(resolved, recursive);
      inputPaths.push(...files);
    } else if (stat?.isFile()) {
      inputPaths.push(resolved);
    }
  }

  for (const entry of bodyPaths) {
    const resolved = path.resolve(String(entry));
    inputPaths.push(resolved);
  }

  const filtered = inputPaths.filter(isAllowedImagePath);
  if (!filtered.length) {
    return res.status(400).json({ error: "images_not_found" });
  }

  const results: BatchItem[] = [];
  const zipEntries: { absolutePath: string; name: string }[] = [];
  let truncated = false;
  const limited = filtered.slice(0, limit);
  if (filtered.length > limit) {
    truncated = true;
  }

  for (const filePath of limited) {
    const source = filePath;
    try {
      const stat = await fsPromises.stat(filePath);
      if (stat.size > config.images.maxUploadBytes) {
        results.push({ source, ok: false, error: "file_too_large" });
        continue;
      }
      const buffer = await fsPromises.readFile(filePath);
      const result = await processUploadedImage({
        buffer,
        originalName: path.basename(filePath),
        barcode,
        marketplace,
        profile,
      });
      results.push({
        source,
        ok: true,
        imageId: result.imageId,
        originalUrl: result.originalUrl,
        processedUrl: result.processedUrl,
        duplicate: result.duplicate === true,
      });
      if (zipRequested) {
        if (zipInclude !== "original") {
          zipEntries.push({
            absolutePath: resolveStoragePath(result.processedPath),
            name: normalizeRelativePath(result.processedPath),
          });
        }
        if (zipInclude !== "processed") {
          zipEntries.push({
            absolutePath: resolveStoragePath(result.originalPath),
            name: normalizeRelativePath(result.originalPath),
          });
        }
      }
    } catch (error) {
      logger.error("image.batch_path.process_failed", { requestId: res.locals?.requestId, source, err: error });
      results.push({ source, ok: false, error: "image_process_failed" });
    }
  }

  const processed = results.filter((item) => item.ok).length;
  const failed = results.length - processed;

  let zipUrl: string | undefined;
  if (zipRequested && zipEntries.length > 0) {
    try {
      const zip = await createZipArchive(zipEntries);
      zipUrl = zip.zipUrl;
    } catch (error) {
      logger.error("image.batch_path.zip_failed", { requestId: res.locals?.requestId, err: error });
      return res.status(500).json({ error: "zip_failed" });
    }
  }

  return res.json({
    ok: true,
    barcode,
    marketplace,
    profile: profile.name,
    count: results.length,
    processed,
    failed,
    truncated,
    zipUrl,
    items: results,
  });
});

imageRouter.post("/inspect", upload.single("image"), validateBody(imageInspectBodySchema), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "image_required" });
  }
  if (!file.mimetype.startsWith("image/")) {
    return res.status(400).json({ error: "invalid_image_type" });
  }

  const requestedProfile = typeof req.body?.profile === "string" ? req.body.profile.trim() : "";
  const profileName = requestedProfile || "";
  const profile = profileName ? getImageProfile(profileName) : null;
  if (profileName && !profile) {
    return res.status(400).json({ error: "profile_not_found" });
  }

  const marketplace =
    typeof req.body?.marketplace === "string" && req.body.marketplace.trim() ? req.body.marketplace.trim() : null;

  try {
    const report = await inspectImageBuffer(file.buffer, {
      profile,
      marketplace,
      maxBytes: config.images.maxUploadBytes,
    });
    await insertImageInspectReport({
      imageId: null,
      barcode: null,
      marketplace,
      profile: profile?.name ?? null,
      source: "upload",
      report,
      requestId: res.locals?.requestId,
    });
    return res.json({ ok: true, report });
  } catch (error) {
    logger.error("image.inspect_failed", { requestId: res.locals?.requestId, err: error });
    return res.status(500).json({ error: "image_inspect_failed" });
  }
});
imageRouter.post("/scan-barcode", upload.single("image"), async (req, res) => {
  if (!config.images.barcodeScanEnabled) {
    return res.status(403).json({ error: "barcode_scan_disabled" });
  }
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "image_required" });
  }
  if (!file.mimetype.startsWith("image/")) {
    return res.status(400).json({ error: "invalid_image_type" });
  }

  try {
    const result = await scanBarcodeFromBuffer(file.buffer);
    if (!result) {
      return res.status(404).json({ error: "barcode_not_found" });
    }
    return res.json({ ok: true, text: result.text, format: result.format });
  } catch (error) {
    const err = error as Error;
    if (err?.name === "NotFoundException") {
      return res.status(404).json({ error: "barcode_not_found" });
    }
    if (err?.message?.includes("Cannot find module")) {
      return res.status(500).json({ error: "barcode_scan_unavailable" });
    }
    logger.error("image.barcode_scan_failed", { requestId: res.locals?.requestId, err: error });
    return res.status(500).json({ error: "barcode_scan_failed" });
  }
});

imageRouter.post(
  "/search",
  upload.single("image"),
  validateBody(imageSearchBodySchema),
  validateQuery(imageSearchQuerySchema),
  async (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "image_required" });
    }
    if (!file.mimetype.startsWith("image/")) {
      return res.status(400).json({ error: "invalid_image_type" });
    }

    const queryRaw = typeof req.body?.query === "string" ? req.body.query.trim() : "";
    const numRaw = Number(req.body?.num ?? req.query?.num);
    const num = Number.isFinite(numRaw) ? Math.min(Math.max(Math.trunc(numRaw), 1), 10) : config.search.imageDefaultNum;
    const siteRaw =
      typeof req.body?.site === "string"
        ? req.body.site.trim()
        : typeof req.query?.site === "string"
          ? req.query.site.trim()
          : "";
    const explicitSiteSearch = siteRaw || undefined;

    const languageHintsRaw: string = typeof req.body?.languageHints === "string" ? req.body.languageHints : "";
    const languageHints = languageHintsRaw
      ? languageHintsRaw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
      : undefined;

    let query = queryRaw;
    let source: "query" | "barcode" | "ocr" | undefined = query ? "query" : undefined;
    let ocrError: { code?: number; message?: string; details?: string } | null = null;

    if (!query && config.images.barcodeScanEnabled) {
      try {
        const scanned = await scanBarcodeFromBuffer(file.buffer);
        if (scanned?.text) {
          const barcode = scanned.text.toLowerCase();
          const productResult = await getProductByBarcode(barcode);
          if (productResult.ok) {
            query = productResult.value.name;
          } else {
            query = scanned.text;
          }
          source = "barcode";
        }
      } catch {
        // ignore barcode scan failures
      }
    }

    if (!query && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        const ocr = await googleVisionOcrFromBuffer(file.buffer, languageHints);
        if (ocr.text) {
          query = buildSearchQueryFromOcr(ocr.text);
          if (query) {
            source = "ocr";
          }
        }
      } catch (error) {
        ocrError = error as { code?: number; message?: string; details?: string };
      }
    }

    if (!query) {
      const message = ocrError?.details ?? ocrError?.message ?? "";
      if (ocrError?.code === 7 && /billing/i.test(message)) {
        return res.status(402).json({ error: "ocr_billing_required" });
      }
      return res.status(400).json({ error: "search_query_required" });
    }

    try {
      const { context, result } = await runImageSearch({
        query,
        message: queryRaw,
        siteSearch: explicitSiteSearch,
        num,
      });
      return res.json({
        ok: true,
        query: result.query,
        source: source ?? null,
        siteSearch: context.siteSearch ?? null,
        num: context.num,
        items: result.items,
        totalResults: result.totalResults,
        searchTime: result.searchTime,
      });
    } catch (error) {
      if (error instanceof CseConfigError) {
        return res.status(500).json({ error: "cse_config_missing" });
      }
      if (error instanceof CseRequestError) {
        return res.status(error.status ?? 500).json({ error: "cse_request_failed", message: error.message });
      }
      logger.error("image.search_failed", { requestId: res.locals?.requestId, err: error });
      return res.status(500).json({ error: "image_search_failed" });
    }
  },
);

imageRouter.post("/ocr", upload.single("image"), validateBody(imageOcrBodySchema), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "image_required" });
  }
  if (!file.mimetype.startsWith("image/")) {
    return res.status(400).json({ error: "invalid_image_type" });
  }
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return res.status(500).json({ error: "ocr_config_missing" });
  }

  const languageHintsRaw: string = typeof req.body?.languageHints === "string" ? req.body.languageHints : "";
  const languageHints = languageHintsRaw
    ? languageHintsRaw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
    : undefined;

  try {
    const result = await googleVisionOcrFromBuffer(file.buffer, languageHints);
    return res.json({ ok: true, text: result.text });
  } catch (error) {
    const err = error as { code?: number; details?: string; message?: string };
    const message = err?.details ?? err?.message ?? "";
    if (err?.code === 7 && /billing/i.test(message)) {
      return res.status(402).json({ error: "ocr_billing_required" });
    }
    if (err?.code === 7) {
      return res.status(403).json({ error: "ocr_permission_denied" });
    }
    if (/default credentials|google_application_credentials/i.test(message.toLowerCase())) {
      return res.status(500).json({ error: "ocr_credentials_invalid" });
    }
    logger.error("image.ocr_failed", { requestId: res.locals?.requestId, err: error });
    return res.status(500).json({ error: "ocr_failed" });
  }
});

productImageRouter.get("/:barcode/images", validateParams(barcodeParamsSchema), async (req, res) => {
  const barcode = req.params.barcode;

  const product = await getProductByBarcode(barcode);
  if (!product) {
    return res.status(404).json({ error: "product_not_found" });
  }

  try {
    const items = await listImagesByBarcode(barcode);
    return res.json({ barcode, items });
  } catch (error) {
    logger.error("image.list_failed", { requestId: res.locals?.requestId, err: error });
    return res.status(500).json({ error: "image_list_failed" });
  }
});

export function resolveProfileForMarketplace(profileHint: string | undefined, marketplace: string | undefined | null) {
  if (profileHint) {
    return profileHint;
  }
  if (!marketplace) {
    return config.images.defaultProfile;
  }
  const normalized = marketplace.toLowerCase();
  if (normalized.includes("trendyol")) {
    return "trendyol_square";
  }
  if (normalized.includes("instagram")) {
    return "instagram_post";
  }
  return config.images.defaultProfile;
}

export async function reprocessByBarcode(input: {
  barcode: string;
  marketplace: string | null;
  profileName?: string | null;
}) {
  const profileName = resolveProfileForMarketplace(input.profileName ?? undefined, input.marketplace);
  const profile = resolveImageProfile(profileName);
  if (!profile) {
    return { error: "profile_not_found" as const };
  }
  const result = await reprocessLatestOriginal({
    barcode: input.barcode,
    marketplace: input.marketplace,
    profile,
  });
  if (!result) {
    return { error: "original_not_found" as const };
  }
  return { result };
}
