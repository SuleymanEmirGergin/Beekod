/**
 * Tool Interfaces
 * 
 * Common interfaces for AI tools
 */

import { z } from 'zod';

/**
 * Tool execution context
 */
export interface ToolContext {
  tenantId: string;
  userId: string;
  requestId: string;
  locale?: string;
}

/**
 * Tool execution result
 */
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    executionTimeMs?: number;
    cached?: boolean;
  };
}

/**
 * Legacy tool definition (backward compatible)
 */
export interface AITool<TArgs = unknown, TResult = unknown> {
  name: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodType<TArgs, any, any>;
  execute(args: TArgs, ctx: ToolContext): Promise<ToolResult<TResult>>;
}

/**
 * Base tool definition
 */
export interface ToolDefinition<TArgs = unknown, TResult = unknown> {
  name: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  argsSchema: z.ZodType<TArgs, any, any>;
  
  /**
   * Execute the tool with validated arguments
   */
  execute(args: TArgs, ctx: ToolContext): Promise<ToolResult<TResult>>;
  
  /**
   * Optional: Check if user has permission to use this tool
   */
  authorize?(ctx: ToolContext): Promise<boolean>;
}

/**
 * Tool registry type
 */
export type ToolRegistry = Map<string, ToolDefinition>;
