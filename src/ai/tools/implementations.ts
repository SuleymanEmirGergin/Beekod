/**
 * Tool implementations for AI orchestration.
 */

import { z } from "zod";
import { ToolDefinition, ToolResult } from "./interfaces.js";
import {
  getOrderByIdArgsSchema,
  listRecentOrdersArgsSchema,
  searchCheapestProductArgsSchema,
  draftCustomerReplyArgsSchema,
  createShipmentArgsSchema,
  analyticsQueryArgsSchema,
  getProductByBarcodeArgsSchema,
  getPriceCompetitionArgsSchema,
  analyzePricingStrategyArgsSchema,
  auditInventoryConsistencyArgsSchema,
  detectStockRisksArgsSchema,
  analyzeProductReviewsArgsSchema,
  updateMarketplacePriceArgsSchema,
  updateAISettingsArgsSchema,
  checkAPIHealthArgsSchema,
  runAutonomousPricingArgsSchema,
  getStockForecastArgsSchema,
} from "./validators.js";
import { logger } from "../../logger.js";
import { getOrderById, getRecentOrders, updateOrderShipping } from "../../services/order/orderService.js";
import { unifiedMarketplaceSearch } from "../../services/search/unifiedMarketplaceSearch.js";
import { cargoService } from "../../services/cargo/cargoService.js";
import { query } from "../../db.js";
import { getPriceCompetition } from "../../services/marketplace/index.js";
import { SearchResult } from "../../services/search/unifiedMarketplaceSearch.js";

type GetOrderByIdArgs = z.infer<typeof getOrderByIdArgsSchema>;
type ListRecentOrdersArgs = z.infer<typeof listRecentOrdersArgsSchema>;
type SearchCheapestProductArgs = z.infer<typeof searchCheapestProductArgsSchema>;
type DraftCustomerReplyArgs = z.infer<typeof draftCustomerReplyArgsSchema>;
type CreateShipmentArgs = z.infer<typeof createShipmentArgsSchema>;
type AnalyticsQueryArgs = z.infer<typeof analyticsQueryArgsSchema>;
type GetProductByBarcodeArgs = z.infer<typeof getProductByBarcodeArgsSchema>;
type GetPriceCompetitionArgs = z.infer<typeof getPriceCompetitionArgsSchema>;
type AnalyzePricingStrategyArgs = z.infer<typeof analyzePricingStrategyArgsSchema>;
type AuditInventoryConsistencyArgs = z.infer<typeof auditInventoryConsistencyArgsSchema>;
type DetectStockRisksArgs = z.infer<typeof detectStockRisksArgsSchema>;
type AnalyzeProductReviewsArgs = z.infer<typeof analyzeProductReviewsArgsSchema>;
type UpdateMarketplacePriceArgs = z.infer<typeof updateMarketplacePriceArgsSchema>;
type UpdateAISettingsArgs = z.infer<typeof updateAISettingsArgsSchema>;
type CheckAPIHealthArgs = z.infer<typeof checkAPIHealthArgsSchema>;
type RunAutonomousPricingArgs = z.infer<typeof runAutonomousPricingArgsSchema>;
type GetStockForecastArgs = z.infer<typeof getStockForecastArgsSchema>;

import { listMarketplaceProviders } from "../../services/marketplace/index.js";
import { credentialService } from "../../services/credentialService.js";

const DEFAULT_ANALYTICS_DAYS = 30;
const DEFAULT_ANALYTICS_LIMIT = 10;
const MAX_ANALYTICS_DAYS = 365;
const MAX_ANALYTICS_LIMIT = 50;
const DEFAULT_LIST_ORDERS_LIMIT = 50;

import { autonomousPricingService } from "../../services/pricing/autonomousPricingService.js";
import { stockForecastingService } from "../../services/product/stockForecastingService.js";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function extractNumber(input: string): number | null {
  const match = input.match(/\b(\d{1,3})\b/);
  if (!match) return null;
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function inferDays(input: string): number {
  const lower = input.toLowerCase();
  const dayMatch = lower.match(/(\d{1,3})\s*(day|days|gun|gune|gundur)/);
  if (dayMatch) {
    return clamp(Number(dayMatch[1]), 1, MAX_ANALYTICS_DAYS);
  }
  if (lower.includes("week")) return 7;
  if (lower.includes("month")) return 30;
  if (lower.includes("year")) return 365;
  return DEFAULT_ANALYTICS_DAYS;
}

function inferLimit(input: string): number {
  const lower = input.toLowerCase();
  const match = lower.match(/top\s+(\d{1,2})/);
  if (match) {
    return clamp(Number(match[1]), 1, MAX_ANALYTICS_LIMIT);
  }
  return DEFAULT_ANALYTICS_LIMIT;
}

type AnalyticsQueryType =
  | "daily_sales"
  | "top_products"
  | "revenue_trend"
  | "order_stats"
  | "stock_alerts";

function resolveAnalyticsQuery(nl: string): {
  queryType: AnalyticsQueryType;
  days: number;
  limit: number;
} {
  const lower = nl.toLowerCase();
  const days = inferDays(lower);
  const limit = inferLimit(lower);

  if (lower.includes("stock") || lower.includes("stok") || lower.includes("inventory")) {
    return { queryType: "stock_alerts", days, limit };
  }
  if (
    lower.includes("top") ||
    lower.includes("best") ||
    lower.includes("most") ||
    lower.includes("cok satan") ||
    lower.includes("top seller")
  ) {
    return { queryType: "top_products", days, limit };
  }
  if (lower.includes("revenue") || lower.includes("gelir")) {
    return { queryType: "revenue_trend", days, limit };
  }
  if (lower.includes("sales") || lower.includes("satis") || lower.includes("daily") || lower.includes("gunluk")) {
    return { queryType: "daily_sales", days, limit };
  }
  return { queryType: "order_stats", days, limit };
}

// ============================================
// getOrderById Tool
// ============================================

export const getOrderByIdTool: ToolDefinition<GetOrderByIdArgs> = {
  name: "getOrderById",
  description: "Fetch order details by order ID.",
  argsSchema: getOrderByIdArgsSchema,
  async execute(args, ctx): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const result = await getOrderById(args.orderId);
      if (!result.ok) {
        return {
          success: false,
          error: result.error.message,
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }
      return {
        success: true,
        data: result.value,
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch (err: unknown) {
      logger.warn("tool.getOrderById.failed", { orderId: args.orderId, requestId: ctx.requestId });
      return {
        success: false,
        error: "Order not found or system error.",
        meta: { executionTimeMs: Date.now() - startTime },
      };
    }
  },
};

// ============================================
// listRecentOrders Tool
// ============================================

export const listRecentOrdersTool: ToolDefinition<ListRecentOrdersArgs> = {
  name: "listRecentOrders",
  description: "List recent orders within a number of days.",
  argsSchema: listRecentOrdersArgsSchema,
  async execute(args, ctx): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const result = await getRecentOrders(args.days, DEFAULT_LIST_ORDERS_LIMIT);
      if (!result.ok) {
        return {
          success: false,
          error: result.error.message,
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }
      const data = result.value.map((order) => ({
        id: order.requestId,
        date: order.date,
        customer: order.customer.name,
        total: order.total,
        status: order.status.label,
        itemCount: order.items?.length || 0,
      }));
      return {
        success: true,
        data: {
          days: args.days,
          count: data.length,
          orders: data,
        },
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch (err: unknown) {
      logger.error("tool.listRecentOrders.failed", { error: String(err), requestId: ctx.requestId });
      return {
        success: false,
        error: "Failed to list recent orders.",
        meta: { executionTimeMs: Date.now() - startTime },
      };
    }
  },
};

// ============================================
// searchCheapestProduct Tool
// ============================================

export const searchCheapestProductTool: ToolDefinition<SearchCheapestProductArgs> = {
  name: "searchCheapestProduct",
  description: "Search for the cheapest product across marketplaces.",
  argsSchema: searchCheapestProductArgsSchema,
  async execute(args, ctx): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const result = await unifiedMarketplaceSearch(args.query);
      if (!result.ok) {
        return {
          success: false,
          error: result.error.message,
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }
      const results = result.value;
      if (!results.length) {
        return {
          success: true,
          data: { query: args.query, results: [], cheapest: null },
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }

      const sorted = results
        .filter((item: SearchResult) => typeof item.price === "number")
        .sort((a: SearchResult, b: SearchResult) => a.price - b.price);

      const cheapest = sorted[0] || results[0];
      return {
        success: true,
        data: {
          query: args.query,
          cheapest,
          results: sorted.slice(0, 5),
        },
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch (err: unknown) {
      logger.error("tool.searchCheapestProduct.failed", { error: String(err), requestId: ctx.requestId });
      return {
        success: false,
        error: "Failed to search products.",
        meta: { executionTimeMs: Date.now() - startTime },
      };
    }
  },
};

// ============================================
// draftCustomerReply Tool
// ============================================

function buildDraftReply(
  tone: DraftCustomerReplyArgs["tone"],
  customerName: string,
  orderId: string,
  orderStatus: string,
  items: string,
  customerMessage: string,
): string {
  const baseGreeting =
    tone === "Formal"
      ? `Hello ${customerName},`
      : tone === "Apologetic"
        ? `Hi ${customerName}, I am sorry for the inconvenience.`
        : `Hi ${customerName},`;

  const toneLine =
    tone === "Formal"
      ? "Thank you for reaching out. Below is the information we have on your order."
      : tone === "Apologetic"
        ? "Thank you for letting us know. Here is the latest information about your order."
        : "Thanks for your message. Here is the latest on your order.";

  return `${baseGreeting}

${toneLine}
Order ID: ${orderId}
Status: ${orderStatus}
Items: ${items}

Your message: "${customerMessage}"

If you have any other questions, reply here and we will help right away.`;
}

export const draftCustomerReplyTool: ToolDefinition<DraftCustomerReplyArgs> = {
  name: "draftCustomerReply",
  description: "Draft a reply to a customer message with order context.",
  argsSchema: draftCustomerReplyArgsSchema,
  async execute(args, ctx): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const result = await getOrderById(args.orderId);
      if (!result.ok) {
        return {
          success: false,
          error: "Order not found or access denied.",
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }
      const order = result.value;
      const items = order.items?.map((item: any) => item.product_name).join(", ") || "No items";
      const draft = buildDraftReply(
        args.tone,
        order.customer.name,
        order.requestId,
        order.status.label,
        items,
        args.customerMessage,
      );
      return {
        success: true,
        data: {
          orderId: order.requestId,
          tone: args.tone,
          draft,
        },
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch {
      logger.error("tool.draftCustomerReply.failed", { error: "Unknown error", requestId: ctx.requestId });
      return {
        success: false,
        error: "Failed to draft customer reply.",
        meta: { executionTimeMs: Date.now() - startTime },
      };
    }
  },
};

// ============================================
// createShipment Tool
// ============================================

export const createShipmentTool: ToolDefinition<CreateShipmentArgs> = {
  name: "createShipment",
  description: "Create a shipment for an order (idempotent).",
  argsSchema: createShipmentArgsSchema,
  async execute(args, ctx): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const result = await getOrderById(args.orderId);
      if (!result.ok) {
        return {
          success: false,
          error: "Order not found.",
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }
      const order = result.value;

      if (order.shipping?.trackingNumber) {
        return {
          success: true,
          data: {
            orderId: order.requestId,
            provider: order.shipping.provider,
            trackingNumber: order.shipping.trackingNumber,
            status: "existing",
          },
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }

      const shipmentRequest = {
        provider: args.carrier,
        barcode: order.requestId,
        recipientName: order.customer.name,
        recipientPhone: order.customer.phone || "",
        recipientAddress: order.customer.address || "",
        recipientCity: "Istanbul",
        recipientDistrict: "Merkez",
        items: order.items?.map((item: any) => ({ name: item.product_name, quantity: item.quantity })) || [],
      };

      const cargoResult = await cargoService.createShipment(shipmentRequest);

      if (!cargoResult.success) {
        return {
          success: false,
          error: cargoResult.error || "Shipment creation failed.",
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }

      if (cargoResult.trackingNumber) {
        await updateOrderShipping(order.requestId, {
          provider: args.carrier,
          trackingNumber: cargoResult.trackingNumber,
          labelUrl: "",
        });
      }

      return {
        success: true,
        data: {
          orderId: order.requestId,
          provider: cargoResult.provider,
          trackingNumber: cargoResult.trackingNumber,
          status: "created",
        },
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch (err: unknown) {
      logger.error("tool.createShipment.failed", { error: String(err), requestId: ctx.requestId });
      return {
        success: false,
        error: "Failed to create shipment.",
        meta: { executionTimeMs: Date.now() - startTime },
      };
    }
  },
};

// ============================================
// analyticsQuery Tool (SAFE allowlisted SQL only)
// ============================================

export const analyticsQueryTool: ToolDefinition<AnalyticsQueryArgs> = {
  name: "analyticsQuery",
  description: "Run an allowlisted analytics query based on natural language.",
  argsSchema: analyticsQueryArgsSchema,
  async execute(args, ctx): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const resolved = resolveAnalyticsQuery(args.nl);
      const days = clamp(resolved.days, 1, MAX_ANALYTICS_DAYS);
      const limit = clamp(resolved.limit, 1, MAX_ANALYTICS_LIMIT);

      const allowlist: Record<AnalyticsQueryType, { sql: string; params: any[] }> = {
        daily_sales: {
          sql: `
            SELECT DATE(created_at) as date,
                   COUNT(*) as orderCount,
                   SUM(total_amount_numeric) as revenue
            FROM orders
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
              AND status_label != 'Cancelled'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
          `,
          params: [days],
        },
        top_products: {
          sql: `
            SELECT
              oi.sku as product_id,
              oi.product_name,
              SUM(oi.quantity) as units_sold,
              SUM(oi.quantity * oi.price_numeric) as revenue
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
              AND o.status_label != 'Cancelled'
            GROUP BY oi.sku, oi.product_name
            ORDER BY units_sold DESC
            LIMIT ?
          `,
          params: [days, limit],
        },
        revenue_trend: {
          sql: `
            SELECT DATE(created_at) as date,
                   SUM(total_amount_numeric) as revenue
            FROM orders
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
              AND status_label != 'Cancelled'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
          `,
          params: [days],
        },
        order_stats: {
          sql: `
            SELECT status_label as status,
                   COUNT(*) as count
            FROM orders
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY status_label
          `,
          params: [days],
        },
        stock_alerts: {
          sql: `
            SELECT barcode, name, stock, alert_threshold
            FROM products
            WHERE stock <= COALESCE(alert_threshold, 10)
            ORDER BY stock ASC
            LIMIT ?
          `,
          params: [limit],
        },
      };

      const querySpec = allowlist[resolved.queryType];
      const results = await query<any[]>(querySpec.sql, querySpec.params);

      return {
        success: true,
        data: {
          queryType: resolved.queryType,
          days,
          limit,
          results,
        },
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch (error) {
      logger.error("tool.analyticsQuery.failed", { error: String(error), requestId: ctx.requestId });
      return {
        success: false,
        error: "Failed to run analytics query.",
        meta: { executionTimeMs: Date.now() - startTime },
      };
    }
  },
};

// ============================================
// getProductByBarcode Tool (optional)
// ============================================

export const getProductByBarcodeTool: ToolDefinition<GetProductByBarcodeArgs> = {
  name: "getProductByBarcode",
  description: "Fetch product by barcode.",
  argsSchema: getProductByBarcodeArgsSchema,
  async execute(args, ctx): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const { getProductByBarcode } = await import("../../services/product/productService.js");
      const result = await getProductByBarcode(args.barcode);
      if (!result.ok) {
        return {
          success: false,
          error: result.error.message,
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }
      return {
        success: true,
        data: result.value,
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch (err: unknown) {
      logger.error("tool.getProductByBarcode.failed", { error: String(err), requestId: ctx.requestId });
      return {
        success: false,
        error: "Failed to fetch product.",
        meta: { executionTimeMs: Date.now() - startTime },
      };
    }
  },
};

// ============================================
// getPriceCompetition Tool
// ============================================

export const getPriceCompetitionTool: ToolDefinition<GetPriceCompetitionArgs> = {
  name: "getPriceCompetition",
  description: "Get real-time price competition and Buy-Box analysis for products.",
  argsSchema: getPriceCompetitionArgsSchema,
  async execute(args, ctx): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const result = await getPriceCompetition(args.marketplace, args.barcodes);
      if (!result.ok) {
        return {
          success: false,
          error: result.error.message,
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }
      return {
        success: true,
        data: result.value,
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch (error) {
      logger.error("tool.getPriceCompetition.failed", { error: String(error), requestId: ctx.requestId });
      return {
        success: false,
        error: "Failed to fetch price competition data.",
        meta: { executionTimeMs: Date.now() - startTime },
      };
    }
  },
};

// ============================================
// analyzePricingStrategy Tool
// ============================================

export const analyzePricingStrategyTool: ToolDefinition<AnalyzePricingStrategyArgs> = {
  name: "analyzePricingStrategy",
  description: "Analyze Buy-Box status and get strategic pricing recommendations for a product.",
  argsSchema: analyzePricingStrategyArgsSchema,
  async execute(args, ctx): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const { pricingIntelligenceService } = await import("../../services/ai/pricingIntelligenceService.js");
      const result = await pricingIntelligenceService.analyzeBuyBoxStatus(args.barcode);
      if (!result.ok) {
        return {
          success: false,
          error: result.error.message,
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }
      return {
        success: true,
        data: result.value,
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch (error) {
      logger.error("tool.analyzePricingStrategy.failed", { error: String(error), requestId: ctx.requestId });
      return {
        success: false,
        error: "Failed to analyze pricing strategy.",
        meta: { executionTimeMs: Date.now() - startTime },
      };
    }
  },
};

// ============================================
// auditInventoryConsistency Tool
// ============================================

export const auditInventoryConsistencyTool: ToolDefinition<AuditInventoryConsistencyArgs> = {
  name: "auditInventoryConsistency",
  description: "Audit stock consistency across marketplaces for a specific product.",
  argsSchema: auditInventoryConsistencyArgsSchema,
  async execute(args, ctx): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const { inventoryAuditService } = await import("../../services/ai/inventoryAuditService.js");
      const result = await inventoryAuditService.auditStockConsistency(args.barcode);
      if (!result.ok) {
        return {
          success: false,
          error: result.error.message,
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }
      return {
        success: true,
        data: result.value,
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch (error) {
      logger.error("tool.auditInventoryConsistency.failed", { error: String(error), requestId: ctx.requestId });
      return {
        success: false,
        error: "Failed to audit inventory consistency.",
        meta: { executionTimeMs: Date.now() - startTime },
      };
    }
  },
};

// ============================================
// detectStockRisks Tool
// ============================================

export const detectStockRisksTool: ToolDefinition<DetectStockRisksArgs> = {
  name: "detectStockRisks",
  description: "Detect over-selling risks across the entire inventory.",
  argsSchema: detectStockRisksArgsSchema,
  async execute(_args, ctx): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const { inventoryAuditService } = await import("../../services/ai/inventoryAuditService.js");
      const result = await inventoryAuditService.detectOverSellingRisks();
      if (!result.ok) {
        return {
          success: false,
          error: result.error.message,
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }
      return {
        success: true,
        data: result.value,
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch (error) {
      logger.error("tool.detectStockRisks.failed", { error: String(error), requestId: ctx.requestId });
      return {
        success: false,
        error: "Failed to detect stock risks.",
        meta: { executionTimeMs: Date.now() - startTime },
      };
    }
  },
};

// ============================================
// analyzeProductReviews Tool
// ============================================

export const analyzeProductReviewsTool: ToolDefinition<AnalyzeProductReviewsArgs> = {
  name: "analyzeProductReviews",
  description: "Analyze product reviews and sentiment from a specific marketplace.",
  argsSchema: analyzeProductReviewsArgsSchema,
  async execute(args, ctx): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const { analyzeReviewsForProduct } = await import("../../services/reviewService.js");
      const result = await analyzeReviewsForProduct(args.barcode, args.marketplace);
      if (!result) {
        return {
          success: true,
          data: { reviewsFound: false, barcode: args.barcode, marketplace: args.marketplace },
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }
      return {
        success: true,
        data: { reviewsFound: true, ...result },
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch (error) {
      logger.error("tool.analyzeProductReviews.failed", { error: String(error), requestId: ctx.requestId });
      return {
        success: false,
        error: "Failed to analyze product reviews.",
        meta: { executionTimeMs: Date.now() - startTime },
      };
    }
  },
};

// ============================================
// updateMarketplacePrice Tool
// ============================================

export const updateMarketplacePriceTool: ToolDefinition<UpdateMarketplacePriceArgs> = {
  name: "updateMarketplacePrice",
  description: "Update the price of a product on a specific marketplace.",
  argsSchema: updateMarketplacePriceArgsSchema,
  async execute(args, ctx): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const { getMarketplaceProvider } = await import("../../services/marketplace/index.js");
      const provider = getMarketplaceProvider(args.marketplace);
      if (!provider) {
        return {
          success: false,
          error: `Marketplace provider '${args.marketplace}' not found.`,
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }

      const result = await provider.updateListing({
        barcode: args.barcode,
        price: args.price,
      });

      if (!result.ok) {
        return {
          success: false,
          error: result.error.message,
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }

      return {
        success: true,
        data: result.value,
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch (error) {
      logger.error("tool.updateMarketplacePrice.failed", { error: String(error), requestId: ctx.requestId });
      return {
        success: false,
        error: "Failed to update marketplace price.",
        meta: { executionTimeMs: Date.now() - startTime },
      };
    }
  },
};

// ============================================
// updateAISettings Tool
// ============================================

export const updateAISettingsTool: ToolDefinition<UpdateAISettingsArgs> = {
  name: "updateAISettings",
  description: "Update AI Assistant settings like automatic pricing or notifications.",
  argsSchema: updateAISettingsArgsSchema,
  async execute(args, ctx): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const { updateUserPreferences } = await import("../../services/userPreferenceService.js");
      
      const updates: any = {};
      if (args.enableAutoPricing !== undefined) updates.enable_ai_auto_pricing = args.enableAutoPricing;
      if (args.enableStockNotifications !== undefined) updates.enable_ai_stock_notifications = args.enableStockNotifications;

      const result = updateUserPreferences("admin", updates);

      return {
        success: true,
        data: { 
          message: "AI settings updated successfully.",
          currentSettings: result 
        },
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch (error) {
      logger.error("tool.updateAISettings.failed", { error: String(error), requestId: ctx.requestId });
      return {
        success: false,
        error: "Failed to update AI settings.",
        meta: { executionTimeMs: Date.now() - startTime },
      };
    }
  },
};

/**
 * Tool: checkAPIHealth
 * AI evaluates credentials and connectivity of all configured marketplaces.
 */
export const checkAPIHealthTool: ToolDefinition<CheckAPIHealthArgs> = {
  name: "checkAPIHealth",
  description: "Check the health, configuration, and connectivity of all marketplace APIs.",
  argsSchema: checkAPIHealthArgsSchema,
  async execute(_args, ctx): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const providers = listMarketplaceProviders();
      const results = providers.map(p => {
        const credStatus = credentialService.inspect(p.name);
        return {
          marketplace: p.name,
          configured: p.configured,
          status: p.token.status,
          missingKeys: credStatus.missingKeys,
          isValidFormat: credStatus.isValid,
        };
      });

      return {
        success: true,
        data: {
          summary: "API Health Evaluation",
          results,
        },
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch (err: unknown) {
      logger.error("tool.checkAPIHealth.failed", { error: String(err), requestId: ctx.requestId });
      return {
        success: false,
        error: "Failed to evaluate API health.",
        meta: { executionTimeMs: Date.now() - startTime },
      };
    }
  },
};

// ============================================
// runAutonomousPricing Tool
// ============================================

export const runAutonomousPricingTool: ToolDefinition<RunAutonomousPricingArgs> = {
  name: "runAutonomousPricing",
  description: "Triggers autonomous pricing for a specific product or all products based on competitor data and target margin.",
  argsSchema: runAutonomousPricingArgsSchema,
  execute: async (args, ctx): Promise<ToolResult> => {
    const startTime = Date.now();
    try {
      let result;
      if (args.barcode) {
        // Single product
        const success = await autonomousPricingService.processProduct(args.barcode, {
          type: "buybox",
          minMargin: args.minMargin
        });
        result = { success, message: success ? "Fiyat başarıyla güncellendi." : "Fiyat güncellenemedi veya rakip bulunamadı." };
      } else {
        // All products
        const stats = await autonomousPricingService.processAllProducts();
        result = { 
          summary: "Toplu otonom fiyatlandırma tamamlandı.", 
          processed: stats.processed, 
          updated: stats.success 
        };
      }

      return {
        success: true,
        data: result,
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch (err: unknown) {
      logger.error("tool.runAutonomousPricing.failed", { error: String(err), requestId: ctx.requestId });
      return {
        success: false,
        error: "Otonom fiyatlandırma çalıştırılamadı.",
        meta: { executionTimeMs: Date.now() - startTime },
      };
    }
  },
};

// ============================================
// getStockForecast Tool
// ============================================

export const getStockForecastTool: ToolDefinition<GetStockForecastArgs> = {
  name: "getStockForecast",
  description: "Get sales velocity and run-out prediction for a product.",
  argsSchema: getStockForecastArgsSchema,
  execute: async (args, ctx): Promise<ToolResult> => {
    const startTime = Date.now();
    try {
      const forecast = await stockForecastingService.getForecast(args.barcode);

      if (!forecast) {
        return {
          success: false,
          error: "Stok tahmini yapılamadı. Ürün veya satış verisi bulunamadı.",
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }

      return {
        success: true,
        data: forecast,
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch (err: unknown) {
      logger.error("tool.getStockForecast.failed", { error: String(err), requestId: ctx.requestId });
      return {
        success: false,
        error: "Stok tahmini alınamadı.",
        meta: { executionTimeMs: Date.now() - startTime },
      };
    }
  },
};

