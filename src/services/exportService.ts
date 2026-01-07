import { MarketplaceListing, Product, SalesRecord } from "../types.js";

function escapeCsvValue(value: unknown) {
  if (value == null) {
    return "";
  }
  const raw = value instanceof Date ? value.toISOString() : typeof value === "string" ? value : String(value);
  if (raw.includes('"')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  if (raw.includes(",") || raw.includes("\n") || raw.includes("\r")) {
    return `"${raw}"`;
  }
  return raw;
}

function toCsv(headers: string[], rows: Array<Record<string, unknown>>) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    const line = headers.map((header) => escapeCsvValue(row[header])).join(",");
    lines.push(line);
  }
  return `${lines.join("\n")}\n`;
}

export function exportProductsCsv(items: Product[]) {
  const headers = ["barcode", "name", "price", "stock", "currency"];
  return toCsv(
    headers,
    items.map((item) => ({
      barcode: item.barcode,
      name: item.name,
      price: item.price,
      stock: item.stock,
      currency: item.currency,
    })),
  );
}

export function exportMarketplaceListingsCsv(items: MarketplaceListing[]) {
  const headers = ["marketplace", "barcode", "title", "price", "stock", "currency", "active"];
  return toCsv(
    headers,
    items.map((item) => ({
      marketplace: item.marketplace,
      barcode: item.barcode,
      title: item.title,
      price: item.price,
      stock: item.stock,
      currency: item.currency,
      active: item.active ? "true" : "false",
    })),
  );
}

export function exportSalesCsv(items: SalesRecord[]) {
  const headers = ["orderId", "date", "barcode", "quantity", "unitPrice", "currency", "marketplace"];
  return toCsv(
    headers,
    items.map((item) => ({
      orderId: item.orderId,
      date: item.date instanceof Date ? item.date.toISOString().slice(0, 10) : item.date,
      barcode: item.barcode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      currency: item.currency,
      marketplace: item.marketplace,
    })),
  );
}
