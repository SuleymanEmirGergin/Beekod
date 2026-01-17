import { Router } from "express";
import { requireAdminKey } from "../middleware/adminKey.js";
import { requireJsonBody } from "../middleware/requireJsonBody.js";
import { validateBody } from "../validation/middleware.js";
import { logger } from "../logger.js";
import { 
  createCampaign, 
  getCampaigns, 
  getCampaignById, 
  updateCampaign, 
  launchCampaign, 
  getCampaignStats,
  createCampaignSchema,
  updateCampaignSchema
} from "../services/campaignService.js";

const router = Router();

router.use(requireJsonBody);

// GET /api/campaigns
router.get("/", requireAdminKey, async (req, res) => {
  try {
    const campaigns = await getCampaigns();
    res.json(campaigns);
  } catch (error) {
    logger.error("campaigns.list_failed", { err: error });
    res.status(500).json({ error: "Failed to list campaigns" });
  }
});

// GET /api/campaigns/stats-summary
router.get("/stats-summary", requireAdminKey, async (req, res) => {
    try {
        const stats = await getCampaignStats();
        res.json(stats);
    } catch (error) {
        logger.error("campaigns.stats_failed", { err: error });
        res.status(500).json({ error: "Failed to get stats" });
    }
});

// GET /api/campaigns/:id
router.get("/:id", requireAdminKey, async (req, res) => {
  try {
    const campaign = await getCampaignById(req.params.id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    res.json(campaign);
  } catch (error) {
    logger.error("campaigns.get_failed", { err: error });
    res.status(500).json({ error: "Failed to get campaign" });
  }
});

// POST /api/campaigns
router.post("/", requireAdminKey, validateBody(createCampaignSchema), async (req, res) => {
  try {
    const campaign = await createCampaign(req.body);
    res.status(201).json(campaign);
  } catch (error) {
    logger.error("campaigns.create_failed", { err: error });
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

// PUT /api/campaigns/:id
router.put("/:id", requireAdminKey, validateBody(updateCampaignSchema), async (req, res) => {
  try {
    const campaign = await updateCampaign(req.params.id, req.body);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    res.json(campaign);
  } catch (error) {
    logger.error("campaigns.update_failed", { err: error });
    res.status(500).json({ error: "Failed to update campaign" });
  }
});

// POST /api/campaigns/:id/launch
router.post("/:id/launch", requireAdminKey, async (req, res) => {
  try {
    const result = await launchCampaign(req.params.id);
    res.json({ success: true, campaign: result });
  } catch (error: any) {
    logger.error("campaigns.launch_failed", { err: error });
    res.status(400).json({ error: error.message || "Failed to launch campaign" });
  }
});

export { router as campaignRouter };
