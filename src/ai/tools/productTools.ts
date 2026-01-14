import { z } from "zod";
import { AITool, ToolContext, ToolResult } from "./interfaces.js";
import { unifiedMarketplaceSearch } from "../../services/search/unifiedMarketplaceSearch.js";

const SearchCheapestProductSchema = z.object({
  query: z.string().describe("Product query string, e.g. 'iPhone 13 128GB'"),
});

export const searchCheapestProductTool: AITool<z.infer<typeof SearchCheapestProductSchema>> = {
  name: "searchCheapestProduct",
  description: "Search for the cheapest product across multiple marketplaces (Trendyol, Hepsiburada, etc).",
  schema: SearchCheapestProductSchema,
  execute: async (args, context: ToolContext): Promise<ToolResult> => {
    try {
      const result = await unifiedMarketplaceSearch(args.query);
      if (!result.ok) {
        return { success: false, error: result.error.message };
      }
      const results = result.value;
      if (!results || results.length === 0) {
        return { success: true, data: [] };
      }

      // Sort by price (ascending)
      const sorted = results.sort((a: any, b: any) => a.price - b.price);
      return { success: true, data: sorted };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
};
