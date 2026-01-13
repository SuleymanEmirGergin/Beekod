import { test, expect, describe } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

describe("Smoke Tests", () => {
  test("default image profiles JSON parses", () => {
    const filePath = path.join(root, "data", "image-profiles.default.json");
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });

  test("trendyol product defaults JSON parses", () => {
    const filePath = path.join(root, "data", "trendyol-product-defaults.json");
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    expect(typeof parsed).toBe("object");
    expect(parsed).toHaveProperty("vatRate");
  });

  test("schema.sql exists and is not empty", () => {
    const filePath = path.join(root, "db", "schema.sql");
    const stat = fs.statSync(filePath);
    expect(stat.isFile()).toBe(true);
    expect(stat.size).toBeGreaterThan(0);
  });
});
