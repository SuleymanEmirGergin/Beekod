import { z } from "zod";

const ResponseStyleSchema = z.enum(["short", "normal", "detailed"]);

export const ToolCallSchema = z
  .object({
    tool: z.string().min(1),
    args: z.record(z.unknown()).default({}),
  })
  .strict();

export const actionPlanSchema = z
  .object({
    intent: z.string().min(1).max(100),
    toolCalls: z.array(ToolCallSchema).default([]),
    responseStyle: ResponseStyleSchema.default("normal"),
  })
  .strict();

// Backward-compatible alias
export const AIActionSchema = actionPlanSchema;

export type AIAction = z.infer<typeof actionPlanSchema>;
export type ToolCall = z.infer<typeof ToolCallSchema>;
export type ResponseStyle = z.infer<typeof ResponseStyleSchema>;
