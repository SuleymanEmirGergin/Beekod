/**
 * AI Tools - Registry and execution helpers.
 */

import { ToolDefinition, ToolRegistry, ToolContext, ToolResult } from "./interfaces.js";
import {
  getOrderByIdTool,
  listRecentOrdersTool,
  searchCheapestProductTool,
  draftCustomerReplyTool,
  createShipmentTool,
  analyticsQueryTool,
  getProductByBarcodeTool,
  getPriceCompetitionTool,
  analyzePricingStrategyTool,
  auditInventoryConsistencyTool,
  detectStockRisksTool,
  analyzeProductReviewsTool,
  updateMarketplacePriceTool,
  updateAISettingsTool,
  checkAPIHealthTool,
  runAutonomousPricingTool,
  getStockForecastTool,
} from "./implementations.js";
import { logger } from "../../logger.js";
import { redactSecrets } from "../audit/redact.js";

export * from "./interfaces.js";
export * from "./validators.js";

const toolRegistry: ToolRegistry = new Map();

toolRegistry.set("getOrderById", getOrderByIdTool);
toolRegistry.set("listRecentOrders", listRecentOrdersTool);
toolRegistry.set("searchCheapestProduct", searchCheapestProductTool);
toolRegistry.set("draftCustomerReply", draftCustomerReplyTool);
toolRegistry.set("createShipment", createShipmentTool);
toolRegistry.set("analyticsQuery", analyticsQueryTool);
toolRegistry.set("getProductByBarcode", getProductByBarcodeTool);
toolRegistry.set("getPriceCompetition", getPriceCompetitionTool);
toolRegistry.set("analyzePricingStrategy", analyzePricingStrategyTool);
toolRegistry.set("auditInventoryConsistency", auditInventoryConsistencyTool);
toolRegistry.set("detectStockRisks", detectStockRisksTool);
toolRegistry.set("analyzeProductReviews", analyzeProductReviewsTool);
toolRegistry.set("updateMarketplacePrice", updateMarketplacePriceTool);
toolRegistry.set("updateAISettings", updateAISettingsTool);
toolRegistry.set("checkAPIHealth", checkAPIHealthTool);
toolRegistry.set("runAutonomousPricing", runAutonomousPricingTool);
toolRegistry.set("getStockForecast", getStockForecastTool);

export function getAvailableTools(): string[] {
  return Array.from(toolRegistry.keys());
}

export function getTool(name: string): ToolDefinition | undefined {
  return toolRegistry.get(name);
}

export function hasTool(name: string): boolean {
  return toolRegistry.has(name);
}

export async function executeTool(
  toolName: string,
  args: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  const startTime = Date.now();
  const tool = toolRegistry.get(toolName);

  if (!tool) {
    logger.warn("tools.execute.unknown_tool", { toolName, requestId: ctx.requestId });
    return {
      success: false,
      error: `Bilinmeyen araç: ${toolName}`,
      meta: { executionTimeMs: Date.now() - startTime },
    };
  }

  try {
    const validatedArgs = tool.argsSchema.parse(args);

    if (tool.authorize) {
      const authorized = await tool.authorize(ctx);
      if (!authorized) {
        logger.warn("tools.execute.unauthorized", {
          toolName,
          userId: ctx.userId,
          requestId: ctx.requestId,
        });
        return {
          success: false,
          error: "Not authorized to use this tool.",
          meta: { executionTimeMs: Date.now() - startTime },
        };
      }
    }

    logger.info("tools.execute.start", {
      toolName,
      requestId: ctx.requestId,
      tenantId: ctx.tenantId,
    });

    const result = await tool.execute(validatedArgs, ctx);

    logger.info("tools.execute.complete", {
      toolName,
      success: result.success,
      executionTimeMs: Date.now() - startTime,
      requestId: ctx.requestId,
    });

    return result;
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      logger.warn("tools.execute.validation_error", {
        toolName,
        error: String(error),
        requestId: ctx.requestId,
      });
      return {
        success: false,
        error: "Geçersiz araç parametreleri.",
        meta: { executionTimeMs: Date.now() - startTime },
      };
    }

    logger.error("tools.execute.error", {
      toolName,
      error: redactSecrets(String(error)),
      requestId: ctx.requestId,
    });

    return {
      success: false,
      error: "Araç çalıştırılırken hata oluştu.",
      meta: { executionTimeMs: Date.now() - startTime },
    };
  }
}

export async function executeToolCalls(
  toolCalls: Array<{ tool: string; args: Record<string, unknown> }>,
  ctx: ToolContext,
): Promise<Array<{ tool: string; result: ToolResult }>> {
  const results: Array<{ tool: string; result: ToolResult }> = [];

  for (const call of toolCalls) {
    const result = await executeTool(call.tool, call.args, ctx);
    results.push({ tool: call.tool, result });
  }

  return results;
}

export function getToolDescriptions(): Record<string, string> {
  const descriptions: Record<string, string> = {};

  for (const [name, tool] of toolRegistry) {
    descriptions[name] = tool.description;
  }

  return descriptions;
}
