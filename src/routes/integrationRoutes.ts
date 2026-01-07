import { Router } from "express";
import { z } from "zod";
import { requireJsonBody } from "../middleware/requireJsonBody.js";
import { validateBody } from "../validation.js";
import { logger } from "../logger.js";
import {
  getAllIntegrations,
  connectIntegration,
  disconnectIntegration,
  updateIntegrationConfig,
} from "../services/integrationService.js";

const router = Router();

router.use(requireJsonBody);

const connectSchema = z
  .object({
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    supplierId: z.string().optional(),
    merchantId: z.string().optional(),
    // Add other potential credential fields here
  })
  .passthrough(); // Allow other provider-specific fields

const configSchema = z
  .object({
    syncProducts: z.boolean().optional(),
    syncOrders: z.boolean().optional(),
    autoSyncFrequency: z.string().optional(),
    autoPriceUpdates: z.boolean().optional(),
    stockNotifications: z.boolean().optional(),
    orderAutoImport: z.boolean().optional(),
  })
  .passthrough();

// GET /api/integrations
router.get("/integrations", async (req, res) => {
  try {
    const integrations = await getAllIntegrations();
    res.json(integrations);
  } catch (error) {
    logger.error("integrations.list_failed", { err: error });
    res.status(500).json({ error: "Failed to list integrations" });
  }
});

// POST /api/integrations/:id/connect
router.post("/integrations/:id/connect", validateBody(connectSchema), async (req, res) => {
  try {
    const integration = await connectIntegration(req.params.id, req.body);
    res.json(integration);
  } catch (error) {
    logger.error("integrations.connect_failed", { err: error });
    res.status(500).json({ error: "Failed to connect integration" });
  }
});

// POST /api/integrations/:id/disconnect
router.post("/integrations/:id/disconnect", async (req, res) => {
  try {
    const integration = await disconnectIntegration(req.params.id);
    res.json(integration);
  } catch (error) {
    logger.error("integrations.disconnect_failed", { err: error });
    res.status(500).json({ error: "Failed to disconnect integration" });
  }
});

// PUT /api/integrations/:id/config
router.put("/integrations/:id/config", validateBody(configSchema), async (req, res) => {
  try {
    const integration = await updateIntegrationConfig(req.params.id, req.body);
    res.json(integration);
  } catch (error) {
    logger.error("integrations.update_config_failed", { err: error });
    res.status(500).json({ error: "Failed to update integration config" });
  }
});

export { router as integrationRouter };
