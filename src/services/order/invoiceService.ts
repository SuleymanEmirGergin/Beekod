import { pool } from "../../db.js";
import { logger } from "../../logger.js";
import { IInvoice, mapInvoice } from "../../models/Invoice.js";
import { pdfService } from "../pdfService.js";
import { SimulatedEInvoiceProvider } from "../invoice/providers/SimulatedEInvoiceProvider.js";
import { getOrderById } from "./orderService.js";

interface CreateInvoiceDTO {
  invoiceNumber?: string;
  customer: {
    name: string;
    taxId?: string;
    taxOffice?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }[];
  date?: Date | string;
  dueDate?: Date | string;
  currency?: string;
  category?: IInvoice["category"];
  notes?: string;
}

/**
 * Get all invoices with limit
 */
export const getAllInvoices = async (limit: number = 50): Promise<IInvoice[]> => {
  try {
    const [rows] = await pool.query("SELECT * FROM invoices ORDER BY date DESC LIMIT ?", [limit]);
    const invoices = await Promise.all(
      (rows as IInvoice[]).map(async (row: any) => {
        const [items] = await pool.query("SELECT * FROM invoice_items WHERE invoice_id = ?", [row.id]);
        return mapInvoice(row, items as any[]);
      }),
    );
    return invoices;
  } catch (error) {
    logger.error("invoice.get_all_failed", { err: error });
    return [];
  }
};

/**
 * Get invoice by ID
 */
export const getInvoiceById = async (id: string | number): Promise<IInvoice | null> => {
  try {
    const [rows] = await pool.query("SELECT * FROM invoices WHERE id = ?", [id]);
    const invoiceRow = (rows as any[])[0];
    if (!invoiceRow) return null;

    const [items] = await pool.query("SELECT * FROM invoice_items WHERE invoice_id = ?", [id]);
    return mapInvoice(invoiceRow, items as any[]);
  } catch (error) {
    logger.error("invoice.get_by_id_failed", { id, err: error });
    return null;
  }
};

/**
 * Count total invoices for numbering
 */
export const countInvoices = async (): Promise<number> => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) as count FROM invoices");
    return (rows as any[])[0].count || 0;
  } catch (error) {
    logger.error("invoice.count_failed", { err: error });
    return 0;
  }
};

/**
 * Create a new invoice
 */
export const createInvoice = async (data: CreateInvoiceDTO): Promise<IInvoice> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let invoiceNumber = data.invoiceNumber;
    if (!invoiceNumber) {
      const count = await countInvoices();
      const year = new Date().getFullYear();
      invoiceNumber = `INV-${year}-${(count + 1).toString().padStart(6, "0")}`;
    }

    const date = data.date ? new Date(data.date) : new Date();
    const dueDate = data.dueDate ? new Date(data.dueDate) : null;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    const processedItems = data.items.map((item) => {
      const qty = item.quantity || 1;
      const price = item.unitPrice || 0;
      const total = qty * price;
      const taxRate = item.taxRate ?? 20;

      subtotal += total;
      taxAmount += total * (taxRate / 100);

      return {
        description: item.description,
        quantity: qty,
        unitPrice: price,
        total,
        taxRate,
      };
    });

    const totalAmount = subtotal + taxAmount;

    const [invoiceResult] = await connection.query(
      `INSERT INTO invoices (
                invoice_number, date, due_date, customer_name, customer_tax_id, 
                customer_tax_office, customer_address, customer_email, customer_phone,
                subtotal, tax_amount, total_amount, currency, status, category, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNumber,
        date,
        dueDate,
        data.customer.name,
        data.customer.taxId || null,
        data.customer.taxOffice || null,
        data.customer.address || null,
        data.customer.email || null,
        data.customer.phone || null,
        subtotal,
        taxAmount,
        totalAmount,
        data.currency || "TRY",
        "DRAFT",
        data.category || "Diğer",
        data.notes || null,
      ],
    );

    const invoiceId = (invoiceResult as any).insertId;

    for (const item of processedItems) {
      await connection.query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total, tax_rate)
                 VALUES (?, ?, ?, ?, ?, ?)`,
        [invoiceId, item.description, item.quantity, item.unitPrice, item.total, item.taxRate],
      );
    }

    await connection.commit();

    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) throw new Error("Failed to retrieve created invoice");
    return invoice;
  } catch (error) {
    await connection.rollback();
    logger.error("invoice.create_failed", { err: error });
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Update invoice status
 */
export const updateInvoiceStatus = async (id: string | number, status: string): Promise<boolean> => {
  try {
    const [result] = await pool.query("UPDATE invoices SET status = ? WHERE id = ?", [status, id]);
    return (result as any).affectedRows > 0;
  } catch (error) {
    logger.error("invoice.update_status_failed", { id, status, err: error });
    return false;
  }
};

/**
 * Generate mock PDF URL
 */


const eInvoiceProvider = new SimulatedEInvoiceProvider();

/**
 * Generate PDF Buffer
 */
export const getInvoicePdfBuffer = async (id: string | number): Promise<Buffer> => {
  const invoice = await getInvoiceById(id);
  if (!invoice) throw new Error("Invoice not found");
  return await pdfService.createInvoicePdf(invoice);
};

/**
 * Generate PDF URL (Direct download link)
 */
export const generateInvoicePdfUrl = async (id: string | number) => {
  // In a real app with S3, we would check if PDF exists, if not generate and upload.
  // Here we just return the endpoint that generates it on the fly.
  const invoice = await getInvoiceById(id);
  if (!invoice) throw new Error("Invoice not found");

  return {
    url: `/api/invoices/${id}/pdf`,
    mock: false,
    filename: `Invoice-${invoice.invoiceNumber}.pdf`
  };
};

/**
 * Officialise Invoice (E-Fatura)
 */
export const officialiseInvoice = async (id: string | number) => {
  const invoice = await getInvoiceById(id);
  if (!invoice) throw new Error("Invoice not found");

  if (invoice.status === 'SENT' || invoice.status === 'PAID') {
    throw new Error("Invoice already officialised or paid");
  }

  try {
    const result = await eInvoiceProvider.officialiseInvoice(invoice);

    await pool.query(
      "UPDATE invoices SET status = 'SENT', notes = CONCAT(COALESCE(notes, ''), ' [ETTN: ', ?, ']') WHERE id = ?",
      [result.ettn, id]
    );

    return { success: true, ettn: result.ettn, status: 'SENT' };
  } catch (error) {
    logger.error("invoice.officialise_failed", { id, error });
    throw error;
  }
};

/**
 * Helper to create invoices from order IDs
 */
export const createInvoicesFromOrders = async (orderIds: string[]) => {
  const results = {
    success: [] as any[],
    failed: [] as any[],
  };

  for (const orderId of orderIds) {
    try {
      const orderRes = await getOrderById(orderId);
      if (!orderRes.ok) {
        results.failed.push({ orderId, reason: orderRes.error?.message || "Order not found" });
        continue;
      }

      const order = orderRes.value;

      const invoiceItems = order.items.map((item) => {
        const cleanPrice = item.price.replace(/[^\d.]/g, "");
        let unitPrice = parseFloat(cleanPrice);
        if (isNaN(unitPrice)) unitPrice = 0;

        return {
          description: `${item.product_name} (SKU: ${item.sku})`,
          quantity: item.quantity,
          unitPrice: unitPrice,
          taxRate: 20,
        };
      });

      const invoice = await createInvoice({
        customer: {
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone,
          address: order.customer.address,
        },
        items: invoiceItems,
        notes: `Created from Order #${order.requestId}`,
        currency: order.currency,
      });

      results.success.push({ orderId, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber });
    } catch (error: any) {
      results.failed.push({ orderId, reason: error.message });
    }
  }

  return results;
};
