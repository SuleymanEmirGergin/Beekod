import { describe, expect, test } from "vitest";
import { actionPlanSchema } from "../../src/ai/schemas/action.schema";

describe("actionPlanSchema", () => {
  test("parses a valid plan", () => {
    const plan = actionPlanSchema.parse({
      intent: "order lookup",
      toolCalls: [{ tool: "getOrderById", args: { orderId: "#BK-1" } }],
      responseStyle: "short",
    });

    expect(plan.intent).toBe("order lookup");
    expect(plan.responseStyle).toBe("short");
    expect(plan.toolCalls.length).toBe(1);
  });

  test("applies defaults", () => {
    const plan = actionPlanSchema.parse({
      intent: "general question",
      toolCalls: [],
    });

    expect(plan.responseStyle).toBe("normal");
  });

  test("rejects invalid responseStyle", () => {
    const parsed = actionPlanSchema.safeParse({
      intent: "invalid style",
      toolCalls: [],
      responseStyle: "friendly",
    });

    expect(parsed.success).toBe(false);
  });
});
