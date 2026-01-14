import { describe, it, expect } from 'vitest';
import "dotenv/config";

const baseUrl = (process.env.API_TEST_BASE_URL || "").trim();
const timeoutMs = 5000;

const run = baseUrl ? it : it.skip;

async function requestJson(pathname: string, options?: { method?: "GET" | "POST"; body?: unknown }) {
  const url = new URL(pathname.replace(/^\//, ""), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
  const headers: Record<string, string> = {};
  if (options?.body != null) {
    headers["content-type"] = "application/json";
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

describe('Public API Integration', () => {
    run("health endpoint responds ok", async () => {
        const result = await requestJson("/health");
        expect(result.status).toBe(200);
        expect(result.json?.status).toBe("ok");
    });

    run("content preview returns text", async () => {
        const result = await requestJson("/content-preview", {
            method: "POST",
            body: { type: "seo", name: "API Test Urun" }
        });
        expect(result.status).toBe(200);
        expect(typeof result.json?.text).toBe("string");
    });

    run("content preview rejects invalid payload", async () => {
        const result = await requestJson("/content-preview", {
            method: "POST",
            body: { type: "seo" }
        });
        expect(result.status).toBe(400);
        expect(result.json?.error?.code).toBe("invalid_payload");
    });
});
