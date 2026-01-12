/**
 * AI Module - Central Export
 * 
 * Provider + Orchestrator + Tools architecture
 */

// Orchestrator
export { AIOrchestrator, getOrchestrator } from './orchestrator.js';
export type { OrchestratorContext, OrchestratorRequest, OrchestratorResponse } from './orchestrator.js';

// Providers
export { 
  getGeminiProvider, 
  GeminiProvider,
  getWiroTryOnProvider,
  WiroTryOnProvider,
  getReplicateVideoProvider,
  ReplicateVideoProvider
} from './providers/index.js';
export type { 
  LLMProvider, 
  TryOnProvider, 
  VideoProvider,
  ImageProvider,
  ProviderContext,
  ProviderMeta,
  ActionPlan,
  ActionToolCall,
  PlanRequest,
  PlanResponse,
  RespondRequest,
  RespondResponse,
  TryOnRequest,
  TryOnResponse,
  VideoRequest,
  VideoResponse,
  ImageRequest,
  ImageResponse
} from './providers/index.js';

// Tools
export { 
  getAvailableTools, 
  getTool, 
  hasTool, 
  executeTool, 
  executeToolCalls,
  getToolDescriptions 
} from './tools/index.js';
export type { ToolDefinition, ToolContext, ToolResult, ToolRegistry } from './tools/index.js';

// Schemas
export { actionPlanSchema, ToolCallSchema } from './schemas/action.schema.js';
export type { AIAction, ToolCall, ResponseStyle } from './schemas/action.schema.js';

// Prompts
export { SYSTEM_PROMPTS, SYSTEM_PROMPT } from './prompts/system.js';

// Audit
export { AuditLogService } from './audit/auditLog.service.js';
export { redactSecrets, redactObject, safeStringify } from './audit/redact.js';
