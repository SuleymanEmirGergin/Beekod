import "../env.js";
import axios from "axios";

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

function getArg(args, name) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) {
    return null;
  }
  const value = args[idx + 1];
  if (!value || value.startsWith("--")) {
    return "";
  }
  return value;
}

function normalizeBool(value, fallback) {
  if (value == null || value === "") {
    return fallback;
  }
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function resolvePath(input, supplierId, sellerId) {
  const fallback = "/integration/product/sellers/{sellerId}/products";
  const raw = input || process.env.TRENDYOL_AUTH_TEST_PATH || fallback;
  return raw.replace("{supplierId}", supplierId).replace("{sellerId}", sellerId);
}

function resolveUrl(endpoint, apiBaseRaw) {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  let base = apiBaseRaw.endsWith("/") ? apiBaseRaw.slice(0, -1) : apiBaseRaw;
  let path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (base.endsWith("/integration") && path.startsWith("/integration/")) {
    path = path.slice("/integration".length);
  }
  return `${base}${path}`;
}

async function main() {
  const args = process.argv.slice(2);
  const pathArg = getArg(args, "path");
  const debug = args.includes("--debug");

  const apiKey = required("TRENDYOL_API_KEY");
  const apiSecret = required("TRENDYOL_API_SECRET");
  const supplierId = required("TRENDYOL_SUPPLIER_ID");
  const sellerId = process.env.TRENDYOL_SELLER_ID || supplierId;
  const apiBase = process.env.TRENDYOL_API_BASE || "https://apigw.trendyol.com";
  const userAgentRaw = process.env.TRENDYOL_USER_AGENT;
  const userAgent = userAgentRaw ? userAgentRaw.trim() : `${supplierId} - SelfIntegration`;

  const endpoint = resolvePath(pathArg, supplierId, sellerId);
  const url = resolveUrl(endpoint, apiBase);
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  const params = endpoint.includes("/products")
    ? {
        page: Number.parseInt(process.env.TRENDYOL_AUTH_TEST_PAGE || "0", 10),
        size: Number.parseInt(process.env.TRENDYOL_AUTH_TEST_SIZE || "1", 10),
        approved: normalizeBool(process.env.TRENDYOL_AUTH_TEST_APPROVED, true)
      }
    : undefined;

  if (debug) {
    console.log("URL:", url);
    console.log("User-Agent:", userAgent);
    if (params) {
      console.log("Params:", params);
    }
  }

  const response = await axios.get(url, {
    params,
    headers: {
      Authorization: `Basic ${auth}`,
      "User-Agent": userAgent,
      Accept: "application/json"
    },
    timeout: 15000,
    validateStatus: () => true
  });

  if (response.status >= 200 && response.status < 300) {
    console.log("OK:", response.status);
    process.exit(0);
  }

  console.error("FAILED:", response.status);
  console.error("Response:", JSON.stringify(response.data, null, 2));
  process.exit(1);
}

main().catch((error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;
  if (status || data) {
    console.error("ERROR:", status, JSON.stringify(data, null, 2));
  } else {
    console.error("ERROR:", error?.message || error);
  }
  process.exit(1);
});
