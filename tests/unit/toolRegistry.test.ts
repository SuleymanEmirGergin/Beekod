import { describe, expect, test } from "vitest";
import { getAvailableTools, getTool } from "../../src/ai/tools/index";

describe("tool registry", () => {
  test("includes required tools", () => {
    const tools = getAvailableTools();
    expect(tools).toEqual(
      expect.arrayContaining([
        "getOrderById",
        "listRecentOrders",
        "searchCheapestProduct",
        "draftCustomerReply",
        "createShipment",
        "analyticsQuery",
      ]),
    );
  });

  test("routes tools by name", () => {
    const tool = getTool("getOrderById");
    expect(tool?.name).toBe("getOrderById");
  });
});
