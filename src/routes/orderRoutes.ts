import { Router } from "express";
import { z } from "zod";
import { requireJsonBody } from "../middleware/requireJsonBody.js";
import { validateBody } from "../validation.js";
import { logger } from "../logger.js";
import { getAllOrders, createOrder, getOrderById, updateOrderStatus, updateOrderShipping } from "../services/order/orderService.js";
import { syncOrdersFromMarketplaces } from "../services/order/orderSyncService.js";
import { shippingService } from "../services/order/shippingService.js";

const router = Router();

router.use(requireJsonBody);

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

// GET /api/orders/shipping/stats
router.get("/shipping/stats", async (req, res) => {
  try {
      const stats = await shippingService.getStats();
      res.json(stats);
  } catch (error) {
      logger.error("orders.shipping_stats_failed", { err: error });
      res.status(500).json({ error: "Failed to get shipping stats" });
  }
});

// GET /api/orders
router.get("/", async (req, res) => {
  try {
    const ordersRes = await getAllOrders();
    res.handleResult(ordersRes);
  } catch (error) {
    logger.error("orders.list_failed", { err: error });
    res.status(500).json([]);
  }
});

// POST /api/orders/sync
router.post("/sync", async (req, res) => {
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
    const orderRes = await getOrderById(req.params.id);
    res.handleResult(orderRes, { notFoundMessage: "Order not found" });
  } catch (error) {
    logger.error("orders.get_failed", { err: error });
    res.status(500).json({ error: "Failed to get order" });
  }
});

// POST /api/orders
router.post("/", validateBody(createOrderSchema), async (req, res) => {
  try {
    const newOrderRes = await createOrder(req.body);
    res.handleResult(newOrderRes, { successStatus: 201 });
  } catch (error) {
    logger.error("orders.create_failed", { err: error });
    res.status(500).json({ error: "Failed to create order" });
  }
});

// PUT /api/orders/:id/status
router.put("/:id/status", validateBody(updateStatusSchema), async (req, res) => {
  try {
    const updatedOrderRes = await updateOrderStatus(req.params.id, req.body.status);
    res.handleResult(updatedOrderRes);
  } catch (error) {
    logger.error("orders.update_status_failed", { err: error });
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// POST /api/orders/:id/shipping-label
router.post("/:id/shipping-label", async (req, res) => {
  const { provider } = req.body; // 'Yurtici', 'Aras', 'MNG'
  if (!provider) return res.status(400).json({ error: "Shipping provider required" });

  try {
    const labelResult = await shippingService.generateLabel(req.params.id, provider);
    const updatedOrderRes = await updateOrderShipping(req.params.id, labelResult);
    if (!updatedOrderRes.ok) {
      return res.status(500).json({ error: updatedOrderRes.error?.message || "Failed to update shipping" });
    }
    res.json({ success: true, order: updatedOrderRes.value, shipping: labelResult });
  } catch (error) {
    logger.error("orders.shipping_label_failed", { err: error, id: req.params.id });
    res.status(500).json({ error: "Failed to generate shipping label" });
  }
});

export { router as orderRouter };
