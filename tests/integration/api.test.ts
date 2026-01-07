import "dotenv/config";

import assert from "node:assert/strict";
import test from "node:test";

const baseUrl = (process.env.API_TEST_BASE_URL || "").trim();
const timeoutRaw = Number(process.env.API_TEST_TIMEOUT_MS ?? 5000);
const timeoutMs = Number.isFinite(timeoutRaw) ? Math.max(timeoutRaw, 1000) : 5000;

const run = baseUrl ? test : test.skip;

type ResponseData = {
  status: number;
  json: unknown;
};

async function requestJson(pathname: string, options?: { method?: "GET" | "POST"; body?: unknown }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const url = new URL(pathname.replace(/^\//, ""), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
  const headers: Record<string, string> = {};
  if (options?.body != null) {
    headers["content-type"] = "application/json";
  }
  try {
    const response = await fetch(url, {
      method: options?.method ?? "GET",
      headers,
      body: options?.body != null ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });
    const text = await response.text();
    const json = text ? (JSON.parse(text) as unknown) : null;
    return { status: response.status, json } satisfies ResponseData;
  } finally {
    clearTimeout(timer);
  }
}

run("health endpoint responds ok", async () => {
  const result = await requestJson("/health");
  assert.equal(result.status, 200);
  assert.equal((result.json as { status?: string })?.status, "ok");
});

run("content preview returns text", async () => {
  const result = await requestJson("/content-preview", {
    method: "POST",
    body: { type: "seo", name: "API Test Urun" }
  });
  assert.equal(result.status, 200);
  assert.equal(typeof (result.json as { text?: string })?.text, "string");
});

run("content preview rejects invalid payload", async () => {
  const result = await requestJson("/content-preview", {
    method: "POST",
    body: { type: "seo" }
  });
  assert.equal(result.status, 400);
  assert.equal((result.json as { error?: { code?: string } })?.error?.code, "invalid_payload");
  assert.ok(Array.isArray((result.json as { details?: unknown })?.details));
});
