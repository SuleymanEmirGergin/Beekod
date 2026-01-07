import assert from "node:assert/strict";
import test from "node:test";
import { parseBooleanQuery, resolveSearchContext, truncateText } from "../src/utils/searchContext.js";

test("parseBooleanQuery accepts true values", () => {
  assert.equal(parseBooleanQuery("yes"), true);
  assert.equal(parseBooleanQuery("1"), true);
});

test("parseBooleanQuery rejects false values", () => {
  assert.equal(parseBooleanQuery("0"), false);
  assert.equal(parseBooleanQuery("no"), false);
});

test("resolveSearchContext applies docs flag", () => {
  const result = resolveSearchContext({ query: "trendyol api docs", docsFlag: true });
  assert.equal(result.siteSearch, "developers.trendyol.com");
  assert.equal(result.autoDocs, true);
});

test("resolveSearchContext respects site token", () => {
  const result = resolveSearchContext({ query: "site:example.com best deals" });
  assert.equal(result.siteSearch, "example.com");
  assert.equal(result.hasSiteToken, true);
  assert.equal(result.query, "best deals");
});

test("truncateText clamps long text", () => {
  assert.equal(truncateText("HelloWorld", 5), "He...");
});
