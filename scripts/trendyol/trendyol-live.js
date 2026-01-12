import "../env.js";
import fs from "fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import axios from "axios";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value.trim();
}

function getArg(args, name) {
  const flag = `--${name}`;
  const direct = args.find((arg) => arg.startsWith(`${flag}=`));
  if (direct) {
    return direct.slice(flag.length + 1).trim();
  }
  const idx = args.indexOf(flag);
  if (idx === -1) {
    return "";
  }
  const value = args[idx + 1];
  if (!value || value.startsWith("--")) {
    return "";
  }
  return value.trim();
}

const VALUE_FLAGS = new Set([
  "method",
  "brand",
  "brand-name",
  "brand-id",
  "brandId",
  "category-id",
  "category",
  "category-query",
  "categoryQuery",
  "category-name",
  "categoryName",
  "page",
  "size",
  "max-pages",
  "maxPages",
  "body",
  "body-file",
  "bodyFile",
  "save",
  "save-path",
  "savePath",
  "path"
]);

function getPositionalArgs(args) {
  const positionals = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg) {
      continue;
    }
    if (arg === "--") {
      positionals.push(...args.slice(i + 1));
      break;
    }
    if (arg.startsWith("--")) {
      const eqIndex = arg.indexOf("=");
      const flag = eqIndex === -1 ? arg : arg.slice(0, eqIndex);
      const name = flag.slice(2);
      if (VALUE_FLAGS.has(name) && eqIndex === -1) {
        const next = args[i + 1];
        if (next && !next.startsWith("--")) {
          i += 1;
        }
      }
      continue;
    }
    positionals.push(arg);
  }
  return positionals;
}

function hasFlag(args, name) {
  return args.includes(`--${name}`);
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function resolveMethod(args) {
  const explicit = getArg(args, "method").toUpperCase();
  if (explicit) {
    return explicit;
  }
  if (args.includes("--post")) {
    return "POST";
  }
  if (args.includes("--put")) {
    return "PUT";
  }
  if (args.includes("--delete")) {
    return "DELETE";
  }
  return "GET";
}

function resolveBrandQuery(args) {
  return (
    getArg(args, "brand") ||
    getArg(args, "brand-name") ||
    (process.env.TRENDYOL_BRAND_QUERY || "").trim()
  );
}

function resolveBrandId(args) {
  const raw =
    getArg(args, "brand-id") ||
    getArg(args, "brandId") ||
    (process.env.TRENDYOL_TEST_BRAND_ID || "").trim() ||
    (process.env.TRENDYOL_BRAND_ID || "").trim();
  if (!raw) {
    return "";
  }
  const normalized = String(raw).trim();
  if (!/^\d+$/.test(normalized)) {
    throw new Error("Brand ID must be a valid integer. Use --brand-id 123 or TRENDYOL_TEST_BRAND_ID.");
  }
  return normalized;
}

function resolvePagination(args) {
  const pageRaw = getArg(args, "page") || (process.env.TRENDYOL_TEST_PAGE || "").trim();
  const sizeRaw = getArg(args, "size") || (process.env.TRENDYOL_TEST_SIZE || "").trim();
  const page = pageRaw ? Number.parseInt(pageRaw, 10) : 0;
  const size = sizeRaw ? Number.parseInt(sizeRaw, 10) : 10;
  if (!Number.isFinite(page) || page < 0) {
    throw new Error("Page must be a non-negative integer. Use --page 0 or TRENDYOL_TEST_PAGE.");
  }
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error("Size must be a positive integer. Use --size 10 or TRENDYOL_TEST_SIZE.");
  }
  return { page, size };
}

function resolveScanOptions(args) {
  const scanEnabled =
    hasFlag(args, "scan-pages") ||
    hasFlag(args, "scanPages") ||
    hasFlag(args, "scan-all") ||
    hasFlag(args, "scanAll") ||
    process.env.TRENDYOL_TEST_SCAN_PAGES === "true";
  const scanAll = hasFlag(args, "scan-all") || hasFlag(args, "scanAll") || process.env.TRENDYOL_TEST_SCAN_ALL === "true";
  const maxPagesRaw = getArg(args, "max-pages") || getArg(args, "maxPages") || (process.env.TRENDYOL_TEST_MAX_PAGES || "").trim();
  const maxPages = maxPagesRaw ? Number.parseInt(maxPagesRaw, 10) : 10;
  if (!Number.isFinite(maxPages) || maxPages <= 0) {
    throw new Error("Max pages must be a positive integer. Use --max-pages 5 or TRENDYOL_TEST_MAX_PAGES.");
  }
  return { scanEnabled: scanEnabled || scanAll, scanAll, maxPages };
}

function extractBrands(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object") {
    const brands = payload.brands;
    if (Array.isArray(brands)) {
      return brands;
    }
  }
  return [];
}

function findBrandMatches(payload, query) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }
  const brands = extractBrands(payload);
  return brands.filter((brand) => {
    if (!brand || typeof brand !== "object") {
      return false;
    }
    const name = typeof brand.name === "string" ? brand.name : "";
    if (!name) {
      return false;
    }
    return name.toLowerCase().includes(normalizedQuery);
  });
}

async function promptBrandSelection(matches, query) {
  console.log(`Brand matches for "${query}":`);
  matches.forEach((match, index) => {
    console.log(`${index + 1}. ${match.id} - ${match.name}`);
  });

  if (!process.stdin.isTTY) {
    throw new Error("Multiple brand matches found. Use --brand-id to select one.");
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question(`Select brand [1-${matches.length}] (default 1): `)).trim();
    if (!answer) {
      return matches[0];
    }
    const normalized = answer.toLowerCase();
    if (["q", "quit", "exit"].includes(normalized)) {
      throw new Error("Brand selection cancelled.");
    }
    if (/^\d+$/.test(answer)) {
      const index = Number.parseInt(answer, 10);
      if (index >= 1 && index <= matches.length) {
        return matches[index - 1];
      }
      const byId = matches.find((match) => String(match.id) === answer);
      if (byId) {
        return byId;
      }
    }
    throw new Error(`Invalid selection: ${answer}`);
  } finally {
    rl.close();
  }
}

async function resolveBrandFromQuery(args) {
  const query = resolveBrandQuery(args);
  if (!query) {
    return { id: "", name: "", matches: [] };
  }

  const { response } = await requestWithRetry({
    method: "GET",
    endpoint: brandsEndpoint,
    params: undefined,
    body: undefined,
    categoryId: "",
    label: "Brands"
  });

  if (!response) {
    throw new Error("Failed to fetch brands. No response received.");
  }
  if (response.status >= 400) {
    throw new Error(`Failed to fetch brands. HTTP ${response.status}.`);
  }

  const matches = findBrandMatches(response.data, query);
  if (!matches.length) {
    throw new Error(`No brand match for "${query}". Try --brand-id.`);
  }
  const selected = matches.length > 1 ? await promptBrandSelection(matches, query) : matches[0];
  const normalizedId = String(selected.id).trim();
  if (!/^\d+$/.test(normalizedId)) {
    throw new Error(`Resolved brandId is not numeric: ${selected.id}`);
  }
  if (debug) {
    console.log("Brand match:", { query, id: normalizedId, name: selected.name });
  }
  return { id: normalizedId, name: selected.name || "", matches };
}

function extractProductItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object") {
    const container = payload;
    const keys = ["content", "items", "result", "data", "products", "productList"];
    for (const key of keys) {
      if (Array.isArray(container[key])) {
        return container[key];
      }
    }
  }
  return [];
}

function extractBrandIdFromItem(item) {
  if (!item || typeof item !== "object") {
    return undefined;
  }
  const record = item;
  const direct = normalizeNumber(record.brandId);
  if (direct != null) {
    return direct;
  }
  const brand = record.brand;
  if (brand && typeof brand === "object") {
    const nested = normalizeNumber(brand.id ?? brand.brandId);
    if (nested != null) {
      return nested;
    }
  }
  return undefined;
}

function findBrandProductMatches(payload, brandId) {
  const targetId = normalizeNumber(brandId);
  if (!targetId) {
    return [];
  }
  const items = extractProductItems(payload);
  return items.filter((item) => extractBrandIdFromItem(item) === targetId);
}

function shouldShowResponse(args, hasFilter) {
  if (!hasFilter) {
    return true;
  }
  if (hasFlag(args, "show-response") || hasFlag(args, "full")) {
    return true;
  }
  const env = process.env.TRENDYOL_BRAND_SHOW_RESPONSE;
  if (!env) {
    return false;
  }
  const normalized = env.trim().toLowerCase();
  return ["true", "1", "yes"].includes(normalized);
}

async function resolveBody(args, method) {
  if (method === "GET") {
    return undefined;
  }
  const bodyArg = getArg(args, "body");
  const bodyFile = getArg(args, "body-file") || getArg(args, "bodyFile");
  if (!bodyArg && !bodyFile) {
    return undefined;
  }
  let raw = bodyArg;
  if (bodyFile) {
    raw = await fs.readFile(bodyFile, "utf8");
  }
  if (!raw || !raw.trim()) {
    return undefined;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error("Body must be valid JSON. Use --body '{}' or --body-file path.");
  }
}

const apiKey = requiredEnv("TRENDYOL_API_KEY");
const apiSecret = requiredEnv("TRENDYOL_API_SECRET");
const supplierId = requiredEnv("TRENDYOL_SUPPLIER_ID");
const sellerId = (process.env.TRENDYOL_SELLER_ID || supplierId).trim();

const userAgentRaw = process.env.TRENDYOL_USER_AGENT;
const userAgent = userAgentRaw && userAgentRaw.trim()
  ? userAgentRaw.trim()
  : `${supplierId} - SelfIntegration`;

const apiBaseOverride = (process.env.TRENDYOL_API_BASE || "").trim();
const debug = process.env.TRENDYOL_TEST_DEBUG === "true";
const fallbackEnabled = process.env.TRENDYOL_TEST_FALLBACK !== "false";
const timeoutRaw = Number.parseInt(process.env.TRENDYOL_TEST_TIMEOUT_MS || "15000", 10);
const timeoutMs = Number.isFinite(timeoutRaw) ? Math.max(timeoutRaw, 1000) : 15000;

const brandsEndpoint =
  process.env.TRENDYOL_BRANDS_URL ||
  process.env.TRENDYOL_BRANDS_PATH ||
  "/integration/product/brands";

const categoriesEndpoint =
  process.env.TRENDYOL_CATEGORIES_PATH ||
  "/integration/product/product-categories";

const categoryAttributesEndpoint =
  process.env.TRENDYOL_CATEGORY_ATTRIBUTES_PATH ||
  "/integration/product/product-categories/{categoryId}/attributes";

const baseDefaults = {
  api: "https://api.trendyol.com",
  apiSapigw: "https://api.trendyol.com/sapigw",
  apigw: "https://apigw.trendyol.com"
};

function normalizeBase(base) {
  const trimmed = String(base || "").trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function baseHasSapigw(base) {
  try {
    const parsed = new URL(base);
    return parsed.pathname.split("/").includes("sapigw");
  } catch {
    return base.includes("/sapigw");
  }
}

function normalizeEndpoint(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) {
    return "";
  }
  const lower = trimmed.toLowerCase();
  if (lower === "getbrands" || lower === "brands") {
    return brandsEndpoint;
  }
  if (
    lower === "getcategorytree" ||
    lower === "categorytree" ||
    lower === "category-tree" ||
    lower === "categories" ||
    lower === "getcategories"
  ) {
    return categoriesEndpoint;
  }
  if (lower === "getcategoryattributes" || lower === "category-attributes" || lower === "categoryattributes") {
    return categoryAttributesEndpoint;
  }
  return trimmed;
}

function resolveEndpoint(args) {
  const pathArg = getPositionalArgs(args)[0];
  const argEndpoint = pathArg ? normalizeEndpoint(pathArg) : "";
  const envEndpoint = process.env.TRENDYOL_TEST_PATH
    ? normalizeEndpoint(process.env.TRENDYOL_TEST_PATH)
    : "";
  return argEndpoint || envEndpoint || `/suppliers/${supplierId}/products`;
}

function resolveCategoryQuery(args) {
  return (
    getArg(args, "category-query") ||
    getArg(args, "categoryQuery") ||
    getArg(args, "category-name") ||
    getArg(args, "categoryName") ||
    (process.env.TRENDYOL_TEST_CATEGORY_QUERY || "").trim() ||
    (process.env.TRENDYOL_CATEGORY_QUERY || "").trim()
  );
}

function resolveCategoryFilterOptions(args) {
  const filterRaw =
    getArg(args, "category-filter") ||
    getArg(args, "categoryFilter") ||
    (process.env.TRENDYOL_TEST_CATEGORY_FILTER || "").trim();
  const filter = normalizeText(filterRaw);
  const normalizedFilter = ["leaf", "parent", "any"].includes(filter) ? filter : "any";

  const depthRaw =
    getArg(args, "category-depth") ||
    getArg(args, "categoryDepth") ||
    (process.env.TRENDYOL_TEST_CATEGORY_DEPTH || "").trim();
  const minDepthRaw =
    getArg(args, "category-min-depth") ||
    getArg(args, "categoryMinDepth") ||
    (process.env.TRENDYOL_TEST_CATEGORY_MIN_DEPTH || "").trim();
  const maxDepthRaw =
    getArg(args, "category-max-depth") ||
    getArg(args, "categoryMaxDepth") ||
    (process.env.TRENDYOL_TEST_CATEGORY_MAX_DEPTH || "").trim();

  const depth = depthRaw && /^\d+$/.test(depthRaw) ? Number.parseInt(depthRaw, 10) : null;
  const minDepth = minDepthRaw && /^\d+$/.test(minDepthRaw) ? Number.parseInt(minDepthRaw, 10) : null;
  const maxDepth = maxDepthRaw && /^\d+$/.test(maxDepthRaw) ? Number.parseInt(maxDepthRaw, 10) : null;

  return {
    filter: normalizedFilter,
    depth,
    minDepth: depth != null ? depth : minDepth,
    maxDepth: depth != null ? depth : maxDepth
  };
}

function getCategoryIdValue(node) {
  return node.categoryId ?? node.categoryID ?? node.category_id ?? node.id ?? null;
}

function getCategoryNameValue(node) {
  return node.name ?? node.categoryName ?? node.category_name ?? node.title ?? "";
}

function getCategoryParentIdValue(node) {
  return node.parentId ?? node.parentCategoryId ?? node.parent_id ?? node.parentCategoryID ?? null;
}

const categoryChildKeys = [
  "subCategories",
  "children",
  "childCategories",
  "subCategoryList",
  "categoryList",
  "categories"
];

function getCategoryChildArrays(node) {
  const arrays = [];
  for (const key of categoryChildKeys) {
    const value = node[key];
    if (Array.isArray(value) && value.length) {
      arrays.push(value);
    }
  }
  return arrays;
}

function looksLikeCategoryNode(node) {
  if (!node || typeof node !== "object") {
    return false;
  }
  const idValue = getCategoryIdValue(node);
  const nameValue = getCategoryNameValue(node);
  if (idValue != null && String(nameValue || "").trim()) {
    return true;
  }
  return getCategoryChildArrays(node).length > 0;
}

function extractFlatCategoryEntries(payload) {
  const results = [];
  const stack = [payload];
  const seen = new Set();

  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== "object") {
      continue;
    }
    if (seen.has(node)) {
      continue;
    }
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) {
        stack.push(item);
      }
      continue;
    }

    const idValue = getCategoryIdValue(node);
    const nameValue = getCategoryNameValue(node);

    if (idValue != null && nameValue) {
      const id = String(idValue).trim();
      const name = String(nameValue).trim();
      if (id && name) {
        results.push({ id, name, parentId: "", depth: 0, isLeaf: true });
      }
    }

    for (const value of Object.values(node)) {
      if (value && typeof value === "object") {
        stack.push(value);
      }
    }
  }

  const unique = new Map();
  for (const entry of results) {
    if (!unique.has(entry.id)) {
      unique.set(entry.id, entry);
    }
  }
  return Array.from(unique.values());
}

function collectCategoryEntries(payload) {
  const nodes = new Map();
  const childCounts = new Map();
  const visited = new Set();

  function addNode({ id, name, parentId, depth }) {
    const normalizedId = String(id || "").trim();
    const normalizedName = String(name || "").trim();
    if (!normalizedId || !normalizedName) {
      return;
    }
    const existing = nodes.get(normalizedId);
    if (existing) {
      if (!existing.name && normalizedName) {
        existing.name = normalizedName;
      }
      if (!existing.parentId && parentId) {
        existing.parentId = parentId;
      }
      if (typeof depth === "number" && (existing.depth == null || depth > existing.depth)) {
        existing.depth = depth;
      }
      return;
    }
    nodes.set(normalizedId, {
      id: normalizedId,
      name: normalizedName,
      parentId: parentId || "",
      depth: typeof depth === "number" ? depth : null
    });
  }

  function walk(node, parentId, depth) {
    if (!node || typeof node !== "object") {
      return;
    }
    if (visited.has(node)) {
      return;
    }
    visited.add(node);

    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item, parentId, depth);
      }
      return;
    }

    const idValue = getCategoryIdValue(node);
    const nameValue = getCategoryNameValue(node);
    const parentValue = getCategoryParentIdValue(node);
    const normalizedId = idValue != null ? String(idValue).trim() : "";
    const normalizedName = nameValue != null ? String(nameValue).trim() : "";
    const resolvedParent = parentValue != null ? String(parentValue).trim() : parentId || "";
    const resolvedDepth = typeof depth === "number" ? depth : 0;

    if (normalizedId && normalizedName) {
      addNode({ id: normalizedId, name: normalizedName, parentId: resolvedParent, depth: resolvedDepth });
    }

    const childArrays = getCategoryChildArrays(node);
    const nextParent = normalizedId || resolvedParent || parentId || "";
    const nextDepth = normalizedId ? resolvedDepth + 1 : resolvedDepth;

    if (normalizedId && childArrays.length) {
      childCounts.set(normalizedId, (childCounts.get(normalizedId) || 0) + childArrays.length);
    }

    for (const childArray of childArrays) {
      walk(childArray, nextParent, nextDepth);
    }
  }

  let roots = [];
  if (Array.isArray(payload)) {
    roots = [payload];
  } else if (payload && typeof payload === "object") {
    for (const value of Object.values(payload)) {
      if (Array.isArray(value) && value.some(looksLikeCategoryNode)) {
        roots.push(value);
      }
    }
  }

  if (!roots.length) {
    roots = [payload];
  }

  for (const root of roots) {
    walk(root, "", 0);
  }

  if (!nodes.size) {
    return extractFlatCategoryEntries(payload);
  }

  for (const entry of nodes.values()) {
    if (entry.parentId) {
      childCounts.set(entry.parentId, (childCounts.get(entry.parentId) || 0) + 1);
    }
  }

  const entries = Array.from(nodes.values());
  const index = new Map(entries.map((entry) => [entry.id, entry]));

  function computeDepth(entry, seen = new Set()) {
    if (typeof entry.depth === "number" && entry.depth >= 0) {
      return entry.depth;
    }
    if (!entry.parentId || !index.has(entry.parentId)) {
      entry.depth = 0;
      return entry.depth;
    }
    if (seen.has(entry.id)) {
      entry.depth = 0;
      return entry.depth;
    }
    seen.add(entry.id);
    const parent = index.get(entry.parentId);
    const parentDepth = computeDepth(parent, seen);
    entry.depth = parentDepth + 1;
    return entry.depth;
  }

  return entries.map((entry) => {
    const depth = computeDepth(entry);
    const isLeaf = !childCounts.has(entry.id);
    return { ...entry, depth, isLeaf };
  });
}

function extractCategoryEntries(payload, options) {
  const entries = collectCategoryEntries(payload);
  const filter = options?.filter || "any";
  const minDepth = options?.minDepth;
  const maxDepth = options?.maxDepth;

  return entries.filter((entry) => {
    if (filter === "leaf" && entry.isLeaf === false) {
      return false;
    }
    if (filter === "parent" && entry.isLeaf === true) {
      return false;
    }
    if (typeof minDepth === "number" && entry.depth < minDepth) {
      return false;
    }
    if (typeof maxDepth === "number" && entry.depth > maxDepth) {
      return false;
    }
    return true;
  });
}

function findCategoryMatches(entries, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return [];
  }
  const matches = [];
  for (const entry of entries) {
    const normalizedName = normalizeText(entry.name);
    if (!normalizedName) {
      continue;
    }
    let score = 0;
    if (normalizedName === normalizedQuery) {
      score = 3;
    } else if (normalizedName.startsWith(normalizedQuery)) {
      score = 2;
    } else if (normalizedName.includes(normalizedQuery)) {
      score = 1;
    } else {
      continue;
    }
    matches.push({ ...entry, score });
  }
  return matches.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (a.name.length !== b.name.length) {
      return a.name.length - b.name.length;
    }
    return a.id.localeCompare(b.id);
  });
}

async function promptCategorySelection(matches, query) {
  console.log(`Category matches for "${query}":`);
  matches.forEach((match, index) => {
    const depthLabel = typeof match.depth === "number" ? ` d${match.depth}` : "";
    const typeLabel = match.isLeaf === true ? " leaf" : match.isLeaf === false ? " parent" : "";
    console.log(`${index + 1}. ${match.id} - ${match.name}${typeLabel}${depthLabel}`);
  });

  if (!process.stdin.isTTY) {
    throw new Error("Multiple category matches found. Use --category-id to select one.");
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question(`Select category [1-${matches.length}] (default 1): `)).trim();
    if (!answer) {
      return matches[0];
    }
    const normalized = answer.toLowerCase();
    if (["q", "quit", "exit"].includes(normalized)) {
      throw new Error("Category selection cancelled.");
    }
    if (/^\d+$/.test(answer)) {
      const index = Number.parseInt(answer, 10);
      if (index >= 1 && index <= matches.length) {
        return matches[index - 1];
      }
      const byId = matches.find((match) => match.id === answer);
      if (byId) {
        return byId;
      }
    }
    throw new Error(`Invalid selection: ${answer}`);
  } finally {
    rl.close();
  }
}

async function resolveCategoryId(args, endpoint) {
  const raw =
    getArg(args, "category-id") ||
    getArg(args, "category") ||
    (process.env.TRENDYOL_TEST_CATEGORY_ID || "").trim() ||
    (process.env.TRENDYOL_CATEGORY_ID || "").trim();
  if (raw) {
    const normalized = String(raw).trim();
    if (!/^\d+$/.test(normalized)) {
      throw new Error(
        "Category ID must be a valid integer. Use --category-id 123 or TRENDYOL_TEST_CATEGORY_ID."
      );
    }
    return { id: normalized, name: "", query: "" };
  }

  if (!needsCategoryId(endpoint)) {
    return "";
  }

  const query = resolveCategoryQuery(args);
  if (!query) {
    return { id: "", name: "", query: "" };
  }

  const filterOptions = resolveCategoryFilterOptions(args);
  const { response } = await requestWithRetry({
    method: "GET",
    endpoint: categoriesEndpoint,
    params: undefined,
    body: undefined,
    categoryId: "",
    label: "Categories"
  });

  if (!response) {
    throw new Error("Failed to fetch categories. No response received.");
  }
  if (response.status >= 400) {
    throw new Error(`Failed to fetch categories. HTTP ${response.status}.`);
  }

  const matches = findCategoryMatches(extractCategoryEntries(response.data, filterOptions), query);
  if (!matches.length) {
    throw new Error(`No category match for "${query}". Try --category-name or --category-id.`);
  }
  const selected = matches.length > 1 ? await promptCategorySelection(matches, query) : matches[0];
  const normalizedId = String(selected.id).trim();
  if (!/^\d+$/.test(normalizedId)) {
    throw new Error(`Resolved categoryId is not numeric: ${selected.id}`);
  }
  if (debug) {
    console.log("Category match:", { query, id: normalizedId, name: selected.name });
  }
  return { id: normalizedId, name: selected.name, query };
}

function resolveAttributesOnly(args) {
  return (
    hasFlag(args, "attributes-only") ||
    hasFlag(args, "attributesOnly") ||
    process.env.TRENDYOL_TEST_ATTRIBUTES_ONLY === "true"
  );
}

function extractAttributes(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.attributes)) {
      return payload.attributes;
    }
    if (Array.isArray(payload.categoryAttributes)) {
      return payload.categoryAttributes;
    }
    if (Array.isArray(payload.attributeList)) {
      return payload.attributeList;
    }
  }
  return payload;
}

function resolveSaveTemplate(args) {
  return (
    getArg(args, "save-template") ||
    getArg(args, "saveTemplate") ||
    (process.env.TRENDYOL_TEST_SAVE_TEMPLATE || "").trim()
  );
}

function safeFileSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatSaveTemplate(template, context) {
  if (!template) {
    return "";
  }
  const timestamp = context.timestamp;
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  const dateStamp = `${yyyy}${mm}${dd}`;
  const timeStamp = `${hh}${min}${ss}`;

  const endpointRaw = String(context.endpoint || "").trim();
  const endpointSafe = safeFileSegment(endpointRaw.replace(/[\\/]+/g, "-"));

  const replacements = new Map([
    ["{timestamp}", String(timestamp)],
    ["{date}", dateStamp],
    ["{time}", timeStamp],
    ["{categoryId}", safeFileSegment(context.categoryId)],
    ["{categoryName}", safeFileSegment(context.categoryName)],
    ["{categoryQuery}", safeFileSegment(context.categoryQuery)],
    ["{endpoint}", endpointSafe]
  ]);

  let output = String(template);
  for (const [token, value] of replacements) {
    output = output.split(token).join(value);
  }
  return output;
}

function resolveSavePaths(args, timestamp, context = {}) {
  const explicit =
    getArg(args, "save") ||
    getArg(args, "save-path") ||
    getArg(args, "savePath") ||
    (process.env.TRENDYOL_TEST_SAVE_PATH || "").trim();
  const template = resolveSaveTemplate(args);
  const saveFlag = hasFlag(args, "save");
  if (!explicit && !saveFlag && !template) {
    return null;
  }
  const defaultBase = `temp/trendyol-live-${timestamp}`;
  const contextWithTime = { ...context, timestamp };
  const templateBase = template ? formatSaveTemplate(template, contextWithTime) : "";
  let raw = explicit || templateBase || defaultBase;
  if (explicit && (explicit.endsWith("/") || explicit.endsWith("\\"))) {
    raw = path.join(explicit, templateBase || defaultBase);
  }
  return normalizeSaveBase(raw, timestamp);
}

function normalizeSaveBase(raw, timestamp) {
  let trimmed = String(raw || "").trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.endsWith("/") || trimmed.endsWith("\\")) {
    trimmed = path.join(trimmed, `trendyol-live-${timestamp}`);
  }
  const parsed = path.parse(trimmed);
  const dir = parsed.dir || ".";
  let baseName = parsed.name;
  if (parsed.ext && parsed.ext !== ".json") {
    baseName = `${parsed.name}${parsed.ext}`;
  }
  return {
    responsePath: path.join(dir, `${baseName}.response.json`),
    attributesPath: path.join(dir, `${baseName}.attributes.json`)
  };
}

function withPageSuffix(filePath, page) {
  const suffix = `.p${page}`;
  if (filePath.endsWith(".response.json")) {
    return filePath.replace(/\.response\.json$/i, `${suffix}.response.json`);
  }
  if (filePath.endsWith(".attributes.json")) {
    return filePath.replace(/\.attributes\.json$/i, `${suffix}.attributes.json`);
  }
  const parsed = path.parse(filePath);
  return path.join(parsed.dir, `${parsed.name}${suffix}${parsed.ext || ""}`);
}

function buildPageSavePaths(savePaths, page) {
  return {
    responsePath: withPageSuffix(savePaths.responsePath, page),
    attributesPath: withPageSuffix(savePaths.attributesPath, page)
  };
}

async function writePageSave(savePaths, page, payload) {
  const pagePaths = buildPageSavePaths(savePaths, page);
  const responseJson = JSON.stringify(payload ?? null, null, 2);
  const attributesJson = JSON.stringify(extractAttributes(payload) ?? null, null, 2);
  await fs.mkdir(path.dirname(pagePaths.responsePath), { recursive: true });
  await fs.writeFile(pagePaths.responsePath, responseJson, "utf8");
  await fs.mkdir(path.dirname(pagePaths.attributesPath), { recursive: true });
  await fs.writeFile(pagePaths.attributesPath, attributesJson, "utf8");
  console.log("Saved:", pagePaths.responsePath);
  console.log("Saved:", pagePaths.attributesPath);
}

function needsCategoryId(endpoint) {
  return endpoint.includes("{categoryId}") || endpoint.includes("{categoriId}");
}

function resolveBase(endpoint) {
  if (apiBaseOverride) {
    return apiBaseOverride;
  }
  const lower = endpoint.toLowerCase();
  if (lower.startsWith("/sapigw/")) {
    return baseDefaults.api;
  }
  if (lower.startsWith("/integration/")) {
    return baseDefaults.apigw;
  }
  return baseDefaults.apiSapigw;
}

function resolveBaseCandidates(endpoint) {
  const primary = normalizeBase(resolveBase(endpoint));
  if (!primary) {
    return [];
  }
  const candidates = [primary];
  const lower = endpoint.toLowerCase();
  const isIntegration = lower.startsWith("/integration/") || lower.startsWith("/sapigw/integration/");
  const hasApigw = primary.includes("apigw.trendyol.com");
  const hasApi = primary.includes("api.trendyol.com");
  if (apiBaseOverride && !fallbackEnabled) {
    return candidates;
  }
  if (isIntegration) {
    const alt = hasApigw ? baseDefaults.apiSapigw : baseDefaults.apigw;
    if (normalizeBase(alt) !== primary) {
      candidates.push(normalizeBase(alt));
    }
    return candidates;
  }
  if (hasApi) {
    candidates.push(baseDefaults.apigw);
  } else if (hasApigw) {
    candidates.push(baseDefaults.apiSapigw);
  }
  return candidates.filter((value, index, list) => list.indexOf(value) === index);
}

function buildUrl(base, endpoint, categoryId) {
  if (needsCategoryId(endpoint) && !categoryId) {
    throw new Error(
      "Missing categoryId. Use --category-id, --category-name, or TRENDYOL_TEST_CATEGORY_ID/TRENDYOL_TEST_CATEGORY_QUERY."
    );
  }
  const resolved = endpoint
    .replace("{supplierId}", supplierId)
    .replace("{sellerId}", sellerId)
    .replace("{categoryId}", categoryId || "")
    .replace("{categoriId}", categoryId || "");
  if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
    return resolved;
  }
  if (!base) {
    throw new Error("Missing base URL.");
  }
  let path = resolved;
  path = path.startsWith("/") ? path : `/${path}`;
  const normalizedBase = normalizeBase(base);
  if (baseHasSapigw(normalizedBase) && path.startsWith("/sapigw/")) {
    path = path.replace(/^\/sapigw/, "");
  }
  return `${normalizedBase}${path}`;
}

function shouldBypassProxy(targetUrl) {
  const noProxyRaw = process.env.NO_PROXY || process.env.no_proxy;
  if (!noProxyRaw) {
    return false;
  }
  let host;
  try {
    host = new URL(targetUrl).hostname;
  } catch {
    return false;
  }
  const entries = noProxyRaw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (!entries.length) {
    return false;
  }
  if (entries.includes("*")) {
    return true;
  }
  return entries.some((entry) => host === entry || host.endsWith(`.${entry}`));
}

function resolveProxyConfig(targetUrl) {
  const bypassed = shouldBypassProxy(targetUrl);
  if (bypassed) {
    return { proxy: null, bypassed: true };
  }

  const proxyUrlRaw =
    process.env.TRENDYOL_PROXY ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.https_proxy ||
    process.env.http_proxy;

  if (!proxyUrlRaw) {
    return { proxy: null, bypassed: false };
  }

  const trimmed = proxyUrlRaw.trim();
  if (!trimmed || ["false", "0", "no"].includes(trimmed.toLowerCase())) {
    return { proxy: null, bypassed: false };
  }

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.replace(":", "");
    if (protocol !== "http" && protocol !== "https") {
      return { proxy: null, bypassed: false };
    }
    const proxy = {
      protocol,
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : protocol === "https" ? 443 : 80
    };
    if (parsed.username) {
      proxy.auth = {
        username: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password || "")
      };
    }
    return { proxy, bypassed: false };
  } catch {
    return { proxy: null, bypassed: false };
  }
}

async function requestOnce(method, url, params, body, proxyState) {
  try {
    const response = await axios({
      method,
      url,
      params: method === "GET" ? params : undefined,
      data: method === "GET" ? undefined : body,
      auth: { username: apiKey, password: apiSecret },
      headers: {
        "User-Agent": userAgent,
        Accept: "application/json"
      },
      ...(proxyState.proxy ? { proxy: proxyState.proxy } : proxyState.bypassed ? { proxy: false } : {}),
      timeout: timeoutMs,
      validateStatus: () => true
    });
    return { response, error: null };
  } catch (error) {
    return { response: error?.response || null, error };
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestWithRetry({ method, endpoint, params, body, categoryId, label }) {
  const bases = endpoint.startsWith("http") ? [""] : resolveBaseCandidates(endpoint);
  const maxAttempts = Number.parseInt(process.env.TRENDYOL_TEST_RETRIES || "3", 10);
  const baseDelayMs = Number.parseInt(process.env.TRENDYOL_TEST_RETRY_DELAY_MS || "1000", 10);
  const attempts = Number.isFinite(maxAttempts) ? Math.max(1, maxAttempts) : 3;

  let lastResponse = null;
  let lastError = null;
  let completed = false;

  for (let baseIndex = 0; baseIndex < bases.length && !completed; baseIndex += 1) {
    const base = bases[baseIndex];
    const url = endpoint.startsWith("http") ? buildUrl("", endpoint, categoryId) : buildUrl(base, endpoint, categoryId);
    const proxyState = resolveProxyConfig(url);

    if (debug) {
      const prefix = label ? `${label} ` : "";
      console.log(`${prefix}Method:`, method);
      console.log(`${prefix}Endpoint:`, endpoint);
      console.log(`${prefix}URL:`, url);
      console.log(`${prefix}User-Agent:`, userAgent);
      if (bases.length > 1) {
        console.log(`${prefix}Fallback bases:`, bases.join(", "));
      }
      if (proxyState.proxy) {
        console.log(
          `${prefix}Proxy:`,
          `${proxyState.proxy.protocol}://${proxyState.proxy.host}:${proxyState.proxy.port}`
        );
      } else if (proxyState.bypassed) {
        console.log(`${prefix}Proxy:`, "bypassed");
      }
    }

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const { response, error } = await requestOnce(method, url, params, body, proxyState);
      if (response) {
        lastResponse = response;
      } else {
        lastError = error;
      }

      if (response) {
        const status = response.status;
        const shouldRetry = status === 429 || status >= 500;
        const shouldFallback =
          (status === 403 || status === 556) && baseIndex < bases.length - 1 && (fallbackEnabled || !apiBaseOverride);
        if (shouldFallback) {
          if (debug) {
            console.log("Fallback:", "trying alternate base after 403/556");
          }
          break;
        }
        if (shouldRetry && attempt < attempts) {
          await sleep(baseDelayMs * attempt);
          continue;
        }
        completed = true;
        break;
      }

      if (attempt < attempts) {
        await sleep(baseDelayMs * attempt);
      }
    }
  }

  return { response: lastResponse, error: lastError };
}

async function main() {
  const args = process.argv.slice(2).filter(Boolean);
  const method = resolveMethod(args);
  const allowed = ["GET", "POST", "PUT", "DELETE"];
  if (!allowed.includes(method)) {
    throw new Error(`Unsupported method: ${method}. Use one of ${allowed.join(", ")}.`);
  }
  const confirm = args.includes("--confirm") || process.env.TRENDYOL_LIVE_CONFIRM === "true";
  if (method !== "GET" && !confirm) {
    throw new Error("Refusing to send a write request without --confirm or TRENDYOL_LIVE_CONFIRM=true.");
  }
  const endpoint = resolveEndpoint(args);
  const category = await resolveCategoryId(args, endpoint);
  const categoryId = category.id;
  const brandQuery = resolveBrandQuery(args);
  const brandIdInput = resolveBrandId(args);
  const pagination = resolvePagination(args);
  const scanOptions = resolveScanOptions(args);
  const body = await resolveBody(args, method);
  if (method !== "GET" && body == null) {
    throw new Error("Missing JSON body. Use --body '{}' or --body-file path.");
  }
  const isProductList = method === "GET" && endpoint.includes("/products");
  const productParams = isProductList ? { size: pagination.size, approved: true } : undefined;
  const params = isProductList ? { ...productParams, page: pagination.page } : undefined;

  const hasBrandFilter = Boolean(brandQuery || brandIdInput);
  if (hasBrandFilter && !isProductList) {
    console.log("Brand filter note:", "Brand filtering works only on /products endpoints.");
  }

  const outputTimestamp = Date.now();
  const savePaths = resolveSavePaths(args, outputTimestamp, {
    endpoint,
    categoryId,
    categoryName: category.name || category.query || categoryId,
    categoryQuery: category.query
  });

  let resolvedBrandId = brandIdInput;
  let resolvedBrandName = "";
  if (isProductList && !resolvedBrandId && brandQuery) {
    const resolved = await resolveBrandFromQuery(args);
    resolvedBrandId = resolved.id;
    resolvedBrandName = resolved.name;
  }

  let lastResponse = null;
  let lastError = null;
  let responsePayload = null;
  let productMatches = [];
  let scannedPages = 0;

  const shouldScan = scanOptions.scanEnabled && isProductList && Boolean(resolvedBrandId);
  if (shouldScan) {
    const startPage = pagination.page;
    for (let page = startPage; page < startPage + scanOptions.maxPages; page += 1) {
      const pageParams = { ...productParams, page };
      const { response, error } = await requestWithRetry({
        method,
        endpoint,
        params: pageParams,
        body,
        categoryId,
        label: `Request p${page}`
      });

      if (!response) {
        lastError = error;
        break;
      }

      lastResponse = response;
      responsePayload = response.data ?? null;
      scannedPages += 1;
      if (savePaths) {
        await writePageSave(savePaths, page, responsePayload);
      }

      const items = extractProductItems(responsePayload);
      const matches = findBrandProductMatches(responsePayload, resolvedBrandId);
      if (matches.length) {
        productMatches.push(...matches);
        if (!scanOptions.scanAll) {
          break;
        }
      }

      if (!items.length || items.length < pagination.size) {
        break;
      }
    }
  } else {
    const { response, error } = await requestWithRetry({
      method,
      endpoint,
      params,
      body,
      categoryId,
      label: "Request"
    });
    lastResponse = response;
    lastError = error;
    responsePayload = lastResponse?.data ?? null;

    if (isProductList && resolvedBrandId) {
      productMatches = findBrandProductMatches(responsePayload, resolvedBrandId);
    }
  }

  if (!lastResponse) {
    throw lastError || new Error("No response received.");
  }

  console.log("HTTP:", lastResponse.status);
  const cfRay = lastResponse.headers?.["cf-ray"] ?? lastResponse.headers?.["CF-RAY"];
  const cfCache = lastResponse.headers?.["cf-cache-status"] ?? lastResponse.headers?.["CF-CACHE-STATUS"];
  if (cfRay || cfCache) {
    console.log("Cloudflare:", {
      "cf-ray": cfRay,
      "cf-cache-status": cfCache
    });
  }

  const brandsInPayload = brandQuery ? extractBrands(responsePayload) : [];
  if (brandQuery && brandsInPayload.length) {
    const matches = findBrandMatches(responsePayload, brandQuery);
    console.log("Brand search:", { query: brandQuery, matches: matches.length });
    console.log("Brand matches:", JSON.stringify(matches, null, 2));
  }

  if (isProductList && resolvedBrandId) {
    const summary = {
      brandId: resolvedBrandId,
      brandName: resolvedBrandName,
      matches: productMatches.length,
      page: pagination.page,
      size: pagination.size
    };
    if (shouldScan) {
      summary.scannedPages = scannedPages;
      summary.scanAll = scanOptions.scanAll;
    }
    console.log("Brand products:", summary);
    console.log("Brand product matches:", JSON.stringify(productMatches, null, 2));
  }

  const attributesOnly = resolveAttributesOnly(args);
  const attributesPayload = extractAttributes(responsePayload);
  const responseJson = JSON.stringify(responsePayload, null, 2);
  const attributesJson = JSON.stringify(attributesPayload ?? null, null, 2);
  const hasFilter = Boolean(brandQuery || resolvedBrandId);

  if (attributesOnly) {
    console.log("Attributes:", attributesJson);
  } else if (shouldShowResponse(args, hasFilter)) {
    console.log("Response:", responseJson);
  }

  if (savePaths && !(shouldScan && scanOptions.scanEnabled)) {
    await fs.mkdir(path.dirname(savePaths.responsePath), { recursive: true });
    await fs.writeFile(savePaths.responsePath, responseJson, "utf8");
    await fs.mkdir(path.dirname(savePaths.attributesPath), { recursive: true });
    await fs.writeFile(savePaths.attributesPath, attributesJson, "utf8");
    console.log("Saved:", savePaths.responsePath);
    console.log("Saved:", savePaths.attributesPath);
  } else if (savePaths && shouldScan && scanOptions.scanEnabled) {
    console.log("Saved:", "per-page responses");
  }
}

main().catch((error) => {
  const status = error?.response?.status;
  const payload = error?.response?.data;
  console.error("ERROR:", status, payload || error?.message || error);
  process.exitCode = 1;
});
