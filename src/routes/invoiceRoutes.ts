import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { requireJsonBody } from "../middleware/requireJsonBody.js";
import { validateBody } from "../validation.js";
import { logger } from "../logger.js";
import { scanInvoiceImage } from "../services/aiScannerService.js";
import {
  getAllInvoices,
  createInvoice,
  getInvoiceById,
  updateInvoiceStatus,
  generateInvoicePdfUrl,
  createInvoicesFromOrders,
  officialiseInvoice,
  getInvoicePdfBuffer
} from "../services/invoiceService.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Middleware skip for scan route which is multipart
const jsonOrMultipartMiddleware = (req: any, res: any, next: any) => {
  if (req.path === "/invoices/scan") return next();
  requireJsonBody(req, res, next);
};

router.use(jsonOrMultipartMiddleware);

const createInvoiceSchema = z.object({
  invoiceNumber: z.string().optional(),
  customer: z.object({
    name: z.string().min(1),
    taxId: z.string().optional(),
    taxOffice: z.string().optional(),
    address: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
  }),
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
        taxRate: z.number().optional(),
      }),
    )
    .min(1),
  date: z.string().optional(),
  dueDate: z.string().optional(),
  currency: z.enum(["TRY", "USD", "EUR"]).optional(),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "CANCELLED", "OVERDUE"]),
});

// GET /api/invoices
router.get("/invoices", async (req, res) => {
  try {
    const invoices = await getAllInvoices();
    res.json(invoices);
  } catch (error) {
    logger.error("invoices.list_failed", { err: error });
    res.status(500).json({ error: "Failed to list invoices" });
  }
});

// GET /api/invoices/:id
router.get("/invoices/:id", async (req, res) => {
  try {
    const invoice = await getInvoiceById(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    logger.error("invoices.get_failed", { err: error });
    res.status(500).json({ error: "Failed to get invoice" });
  }
});

// POST /api/invoices
router.post("/invoices", validateBody(createInvoiceSchema), async (req, res) => {
  try {
    const newInvoice = await createInvoice(req.body);
    res.status(201).json(newInvoice);
  } catch (error) {
    logger.error("invoices.create_failed", { err: error });
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

// PUT /api/invoices/:id/status
router.put("/invoices/:id/status", validateBody(updateStatusSchema), async (req, res) => {
  try {
    const updated = await updateInvoiceStatus(req.params.id, req.body.status);
    if (!updated) return res.status(404).json({ error: "Invoice not found" });
    res.json(updated);
  } catch (error) {
    logger.error("invoices.update_status_failed", { err: error });
    res.status(500).json({ error: "Failed to update invoice status" });
  }
});


// ... existing code ...

// GET /api/invoices/:id/pdf
router.get("/invoices/:id/pdf", async (req, res) => {
  try {
    const pdfBuffer = await getInvoicePdfBuffer(req.params.id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      // 'Content-Disposition': `attachment; filename="Invoice-${req.params.id}.pdf"` // Optional: force download
    });

    res.send(pdfBuffer);
  } catch (error) {
    logger.error("invoices.pdf_failed", { err: error, id: req.params.id });
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// POST /api/invoices/:id/officialise
router.post("/invoices/:id/officialise", async (req, res) => {
  try {
    const result = await officialiseInvoice(req.params.id);
    res.json(result);
  } catch (error: any) {
    logger.error("invoices.officialise_route_failed", { err: error, id: req.params.id });
    res.status(500).json({ error: error.message || "Officialization failed" });
  }
});
// POST /api/invoices/bulk-from-orders
router.post("/invoices/bulk-from-orders", async (req, res) => {
  try {
    const { orderIds } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: "orderIds array is required" });
    }

    const results = await createInvoicesFromOrders(orderIds);
    res.json(results);
  } catch (error) {
    logger.error("invoices.bulk_create_failed", { err: error });
    res.status(500).json({ error: "Failed to create bulk invoices" });
  }
});

router.post("/invoices/scan", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const scannedData = await scanInvoiceImage(req.file.buffer, req.file.mimetype);
    if (!scannedData) {
      return res.status(500).json({ error: "Failed to scan invoice via AI" });
    }

    res.json(scannedData);
  } catch (error) {
    logger.error("invoices.scan_failed", { err: error });
    res.status(500).json({ error: "An unexpected error occurred during scan" });
  }
});

export { router as invoiceRouter };
