import path from "path";
import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { requireAdminKey } from "../middleware/adminKey.js";
import { requireJsonBody } from "../middleware/requireJsonBody.js";
import { validateBody, validateQuery } from "../validation.js";
import { exportProductsCsv } from "../services/product/exportService.js";
import { importProductsFromFile, importProductFromUrl } from "../services/product/importService.js";
import { generateQrCode } from "../services/product/qrService.js";
import { handleStockAlert } from "../services/product/stockAlertService.js";
import { generateProductDescription, suggestCategory, removeBackground } from "../services/ai/aiService.js";
import { getPriceSuggestion, analyzePricing } from "../services/pricingService.js";
import { syncPriceStock, bulkSyncPriceStock } from "../services/marketplace/syncService.js";
import { getStockHistory } from "../services/product/stockHistoryService.js";
import jwt from 'jsonwebtoken';
import {
  getAllProducts,
  getLowStockProducts,
  getProductByBarcode,
  searchProductsByName,
  upsertProduct,
  updatePrice,
  updateStock,
  deleteProduct,
  bulkDeleteProducts,
  generateQRCode,
  getProductPrices,
  addProductPrice,
  deleteProductPrice,
} from "../services/product/productService.js";

import { getAdminSettings } from "../services/adminSettingsService.js";

const router = Router();

// QR Code generation route
router.get("/:barcode/qr", requireAdminKey, async (req, res) => {
  const { barcode } = req.params;
  if (!barcode) {
    return res.status(400).json({ error: "barcode_required" });
  }
  try {
    const qrCode = await generateQRCode(barcode);
    res.json({ status: "ok", qrCode, barcode });
  } catch (error) {
    res.status(500).json({ error: "qr_generation_failed" });
  }
});

// Price suggestion route
router.get("/:barcode/price-suggestion", async (req, res) => {
  const { barcode } = req.params;
  try {
    const suggestion = await getPriceSuggestion(barcode);
    if (!suggestion) {
      return res.status(404).json({ error: "product_not_found_or_no_competitors" });
    }
    res.json(suggestion);
  } catch (error) {
    logger.error("products.price_suggestion_failed", { err: error });
    res.status(500).json({ error: "price_suggestion_failed" });
  }
});


// Product Prices Management
router.get("/:barcode/prices", requireAdminKey, async (req, res) => {
  const { barcode } = req.params;
  try {
    const prices = await getProductPrices(barcode);
    res.json({ status: "ok", prices });
  } catch (error) {
    logger.error("products.get_prices_failed", { barcode, err: error });
    res.status(500).json({ error: "get_prices_failed" });
  }
});

router.post("/:barcode/prices", requireAdminKey, requireJsonBody, async (req, res) => {
  const { barcode } = req.params;
  const { price, start_date, end_date, price_type, priority } = req.body;

  try {
    const id = await addProductPrice({
      barcode,
      price: Number(price),
      currency: req.body.currency || "TRY",
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      price_type: price_type || "STANDARD",
      priority: Number(priority) || 0
    });
    res.json({ status: "ok", id });
  } catch (error) {
    logger.error("products.add_price_failed", { barcode, err: error });
    res.status(500).json({ error: "add_price_failed" });
  }
});

router.delete("/:barcode/prices/:id", requireAdminKey, async (req, res) => {
  const { id } = req.params;
  try {
    const success = await deleteProductPrice(Number(id));
    res.json({ status: success ? "ok" : "failed" });
  } catch (error) {
    logger.error("products.delete_price_failed", { id, err: error });
    res.status(500).json({ error: "delete_price_failed" });
  }
});

// Marketplace Sync Route
router.post("/:barcode/sync", requireJsonBody, async (req, res) => {
  const { barcode } = req.params;

  try {
    const productRes = await getProductByBarcode(barcode);
    if (!productRes.ok) {
      return res.status(404).json({ error: "product_not_found" });
    }

    const { stock, price } = productRes.value;
    // We send current DB values to sync service
    const result = await syncPriceStock({
      barcode,
      price,
      stock,
      targets: ["all"], // Default to all configured marketplaces
    });

    res.json(result);
  } catch (error) {
    logger.error("products.sync_failed", { barcode, err: error });
    res.status(500).json({ error: "sync_failed" });
  }
});

router.use(requireJsonBody);

const numberLike = z.preprocess((value) => {
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
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no"].includes(normalized)) {
      return false;
    }
  }
  return value;
}, z.boolean());

const productImportSchema = z.object({
  path: z.string().trim().optional(),
});

const productCreateSchema = z.object({
  barcode: z.string().trim().min(1),
  name: z.string().trim().min(1),
  category: z.string().trim().optional(),
  description: z.string().trim().optional(),
  price: numberLike,
  stock: numberLike,
  currency: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  product_code: z.string().trim().optional(),
  vat_rate: numberLike.optional(),
  unit: z.string().trim().optional(),
  images: z.array(z.string()).optional(),
  attributes: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  cargo_company: z.string().trim().optional(),
  cargo_desi: numberLike.optional(),
  width: numberLike.optional(),
  height: numberLike.optional(),
  length: numberLike.optional(),
  weight: numberLike.optional(),
  max_order_limit: numberLike.optional(),
  auto_stock_update: booleanLike.optional(),
  parent_barcode: z.string().trim().optional(),
  cost_price: numberLike.optional(),
  product_type: z.enum(["standard", "packet", "digital"]).optional(),
  preparation_days: numberLike.optional(),
  translations: z.record(z.string(), z.any()).optional(),
});

const priceUpdateSchema = z.object({
  action: z.enum(["set", "increase", "decrease"]).optional(),
  value: numberLike,
  isPercent: booleanLike.optional(),
});

const stockUpdateSchema = z.object({
  action: z.enum(["set", "increase", "decrease"]).optional(),
  value: numberLike,
  isPercent: booleanLike.optional(),
});

const productQuerySchema = z
  .object({
    search: z.string().trim().optional(),
    barcode: z.string().trim().optional(),
    limit: numberLike.optional(),
  })
  .passthrough();

const lowStockQuerySchema = z
  .object({
    threshold: numberLike.optional(),
    critical: numberLike.optional(),
    limit: numberLike.optional(),
  })
  .passthrough();

const productExportQuerySchema = z
  .object({
    limit: numberLike.optional(),
  })
  .passthrough();

router.post("/import", requireAdminKey, validateBody(productImportSchema), async (req, res) => {
  const requestedPath = req.body.path?.trim() ?? "";
  const filePath = requestedPath ? path.resolve(requestedPath) : path.resolve(config.data.productPath);
  try {
    const result = await importProductsFromFile(filePath);
    res.json({ status: "ok", path: filePath, ...result });
  } catch (error) {
    logger.error("products.import_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "product_import_failed" });
  }
});

router.post("/import-url", requireAdminKey, requireJsonBody, async (req, res) => {
  const url = typeof req.body.url === "string" ? req.body.url.trim() : "";
  if (!url) {
    return res.status(400).json({ error: "url_required" });
  }

  try {
    const result = await importProductFromUrl(url);

    if (!result.success) {
      return res.status(422).json({ error: result.error || "import_failed" });
    }

    res.json({ status: "ok", ...result });
  } catch (error) {
    logger.error("products.import_url_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "product_import_url_failed" });
  }
});

router.post("/analyze-price", requireAdminKey, requireJsonBody, async (req, res) => {
  const { productName, myCost } = req.body;

  if (!productName) {
    return res.status(400).json({ error: "product_name_required" });
  }

  try {
    const result = await analyzePricing({
      productName,
      myCost: typeof myCost === "number" ? myCost : undefined,
      locale: "tr",
    });

    if (!result) {
      return res.status(500).json({ error: "pricing_analysis_failed" });
    }

    res.json({ status: "ok", ...result });
  } catch (error) {
    logger.error("product.analyze_price_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "analyze_price_failed" });
  }
});

router.post("/ai/generate-description", requireAdminKey, requireJsonBody, async (req, res) => {
  const { name, category, brand, tone } = req.body;

  if (!name) {
    return res.status(400).json({ error: "product_name_required" });
  }

  try {
    const description = await generateProductDescription(name, category || "", brand || "", tone || "professional");
    res.json({ status: "ok", description });
  } catch (error) {
    logger.error("product.generate_description_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "generate_description_failed" });
  }
});

router.post("/ai/suggest-category", requireAdminKey, requireJsonBody, async (req, res) => {
  const { name, brand } = req.body;

  if (!name) {
    return res.status(400).json({ error: "product_name_required" });
  }

  try {
    const category = await suggestCategory(name, brand || "");
    res.json({ status: "ok", category });
  } catch (error) {
    logger.error("product.suggest_category_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "suggest_category_failed" });
  }
});

router.post("/ai/remove-background", requireAdminKey, requireJsonBody, async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: "image_url_required" });
  }

  try {
    const result = await removeBackground(imageUrl);
    res.json({ status: "ok", imageUrl: result });
  } catch (error) {
    logger.error("product.remove_background_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "remove_background_failed" });
  }
});

router.post("/try-on", requireAdminKey, requireJsonBody, async (req, res) => {
  const { clothingImage, modelImage, category } = req.body;

  if (!clothingImage || !modelImage) {
    return res.status(400).json({ error: "clothing_and_model_images_required" });
  }

  try {
    const { generateVirtualTryOn } = await import("../services/virtualTryOnService.js");
    const result = await generateVirtualTryOn(modelImage, clothingImage);

    res.json({
      status: "ok",
      imageUrl: result.imageUrl,
    });
  } catch (error) {
    logger.error("product.try_on_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "try_on_failed" });
  }
});

// Redundant QR route removed (consolidated above at Line 29)

router.get("/export", requireAdminKey, validateQuery(productExportQuerySchema), async (req, res) => {
  const limitRaw = Number(req.query.limit ?? 1000);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 5000) : 1000;
  try {
    const productsResult = await getAllProducts(limit);
    if (!productsResult.ok) throw productsResult.error;
    const csv = exportProductsCsv(productsResult.value);
    res
      .status(200)
      .type("text/csv")
      .setHeader("Content-Disposition", `attachment; filename="products-${Date.now()}.csv"`)
      .send(csv);
  } catch (error) {
    logger.error("products.export_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "product_export_failed" });
  }
});

router.get("/low-stock", requireAdminKey, validateQuery(lowStockQuerySchema), async (req, res) => {
  const limitRaw = Number(req.query.limit ?? 50);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;
  try {
    const settings = await getAdminSettings();
    const thresholdRaw = Number(req.query.threshold ?? settings.lowStockThreshold);
    const criticalRaw = Number(req.query.critical ?? settings.lowStockCriticalThreshold);
    const threshold = Number.isFinite(thresholdRaw) && thresholdRaw >= 0 ? Math.floor(thresholdRaw) : 0;
    let critical = Number.isFinite(criticalRaw) && criticalRaw >= 0 ? Math.floor(criticalRaw) : 0;
    if (critical > threshold) {
      critical = threshold;
    }
    const productsResult = await getLowStockProducts(threshold, limit);
    if (!productsResult.ok) throw productsResult.error;
    return res.json({ items: productsResult.value, threshold, critical, limit });
  } catch (error) {
    logger.error("products.low_stock_failed", { requestId: res.locals?.requestId, err: error });
    return res.status(500).json({ error: "low_stock_list_failed" });
  }
});

router.get("/", requireAdminKey, validateQuery(productQuerySchema), async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const barcode = typeof req.query.barcode === "string" ? req.query.barcode.trim() : "";
  const limitRaw = Number(req.query.limit ?? 50);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;
  try {
    if (barcode) {
      const productResult = await getProductByBarcode(barcode.toLowerCase());
      return res.json({ items: productResult.ok ? [productResult.value] : [] });
    }
    if (search) {
      const productsResult = await searchProductsByName(search, limit);
      return res.json({ items: productsResult.ok ? productsResult.value : [] });
    }
    const productsResult = await getAllProducts(limit);
    return res.json({ items: productsResult.ok ? productsResult.value : [] });
  } catch (error) {
    logger.error("products.list_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "product_list_failed" });
  }
});

// GET /api/products/search?q=iphone%2017 (alias for chatbot)
router.get("/search", requireAdminKey, async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const limitRaw = Number(req.query.limit ?? 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 10;

  if (!q) {
    return res.status(400).json({ error: "query_required", success: false });
  }

  try {
    const productsResult = await searchProductsByName(q, limit);
    if (!productsResult.ok) throw productsResult.error;
    res.json({ success: true, query: q, items: productsResult.value });
  } catch (error) {
    logger.error("products.search_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "product_search_failed", success: false });
  }
});



router.post("/", requireAdminKey, validateBody(productCreateSchema), async (req, res) => {
  const barcode = req.body.barcode.trim().toLowerCase();
  const name = req.body.name.trim();
  const price = req.body.price;
  const stock = req.body.stock;
  const currencyRaw = req.body.currency?.trim().toUpperCase() ?? "";
  const currency = currencyRaw || "TRY";

  // Extract user ID
  let userId: number | undefined = undefined;
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.decode(token) as { id: number } | null;
    if (decoded && decoded.id) userId = decoded.id;
  }

  if (!barcode || !name) {
    return res.status(400).json({ error: "barcode_name_required" });
  }
  if (!Number.isFinite(price)) {
    return res.status(400).json({ error: "price_required" });
  }
  if (!Number.isFinite(stock)) {
    return res.status(400).json({ error: "stock_required" });
  }
  if (price < 0 || stock < 0) {
    return res.status(400).json({ error: "invalid_values" });
  }

  try {
    const productResult = await upsertProduct({
      barcode,
      name,
      category: req.body.category,
      description: req.body.description,
      price,
      stock: Math.trunc(stock),
      currency,
      brand: req.body.brand,
      product_code: req.body.product_code,
      vat_rate: req.body.vat_rate,
      unit: req.body.unit,
      images: req.body.images,
      attributes: req.body.attributes,
      cargo_company: req.body.cargo_company,
      cargo_desi: req.body.cargo_desi,
      width: req.body.width,
      height: req.body.height,
      length: req.body.length,
      weight: req.body.weight,
      max_order_limit: req.body.max_order_limit,
      auto_stock_update: req.body.auto_stock_update,
      parent_barcode: req.body.parent_barcode,
      cost_price: req.body.cost_price || req.body.costPrice, // Handle both naming conventions
      userId,
      product_type: req.body.product_type,
      preparation_days: req.body.preparation_days,
      translations: req.body.translations,
    });
    if (productResult.ok) {
      try {
        await handleStockAlert(productResult.value, "admin.product.upsert");
      } catch (error) {
        logger.warn("products.stock_alert_failed", { requestId: res.locals?.requestId, err: error });
      }
      res.json({ item: productResult.value });
    } else {
      res.status(500).json({ error: productResult.error.message || "product_upsert_failed" });
    }
  } catch (error) {
    logger.error("products.upsert_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "product_upsert_failed" });
  }
});

router.put("/:barcode/price", requireAdminKey, validateBody(priceUpdateSchema), async (req, res) => {
  const barcode = typeof req.params?.barcode === "string" ? req.params.barcode.trim().toLowerCase() : "";
  const action = req.body.action === "increase" || req.body.action === "decrease" ? req.body.action : "set";
  const valueRaw = req.body.value;
  const isPercent = Boolean(req.body.isPercent);
  if (!barcode) {
    return res.status(400).json({ error: "barcode_required" });
  }
  if (!Number.isFinite(valueRaw)) {
    return res.status(400).json({ error: "price_required" });
  }

  // Extract user ID
  let userId: number | undefined = undefined;
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.decode(token) as { id: number } | null;
    if (decoded && decoded.id) userId = decoded.id;
  }

  try {
    const productRes = await getProductByBarcode(barcode);
    if (!productRes.ok) {
      return res.status(404).json({ error: "product_not_found" });
    }
    const product = productRes.value;
    const base = Number(product.price ?? 0);
    let nextValue = valueRaw;
    if (action !== "set") {
      const delta = isPercent ? base * (valueRaw / 100) : valueRaw;
      nextValue = action === "decrease" ? base - delta : base + delta;
    }

    if (!Number.isFinite(nextValue) || nextValue < 0) {
      return res.status(400).json({ error: "invalid_price" });
    }

    const updatedRes = await updatePrice(barcode, Number(nextValue), userId);
    if (!updatedRes.ok) {
       return res.status(500).json({ error: updatedRes.error?.message || "product_price_update_failed" });
    }
    res.json({ item: updatedRes.value });
  } catch (error) {
    logger.error("products.price_update_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "product_price_update_failed" });
  }
});

router.put("/:barcode/stock", requireAdminKey, validateBody(stockUpdateSchema), async (req, res) => {
  const barcode = typeof req.params?.barcode === "string" ? req.params.barcode.trim().toLowerCase() : "";
  const action = req.body.action === "increase" || req.body.action === "decrease" ? req.body.action : "set";
  const valueRaw = req.body.value;
  const isPercent = Boolean(req.body.isPercent);
  if (!barcode) {
    return res.status(400).json({ error: "barcode_required" });
  }
  if (!Number.isFinite(valueRaw)) {
    return res.status(400).json({ error: "stock_required" });
  }

  // Extract user ID
  let userId: number | undefined = undefined;
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.decode(token) as { id: number } | null;
    if (decoded && decoded.id) userId = decoded.id;
  }

  try {
    const productRes = await getProductByBarcode(barcode);
    if (!productRes.ok) {
      return res.status(404).json({ error: "product_not_found" });
    }
    const product = productRes.value;
    const base = Number(product.stock ?? 0);
    let nextValue = valueRaw;
    if (action !== "set") {
      const delta = isPercent ? base * (valueRaw / 100) : valueRaw;
      nextValue = action === "decrease" ? base - delta : base + delta;
    }
    if (!Number.isFinite(nextValue) || nextValue < 0) {
      return res.status(400).json({ error: "invalid_stock" });
    }
    const updatedRes = await updateStock(
      barcode,
      Math.trunc(nextValue) - base,
      "Stok Kartı",
      `Manuel güncelleme (${action}: ${valueRaw}${isPercent ? "%" : ""})`,
      userId
    );
    if (!updatedRes.ok) {
       return res.status(500).json({ error: updatedRes.error?.message || "product_stock_update_failed" });
    }

    try {
      await handleStockAlert(updatedRes.value, "admin.product.update_stock");
    } catch (error) {
      logger.warn("products.stock_alert_failed", { requestId: res.locals?.requestId, err: error });
    }

    res.json({ item: updatedRes.value });
  } catch (error) {
    logger.error("products.stock_update_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "product_stock_update_failed" });
  }
});

router.post("/bulk-delete", requireAdminKey, requireJsonBody, async (req, res) => {
  const { barcodes } = req.body;
  if (!Array.isArray(barcodes) || barcodes.length === 0) {
    return res.status(400).json({ error: "barcodes_required_as_array" });
  }

  try {
    const deletedCount = await bulkDeleteProducts(barcodes);
    res.json({ status: "ok", deletedCount });
  } catch (error) {
    logger.error("products.bulk_delete_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "bulk_delete_failed" });
  }
});

router.post("/bulk-sync", requireAdminKey, requireJsonBody, async (req, res) => {
  const { barcodes } = req.body;
  if (!Array.isArray(barcodes) || barcodes.length === 0) {
    return res.status(400).json({ error: "barcodes_required_as_array" });
  }

  try {
    const results = [];
    for (const barcode of barcodes) {
      try {
        const productRes = await getProductByBarcode(barcode);
        if (productRes.ok) {
          const product = productRes.value;
          const syncResult = await syncPriceStock({
            barcode,
            price: product.price,
            stock: product.stock,
            targets: ["all"],
          });
          results.push({ barcode, status: "ok", result: syncResult });
        } else {
          results.push({ barcode, status: "failed", error: "not_found" });
        }
      } catch (err) {
        results.push({ barcode, status: "failed", error: (err as Error).message });
      }
    }
    res.json({ status: "ok", results });
  } catch (error) {
    logger.error("products.bulk_sync_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "bulk_sync_failed" });
  }
});

export { router as productRouter };
