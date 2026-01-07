import fs from "fs/promises";
import path from "path";
import ExcelJS from "exceljs";
import { config } from "../config.js";
import { MarketplaceListing, MarketplaceStats } from "../types.js";

let cache: MarketplaceListing[] | null = null;
let loading: Promise<MarketplaceListing[]> | null = null;
let cachedMtimeMs: number | null = null;

const HEADER_ALIASES: Record<string, keyof MarketplaceListing> = {
  marketplace: "marketplace",
  pazaryeri: "marketplace",
  barcode: "barcode",
  barkod: "barcode",
  price: "price",
  fiyat: "price",
  stock: "stock",
  stok: "stock",
  currency: "currency",
  title: "title",
  baslik: "title",
  name: "title",
  active: "active",
  status: "active",
  durum: "active",
  aktif: "active",
  pasif: "active",
  enabled: "active",
  disabled: "active",
};

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function cellToString(value: ExcelJS.CellValue) {
  if (value == null) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      return value.text;
    }
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("formula" in value && "result" in value) {
      return value.result == null ? "" : String(value.result);
    }
    if ("hyperlink" in value && typeof value.text === "string") {
      return value.text;
    }
  }
  return String(value);
}

function buildHeaderMap(worksheet: ExcelJS.Worksheet) {
  const map: Partial<Record<keyof MarketplaceListing, number>> = {};
  const headerRow = worksheet.getRow(1);

  headerRow.eachCell((cell, column) => {
    const raw = cellToString(cell.value);
    const normalized = normalizeHeader(raw);
    const alias = HEADER_ALIASES[normalized];
    if (alias) {
      map[alias] = column;
    }
  });

  return map;
}

function readText(worksheet: ExcelJS.Worksheet, rowNumber: number, column?: number) {
  if (!column) {
    return "";
  }
  const cell = worksheet.getRow(rowNumber).getCell(column);
  return cellToString(cell.value).trim();
}

function readNumber(worksheet: ExcelJS.Worksheet, rowNumber: number, column?: number) {
  if (!column) {
    return 0;
  }
  const cell = worksheet.getRow(rowNumber).getCell(column);
  const raw = cellToString(cell.value).replace(",", ".");
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
}

function readBoolean(worksheet: ExcelJS.Worksheet, rowNumber: number, column?: number) {
  if (!column) {
    return true;
  }
  const cell = worksheet.getRow(rowNumber).getCell(column);
  const raw = cellToString(cell.value).trim().toLowerCase();
  if (!raw) {
    return true;
  }
  if (["1", "true", "aktif", "active", "yes", "evet", "enabled"].includes(raw)) {
    return true;
  }
  if (["0", "false", "pasif", "inactive", "no", "hayir", "disabled"].includes(raw)) {
    return false;
  }
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    return numeric > 0;
  }
  return true;
}

function parseWorksheet(worksheet: ExcelJS.Worksheet): MarketplaceListing[] {
  const headerMap = buildHeaderMap(worksheet);
  const rows: MarketplaceListing[] = [];

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const barcode = readText(worksheet, rowNumber, headerMap.barcode);
    if (!barcode) {
      continue;
    }
    const listing: MarketplaceListing = {
      marketplace: readText(worksheet, rowNumber, headerMap.marketplace),
      barcode,
      price: readNumber(worksheet, rowNumber, headerMap.price),
      stock: Math.trunc(readNumber(worksheet, rowNumber, headerMap.stock)),
      currency: readText(worksheet, rowNumber, headerMap.currency) || "TRY",
      title: readText(worksheet, rowNumber, headerMap.title),
      active: readBoolean(worksheet, rowNumber, headerMap.active),
    };
    rows.push(listing);
  }

  return rows;
}

const OUTPUT_HEADERS: Array<keyof MarketplaceListing> = [
  "marketplace",
  "barcode",
  "price",
  "stock",
  "currency",
  "title",
  "active",
];

function normalizeMarketplace(value: string) {
  return value.trim().toLowerCase();
}

async function saveData(rows: MarketplaceListing[]): Promise<void> {
  const filePath = path.resolve(config.data.marketplacePath);
  const ext = path.extname(filePath).toLowerCase();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Marketplace");
  worksheet.addRow(OUTPUT_HEADERS);

  for (const row of rows) {
    worksheet.addRow([
      row.marketplace,
      row.barcode,
      row.price,
      row.stock,
      row.currency,
      row.title,
      row.active ? "active" : "inactive",
    ]);
  }

  if (ext === ".csv") {
    await workbook.csv.writeFile(filePath);
  } else if (ext === ".xlsx") {
    await workbook.xlsx.writeFile(filePath);
  } else {
    throw new Error(`Unsupported marketplace data file: ${ext}`);
  }
}

async function loadDataFromPath(filePath: string): Promise<MarketplaceListing[]> {
  const ext = path.extname(filePath).toLowerCase();
  const workbook = new ExcelJS.Workbook();

  if (ext === ".csv") {
    await workbook.csv.readFile(filePath);
  } else if (ext === ".xlsx") {
    await workbook.xlsx.readFile(filePath);
  } else {
    throw new Error(`Unsupported marketplace data file: ${ext}`);
  }

  const worksheet = workbook.worksheets[0];
  return worksheet ? parseWorksheet(worksheet) : [];
}

async function loadData(): Promise<MarketplaceListing[]> {
  const filePath = path.resolve(config.data.marketplacePath);
  if (loading) {
    return loading;
  }

  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch (error) {
    throw new Error(`Marketplace data not found at ${filePath}`);
  }

  if (cache && cachedMtimeMs === stat.mtimeMs) {
    return cache;
  }

  loading = (async () => {
    try {
      const rows = await loadDataFromPath(filePath);
      cache = rows;
      cachedMtimeMs = stat.mtimeMs;
      return rows;
    } finally {
      loading = null;
    }
  })();

  return loading;
}

export async function getMarketplaceListings(barcode?: string): Promise<MarketplaceListing[]> {
  const data = await loadData();
  if (!barcode) {
    return data;
  }
  const target = barcode.toLowerCase();
  return data.filter((row) => row.barcode.toLowerCase() === target);
}

export async function loadMarketplaceFromFile(filePath: string): Promise<MarketplaceListing[]> {
  const resolved = path.resolve(filePath);
  return loadDataFromPath(resolved);
}

export async function getMarketplaceListing(barcode: string, marketplace: string): Promise<MarketplaceListing | null> {
  const data = await loadData();
  const targetBarcode = barcode.toLowerCase();
  const targetMarketplace = normalizeMarketplace(marketplace);
  return (
    data.find(
      (row) =>
        row.barcode.toLowerCase() === targetBarcode && normalizeMarketplace(row.marketplace) === targetMarketplace,
    ) ?? null
  );
}

export async function upsertMarketplaceListing(listing: MarketplaceListing): Promise<MarketplaceListing> {
  const data = await loadData();
  const targetBarcode = listing.barcode.toLowerCase();
  const targetMarketplace = normalizeMarketplace(listing.marketplace);
  const index = data.findIndex(
    (row) => row.barcode.toLowerCase() === targetBarcode && normalizeMarketplace(row.marketplace) === targetMarketplace,
  );

  if (index >= 0) {
    data[index] = { ...data[index], ...listing };
  } else {
    data.push(listing);
  }

  await saveData(data);
  cache = data;
  try {
    const stat = await fs.stat(path.resolve(config.data.marketplacePath));
    cachedMtimeMs = stat.mtimeMs;
  } catch {
    cachedMtimeMs = null;
  }
  loading = null;
  return listing;
}

export async function upsertMarketplaceListings(listings: MarketplaceListing[]): Promise<MarketplaceListing[]> {
  if (!listings.length) {
    return [];
  }
  const data = await loadData();

  for (const listing of listings) {
    const targetBarcode = listing.barcode.toLowerCase();
    const targetMarketplace = normalizeMarketplace(listing.marketplace);
    const index = data.findIndex(
      (row) =>
        row.barcode.toLowerCase() === targetBarcode && normalizeMarketplace(row.marketplace) === targetMarketplace,
    );

    if (index >= 0) {
      data[index] = { ...data[index], ...listing };
    } else {
      data.push(listing);
    }
  }

  await saveData(data);
  cache = data;
  try {
    const stat = await fs.stat(path.resolve(config.data.marketplacePath));
    cachedMtimeMs = stat.mtimeMs;
  } catch {
    cachedMtimeMs = null;
  }
  loading = null;
  return listings;
}

export function resetMarketplaceCache() {
  cache = null;
  loading = null;
  cachedMtimeMs = null;
}

export async function getMarketplaceStats(): Promise<MarketplaceStats[]> {
  const data = await loadData();
  const summary = new Map<string, MarketplaceStats>();
  for (const row of data) {
    const key = row.marketplace.trim() || "Unknown";
    const current =
      summary.get(key) ??
      ({
        marketplace: key,
        total: 0,
        active: 0,
        inactive: 0,
      } satisfies MarketplaceStats);
    current.total += 1;
    if (row.active) {
      current.active += 1;
    } else {
      current.inactive += 1;
    }
    summary.set(key, current);
  }

  return Array.from(summary.values()).sort((a, b) => a.marketplace.localeCompare(b.marketplace));
}
