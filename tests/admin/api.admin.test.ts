import "dotenv/config";

import assert from "node:assert/strict";
import test from "node:test";

const baseUrl = (process.env.API_TEST_BASE_URL || "").trim();
const adminKey = (process.env.API_TEST_ADMIN_KEY || process.env.ADMIN_API_KEY || "").trim();
const timeoutRaw = Number(process.env.API_TEST_TIMEOUT_MS ?? 5000);
const timeoutMs = Number.isFinite(timeoutRaw) ? Math.max(timeoutRaw, 1000) : 5000;

const run =
  baseUrl
    ? test
    : (name: string, fn: Parameters<typeof test>[1]) =>
        test(name, { skip: "API_TEST_BASE_URL not set" }, fn);
const runAdmin =
  adminKey
    ? run
    : (name: string, fn: Parameters<typeof test>[1]) =>
        run(name, { skip: "API_TEST_ADMIN_KEY not set" }, fn);

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
  if (adminKey) {
    headers["x-admin-key"] = adminKey;
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

runAdmin("products list returns items", async () => {
  const result = await requestJson("/products?limit=1");
  assert.equal(result.status, 200);
  assert.ok(Array.isArray((result.json as { items?: unknown[] })?.items));
});

runAdmin("marketplace listings returns items", async () => {
  const result = await requestJson("/marketplace/listings?limit=1");
  assert.equal(result.status, 200);
  assert.ok(Array.isArray((result.json as { items?: unknown[] })?.items));
});

runAdmin("marketplace stats returns items", async () => {
  const result = await requestJson("/marketplace/listings/stats");
  assert.equal(result.status, 200);
  assert.ok(Array.isArray((result.json as { items?: unknown[] })?.items));
});

runAdmin("marketplace providers returns providers", async () => {
  const result = await requestJson("/marketplaces/providers");
  assert.equal(result.status, 200);
  assert.ok(Array.isArray((result.json as { providers?: unknown[] })?.providers));
});

runAdmin("content config returns object", async () => {
  const result = await requestJson("/content-config");
  assert.equal(result.status, 200);
  assert.equal(typeof result.json, "object");
});

runAdmin("marketplace report returns items", async () => {
  const result = await requestJson("/reports/marketplaces?period=this_week");
  assert.equal(result.status, 200);
  const data = (result.json as { data?: { items?: unknown[] } })?.data;
  assert.ok(data);
  assert.ok(Array.isArray(data?.items));
});

runAdmin("admin settings returns defaults", async () => {
  const result = await requestJson("/admin/settings");
  assert.equal(result.status, 200);
  const settings = (result.json as { settings?: Record<string, unknown> })?.settings;
  assert.ok(settings);
  assert.equal(typeof settings?.lowStockThreshold, "number");
  assert.equal(typeof settings?.lowStockCriticalThreshold, "number");
  assert.equal(typeof settings?.toastDurationMs, "number");
});

runAdmin("admin settings update persists", async () => {
  const initial = await requestJson("/admin/settings");
  assert.equal(initial.status, 200);
  const current = (initial.json as { settings?: Record<string, unknown> })?.settings ?? {};
  const originalLow = Number(current.lowStockThreshold ?? 5);
  const originalCritical = Number(current.lowStockCriticalThreshold ?? 2);
  const originalToast = Number(current.toastDurationMs ?? 2000);

  const nextLow = Number.isFinite(originalLow) ? Math.max(0, originalLow + 1) : 6;
  const nextCritical = Number.isFinite(originalCritical)
    ? Math.min(originalCritical, nextLow)
    : Math.min(2, nextLow);
  const nextToast = Number.isFinite(originalToast) ? Math.max(500, originalToast + 500) : 2500;

  const update = await requestJson("/admin/settings", {
    method: "POST",
    body: {
      lowStockThreshold: nextLow,
      lowStockCriticalThreshold: nextCritical,
      toastDurationMs: nextToast
    }
  });
  assert.equal(update.status, 200);
  const updated = (update.json as { settings?: Record<string, unknown> })?.settings ?? {};
  assert.equal(updated.lowStockThreshold, nextLow);
  assert.equal(updated.lowStockCriticalThreshold, nextCritical);
  assert.equal(updated.toastDurationMs, nextToast);

  const restoreLow = Number.isFinite(originalLow) ? Math.floor(originalLow) : 5;
  const restoreCritical = Number.isFinite(originalCritical)
    ? Math.floor(Number.isFinite(originalLow) ? Math.min(originalCritical, originalLow) : originalCritical)
    : 2;
  const restoreToast = Number.isFinite(originalToast) ? Math.floor(originalToast) : 2000;

  await requestJson("/admin/settings", {
    method: "POST",
    body: {
      lowStockThreshold: restoreLow,
      lowStockCriticalThreshold: restoreCritical,
      toastDurationMs: restoreToast
    }
  });
});

runAdmin("admin settings rejects invalid payloads", async () => {
  const invalidOrder = await requestJson("/admin/settings", {
    method: "POST",
    body: { lowStockThreshold: 3, lowStockCriticalThreshold: 4 }
  });
  assert.equal(invalidOrder.status, 400);
  assert.equal(
    (invalidOrder.json as { error?: { code?: string } })?.error?.code,
    "invalid_threshold_order"
  );
  assert.equal(typeof (invalidOrder.json as { requestId?: string })?.requestId, "string");

  const invalidToast = await requestJson("/admin/settings", {
    method: "POST",
    body: { toastDurationMs: 200 }
  });
  assert.equal(invalidToast.status, 400);
  assert.equal(
    (invalidToast.json as { error?: { code?: string } })?.error?.code,
    "invalid_toast_duration"
  );
  assert.equal(typeof (invalidToast.json as { requestId?: string })?.requestId, "string");
});
