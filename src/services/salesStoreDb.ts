import { cacheDel, cacheGetJson, cacheSetJson } from "../cache/redisCache.js";
import { query } from "../db.js";
import { SalesRecord } from "../types.js";

type SalesRow = {
  order_id: string;
  order_date: string | Date;
  barcode: string;
  quantity: number;
  unit_price: number;
  currency: string;
  marketplace: string;
};

const CACHE_TTL_SECONDS = Number(process.env.CACHE_SALES_TTL_SECONDS ?? 60);

function cacheKey() {
  return "sales:records:all";
}

function parseDate(value: string | Date) {
  if (!value) {
    return new Date(0);
  }
  if (value instanceof Date) {
    return value;
  }
  const normalized = value.includes("T") ? value : `${value}T00:00:00`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function normalizeRecord(record: SalesRecord) {
  const rawDate = record.date instanceof Date ? record.date : new Date(record.date);
  const safeDate = Number.isNaN(rawDate.getTime()) ? new Date(0) : rawDate;
  return {
    orderId: record.orderId?.trim() || "",
    date: safeDate,
    barcode: record.barcode.trim().toLowerCase(),
    quantity: Math.max(0, Math.trunc(Number(record.quantity ?? 0))),
    unitPrice: Number(record.unitPrice ?? 0),
    currency: record.currency?.trim().toUpperCase() || "TRY",
    marketplace: record.marketplace?.trim() || "",
  };
}

export async function getSalesRecords(): Promise<SalesRecord[]> {
  if (Number.isFinite(CACHE_TTL_SECONDS) && CACHE_TTL_SECONDS > 0) {
    const cached = await cacheGetJson<SalesRecord[]>(cacheKey());
    if (cached) {
      return cached;
    }
  }
  const rows = await query<SalesRow[]>(
    `SELECT order_id, order_date, barcode, quantity, unit_price, currency, marketplace
     FROM sales_records
     ORDER BY order_date DESC, id DESC`,
  );

  const mapped = rows.map((row) => ({
    orderId: row.order_id,
    date: parseDate(row.order_date),
    barcode: row.barcode,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    currency: row.currency,
    marketplace: row.marketplace ?? "",
  }));
  if (Number.isFinite(CACHE_TTL_SECONDS) && CACHE_TTL_SECONDS > 0) {
    await cacheSetJson(cacheKey(), mapped, CACHE_TTL_SECONDS);
  }
  return mapped;
}

export async function insertSalesRecords(records: SalesRecord[]): Promise<number> {
  if (!records.length) {
    return 0;
  }

  const normalized = records.map(normalizeRecord);
  const values = normalized.map((record) => [
    record.orderId,
    record.date.toISOString().slice(0, 10),
    record.barcode,
    record.quantity,
    record.unitPrice,
    record.currency,
    record.marketplace,
  ]);

  await query(
    `INSERT INTO sales_records (order_id, order_date, barcode, quantity, unit_price, currency, marketplace)
     VALUES ?`,
    [values],
  );

  if (Number.isFinite(CACHE_TTL_SECONDS) && CACHE_TTL_SECONDS > 0) {
    await cacheDel(cacheKey());
  }
  return normalized.length;
}

export async function clearSalesRecords() {
  await query("DELETE FROM sales_records");
  if (Number.isFinite(CACHE_TTL_SECONDS) && CACHE_TTL_SECONDS > 0) {
    await cacheDel(cacheKey());
  }
}

export async function resetSalesCache() {
  if (Number.isFinite(CACHE_TTL_SECONDS) && CACHE_TTL_SECONDS > 0) {
    await cacheDel(cacheKey());
  }
}
