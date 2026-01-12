import { z } from "zod";
import { AITool, ToolContext, ToolResult } from "./interfaces.js";
import { 
  getDashboardStats, 
  getRevenueTimeline, 
  getTopSellers, 
  getInventoryForecast 
} from "../../services/analyticsService.js";

const AnalyticsQuerySchema = z.object({
  queryType: z.enum(["DASHBOARD", "REVENUE", "TOP_PRODUCTS", "INVENTORY"]).describe("The type of analytics to fetch"),
  days: z.number().optional().default(30).describe("Time range in days (default 30)"),
});

export const analyticsQueryTool: AITool<z.infer<typeof AnalyticsQuerySchema>> = {
  name: "analyticsQuery",
  description: "Query analytics data (dashboard, revenue, top products, inventory).",
  schema: AnalyticsQuerySchema,
  execute: async (args, context: ToolContext): Promise<ToolResult> => {
    try {
      let data;
      switch (args.queryType) {
        case "DASHBOARD":
          data = await getDashboardStats();
          break;
        case "REVENUE":
          data = await getRevenueTimeline(args.days);
          break;
        case "TOP_PRODUCTS":
          data = await getTopSellers(10, args.days);
          break;
        case "INVENTORY":
          data = await getInventoryForecast();
          break;
        default:
          return { success: false, error: "Invalid queryType" };
      }
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
};
