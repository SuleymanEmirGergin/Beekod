import fs from "fs/promises";
import path from "path";
import ExcelJS from "exceljs";
import { config } from "../config.js";
import { SalesRecord } from "../types.js";

let cache: SalesRecord[] | null = null;
let loading: Promise<SalesRecord[]> | null = null;
let cachedMtimeMs: number | null = null;

const HEADER_ALIASES: Record<string, keyof SalesRecord> = {
  orderid: "orderId",
  order_id: "orderId",
  order: "orderId",
  siparis: "orderId",
  date: "date",
  orderdate: "date",
  order_date: "date",
  createdat: "date",
  barcode: "barcode",
  barkod: "barcode",
  quantity: "quantity",
  qty: "quantity",
  adet: "quantity",
  unitprice: "unitPrice",
  unit_price: "unitPrice",
  price: "unitPrice",
  birimfiyat: "unitPrice",
  currency: "currency",
  para: "currency",
  parabirimi: "currency",
  marketplace: "marketplace",
  pazaryeri: "marketplace",
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

function excelDateToJSDate(serial: number) {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  const dateInfo = new Date(utcValue * 1000);
  return new Date(dateInfo.getFullYear(), dateInfo.getMonth(), dateInfo.getDate());
}

function cellToDate(value: ExcelJS.CellValue): Date | null {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "number") {
    return excelDateToJSDate(value);
  }
  if (typeof value === "object" && value && "result" in value) {
    const result = value.result;
    if (result instanceof Date) {
      return result;
    }
    if (typeof result === "number") {
      return excelDateToJSDate(result);
    }
    if (typeof result === "string") {
      const parsed = new Date(result);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function buildHeaderMap(worksheet: ExcelJS.Worksheet) {
  const map: Partial<Record<keyof SalesRecord, number>> = {};
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

function readDate(worksheet: ExcelJS.Worksheet, rowNumber: number, column?: number) {
  if (!column) {
    return null;
  }
  const cell = worksheet.getRow(rowNumber).getCell(column);
  return cellToDate(cell.value);
}

function parseWorksheet(worksheet: ExcelJS.Worksheet): SalesRecord[] {
  const headerMap = buildHeaderMap(worksheet);
  const rows: SalesRecord[] = [];

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const barcode = readText(worksheet, rowNumber, headerMap.barcode);
    if (!barcode) {
      continue;
    }
    const date = readDate(worksheet, rowNumber, headerMap.date);
    if (!date) {
      continue;
    }
    const record: SalesRecord = {
      orderId: readText(worksheet, rowNumber, headerMap.orderId) || `${rowNumber}`,
      date,
      barcode,
      quantity: Math.trunc(readNumber(worksheet, rowNumber, headerMap.quantity)),
      unitPrice: readNumber(worksheet, rowNumber, headerMap.unitPrice),
      currency: readText(worksheet, rowNumber, headerMap.currency) || "TRY",
      marketplace: readText(worksheet, rowNumber, headerMap.marketplace),
    };
    rows.push(record);
  }

  return rows;
}

async function loadDataFromPath(filePath: string): Promise<SalesRecord[]> {
  const ext = path.extname(filePath).toLowerCase();
  const workbook = new ExcelJS.Workbook();

  if (ext === ".csv") {
    await workbook.csv.readFile(filePath);
  } else if (ext === ".xlsx") {
    await workbook.xlsx.readFile(filePath);
  } else {
    throw new Error(`Unsupported sales data file: ${ext}`);
  }

  const worksheet = workbook.worksheets[0];
  return worksheet ? parseWorksheet(worksheet) : [];
}

async function loadData(): Promise<SalesRecord[]> {
  const filePath = path.resolve(config.data.salesPath);
  if (loading) {
    return loading;
  }

  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch (error) {
    throw new Error(`Sales data not found at ${filePath}`);
  }

  if (cache && cachedMtimeMs === stat.mtimeMs) {
    return cache;
  }

  loading = (async () => {
    const rows = await loadDataFromPath(filePath);
    cache = rows;
    cachedMtimeMs = stat.mtimeMs;
    loading = null;
    return rows;
  })();

  return loading;
}

export async function getSalesRecords(): Promise<SalesRecord[]> {
  return loadData();
}

export async function loadSalesFromFile(filePath: string): Promise<SalesRecord[]> {
  const resolved = path.resolve(filePath);
  return loadDataFromPath(resolved);
}

export function resetSalesCache() {
  cache = null;
  loading = null;
  cachedMtimeMs = null;
}
