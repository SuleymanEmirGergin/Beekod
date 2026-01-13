import QRCode from "qrcode";
import { ResultSetHeader } from "mysql2";
import { query } from "../../db.js";
import { Product, ProductPrice } from "../../types.js";
import { logger } from "../../logger.js";
import { logStockChange } from "./stockHistoryService.js";
import { auditService } from "./auditService.js";
import { InternalError } from "../../errors/AppError.js";
import { getCache, setCache } from "./cacheService.js";
import { generateEmbedding, cosineSimilarity } from "./vectorService.js";
import { ok, fail, Result } from "../../utils/result.js";

/**
 * Ürün servislerinin ana dosyası. Eskiden farklı dizinlerde olan 
 * product ve inventory servisleri burada birleştirilmiştir.
 */

export async function getProductByBarcode(barcode: string): Promise<Result<Product>> {
  const cacheKey = `product:${barcode}`;
  const cached = await getCache<Product>(cacheKey);
  if (cached) {
    return ok(cached);
  }

  const rows = await query<Product[]>(
    "SELECT id, barcode, name, category, description, price, cost_price, stock, alert_threshold, currency, brand, product_code, vat_rate, unit, images, attributes, cargo_company, cargo_desi, width, height, length, weight, max_order_limit, auto_stock_update, parent_barcode, variants, product_type, preparation_days, translations FROM products WHERE barcode = ? LIMIT 1",
    [barcode],
  );

  if (rows[0]) {
    // Parse JSON fields
    if (typeof rows[0].images === "string") rows[0].images = JSON.parse(rows[0].images);
    if (typeof rows[0].attributes === "string") rows[0].attributes = JSON.parse(rows[0].attributes);
    if (typeof rows[0].variants === "string") rows[0].variants = JSON.parse(rows[0].variants);

    // Cache for 1 hour
    await setCache(cacheKey, rows[0], 3600);
    return ok(rows[0]);
  }
  return fail(new Error(`Product with barcode ${barcode} not found`));
}

/**
 * Search products using semantic similarity (embeddings).
 */
export async function searchProductsByEmbedding(queryText: string, limit = 5): Promise<Product[]> {
  const queryEmbedding = await generateEmbedding(queryText);
  if (!queryEmbedding) {
    logger.warn("semantic_search.no_query_embedding", { query: queryText });
    return [];
  }

  interface EmbeddingRow {
    id: number;
    barcode: string;
    name: string;
    category: string;
    description: string;
    price: number;
    stock: number;
    images: string | string[];
    embedding: string | number[];
  }

  const rows = await query<EmbeddingRow[]>(
    "SELECT id, barcode, name, category, description, price, stock, images, embedding FROM products WHERE embedding IS NOT NULL"
  );

  if (rows.length === 0) {
    logger.info("semantic_search.no_embeddings_in_db");
    return [];
  }

  const scored = rows.map(row => {
    let productEmbedding: number[] = [];
    try {
      if (typeof row.embedding === 'string') {
        productEmbedding = JSON.parse(row.embedding);
      } else if (Array.isArray(row.embedding)) {
        productEmbedding = row.embedding;
      }
    } catch {
      productEmbedding = [];
    }

    const score = productEmbedding.length > 0
      ? cosineSimilarity(queryEmbedding, productEmbedding)
      : 0;

    return { product: row, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const topResults = scored.slice(0, limit).map(s => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { embedding, ...p } = s.product;
    const prod = p as unknown as Product;

    if (typeof prod.images === 'string') {
      try { prod.images = JSON.parse(prod.images); } catch { prod.images = []; }
    }
    return prod;
  });

  logger.info("semantic_search.completed", {
    query: queryText,
    totalProducts: rows.length,
    resultsReturned: topResults.length,
    topScore: scored[0]?.score?.toFixed(3)
  });

  return topResults;
}

export async function searchProductsByName(name: string, limit = 5): Promise<Result<Product[]>> {
  try {
    const like = `%${name.toLowerCase()}%`;
    const rows = await query<Product[]>(
      "SELECT id, barcode, name, category, description, price, cost_price, stock, alert_threshold, currency, brand, images FROM products WHERE LOWER(name) LIKE ? LIMIT ?",
      [like, limit],
    );
    rows.forEach((row) => {
      if (typeof row.images === "string") row.images = JSON.parse(row.images);
    });
    return ok(rows);
  } catch (err: unknown) {
    logger.error("product.search_failed", { name, err });
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function getAllProducts(limit = 50): Promise<Result<Product[]>> {
  try {
    const rows = await query<Product[]>(
      "SELECT id, barcode, name, category, description, price, cost_price, stock, alert_threshold, currency, brand, images FROM products LIMIT ?",
      [limit],
    );
    rows.forEach((row) => {
      if (typeof row.images === "string") row.images = JSON.parse(row.images);
    });
    return ok(rows);
  } catch (err: unknown) {
    logger.error("product.get_all_failed", { err });
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function getLowStockProducts(threshold: number, limit = 50): Promise<Result<Product[]>> {
  try {
    const rows = await query<Product[]>(
      "SELECT id, barcode, name, category, description, price, cost_price, stock, alert_threshold, currency FROM products WHERE stock <= COALESCE(alert_threshold, ?) ORDER BY stock ASC, name ASC LIMIT ?",
      [threshold, limit],
    );
    return ok(rows);
  } catch (err: unknown) {
    logger.error("product.get_low_stock_failed", { threshold, err });
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function upsertProduct(input: {
  barcode: string;
  name: string;
  category?: string;
  description?: string;
  price: number;
  cost_price?: number;
  stock: number;
  currency: string;
  brand?: string;
  product_code?: string;
  vat_rate?: number;
  unit?: string;
  images?: string[];
  attributes?: Record<string, string | number>;
  cargo_company?: string;
  cargo_desi?: number;
  width?: number;
  height?: number;
  length?: number;
  weight?: number;
  max_order_limit?: number;
  auto_stock_update?: boolean;
  parent_barcode?: string;
  variants?: Product["variants"];
  alert_threshold?: number;
  userId?: number;
  sourceUrl?: string;
  sourceSite?: string;
  snapshotPrice?: number;
  snapshotCurrency?: string;
  snapshotAt?: Date;
  imageUrl?: string;
  preparation_days?: number;
  product_type?: 'standard' | 'packet' | 'digital';
  translations?: Record<string, unknown>;
}): Promise<Result<Product>> {
  const finalImages = input.images || (input.imageUrl ? [input.imageUrl] : []);
  const imagesJson = finalImages.length > 0 ? JSON.stringify(finalImages) : null;
  const attributesJson = input.attributes ? JSON.stringify(input.attributes) : null;
  const variantsJson = input.variants ? JSON.stringify(input.variants) : null;

  const productRes = await getProductByBarcode(input.barcode);
  const oldStock = productRes.ok ? productRes.value.stock : 0;

  try {
    await query<ResultSetHeader>(
      `INSERT INTO products(barcode, name, category, description, price, cost_price, stock, alert_threshold, currency, brand, product_code, vat_rate, unit, images, attributes, cargo_company, cargo_desi, width, height, length, weight, max_order_limit, auto_stock_update, parent_barcode, variants, sourceUrl, sourceSite, snapshotPrice, snapshotCurrency, snapshotAt, imageUrl, preparation_days, translations, product_type)
  VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
  name = VALUES(name),
    category = VALUES(category),
    description = VALUES(description),
    price = VALUES(price),
    cost_price = VALUES(cost_price),
    stock = VALUES(stock),
    alert_threshold = VALUES(alert_threshold),
    currency = VALUES(currency),
    brand = VALUES(brand),
    product_code = VALUES(product_code),
    vat_rate = VALUES(vat_rate),
    unit = VALUES(unit),
    images = VALUES(images),
    attributes = VALUES(attributes),
    cargo_company = VALUES(cargo_company),
    cargo_desi = VALUES(cargo_desi),
    width = VALUES(width),
    height = VALUES(height),
    length = VALUES(length),
    weight = VALUES(weight),
    max_order_limit = VALUES(max_order_limit),
    auto_stock_update = VALUES(auto_stock_update),
    parent_barcode = VALUES(parent_barcode),
    variants = VALUES(variants),
    sourceUrl = VALUES(sourceUrl),
    sourceSite = VALUES(sourceSite),
    snapshotPrice = VALUES(snapshotPrice),
    snapshotCurrency = VALUES(snapshotCurrency),
    snapshotAt = VALUES(snapshotAt),
    imageUrl = VALUES(imageUrl),
    preparation_days = VALUES(preparation_days),
    translations = VALUES(translations),
    product_type = VALUES(product_type)`,
      [
        input.barcode,
        input.name,
        input.category ?? null,
        input.description ?? null,
        input.price,
        input.cost_price ?? 0,
        input.stock,
        input.alert_threshold ?? 10,
        input.currency,
        input.brand ?? null,
        input.product_code ?? null,
        input.vat_rate ?? 0,
        input.unit ?? "Adet",
        imagesJson,
        attributesJson,
        input.cargo_company ?? null,
        input.cargo_desi ?? 0,
        input.width ?? 0,
        input.height ?? 0,
        input.length ?? 0,
        input.weight ?? 0,
        input.max_order_limit ?? 0,
        input.auto_stock_update ? 1 : 0,
        input.parent_barcode ?? null,
        variantsJson,
        input.sourceUrl ?? null,
        input.sourceSite ?? null,
        input.snapshotPrice ?? null,
        input.snapshotCurrency ?? null,
        input.snapshotAt ?? null,
        input.imageUrl ?? null,
        input.preparation_days ?? 3,
        input.translations ? JSON.stringify(input.translations) : null,
        input.product_type ?? 'standard'
      ],
    );

    if (oldStock !== input.stock) {
      await logStockChange({
        barcode: input.barcode,
        productName: input.name,
        oldStock,
        newStock: input.stock,
        reason: oldStock === 0 ? "New product" : "Product update/sync",
        source: "Inventory Management",
      });
    }

    // Audit Log
    await auditService.log({
      userId: input.userId,
      action: oldStock === 0 ? 'CREATE_PRODUCT' : 'UPDATE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: input.barcode,
      details: { name: input.name, price: input.price, stock: input.stock }
    });

    return getProductByBarcode(input.barcode);
  } catch (err: unknown) {
    logger.error("product.upsert_failed", { barcode: input.barcode, err });
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function updatePrice(barcode: string, price: number, userId?: number): Promise<Result<Product>> {
  try {
    const result = await query<ResultSetHeader>("UPDATE products SET price = ? WHERE barcode = ?", [price, barcode]);
    if (result.affectedRows === 0) {
      return fail(new Error(`Product with barcode ${barcode} not found`));
    }

    await auditService.log({
      userId,
      action: 'UPDATE_PRICE',
      entityType: 'PRODUCT',
      entityId: barcode,
      details: { price }
    });

    return getProductByBarcode(barcode);
  } catch (err: unknown) {
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function updateStock(
  barcode: string,
  quantityChange: number,
  source = "Manual Update",
  reason = "Stok güncellemesi",
  userId?: number
): Promise<Result<Product>> {
  const productRes = await getProductByBarcode(barcode);
  if (!productRes.ok) {
    return fail(productRes.error);
  }

  const product = productRes.value;
  const oldStock = product.stock;
  const newStock = oldStock + quantityChange;

  try {
    const result = await query<ResultSetHeader>("UPDATE products SET stock = stock + ? WHERE barcode = ?", [
      quantityChange,
      barcode,
    ]);

    const success = result.affectedRows > 0;
    if (success) {
      await logStockChange({
        barcode,
        productName: product.name,
        oldStock,
        newStock,
        reason: reason,
        source: source,
      });

      await auditService.log({
        userId,
        action: 'UPDATE_STOCK',
        entityType: 'PRODUCT',
        entityId: barcode,
        details: { change: quantityChange, reason }
      });
    }
    return getProductByBarcode(barcode) as Promise<Result<Product>>;
  } catch (err: unknown) {
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function setStock(
  barcode: string,
  newStockValue: number,
  source = "Manual Update",
  reason = "Stok set edildi",
  userId?: number
): Promise<Result<Product>> {
  const productRes = await getProductByBarcode(barcode);
  if (!productRes.ok) {
    return fail(productRes.error);
  }
  const product = productRes.value;
  const oldStock = product.stock;

  try {
    const result = await query<ResultSetHeader>("UPDATE products SET stock = ? WHERE barcode = ?", [newStockValue, barcode]);
    const success = result.affectedRows > 0;

    if (success) {
      await logStockChange({
        barcode,
        productName: product.name,
        oldStock,
        newStock: newStockValue,
        reason,
        source,
      });

      await auditService.log({
        userId,
        action: 'SET_STOCK',
        entityType: 'PRODUCT',
        entityId: barcode,
        details: { oldStock, newStock: newStockValue, reason }
      });
    }

    return getProductByBarcode(barcode);
  } catch (err: unknown) {
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function getProductNames(barcodes: string[]): Promise<Record<string, string>> {
  if (!barcodes.length) {
    return {};
  }
  const placeholders = barcodes.map(() => "?").join(",");
  const rows = await query<{ barcode: string; name: string }[]>(
    `SELECT barcode, name FROM products WHERE barcode IN(${placeholders})`,
    barcodes,
  );
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.barcode] = row.name;
  }
  return map;
}

export async function deleteProduct(barcode: string, userId?: number): Promise<Result<boolean>> {
  try {
    const result = await query<ResultSetHeader>("DELETE FROM products WHERE barcode = ?", [barcode]);
    if (result.affectedRows === 0) {
      return fail(new Error(`Product with barcode ${barcode} not found`));
    }

    await auditService.log({
      userId,
      action: 'DELETE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: barcode
    });

    return ok(true);
  } catch (err: unknown) {
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function bulkDeleteProducts(barcodes: string[]): Promise<number> {
  if (!barcodes.length) return 0;
  const placeholders = barcodes.map(() => "?").join(",");
  const result = await query<ResultSetHeader>(`DELETE FROM products WHERE barcode IN (${placeholders})`, barcodes);
  return result.affectedRows;
}

export async function generateQRCode(barcode: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(barcode, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
    return qrDataUrl;
  } catch (err) {
    logger.error("product.qr_generation_failed", { barcode, err });
    throw new InternalError("Could not generate QR code", { barcode, originalError: err });
  }
}

export async function updateProduct(
  barcode: string,
  updates: Partial<{
    price: number;
    stock: number;
    name: string;
    description: string;
    category: string;
    alert_threshold: number;
  }>,
): Promise<boolean> {
  try {
    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (updates.price !== undefined) {
      fields.push("price = ?");
      values.push(updates.price);
    }
    if (updates.stock !== undefined) {
      fields.push("stock = ?");
      values.push(updates.stock);
    }
    if (updates.name) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.description) {
      fields.push("description = ?");
      values.push(updates.description);
    }
    if (updates.category) {
      fields.push("category = ?");
      values.push(updates.category);
    }
    if (updates.alert_threshold !== undefined) {
      fields.push("alert_threshold = ?");
      values.push(updates.alert_threshold);
    }

    if (fields.length === 0) {
      return false;
    }

    values.push(barcode);
    await query(`UPDATE products SET ${fields.join(", ")} WHERE barcode = ?`, values);
    return true;
  } catch (err: unknown) {
    logger.error("product.get_prices_failed", { barcode, err });
    return false; // Corrected return type to match Promise<boolean>
  }
}

export async function suggestCategories(name: string): Promise<Result<string[]>> {
  try {
    const rows = await query<{ category: string }[]>(
      `SELECT DISTINCT category FROM products WHERE name LIKE ? ORDER BY category LIMIT 5`,
      [`%${name}%`]
    );
    return ok(rows.map(row => row.category));
  } catch (err: unknown) {
    logger.error("product.get_category_suggestions_failed", { name, err });
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function addProductPrice(price: Omit<ProductPrice, "id" | "created_at">): Promise<number> {
  const result = await query<ResultSetHeader>(
    `INSERT INTO product_prices (barcode, price, currency, start_date, end_date, price_type, priority)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      price.barcode,
      price.price,
      price.currency,
      price.start_date || null,
      price.end_date || null,
      price.price_type,
      price.priority
    ]
  );
  return result.insertId;
}

export async function getProductPrices(barcode: string): Promise<ProductPrice[]> {
  return await query<ProductPrice[]>(
    `SELECT * FROM product_prices WHERE barcode = ? ORDER BY priority DESC, start_date ASC`,
    [barcode]
  );
}

export async function deleteProductPrice(id: number): Promise<boolean> {
  const result = await query<ResultSetHeader>(`DELETE FROM product_prices WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}

// INVENTORY SERVICE METHODS (Merged)
import { ConsolidatedInventoryItem } from "../../types.js";

interface DbConsolidatedRow {
  barcode: string;
  title: string;
  marketplaces: string;
  marketplace_data: string;
  min_price: number;
  max_price: number;
  total_stock: number;
}

export async function getConsolidatedInventory(): Promise<Result<ConsolidatedInventoryItem[]>> {
  try {
    const rows = await query<DbConsolidatedRow[]>(`
        SELECT 
            barcode, 
            title, 
            GROUP_CONCAT(marketplace) as marketplaces,
            GROUP_CONCAT(CONCAT(marketplace, ':', price, ':', stock, ':', active)) as marketplace_data,
            MIN(price) as min_price,
            MAX(price) as max_price,
            SUM(stock) as total_stock
        FROM marketplace_listings
        GROUP BY barcode, title
        ORDER BY title ASC
    `);

    const items: ConsolidatedInventoryItem[] = rows.map(row => ({
      barcode: row.barcode,
      title: row.title,
      marketplaces: row.marketplaces.split(','),
      details: row.marketplace_data.split(',').map((d: string) => {
        const [mp, price, stock, active] = d.split(':');
        return {
          marketplace: mp,
          price: parseFloat(price),
          stock: parseInt(stock),
          active: active === '1'
        };
      }),
      minPrice: row.min_price,
      maxPrice: row.max_price,
      totalStock: row.total_stock
    }));

    return ok(items);
  } catch (err: unknown) {
    logger.error("inventory.get_consolidated_failed", { err });
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function updateBulkPrice(barcode: string, newPrice: number, marketplaces: string[]): Promise<Result<number>> {
  try {
    logger.info("inventory.bulk_price_update", { barcode, newPrice, marketplaces });

    const placeholders = marketplaces.map(() => "?").join(",");
    const result = await query<ResultSetHeader>(
      `UPDATE marketplace_listings SET price = ? WHERE barcode = ? AND marketplace IN (${placeholders})`,
      [newPrice, barcode, ...marketplaces]
    );
    return ok(result.affectedRows);
  } catch (err: unknown) {
    logger.error("inventory.bulk_price_update_failed", { barcode, err });
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
}
