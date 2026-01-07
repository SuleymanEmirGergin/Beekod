import fs from "fs/promises";
import path from "path";
import { config } from "../config.js";
import crypto from "crypto";

const INVOICE_DATA_PATH = "data/invoices.json";

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate: number;
}

export interface InvoiceRecord {
  _id: string; // Using _id to match frontend expectations often used with Mongo
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  customer: {
    name: string;
    taxId?: string;
    taxOffice?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  items: IInvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED" | "OVERDUE";
  category?: "Lojistik" | "Ürün Tedariği" | "Hizmet" | "Ofis Giderleri" | "Pazarlama" | "Diğer";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Ensure directory exists
const ensureDir = async () => {
  const dir = path.dirname(INVOICE_DATA_PATH);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

// Load invoices from file
const loadInvoices = async (): Promise<InvoiceRecord[]> => {
  try {
    await ensureDir();
    const data = await fs.readFile(INVOICE_DATA_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or error, return empty array
    return [];
  }
};

// Save invoices to file
const saveInvoices = async (invoices: InvoiceRecord[]) => {
  await ensureDir();
  await fs.writeFile(INVOICE_DATA_PATH, JSON.stringify(invoices, null, 2), "utf-8");
};

export const getInvoices = async (): Promise<InvoiceRecord[]> => {
  return loadInvoices();
};

export const getInvoiceById = async (id: string): Promise<InvoiceRecord | undefined> => {
  const invoices = await loadInvoices();
  return invoices.find((inv) => inv._id === id);
};

export const createInvoiceRecord = async (
  data: Omit<InvoiceRecord, "_id" | "createdAt" | "updatedAt">,
): Promise<InvoiceRecord> => {
  const invoices = await loadInvoices();
  const newInvoice: InvoiceRecord = {
    ...data,
    _id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  invoices.unshift(newInvoice); // Add to beginning
  await saveInvoices(invoices);
  return newInvoice;
};

export const updateInvoiceRecordStatus = async (
  id: string,
  status: InvoiceRecord["status"],
): Promise<InvoiceRecord | null> => {
  const invoices = await loadInvoices();
  const index = invoices.findIndex((inv) => inv._id === id);
  if (index === -1) return null;

  invoices[index].status = status;
  invoices[index].updatedAt = new Date().toISOString();

  await saveInvoices(invoices);
  return invoices[index];
};

export const countInvoices = async (): Promise<number> => {
  const invoices = await loadInvoices();
  return invoices.length;
};
