import "../env.js";
import fs from "fs/promises";
import path from "path";

type SmokeCheck = {
  name: string;
  method: "GET" | "POST";
  path: string;
  body?: Record<string, unknown>;
  requireAuth?: boolean;
};

const baseUrl = (process.env.SMOKE_BASE_URL || "").trim() || `http://localhost:${process.env.PORT ?? "3000"}`;
const adminKey = (process.env.SMOKE_ADMIN_KEY || process.env.ADMIN_API_KEY || "").trim();
const timeoutRaw = Number(process.env.SMOKE_TIMEOUT_MS ?? 5000);
const timeoutMs = Number.isFinite(timeoutRaw) ? Math.max(timeoutRaw, 1000) : 5000;
const imagePath = (process.env.SMOKE_IMAGE_PATH || "").trim();
const imageQuery = (process.env.SMOKE_IMAGE_QUERY || "").trim();

const checks: SmokeCheck[] = [
  { name: "health", method: "GET", path: "/health" },
  {
    name: "content-preview",
    method: "POST",
    path: "/content-preview",
    body: { type: "seo", name: "Smoke Test Urun" }
  },
  { name: "content-config", method: "GET", path: "/content-config", requireAuth: true },
  { name: "products", method: "GET", path: "/products?limit=1", requireAuth: true },
  { name: "marketplace-listings", method: "GET", path: "/marketplace/listings?limit=1", requireAuth: true },
  { name: "marketplace-stats", method: "GET", path: "/marketplace/listings/stats", requireAuth: true },
  { name: "marketplace-providers", method: "GET", path: "/marketplaces/providers", requireAuth: true },
  { name: "report-marketplaces", method: "GET", path: "/reports/marketplaces?period=this_week", requireAuth: true },
  { name: "logs", method: "GET", path: "/logs?limit=1", requireAuth: true },
  { name: "ops-metrics", method: "GET", path: "/ops/metrics", requireAuth: true },
  { name: "docs-json", method: "GET", path: "/docs.json", requireAuth: true },
  { name: "cache-reset", method: "POST", path: "/cache/reset", requireAuth: true },
  { name: "orders", method: "GET", path: "/api/orders", requireAuth: true },
  { name: "orders-sync", method: "POST", path: "/api/orders/sync", requireAuth: true },
  { name: "intelligence-summary", method: "GET", path: "/api/intelligence/summary", requireAuth: true },
  { name: "intelligence-actions", method: "GET", path: "/api/intelligence/actions", requireAuth: true },
  { name: "products-predictions", method: "GET", path: "/products/predictions", requireAuth: true }
];

function buildHeaders(check: SmokeCheck) {
  const headers: Record<string, string> = {};
  if (check.body) {
    headers["content-type"] = "application/json";
  }
  if (check.requireAuth && adminKey) {
    headers["x-admin-key"] = adminKey;
  }
  return headers;
}

function resolveUrl(pathname: string) {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(pathname.replace(/^\//, ""), base).toString();
}

function resolveErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const record = payload as { error?: unknown; message?: unknown };
    if (typeof record.error === "string") {
      return record.error;
    }
    if (record.error && typeof record.error === "object") {
      const errorRecord = record.error as { code?: string; message?: string };
      return errorRecord.code ?? errorRecord.message ?? fallback;
    }
    if (typeof record.message === "string") {
      return record.message;
    }
  }
  return fallback;
}

function resolveImageMimeType(filePath: string) {
  switch (path.extname(filePath).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

async function runCheck(check: SmokeCheck) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const url = resolveUrl(check.path);
  const started = Date.now();

  try {
    const response = await fetch(url, {
      method: check.method,
      headers: buildHeaders(check),
      body: check.body ? JSON.stringify(check.body) : undefined,
      signal: controller.signal
    });
    const contentType = response.headers.get("content-type") ?? "";
    const durationMs = Date.now() - started;
    const text = await response.text();
    const json = contentType.includes("application/json") ? JSON.parse(text || "{}") : null;

    if (!response.ok) {
      const message = resolveErrorMessage(json, text);
      return {
        ok: false,
        name: check.name,
        status: response.status,
        durationMs,
        message
      };
    }

    if (check.name === "health" && json?.status !== "ok") {
      return {
        ok: false,
        name: check.name,
        status: response.status,
        durationMs,
        message: "health check did not return ok"
      };
    }

    if (check.name === "content-preview" && typeof json?.text !== "string") {
      return {
        ok: false,
        name: check.name,
        status: response.status,
        durationMs,
        message: "content preview missing text"
      };
    }

    if ((check.name === "products" || check.name === "marketplace-listings") && !Array.isArray(json?.items)) {
      return {
        ok: false,
        name: check.name,
        status: response.status,
        durationMs,
        message: "items response missing"
      };
    }

    if (check.name === "marketplace-stats" && !Array.isArray(json?.items)) {
      return {
        ok: false,
        name: check.name,
        status: response.status,
        durationMs,
        message: "stats response missing items"
      };
    }

    if (check.name === "marketplace-providers" && !Array.isArray(json?.providers)) {
      return {
        ok: false,
        name: check.name,
        status: response.status,
        durationMs,
        message: "providers response missing"
      };
    }

    if (check.name === "logs" && !Array.isArray(json?.items)) {
      return {
        ok: false,
        name: check.name,
        status: response.status,
        durationMs,
        message: "log items response missing"
      };
    }

    if (check.name === "report-marketplaces" && !Array.isArray(json?.data?.items)) {
      return {
        ok: false,
        name: check.name,
        status: response.status,
        durationMs,
        message: "report response missing items"
      };
    }

    if (check.name === "ops-metrics" && typeof json?.requests?.total !== "number") {
      return {
        ok: false,
        name: check.name,
        status: response.status,
        durationMs,
        message: "ops metrics response missing request totals"
      };
    }

    if (check.name === "docs-json" && typeof json?.openapi !== "string") {
      return {
        ok: false,
        name: check.name,
        status: response.status,
        durationMs,
        message: "docs json response missing openapi version"
      };
    }

    if (check.name === "cache-reset" && json?.status !== "ok") {
      return {
        ok: false,
        name: check.name,
        status: response.status,
        durationMs,
        message: "cache reset did not return ok"
      };
    }

    return {
      ok: true,
      name: check.name,
      status: response.status,
      durationMs
    };
  } catch (error) {
    const durationMs = Date.now() - started;
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, name: check.name, status: 0, durationMs, message };
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  console.log(`[smoke] baseUrl=${baseUrl}`);
  if (!adminKey) {
    console.log("[smoke] admin key not set; admin-protected endpoints may fail");
  }

  let failures = 0;
  for (const check of checks) {
    const result = await runCheck(check);
    if (result.ok) {
      console.log(`[smoke] ok ${result.name} (${result.status}) ${result.durationMs}ms`);
    } else {
      failures += 1;
      const hint =
        result.status === 401 && !adminKey
          ? " (set SMOKE_ADMIN_KEY or ADMIN_API_KEY)"
          : "";
      console.error(
        `[smoke] fail ${result.name} (${result.status}) ${result.durationMs}ms: ${result.message ?? "error"}${hint}`
      );
    }
  }

  if (failures > 0) {
    process.exitCode = 1;
  }

  if (imagePath) {
    const result = await runImageSearchCheck(imagePath);
    if (result.ok) {
      console.log(`[smoke] ok image-search (${result.status}) ${result.durationMs}ms`);
    } else {
      process.exitCode = 1;
      console.error(
        `[smoke] fail image-search (${result.status}) ${result.durationMs}ms: ${result.message ?? "error"}`
      );
    }
  } else {
    console.log("[smoke] skip image-search (set SMOKE_IMAGE_PATH to enable)");
  }
}

run();

async function runImageSearchCheck(filePath: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const resolved = path.resolve(filePath);
    const buffer = await fs.readFile(resolved);
    const mimeType = resolveImageMimeType(resolved);
    const form = new FormData();
    form.append("image", new Blob([buffer], { type: mimeType }), path.basename(resolved));
    if (imageQuery) {
      form.append("query", imageQuery);
    }
    const headers = new Headers();
    if (adminKey) {
      headers.set("x-admin-key", adminKey);
    }
    const response = await fetch(resolveUrl("/images/search"), {
      method: "POST",
      headers,
      body: form,
      signal: controller.signal
    });
    const contentType = response.headers.get("content-type") ?? "";
    const text = await response.text();
    const json = contentType.includes("application/json") ? JSON.parse(text || "{}") : null;
    const durationMs = Date.now() - started;
    if (!response.ok) {
      const message = resolveErrorMessage(json, text);
      return {
        ok: false,
        status: response.status,
        durationMs,
        message
      };
    }
    if (!Array.isArray(json?.items)) {
      return {
        ok: false,
        status: response.status,
        durationMs,
        message: "image search missing items"
      };
    }
    return { ok: true, status: response.status, durationMs };
  } catch (error) {
    const durationMs = Date.now() - started;
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, status: 0, durationMs, message };
  } finally {
    clearTimeout(timer);
  }
}
