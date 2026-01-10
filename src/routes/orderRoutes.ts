import { Router } from "express";
import { z } from "zod";
import { requireJsonBody } from "../middleware/requireJsonBody.js";
import { validateBody } from "../validation.js";
import { logger } from "../logger.js";
import { getAllOrders, createOrder, getOrderById, updateOrderStatus, updateOrderShipping } from "../services/orderService.js";
import { syncOrdersFromMarketplaces } from "../services/orderSyncService.js";
import { shippingService } from "../services/shippingService.js";

const router = Router();

// Remove global middleware that blocks GET requests
// router.use(requireJsonBody);

const createOrderSchema = z.object({
  source: z.object({
    name: z.string(),
    icon: z.string().optional(),
    color: z.string().optional(),
    logo: z.string().optional(),
  }),
  customer: z.object({
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
  items: z.array(
    z.object({
      name: z.string(),
      sku: z.string(),
      image: z.string().optional(),
      price: z.string(),
      quantity: z.number(),
    }),
  ),
  total: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.string().min(1),
});

// GET /api/orders
router.get("/", async (req, res) => {
  try {
    const orders = await getAllOrders();
    res.json(orders);
  } catch (error) {
    logger.error("orders.list_failed", { err: error });
    res.status(500).json([]); // Return empty array on error for frontend data.map
  }
});

// POST /api/orders/sync
router.post("/sync", requireJsonBody, async (req, res) => {
  try {
    const results = await syncOrdersFromMarketplaces();
    res.json(results);
  } catch (error) {
    logger.error("orders.sync_failed", { err: error });
    res.status(500).json({ error: "Failed to sync orders" });
  }
});

// GET /api/orders/:id
router.get("/:id", async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    logger.error("orders.get_failed", { err: error });
    res.status(500).json({ error: "Failed to get order" });
  }
});

// POST /api/orders
router.post("/", requireJsonBody, validateBody(createOrderSchema), async (req, res) => {
  try {
    const newOrder = await createOrder(req.body);
    res.status(201).json(newOrder);
  } catch (error) {
    logger.error("orders.create_failed", { err: error });
    res.status(500).json({ error: "Failed to create order" });
  }
});

// PUT /api/orders/:id/status
router.put("/:id/status", requireJsonBody, validateBody(updateStatusSchema), async (req, res) => {
  try {
    const updatedOrder = await updateOrderStatus(req.params.id, req.body.status);
    res.json(updatedOrder);
  } catch (error) {
    logger.error("orders.update_status_failed", { err: error });
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// POST /api/orders/:id/shipping-label
router.post("/:id/shipping-label", requireJsonBody, async (req, res) => {
  const { provider } = req.body; // 'Yurtici', 'Aras', 'MNG'
  if (!provider) return res.status(400).json({ error: "Shipping provider required" });

  try {
    const labelResult = await shippingService.generateLabel(req.params.id, provider);
    const updatedOrder = await updateOrderShipping(req.params.id, labelResult);
    res.json({ success: true, order: updatedOrder, shipping: labelResult });
  } catch (error) {
    logger.error("orders.shipping_label_failed", { err: error, id: req.params.id });
    res.status(500).json({ error: "Failed to generate shipping label" });
  }
});

export { router as orderRouter };
