/**
 * Tool implementations for AI orchestration.
 */

import { z } from "zod";
import { ToolDefinition, ToolContext, ToolResult } from "./interfaces.js";
import {
  getOrderByIdArgsSchema,
  listRecentOrdersArgsSchema,
  searchCheapestProductArgsSchema,
  draftCustomerReplyArgsSchema,
  createShipmentArgsSchema,
  analyticsQueryArgsSchema,
  getProductByBarcodeArgsSchema,
} from "./validators.js";
import { logger } from "../../logger.js";
import { getOrderById, getRecentOrders, updateOrderShipping } from "../../services/orderService.js";
import { unifiedMarketplaceSearch } from "../../services/unifiedMarketplaceSearch.js";
import { cargoService } from "../../services/cargo/cargoService.js";
import { query } from "../../db.js";

type GetOrderByIdArgs = z.infer<typeof getOrderByIdArgsSchema>;
type ListRecentOrdersArgs = z.infer<typeof listRecentOrdersArgsSchema>;
type SearchCheapestProductArgs = z.infer<typeof searchCheapestProductArgsSchema>;
type DraftCustomerReplyArgs = z.infer<typeof draftCustomerReplyArgsSchema>;
type CreateShipmentArgs = z.infer<typeof createShipmentArgsSchema>;
type AnalyticsQueryArgs = z.infer<typeof analyticsQueryArgsSchema>;
type GetProductByBarcodeArgs = z.infer<typeof getProductByBarcodeArgsSchema>;

const DEFAULT_ANALYTICS_DAYS = 30;
const DEFAULT_ANALYTICS_LIMIT = 10;
const MAX_ANALYTICS_DAYS = 365;
const MAX_ANALYTICS_LIMIT = 50;
const DEFAULT_LIST_ORDERS_LIMIT = 50;

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
      const order = await getOrderById(args.orderId);
      return {
        success: true,
        data: order,
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch (error) {
      logger.warn("tool.getOrderById.failed", { orderId: args.orderId, requestId: ctx.requestId });
      return {
        success: false,
        error: "Order not found.",
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
      const orders = await getRecentOrders(args.days, DEFAULT_LIST_ORDERS_LIMIT);
      const data = orders.map((order) => ({
        id: order.requestId,
        date: order.date,
        customer: order.customer.name,
        total: order.total,
        status: order.status.label,
        itemCount: order.items.length,
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
    } catch (error) {
      logger.error("tool.listRecentOrders.failed", { error: String(error), requestId: ctx.requestId });
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
      const results = await unifiedMarketplaceSearch(args.query);
      if (!results.length) {
        return {
          success: true,
          data: { query: args.query, results: [], cheapest: null },
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }

      const sorted = results
        .filter((item) => typeof item.price === "number")
        .sort((a, b) => a.price - b.price);

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
    } catch (error) {
      logger.error("tool.searchCheapestProduct.failed", { error: String(error), requestId: ctx.requestId });
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
      const order = await getOrderById(args.orderId);
      if (!order) {
        return {
          success: false,
          error: "Order not found.",
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }
      const items = order.items.map((item) => item.product_name).join(", ");
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
    } catch (error) {
      logger.error("tool.draftCustomerReply.failed", { error: String(error), requestId: ctx.requestId });
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
      const order = await getOrderById(args.orderId);
      if (!order) {
        return {
          success: false,
          error: "Order not found.",
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }

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
        items: order.items.map((item) => ({ name: item.product_name, quantity: item.quantity })),
      };

      const result = await cargoService.createShipment(shipmentRequest);

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Shipment creation failed.",
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }

      if (result.trackingNumber) {
        await updateOrderShipping(order.requestId, {
          provider: args.carrier,
          trackingNumber: result.trackingNumber,
          labelUrl: "",
        });
      }

      return {
        success: true,
        data: {
          orderId: order.requestId,
          provider: result.provider,
          trackingNumber: result.trackingNumber,
          status: "created",
        },
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch (error) {
      logger.error("tool.createShipment.failed", { error: String(error), requestId: ctx.requestId });
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
      const { getProductByBarcode } = await import("../../services/productService.js");
      const product = await getProductByBarcode(args.barcode);
      if (!product) {
        return {
          success: false,
          error: "Product not found.",
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }
      return {
        success: true,
        data: product,
        meta: { executionTimeMs: Date.now() - startTime },
      };
    } catch (error) {
      logger.error("tool.getProductByBarcode.failed", { error: String(error), requestId: ctx.requestId });
      return {
        success: false,
        error: "Failed to fetch product.",
        meta: { executionTimeMs: Date.now() - startTime },
      };
    }
  },
};
