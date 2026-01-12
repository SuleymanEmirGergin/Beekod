import { z } from "zod";
import { AITool, ToolContext, ToolResult } from "./interfaces.js";
import { getOrderById, getAllOrders } from "../../services/orderService.js";

const GetOrderByIdSchema = z.object({
  orderId: z.string().describe("The order ID to lookup, e.g., #BK-1234"),
});

const ListRecentOrdersSchema = z.object({
  limit: z.number().min(1).max(20).default(5).describe("Number of orders to return"),
  status: z.enum(["New", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"]).optional(),
});

const DraftCustomerReplySchema = z.object({
  orderId: z.string().describe("The order ID to reply to"),
  customerMessage: z.string().describe("The message received from the customer (or topic to address)"),
  tone: z.enum(["Formal", "Friendly", "Apologetic"]).default("Friendly"),
});

export const getOrderByIdTool: AITool<z.infer<typeof GetOrderByIdSchema>> = {
  name: "getOrderById",
  description: "Get details of a specific order by its ID (Request ID).",
  schema: GetOrderByIdSchema,
  execute: async (args, context: ToolContext): Promise<ToolResult> => {
    try {
      const order = await getOrderById(args.orderId);
      if (!order) {
        return { success: false, error: "Order not found" };
      }
      return { success: true, data: order };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
};

export const listRecentOrdersTool: AITool<z.infer<typeof ListRecentOrdersSchema>> = {
  name: "listRecentOrders",
  description: "List the most recent orders, optionally filtered by status.",
  schema: ListRecentOrdersSchema,
  execute: async (args, context: ToolContext): Promise<ToolResult> => {
    try {
      const allOrders = await getAllOrders();
      let filtered = allOrders;

      if (args.status) {
        filtered = filtered.filter((o) => o.status.label === args.status);
      }

      const recent = filtered.slice(0, args.limit);
      
      const minimalData = recent.map(o => ({
        id: o.requestId,
        date: o.date,
        customer: o.customer.name,
        total: o.total,
        status: o.status.label,
        itemCount: o.items.length
      }));

      return { success: true, data: minimalData };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
};

export const draftCustomerReplyTool: AITool<z.infer<typeof DraftCustomerReplySchema>> = {
  name: "draftCustomerReply",
  description: "Get order context to draft a reply to a customer.",
  schema: DraftCustomerReplySchema,
  execute: async (args, context: ToolContext): Promise<ToolResult> => {
    try {
      const order = await getOrderById(args.orderId);
      if (!order) {
        return { success: false, error: "Order not found" };
      }

      return {
        success: true,
        data: {
          orderContext: {
            id: order.requestId,
            customer: order.customer.name,
            status: order.status.label,
            items: order.items.map((i) => i.product_name).join(", "),
            total: order.total,
            shipping: order.shipping 
          },
          inputMessage: args.customerMessage,
          requestedTone: args.tone,
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
};
