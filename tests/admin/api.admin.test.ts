import { describe, it, expect } from 'vitest';
import "dotenv/config";

const baseUrl = (process.env.API_TEST_BASE_URL || "").trim();
const adminKey = (process.env.API_TEST_ADMIN_KEY || process.env.ADMIN_API_KEY || "").trim();
const timeoutMs = 5000;

const run = baseUrl ? it : it.skip;
const runAdmin = adminKey ? run : it.skip;

async function requestJson(pathname: string, options?: { method?: "GET" | "POST"; body?: unknown }) {
  const url = new URL(pathname.replace(/^\//, ""), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
  const headers: Record<string, string> = {};
  if (options?.body != null) {
    headers["content-type"] = "application/json";
  }
  if (adminKey) {
    headers["x-admin-key"] = adminKey;
  }

  const response = await fetch(url, {
    method: options?.method ?? "GET",
    headers,
    body: options?.body != null ? JSON.stringify(options.body) : undefined,
  });
  
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  return { status: response.status, json };
}

describe('Admin API Integration', () => {
    runAdmin("products list returns items", async () => {
        const result = await requestJson("/products?limit=1");
        expect(result.status).toBe(200);
        expect(Array.isArray(result.json?.items)).toBe(true);
    });

    runAdmin("marketplace listings returns items", async () => {
        const result = await requestJson("/marketplace/listings?limit=1");
        expect(result.status).toBe(200);
        expect(Array.isArray(result.json?.items)).toBe(true);
    });

    runAdmin("marketplace stats returns items", async () => {
        const result = await requestJson("/marketplace/listings/stats");
        expect(result.status).toBe(200);
        expect(Array.isArray(result.json?.items)).toBe(true);
    });

    runAdmin("marketplace providers returns providers", async () => {
        const result = await requestJson("/marketplaces/providers");
        expect(result.status).toBe(200);
        expect(Array.isArray(result.json?.providers)).toBe(true);
    });

    runAdmin("content config returns object", async () => {
        const result = await requestJson("/content-config");
        expect(result.status).toBe(200);
        expect(typeof result.json).toBe("object");
    });
});
