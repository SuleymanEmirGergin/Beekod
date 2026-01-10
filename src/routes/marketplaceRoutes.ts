import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { requireAdminKey } from "../middleware/adminKey.js";
import { logger } from "../logger.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust path relative to built 'dist/routes' or source 'src/routes'
// Assuming 'data' is at project root.
const MAPPINGS_FILE = path.resolve(__dirname, "../../data/marketplace-mappings.json");

// Middleware to ensure admin access for all mapping operations
router.use(requireAdminKey);

// GET /api/marketplace/mappings
router.get("/mappings", async (req, res) => {
  try {
    const data = await fs.readFile(MAPPINGS_FILE, "utf-8");
    res.json(JSON.parse(data));
  } catch (error) {
    logger.error("marketplace_mappings_read_failed", { error });
    res.status(500).json({ error: "Failed to read mappings" });
  }
});

// Product Discovery Agent Search
router.get("/discovery/search", async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) return res.status(400).json({ error: "Query is required" });

    const { searchMarketplaceAgent } = await import("../services/marketplaceFinderAgent.js");
    const result = await searchMarketplaceAgent(query);
    res.json(result);
  } catch (error) {
    logger.error("marketplace_agent_search_failed", { error });
    res.status(500).json({ error: "Agent search failed" });
  }
});

// Prepare Import Payload
router.post("/import/prepare", async (req, res) => {
  try {
    const { offer } = req.body;
    if (!offer) return res.status(400).json({ error: "Offer data required" });

    const { generateImportPayload } = await import("../services/marketplaceFinderAgent.js");
    const payload = await generateImportPayload(offer);
    res.json(payload);
  } catch (error) {
    logger.error("marketplace_agent_import_failed", { error });
    res.status(500).json({ error: "Import preparation failed" });
  }
});

// POST /api/marketplace/mappings
router.post("/mappings", async (req, res) => {
  try {
    const newMappings = req.body;
    // Basic validation: ensure it's an object
    if (typeof newMappings !== "object" || newMappings === null) {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    await fs.writeFile(MAPPINGS_FILE, JSON.stringify(newMappings, null, 2), "utf-8");

    logger.info("marketplace_mappings_updated");
    res.json({ success: true, message: "Mappings updated" });
  } catch (error) {
    logger.error("marketplace_mappings_write_failed", { error });
    res.status(500).json({ error: "Failed to save mappings" });
  }
});

export const marketplaceRouter = router;
