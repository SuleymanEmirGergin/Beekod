/**
 * AI Orchestrator
 *
 * PLAN -> EXECUTE -> RESPOND flow with validation, rate limiting, and audit logging.
 */

import crypto from "crypto";
import { getGeminiProvider, LLMProvider } from "./providers/index.js";
import { executeTool, getAvailableTools, ToolContext } from "./tools/index.js";
import { AuditLogService } from "./audit/auditLog.service.js";
import { logger } from "../logger.js";
import { redactSecrets } from "./audit/redact.js";
import { actionPlanSchema } from "./schemas/action.schema.js";
import { getRedisClient, getRedisPrefix } from "../redis.js";

function generateRequestId(): string {
  return crypto.randomUUID();
}

const DEFAULT_AI_RATE_LIMIT_WINDOW_SECONDS = Number(process.env.AI_RATE_LIMIT_WINDOW_SECONDS ?? 600);
const DEFAULT_AI_RATE_LIMIT_MAX = Number(process.env.AI_RATE_LIMIT_MAX ?? 30);
const inMemoryLimiter = new Map<string, { count: number; resetAt: number }>();

type RateLimitStatus = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
};

async function checkRateLimit(key: string): Promise<RateLimitStatus> {
  const windowSeconds = Math.max(1, DEFAULT_AI_RATE_LIMIT_WINDOW_SECONDS);
  const limit = Math.max(1, DEFAULT_AI_RATE_LIMIT_MAX);
  const windowKey = Math.floor(Date.now() / 1000 / windowSeconds);
  const resetAt = (windowKey + 1) * windowSeconds * 1000;

  try {
    const client = await getRedisClient();
    if (client) {
      const redisKey = `${getRedisPrefix()}:ai:${key}:${windowKey}`;
      const count = await client.incr(redisKey);
      if (count === 1) {
        await client.expire(redisKey, windowSeconds);
      }
      const remaining = Math.max(0, limit - count);
      return { allowed: count <= limit, remaining, resetAt, limit };
    }
  } catch (error) {
    logger.warn("orchestrator.rate_limit.redis_failed", { error: String(error) });
  }

  const existing = inMemoryLimiter.get(key);
  if (!existing || existing.resetAt <= Date.now()) {
    inMemoryLimiter.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt, limit };
  }

  existing.count += 1;
  inMemoryLimiter.set(key, existing);
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    limit,
  };
}

export interface OrchestratorContext {
  tenantId: string;
  userId: string;
  requestId?: string;
  locale?: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface OrchestratorRequest {
  message: string;
  context: OrchestratorContext;
}

export interface OrchestratorResponse {
  requestId: string;
  intent: string;
  toolResults: Array<{
    tool: string;
    success: boolean;
    data?: unknown;
    error?: string;
  }>;
  answer: string;
  meta: {
    planLatencyMs: number;
    toolsLatencyMs: number;
    respondLatencyMs: number;
    totalLatencyMs: number;
  };
}

export class AIOrchestrator {
  private llmProvider: LLMProvider;
  private auditService: AuditLogService;

  constructor(llmProvider?: LLMProvider) {
    this.llmProvider = llmProvider || getGeminiProvider();
    this.auditService = new AuditLogService();
  }

  async process(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const totalStartTime = Date.now();
    const requestId = request.context.requestId || generateRequestId();

    logger.info("orchestrator.process.start", {
      requestId,
      messageLength: request.message.length,
      tenantId: request.context.tenantId,
    });

    try {
      const planStartTime = Date.now();

      const planResponse = await this.llmProvider.plan(
        {
          message: request.message,
          context: {
            conversationHistory: request.context.conversationHistory,
            availableTools: getAvailableTools(),
          },
        },
        {
          tenantId: request.context.tenantId,
          userId: request.context.userId,
          requestId,
          locale: request.context.locale,
        },
      );

      const planParse = actionPlanSchema.safeParse(planResponse.plan);
      const plan = planParse.success
        ? planParse.data
        : { intent: "unknown", toolCalls: [] as { tool: string; args: Record<string, unknown> }[], responseStyle: "normal" as const };

      const planLatencyMs = Date.now() - planStartTime;

      logger.info("orchestrator.plan.complete", {
        requestId,
        intent: plan.intent,
        toolCount: plan.toolCalls.length,
        planLatencyMs,
      });

      const toolsStartTime = Date.now();

      const toolCtx: ToolContext = {
        tenantId: request.context.tenantId,
        userId: request.context.userId,
        requestId,
        locale: request.context.locale,
      };

      const toolResults: Array<{ tool: string; result: unknown; error?: string }> = [];

      const rateKey = `${request.context.tenantId}:${request.context.userId}`;
      const rateStatus = await checkRateLimit(rateKey);
      if (!rateStatus.allowed) {
        logger.warn("orchestrator.rate_limit.exceeded", {
          requestId,
          tenantId: request.context.tenantId,
          userId: request.context.userId,
          limit: rateStatus.limit,
          resetAt: rateStatus.resetAt,
        });
        for (const toolCall of plan.toolCalls) {
          toolResults.push({
            tool: toolCall.tool,
            result: undefined,
            error: "rate_limit_exceeded",
          });
        }
      } else {
        for (const toolCall of plan.toolCalls) {
          const result = await executeTool(toolCall.tool, toolCall.args, toolCtx);
          toolResults.push({
            tool: toolCall.tool,
            result: result.success ? result.data : undefined,
            error: result.error,
          });
        }
      }

      const toolsLatencyMs = Date.now() - toolsStartTime;

      logger.info("orchestrator.tools.complete", {
        requestId,
        toolCount: toolResults.length,
        successCount: toolResults.filter((r) => !r.error).length,
        toolsLatencyMs,
      });

      const respondStartTime = Date.now();

      const respondResponse = await this.llmProvider.respond(
        {
          message: request.message,
          toolResults,
          style: plan.responseStyle,
          context: {
            conversationHistory: request.context.conversationHistory,
          },
        },
        {
          tenantId: request.context.tenantId,
          userId: request.context.userId,
          requestId,
          locale: request.context.locale,
        },
      );

      const respondLatencyMs = Date.now() - respondStartTime;
      const totalLatencyMs = Date.now() - totalStartTime;

      await this.auditService.log({
        tenantId: request.context.tenantId,
        userId: request.context.userId,
        requestText: request.message,
        intent: plan.intent,
        toolCalls: plan.toolCalls,
        toolResults,
      });

      return {
        requestId,
        intent: plan.intent,
        toolResults: toolResults.map((tr) => ({
          tool: tr.tool,
          success: !tr.error,
          data: tr.result,
          error: tr.error,
        })),
        answer: respondResponse.answer,
        meta: {
          planLatencyMs,
          toolsLatencyMs,
          respondLatencyMs,
          totalLatencyMs,
        },
      };
    } catch (error) {
      logger.error("orchestrator.process.error", {
        requestId,
        error: redactSecrets(String(error)),
      });

      return {
        requestId,
        intent: "error",
        toolResults: [],
        answer: "Sorry, something went wrong while processing your request.",
        meta: {
          planLatencyMs: 0,
          toolsLatencyMs: 0,
          respondLatencyMs: 0,
          totalLatencyMs: Date.now() - totalStartTime,
        },
      };
    }
  }
}

let defaultOrchestrator: AIOrchestrator | null = null;

export function getOrchestrator(): AIOrchestrator {
  if (!defaultOrchestrator) {
    defaultOrchestrator = new AIOrchestrator();
  }
  return defaultOrchestrator;
}
