import { Router } from "express";
import { buildSeoContent, buildSocialContent } from "../services/contentService.js";
import { z } from "zod";
import { Locale } from "../types.js";
import { requireJsonBody } from "../middleware/requireJsonBody.js";
import { validateBody } from "../validation/middleware.js";

const router = Router();

router.use(requireJsonBody);

const numberLike = z.preprocess((value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    return Number(trimmed);
  }
  return value;
}, z.number().finite());

const contentPreviewSchema = z.object({
  type: z.enum(["seo", "social"]).optional(),
  locale: z.enum(["tr", "en"]).optional(),
  name: z.string().trim().min(1),
  price: numberLike.optional(),
  currency: z.string().trim().optional(),
  category: z.string().trim().optional(),
  tone: z.string().trim().optional(),
});

router.post("/content-preview", validateBody(contentPreviewSchema), (req, res) => {
  const type = req.body.type === "social" ? "social" : "seo";
  const locale: Locale = req.body.locale === "en" ? "en" : "tr";
  const name = req.body.name;
  const price = req.body.price;
  const currency =
    req.body.currency && req.body.currency.trim()
      ? req.body.currency.trim().toUpperCase()
      : price != null
        ? "TRY"
        : undefined;
  const categoryHint = req.body.category?.trim() || undefined;
  const toneHint = req.body.tone?.trim() || undefined;
  const base = { name, price, currency, categoryHint, toneHint };

  const result = type === "social" ? buildSocialContent(base, locale) : buildSeoContent(base, locale);
  res.json({ text: result.text, category: result.category, tone: result.tone });
});

export { router as contentPreviewRouter };
