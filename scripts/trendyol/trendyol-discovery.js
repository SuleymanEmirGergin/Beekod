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

function resolveEndpoint(input, supplierId, categoryId) {
  if (!input) {
    return "";
  }
  let endpoint = input.replace("{supplierId}", supplierId);
  if (endpoint.includes("{categoryId}")) {
    if (!categoryId) {
      throw new Error("Missing --category-id for category attributes.");
    }
    endpoint = endpoint.replace("{categoryId}", categoryId);
  }
  return endpoint;
}

function resolveUrl(endpoint, apiBase) {
  if (endpoint.startsWith("http")) {
    return endpoint;
  }
  const base = apiBase.endsWith("/") ? apiBase : `${apiBase}/`;
  const path = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return new URL(path, base).toString();
}

async function main() {
  const args = process.argv.slice(2);
  const type = args.find((arg) => !arg.startsWith("--")) || "";
  const pathArg = getArg(args, "path") || "";
  const categoryId = getArg(args, "category-id") || getArg(args, "category") || "";
  const page = getArg(args, "page");
  const size = getArg(args, "size");
  const debug = args.includes("--debug") || process.env.TRENDYOL_TEST_DEBUG === "true";

  const apiKey = required("TRENDYOL_API_KEY");
  const apiSecret = required("TRENDYOL_API_SECRET");
  const supplierId = required("TRENDYOL_SUPPLIER_ID");
  const apiBase = required("TRENDYOL_API_BASE");
  const userAgent = (process.env.TRENDYOL_USER_AGENT || `${supplierId} - BeekodBot`).trim();

  const endpoints = {
    brands: process.env.TRENDYOL_BRANDS_PATH,
    categories: process.env.TRENDYOL_CATEGORIES_PATH,
    "category-attributes": process.env.TRENDYOL_CATEGORY_ATTRIBUTES_PATH,
    "cargo-companies": process.env.TRENDYOL_CARGO_COMPANIES_PATH,
    "shipment-addresses": process.env.TRENDYOL_SHIPMENT_ADDRESSES_PATH,
    "returning-addresses": process.env.TRENDYOL_RETURNING_ADDRESSES_PATH,
    products: process.env.TRENDYOL_PRODUCT_LIST_PATH
  };

  const endpointKey = type.toLowerCase();
  const normalizedKey =
    endpointKey === "getcategorytree" || endpointKey === "categorytree" || endpointKey === "category-tree"
      ? "categories"
      : endpointKey;
  const endpointRaw = pathArg || endpoints[normalizedKey];
  if (!endpointRaw) {
    const available = Object.keys(endpoints).join(", ");
    throw new Error(`Missing endpoint. Use --path or one of: ${available}`);
  }

  const endpoint = resolveEndpoint(endpointRaw, supplierId, categoryId);
  const url = resolveUrl(endpoint, apiBase);
  if (debug) {
    console.log("URL:", url);
    console.log("User-Agent:", userAgent);
  }

  const params = {};
  if (page) {
    params.page = page;
  }
  if (size) {
    params.size = size;
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const response = await axios.get(url, {
    params: Object.keys(params).length ? params : undefined,
    headers: {
      Authorization: `Basic ${auth}`,
      "User-Agent": userAgent,
      Accept: "application/json"
    },
    timeout: 15000,
    validateStatus: () => true
  });

  console.log("HTTP:", response.status);
  console.log("Response:", JSON.stringify(response.data, null, 2));
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
