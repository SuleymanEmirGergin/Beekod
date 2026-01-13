import { getAllProducts } from "./product/productService.js";
import { getSalesRecords } from "./salesStore.js";
import { Product, SalesRecord } from "../types.js";

type Issue = {
  type: string;
  message: string;
  barcode?: string;
  orderId?: string;
};

type SectionReport = {
  total: number;
  invalid: number;
  issues: Issue[];
  issuesByType: Record<string, number>;
  duplicates?: string[];
  missingProducts?: number;
};

export type DataQualityReport = {
  generatedAt: string;
  products: SectionReport;
  sales: SectionReport;
};

const ISSUE_LIMIT = 50;

function addIssue(report: { issues: Issue[]; issuesByType: Record<string, number> }, issue: Issue) {
  report.issuesByType[issue.type] = (report.issuesByType[issue.type] ?? 0) + 1;
  if (report.issues.length < ISSUE_LIMIT) {
    report.issues.push(issue);
  }
}

function validateProducts(products: Product[]) {
  const report: SectionReport = {
    total: products.length,
    invalid: 0,
    issues: [],
    issuesByType: {},
  };
  const barcodeCounts = new Map<string, number>();
  for (const product of products) {
    const barcode = product.barcode?.trim().toLowerCase() || "";
    barcodeCounts.set(barcode, (barcodeCounts.get(barcode) ?? 0) + 1);
    let invalid = false;
    if (!barcode) {
      addIssue(report, { type: "missing_barcode", message: "Missing barcode" });
      invalid = true;
    }
    if (!product.name?.trim()) {
      addIssue(report, { type: "missing_name", message: "Missing name", barcode });
      invalid = true;
    }
    if (!Number.isFinite(product.price) || product.price < 0) {
      addIssue(report, { type: "invalid_price", message: "Invalid price", barcode });
      invalid = true;
    }
    if (!Number.isFinite(product.stock) || product.stock < 0) {
      addIssue(report, { type: "invalid_stock", message: "Invalid stock", barcode });
      invalid = true;
    }
    if (!product.currency?.trim()) {
      addIssue(report, { type: "missing_currency", message: "Missing currency", barcode });
      invalid = true;
    }
    if (invalid) {
      report.invalid += 1;
    }
  }

  const duplicates = Array.from(barcodeCounts.entries())
    .filter(([barcode, count]) => barcode && count > 1)
    .map(([barcode]) => barcode)
    .slice(0, ISSUE_LIMIT);
  if (duplicates.length) {
    report.duplicates = duplicates;
    report.issuesByType.duplicate_barcode = duplicates.length;
  }

  return report;
}

function normalizeDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateSales(records: SalesRecord[], knownBarcodes: Set<string>) {
  const report: SectionReport = {
    total: records.length,
    invalid: 0,
    issues: [],
    issuesByType: {},
  };
  let missingProducts = 0;

  for (const record of records) {
    const barcode = record.barcode?.trim().toLowerCase() || "";
    const orderId = record.orderId?.trim() || "";
    let invalid = false;
    if (!orderId) {
      addIssue(report, { type: "missing_order_id", message: "Missing orderId", barcode });
      invalid = true;
    }
    if (!barcode) {
      addIssue(report, { type: "missing_barcode", message: "Missing barcode", orderId });
      invalid = true;
    }
    if (!normalizeDate(record.date)) {
      addIssue(report, { type: "invalid_date", message: "Invalid date", barcode, orderId });
      invalid = true;
    }
    if (!Number.isFinite(record.quantity) || record.quantity <= 0) {
      addIssue(report, { type: "invalid_quantity", message: "Invalid quantity", barcode, orderId });
      invalid = true;
    }
    if (!Number.isFinite(record.unitPrice) || record.unitPrice < 0) {
      addIssue(report, { type: "invalid_unit_price", message: "Invalid unit price", barcode, orderId });
      invalid = true;
    }
    if (!record.currency?.trim()) {
      addIssue(report, { type: "missing_currency", message: "Missing currency", barcode, orderId });
      invalid = true;
    }
    if (!record.marketplace?.trim()) {
      addIssue(report, { type: "missing_marketplace", message: "Missing marketplace", barcode, orderId });
      invalid = true;
    }
    if (barcode && !knownBarcodes.has(barcode)) {
      missingProducts += 1;
      addIssue(report, { type: "unknown_product", message: "Barcode not found in products", barcode, orderId });
    }
    if (invalid) {
      report.invalid += 1;
    }
  }

  report.missingProducts = missingProducts;
  return report;
}

export async function generateDataQualityReport() {
  const productsResult = await getAllProducts(5000);
  if (!productsResult.ok) throw productsResult.error;
  const products = productsResult.value;
  const sales = await getSalesRecords();
  const productReport = validateProducts(products);
  const barcodeSet = new Set(products.map((item) => item.barcode.toLowerCase()));
  const salesReport = validateSales(sales, barcodeSet);
  return {
    generatedAt: new Date().toISOString(),
    products: productReport,
    sales: salesReport,
  } satisfies DataQualityReport;
}
