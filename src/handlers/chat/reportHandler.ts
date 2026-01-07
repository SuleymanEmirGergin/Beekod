import { t, formatCurrency } from "../../i18n.js";
import {
  formatPeriodLabel,
  resolvePeriod,
  filterByPeriod,
  summarizeSales,
  topProducts,
  summarizeMarketplaceSales,
} from "../../services/reportService.js";
import { getSalesRecords } from "../../services/salesStore.js";
import { getProductNames, getProductByBarcode } from "../../services/productService.js";
import { getSuggestions } from "../../services/suggestionService.js";
import { normalizeMarketplaceName } from "../../utils/marketplace.js";
import { IntentHandler } from "./types.js";

export const reportHandler: IntentHandler = async (parsed, context) => {
  const { locale } = context;

  if (parsed.intent === "report.advice") {
    const records = await getSalesRecords();
    const periodKey = resolvePeriod(records, "this_month");
    const filtered = periodKey ? filterByPeriod(records, periodKey) : [];

    const sales = summarizeSales(filtered, periodKey?.key ?? "overall");
    const top = topProducts(filtered, 5);
    const marketplaces = summarizeMarketplaceSales(filtered);

    if (!sales) {
      return { reply: t(locale, "report_sales_empty"), success: false };
    } else {
      const advice = await getSuggestions({ sales, topProducts: top, marketplaces }, locale);
      return {
        reply: advice,
        data: { sales, topProducts: top, marketplaces },
        success: true,
      };
    }
  }

  if (parsed.intent === "report.sales" || parsed.intent === "report.top_products") {
    const marketplaceFilter = parsed.marketplace && parsed.marketplace !== "ALL" ? parsed.marketplace : undefined;
    const marketplaceKey = marketplaceFilter ? normalizeMarketplaceName(marketplaceFilter) : undefined;
    const scopeLabel = marketplaceFilter ? marketplaceFilter : locale === "tr" ? "Genel" : "Overall";

    const records = await getSalesRecords();
    const filteredRecords = marketplaceKey
      ? records.filter((record) => normalizeMarketplaceName(record.marketplace) === marketplaceKey)
      : records;

    const periodKey = resolvePeriod(filteredRecords, parsed.period);
    if (!periodKey) {
      return {
        reply: t(locale, parsed.intent === "report.sales" ? "report_sales_empty" : "report_top_empty"),
        success: false,
      };
    }

    const scoped = filterByPeriod(filteredRecords, periodKey);
    if (!scoped.length) {
      return {
        reply: t(locale, parsed.intent === "report.sales" ? "report_sales_empty" : "report_top_empty"),
        success: false,
      };
    }

    if (parsed.intent === "report.sales") {
      const summary = summarizeSales(scoped, periodKey.key);
      if (!summary) {
        return { reply: t(locale, "report_sales_empty"), success: false };
      } else {
        const revenue = formatCurrency(summary.revenue, summary.currency);
        const average = formatCurrency(summary.averageOrderValue, summary.currency);
        const periodLabel = formatPeriodLabel(periodKey, locale);
        const topMarketplaceLabel =
          summary.topMarketplace === "Unknown" && locale === "tr" ? "Bilinmiyor" : summary.topMarketplace;

        return {
          reply: t(locale, "report_sales_summary", {
            scope: scopeLabel,
            period: periodLabel,
            orders: summary.orders,
            items: summary.items,
            revenue,
            average,
            top: topMarketplaceLabel,
          }),
          data: { ...summary, periodLabel },
          success: true,
        };
      }
    } else {
      const limit = typeof parsed.amount === "number" ? Math.min(Math.max(Math.trunc(parsed.amount), 1), 50) : 10;
      const items = topProducts(scoped, limit);
      if (!items.length) {
        return { reply: t(locale, "report_top_empty"), success: false };
      } else {
        // Enrich items with full product details for Rich UI
        const enrichedItems = await Promise.all(
          items.map(async (item) => {
            const product = await getProductByBarcode(item.barcode);
            return {
              ...item,
              name: product?.name || item.barcode,
              price: product?.price || 0,
              stock: product?.stock ?? 0,
              currency: product?.currency || "TRY",
            };
          }),
        );

        const unit = locale === "tr" ? "adet" : "pcs";
        const list = enrichedItems
          .map((item, index) => {
            return `${index + 1}. ${item.name} (${item.quantity} ${unit})`;
          })
          .join(", ");
        const periodLabel = formatPeriodLabel(periodKey, locale);

        return {
          reply: t(locale, "report_top_products", { scope: scopeLabel, period: periodLabel, list }),
          data: { period: periodKey.key, periodLabel, items: enrichedItems },
          success: true,
        };
      }
    }
  }

  return { reply: t(locale, "unknown_intent"), success: false };
};
