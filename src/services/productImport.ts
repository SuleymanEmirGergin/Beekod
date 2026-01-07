import path from "path";
import ExcelJS from "exceljs";
import { upsertProduct } from "./productService.js";

export type ProductImportRow = {
  barcode: string;
  name: string;
  price: number;
  stock: number;
  currency: string;
};

export type ProductImportError = {
  row: number;
  reason: string;
  barcode?: string;
  name?: string;
};

export type ProductImportResult = {
  total: number;
  imported: number;
  skipped: number;
  errors: ProductImportError[];
};

const HEADER_ALIASES: Record<string, keyof ProductImportRow> = {
  barcode: "barcode",
  barkod: "barcode",
  name: "name",
  urun: "name",
  product: "name",
  title: "name",
  baslik: "name",
  price: "price",
  fiyat: "price",
  stock: "stock",
  stok: "stock",
  currency: "currency",
  para: "currency",
  parabirimi: "currency",
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
  const map: Partial<Record<keyof ProductImportRow, number>> = {};
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
    return null;
  }
  const cell = worksheet.getRow(rowNumber).getCell(column);
  const raw = cellToString(cell.value).trim();
  if (!raw) {
    return null;
  }
  const num = Number(raw.replace(",", "."));
  return Number.isFinite(num) ? num : null;
}

function parseWorksheet(worksheet: ExcelJS.Worksheet) {
  const headerMap = buildHeaderMap(worksheet);
  const rows: Array<{ rowNumber: number; data: ProductImportRow }> = [];
  const errors: ProductImportError[] = [];
  const seen = new Set<string>();

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const barcode = readText(worksheet, rowNumber, headerMap.barcode);
    const name = readText(worksheet, rowNumber, headerMap.name);
    if (!barcode && !name) {
      continue;
    }
    if (!barcode || !name) {
      errors.push({ row: rowNumber, reason: "missing_required", barcode, name });
      continue;
    }
    const normalizedBarcode = barcode.toLowerCase();
    if (seen.has(normalizedBarcode)) {
      errors.push({ row: rowNumber, reason: "duplicate_barcode", barcode, name });
      continue;
    }
    seen.add(normalizedBarcode);
    const price = readNumber(worksheet, rowNumber, headerMap.price);
    const stockRaw = readNumber(worksheet, rowNumber, headerMap.stock);
    if (price == null || stockRaw == null) {
      errors.push({
        row: rowNumber,
        reason:
          price == null && stockRaw == null ? "missing_price_stock" : price == null ? "missing_price" : "missing_stock",
        barcode,
        name,
      });
      continue;
    }
    const stock = Math.trunc(stockRaw);
    if (price < 0 || stock < 0) {
      errors.push({ row: rowNumber, reason: "invalid_values", barcode, name });
      continue;
    }
    const currency = readText(worksheet, rowNumber, headerMap.currency) || "TRY";
    rows.push({
      rowNumber,
      data: {
        barcode: normalizedBarcode,
        name,
        price,
        stock,
        currency: currency.toUpperCase(),
      },
    });
  }

  return { rows, errors };
}

async function loadRowsFromFile(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  const workbook = new ExcelJS.Workbook();

  if (ext === ".csv") {
    await workbook.csv.readFile(filePath);
  } else if (ext === ".xlsx") {
    await workbook.xlsx.readFile(filePath);
  } else {
    throw new Error(`Unsupported product import file: ${ext}`);
  }

  const worksheet = workbook.worksheets[0];
  return worksheet ? parseWorksheet(worksheet) : { rows: [], errors: [] };
}

export async function importProductsFromFile(filePath: string): Promise<ProductImportResult> {
  const { rows, errors } = await loadRowsFromFile(filePath);
  let imported = 0;

  for (const row of rows) {
    await upsertProduct(row.data);
    imported += 1;
  }

  return {
    total: rows.length + errors.length,
    imported,
    skipped: errors.length,
    errors: errors.slice(0, 10),
  };
}
