type JsonValue = Record<string, unknown> | string | number | boolean | null;

const baseUrl = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const adminKey = process.env.SMOKE_ADMIN_KEY ?? process.env.ADMIN_API_KEY ?? "";

async function request(path: string, options: RequestInit = {}) {
  const url = `${baseUrl}${path}`;
  const headers = new Headers(options.headers ?? {});
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let payload: JsonValue = text;
  try {
    payload = text ? (JSON.parse(text) as JsonValue) : null;
  } catch {
    // keep raw text
  }
  if (!res.ok) {
    const details = typeof payload === "string" ? payload : JSON.stringify(payload);
    throw new Error(`${res.status} ${res.statusText} - ${details}`);
  }
  return payload;
}

async function run() {
  console.log(`[Smoke] baseUrl=${baseUrl}`);

  const health = await request("/health");
  console.log("[Smoke] health ok", health);

  const chat = await request("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Bee252525 barkodlu urunun stokunu 5 yap" })
  });
  console.log("[Smoke] chat ok", chat);

  if (!adminKey) {
    console.warn("[Smoke] admin key missing; skipping reports test");
    return;
  }

  const report = await request("/reports/sales?period=this_week", {
    headers: { "x-admin-key": adminKey }
  });
  console.log("[Smoke] report ok", report);
}

run().catch((error) => {
  console.error("[Smoke] failed", error);
  process.exitCode = 1;
});
