/**
 * Invoices Module Barrel Export
 * @module modules/invoices
 */

// Invoice service
export {
  getAllInvoices,
  getInvoiceById,
  countInvoices,
  createInvoice,
  updateInvoiceStatus,
  getInvoicePdfBuffer,
  generateInvoicePdfUrl,
  officialiseInvoice,
  createInvoicesFromOrders,
} from "../../services/invoiceService.js";

// Invoice store
export {
  getInvoices,
  createInvoiceRecord,
  updateInvoiceRecordStatus,
} from "../../services/invoiceStore.js";
export type { InvoiceRecord, IInvoiceItem } from "../../services/invoiceStore.js";

// PDF service
export { pdfService, PdfService } from "../../services/pdfService.js";

// Routes
export { invoiceRouter } from "../../routes/invoiceRoutes.js";


