import fs from "fs";
import path from "path";
import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { requireAdminKey } from "../middleware/adminKey.js";

const router = Router();
const specPath = path.resolve("docs", "openapi.json");

function loadSpec() {
  const raw = fs.readFileSync(specPath, "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

const spec = loadSpec();

router.get("/docs.json", requireAdminKey, (_req, res) => {
  res.json(spec);
});

router.use("/docs", requireAdminKey, swaggerUi.serve);
router.get("/docs", requireAdminKey, swaggerUi.setup(spec));

export { router as docsRouter };
