import { Router } from "express";
import { z } from "zod";
import { requireAdminKey } from "../middleware/adminKey.js";
import { logger } from "../logger.js";
import {
  formatPeriodLabel,
  resolvePeriod,
  filterByPeriod,
  summarizeSales,
  summarizeMarketplaceSales,
  topProducts,
} from "../services/reportService.js";
import { getSalesRecords } from "../services/salesStore.js";
import { normalizeMarketplaceName } from "../utils/marketplace.js";
import { validateQuery } from "../validation.js";

const router = Router();

const numberLike = z.preprocess((value) => {
  if (value == null) {
    return undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    return Number(trimmed);
  }
  return value;
}, z.number().finite());

const reportQuerySchema = z
  .object({
    period: z.enum(["last_week", "this_week", "last_month", "this_month"]).optional(),
    month: z.string().trim().optional(),
    marketplace: z.string().trim().optional(),
    locale: z.enum(["tr", "en"]).optional(),
  })
  .passthrough();

const topProductsQuerySchema = reportQuerySchema.extend({
  limit: numberLike.optional(),
});

router.get("/reports/sales", requireAdminKey, validateQuery(reportQuerySchema), async (req, res) => {
  const period =
    req.query.period === "last_week"
      ? "last_week"
      : req.query.period === "this_week"
        ? "this_week"
        : req.query.period === "last_month"
          ? "last_month"
          : "this_month";
  const month = typeof req.query.month === "string" ? req.query.month : undefined;
  const marketplace =
    typeof req.query.marketplace === "string" && req.query.marketplace.trim()
      ? req.query.marketplace.trim()
      : undefined;
  const marketplaceKey = marketplace ? normalizeMarketplaceName(marketplace) : undefined;
  const locale = req.query.locale === "tr" ? "tr" : "en";
  try {
    const records = await getSalesRecords();
    const filteredRecords = marketplaceKey
      ? records.filter((record) => normalizeMarketplaceName(record.marketplace) === marketplaceKey)
      : records;
    const periodKey = resolvePeriod(filteredRecords, period, month);
    if (!periodKey) {
      return res.json({ data: null });
    }
    const scoped = filterByPeriod(filteredRecords, periodKey);
    const summary = summarizeSales(scoped, periodKey.key);
    const periodLabel = summary ? formatPeriodLabel(periodKey, locale) : periodKey.key;
    if (summary) {
      summary.periodLabel = periodLabel;
    }
    res.json({ data: summary });
  } catch (error) {
    logger.error("reports.sales_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "sales_report_failed" });
  }
});

router.get("/reports/top-products", requireAdminKey, validateQuery(topProductsQuerySchema), async (req, res) => {
  const period =
    req.query.period === "last_week"
      ? "last_week"
      : req.query.period === "this_week"
        ? "this_week"
        : req.query.period === "last_month"
          ? "last_month"
          : "this_month";
  const month = typeof req.query.month === "string" ? req.query.month : undefined;
  const limitRaw = Number(req.query.limit ?? 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 10;
  const marketplace =
    typeof req.query.marketplace === "string" && req.query.marketplace.trim()
      ? req.query.marketplace.trim()
      : undefined;
  const marketplaceKey = marketplace ? normalizeMarketplaceName(marketplace) : undefined;
  const locale = req.query.locale === "tr" ? "tr" : "en";
  try {
    const records = await getSalesRecords();
    const filteredRecords = marketplaceKey
      ? records.filter((record) => normalizeMarketplaceName(record.marketplace) === marketplaceKey)
      : records;
    const periodKey = resolvePeriod(filteredRecords, period, month);
    if (!periodKey) {
      return res.json({ data: [] });
    }
    const scoped = filterByPeriod(filteredRecords, periodKey);
    const items = topProducts(scoped, limit);
    const periodLabel = formatPeriodLabel(periodKey, locale);
    res.json({ data: { period: periodKey.key, periodLabel, items } });
  } catch (error) {
    logger.error("reports.top_products_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "top_products_failed" });
  }
});

router.get("/reports/marketplaces", requireAdminKey, validateQuery(reportQuerySchema), async (req, res) => {
  const period =
    req.query.period === "last_week"
      ? "last_week"
      : req.query.period === "this_week"
        ? "this_week"
        : req.query.period === "last_month"
          ? "last_month"
          : "this_month";
  const month = typeof req.query.month === "string" ? req.query.month : undefined;
  const marketplace =
    typeof req.query.marketplace === "string" && req.query.marketplace.trim()
      ? req.query.marketplace.trim()
      : undefined;
  const marketplaceKey = marketplace ? normalizeMarketplaceName(marketplace) : undefined;
  const locale = req.query.locale === "tr" ? "tr" : "en";
  try {
    const records = await getSalesRecords();
    const filteredRecords = marketplaceKey
      ? records.filter((record) => normalizeMarketplaceName(record.marketplace) === marketplaceKey)
      : records;
    const periodKey = resolvePeriod(filteredRecords, period, month);
    if (!periodKey) {
      return res.json({ data: { period: "", periodLabel: "", items: [] } });
    }
    const scoped = filterByPeriod(filteredRecords, periodKey);
    const items = summarizeMarketplaceSales(scoped);
    const periodLabel = formatPeriodLabel(periodKey, locale);
    res.json({ data: { period: periodKey.key, periodLabel, items } });
  } catch (error) {
    logger.error("reports.marketplace_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "marketplace_report_failed" });
  }
});

export { router as reportRouter };
