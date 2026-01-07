import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("default image profiles JSON parses", () => {
  const filePath = path.join(root, "data", "image-profiles.default.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);
  assert.ok(Array.isArray(parsed));
  assert.ok(parsed.length > 0);
});

test("trendyol product defaults JSON parses", () => {
  const filePath = path.join(root, "data", "trendyol-product-defaults.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);
  assert.equal(typeof parsed, "object");
  assert.ok("vatRate" in parsed);
});

test("schema.sql exists and is not empty", () => {
  const filePath = path.join(root, "db", "schema.sql");
  const stat = fs.statSync(filePath);
  assert.ok(stat.isFile());
  assert.ok(stat.size > 0);
});
