import { config } from "../config.js";
import { SalesRecord } from "../types.js";
import * as db from "./salesStoreDb.js";
import * as mock from "./salesMock.js";

const store = config.stores.sales;

export function isSalesStoreDb() {
  return store === "db";
}

export async function getSalesRecords(): Promise<SalesRecord[]> {
  return store === "db" ? db.getSalesRecords() : mock.getSalesRecords();
}

export async function insertSalesRecords(records: SalesRecord[]): Promise<number> {
  if (store === "db") {
    return db.insertSalesRecords(records);
  }
  return records.length;
}

export async function clearSalesRecords() {
  if (store === "db") {
    await db.clearSalesRecords();
  }
}

export async function loadSalesFromFile(filePath: string): Promise<SalesRecord[]> {
  return mock.loadSalesFromFile(filePath);
}

export function resetSalesCache() {
  if (store === "db") {
    void db.resetSalesCache();
    return;
  }
  mock.resetSalesCache();
}
