import fs from "fs";
import path from "path";
import "./env.js";

const enabled = process.env.GOOGLE_TEST_ENABLED === "true";
const docsSites = [
  "developers.trendyol.com",
  "dev.trendyol.com",
  "partner.trendyol.com",
  "api.trendyol.com",
  "docs.trendyol.com"
];
const docsSitesEnv = process.env.TRENDYOL_DOCS_SITES || "";
const expandKeywordsEnv =
  process.env.GOOGLE_TEST_EXPAND_KEYWORDS || process.env.GOOGLE_EXPAND_KEYWORDS || "";
const scriptLabel = path.basename(process.argv[1] || "google-live.mjs");
const scriptPrefix = path.parse(scriptLabel).name;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value.trim();
}

function printHelp() {
  console.log(`Usage:
  node ${scriptLabel} "query" [options]

Options:
  --images                 Image search
  --site <host[,host]>     Limit to site(s)
  --docs                   Limit to docs sites
  --variants               Generate query variations
  --expand                 Add extra keyword variants
  --dedupe                 Dedupe results across queries
  --summarize              Summarize unique links and counts
  --min-count <n>          Minimum count for summarize (default 1)
  --top <n>                Limit summarize/dedupe outputs
  --include-path <p1,p2>   Require path segment(s)
  --exclude-path <p1,p2>   Exclude path segment(s)
  --num <1-10>             Results per page (default 5)
  --start <1-100>          Start index (default 1)
  --lang <lang>            Language (e.g. tr, en)
  --country <country>      Country (e.g. TR, US)
  --exact <phrase>         Exact terms
  --exclude <t1,t2>        Exclude terms (comma separated)
  --json                   JSON output
  --csv                    CSV output
  --pretty                 Pretty JSON
  --fields <expr>          Partial response (fields param)
  --save <path|auto>       Save output to file (auto uses timestamp)
  --cache                  Enable cache
  --cache-ttl <seconds>    Cache TTL (default 300)
  --cache-file <path>      Cache file path
  --retries <1-10>         Retry count (default 3)
  --retry-delay <ms>       Retry delay base (default 500)
  --timeout <ms>           Request timeout (default 10000)
  -h, --help               Show help`);
  console.log(
    "Env: GOOGLE_TEST_EXPAND_KEYWORDS=token,oauth,shipment (comma separated)"
  );
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildCsv(query, items, includeHeader = true) {
  const rows = [];
  if (includeHeader) {
    rows.push(
      ["query", "title", "link", "displayLink", "snippet"]
        .map(csvEscape)
        .join(",")
    );
  }
  for (const item of items) {
    rows.push(
      [
        query,
        item.title || "Untitled",
        item.link || "",
        item.displayLink || "",
        item.snippet || ""
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  return rows.join("\n");
}

function buildSiteQuery(query, sites) {
  if (!sites.length) {
    return query;
  }
  return `${query} (${sites.map((site) => `site:${site}`).join(" OR ")})`;
}

function buildPathFilters(includePaths, excludePaths) {
  const parts = [];
  for (const value of includePaths) {
    if (value) {
      parts.push(`inurl:${value}`);
    }
  }
  for (const value of excludePaths) {
    if (value) {
      parts.push(`-inurl:${value}`);
    }
  }
  return parts.join(" ");
}

function buildFullQuery(query, sites, includePaths, excludePaths) {
  const siteQuery = buildSiteQuery(query, sites);
  const pathFilters = buildPathFilters(includePaths, excludePaths);
  return pathFilters ? `${siteQuery} ${pathFilters}` : siteQuery;
}

function mapItems(items) {
  return items.map((item) => ({
    title: item.title || "Untitled",
    link: item.link,
    displayLink: item.displayLink || "",
    snippet: item.snippet || ""
  }));
}

function normalizeLink(link) {
  if (!link) {
    return "";
  }
  const trimmed = link.trim();
  try {
    const url = new URL(trimmed);
    url.hash = "";
    const normalized = url.toString().replace(/\/$/, "");
    return normalized.toLowerCase();
  } catch {
    return trimmed.replace(/\/$/, "").toLowerCase();
  }
}

function dedupeResults(results) {
  const seen = new Map();
  for (const result of results) {
    for (const item of result.items) {
      const key = normalizeLink(item.link);
      if (!key) {
        continue;
      }
      if (!seen.has(key)) {
        seen.set(key, {
          title: item.title || "Untitled",
          link: item.link,
          displayLink: item.displayLink || "",
          snippet: item.snippet || "",
          queries: [result.query]
        });
      } else {
        const entry = seen.get(key);
        if (!entry.queries.includes(result.query)) {
          entry.queries.push(result.query);
        }
      }
    }
  }
  return Array.from(seen.values());
}

function buildSummary(results) {
  const summaryMap = new Map();
  for (const result of results) {
    const seenInQuery = new Set();
    for (const item of result.items) {
      const key = normalizeLink(item.link);
      if (!key) {
        continue;
      }
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          link: item.link,
          title: item.title || "Untitled",
          displayLink: item.displayLink || "",
          snippet: item.snippet || "",
          count: 0,
          queries: []
        });
      }
      if (!seenInQuery.has(key)) {
        const entry = summaryMap.get(key);
        entry.count += 1;
        entry.queries.push(result.query);
        seenInQuery.add(key);
      }
    }
  }
  return Array.from(summaryMap.values());
}

function buildSummaryCsv(summary) {
  const rows = [
    ["link", "title", "displayLink", "count", "queries"]
      .map(csvEscape)
      .join(",")
  ];
  for (const entry of summary) {
    rows.push(
      [
        entry.link || "",
        entry.title || "Untitled",
        entry.displayLink || "",
        entry.count || 0,
        (entry.queries || []).join(" | ")
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  return rows.join("\n");
}

function buildDedupeCsv(items) {
  const rows = [
    ["link", "title", "displayLink", "queries"]
      .map(csvEscape)
      .join(",")
  ];
  for (const item of items) {
    rows.push(
      [
        item.link || "",
        item.title || "Untitled",
        item.displayLink || "",
        (item.queries || []).join(" | ")
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  return rows.join("\n");
}

function buildSummaryText(summary) {
  if (!summary.length) {
    return "No results.";
  }
  const lines = [];
  summary.forEach((entry, index) => {
    const host = entry.displayLink || "";
    const count = entry.count || 0;
    const label = host ? `- ${host}` : "";
    lines.push(`${index + 1}. (${count}) ${entry.title} ${label} - ${entry.link}`);
  });
  return lines.join("\n");
}

function buildDedupeText(items) {
  if (!items.length) {
    return "No results.";
  }
  const lines = [];
  items.forEach((entry, index) => {
    const host = entry.displayLink || "";
    const count = entry.queries?.length || 0;
    const label = host ? `- ${host}` : "";
    lines.push(`${index + 1}. (${count}) ${entry.title} ${label} - ${entry.link}`);
  });
  return lines.join("\n");
}

function buildQueryVariants(baseQuery, expand) {
  const normalized = baseQuery.trim();
  const lower = normalized.toLowerCase();
  const variants = [];
  const add = (value) => {
    if (value && !variants.includes(value)) {
      variants.push(value);
    }
  };

  add(normalized);
  if (!lower.includes("api")) {
    add(`${normalized} api`);
  }
  if (!lower.includes("marketplace")) {
    add(`${normalized} marketplace`);
  }
  if (!lower.includes("seller")) {
    add(`${normalized} seller api`);
  }
  if (!lower.includes("supplier")) {
    add(`${normalized} supplier api`);
  }
  add("trendyol seller api");
  add("trendyol marketplace api");
  add("trendyol partner api");
  add("trendyol api documentation");
  add("trendyol developer api");

  if (expand) {
    const extraKeywords = [
      "auth",
      "orders",
      "returns",
      "inventory",
      "webhook",
      "siparis",
      "iade",
      "stok",
      "fiyat",
      "urun"
    ];
    const envKeywords = expandKeywordsEnv
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    extraKeywords.push(...envKeywords);
    for (const keyword of extraKeywords) {
      add(`${normalized} ${keyword}`);
    }
  }

  return variants;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function resolveSavePath(savePath, output) {
  const raw = savePath.trim();
  if (!raw) {
    return "";
  }
  if (raw.toLowerCase() !== "auto") {
    return raw;
  }
  const now = new Date();
  const stamp = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(
    now.getDate()
  )}-${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(
    now.getSeconds()
  )}`;
  const ext = output === "json" ? "json" : output === "csv" ? "csv" : "txt";
  return path.resolve(
    process.cwd(),
    path.join("temp", `${scriptPrefix}-${stamp}.${ext}`)
  );
}

function resolveCachePath(cacheFile) {
  const raw = cacheFile && cacheFile.trim();
  return path.resolve(
    process.cwd(),
    raw || path.join("temp", `${scriptPrefix}-cache.json`)
  );
}

function readCache(cachePath) {
  try {
    if (!fs.existsSync(cachePath)) {
      return { version: 1, entries: {} };
    }
    const raw = fs.readFileSync(cachePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { version: 1, entries: {} };
    }
    if (!parsed.entries || typeof parsed.entries !== "object") {
      parsed.entries = {};
    }
    if (!parsed.version) {
      parsed.version = 1;
    }
    return parsed;
  } catch {
    return { version: 1, entries: {} };
  }
}

function writeCache(cachePath, cacheState) {
  try {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, JSON.stringify(cacheState), "utf8");
  } catch {
    // Ignore cache write errors.
  }
}

async function fetchWithRetry(url, retries, retryDelayMs, timeoutMs) {
  let res;
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      res = await fetch(url, { signal: controller.signal });
      break;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delayMs = retryDelayMs * attempt;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
  if (!res) {
    throw lastError || new Error("Request failed");
  }
  return res;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let query = "";
  let num = 5;
  let isImage = false;
  let output = "text";
  let pretty = false;
  let retries = 3;
  let retryDelayMs = 500;
  let timeoutMs = 10000;
  let variants = false;
  let expand = false;
  let dedupe = false;
  let summarize = false;
  let minCount = 1;
  let top = 0;
  let start = 1;
  let lang = "";
  let country = "";
  let exact = "";
  let savePath = "";
  let fields = "";
  let cache = false;
  let cacheTtl = 300;
  let cacheFile = "";
  let showHelp = false;
  const exclude = [];
  const includePaths = [];
  const excludePaths = [];
  const sites = [];

  const addUnique = (list, value) => {
    if (!list.includes(value)) {
      list.push(value);
    }
  };

  const addList = (list, raw) => {
    raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((value) => addUnique(list, value));
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      showHelp = true;
      continue;
    }
    if (arg === "--images") {
      isImage = true;
      continue;
    }
    if (arg === "--docs" || arg === "--site-docs") {
      docsSites.forEach((site) => addUnique(sites, site));
      if (docsSitesEnv) {
        addList(sites, docsSitesEnv);
      }
      continue;
    }
    if (arg === "--variants") {
      variants = true;
      continue;
    }
    if (arg === "--expand") {
      expand = true;
      variants = true;
      continue;
    }
    if (arg === "--dedupe") {
      dedupe = true;
      continue;
    }
    if (arg === "--summarize") {
      summarize = true;
      continue;
    }
    if (arg === "--min-count" && args[i + 1]) {
      minCount = Number(args[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith("--min-count=")) {
      minCount = Number(arg.split("=")[1]);
      continue;
    }
    if (arg === "--top" && args[i + 1]) {
      top = Number(args[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith("--top=")) {
      top = Number(arg.split("=")[1]);
      continue;
    }
    if (arg === "--include-path" && args[i + 1]) {
      addList(includePaths, args[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith("--include-path=")) {
      addList(includePaths, arg.split("=").slice(1).join("="));
      continue;
    }
    if (arg === "--exclude-path" && args[i + 1]) {
      addList(excludePaths, args[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith("--exclude-path=")) {
      addList(excludePaths, arg.split("=").slice(1).join("="));
      continue;
    }
    if (arg === "--num" && args[i + 1]) {
      num = Number(args[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith("--num=")) {
      num = Number(arg.split("=")[1]);
      continue;
    }
    if (arg === "--json") {
      output = "json";
      continue;
    }
    if (arg === "--csv") {
      output = "csv";
      continue;
    }
    if (arg === "--pretty") {
      pretty = true;
      continue;
    }
    if (arg === "--start" && args[i + 1]) {
      start = Number(args[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith("--start=")) {
      start = Number(arg.split("=")[1]);
      continue;
    }
    if (arg === "--lang" && args[i + 1]) {
      lang = args[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--lang=")) {
      lang = arg.split("=").slice(1).join("=");
      continue;
    }
    if (arg === "--country" && args[i + 1]) {
      country = args[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--country=")) {
      country = arg.split("=").slice(1).join("=");
      continue;
    }
    if (arg === "--exact" && args[i + 1]) {
      exact = args[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--exact=")) {
      exact = arg.split("=").slice(1).join("=");
      continue;
    }
    if (arg === "--exclude" && args[i + 1]) {
      addList(exclude, args[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith("--exclude=")) {
      addList(exclude, arg.split("=").slice(1).join("="));
      continue;
    }
    if (arg === "--save" && args[i + 1]) {
      savePath = args[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--save=")) {
      savePath = arg.split("=").slice(1).join("=");
      continue;
    }
    if (arg === "--fields" && args[i + 1]) {
      fields = args[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--fields=")) {
      fields = arg.split("=").slice(1).join("=");
      continue;
    }
    if (arg === "--cache") {
      cache = true;
      continue;
    }
    if (arg === "--no-cache") {
      cache = false;
      continue;
    }
    if (arg === "--cache-ttl" && args[i + 1]) {
      cache = true;
      cacheTtl = Number(args[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith("--cache-ttl=")) {
      cache = true;
      cacheTtl = Number(arg.split("=")[1]);
      continue;
    }
    if (arg === "--cache-file" && args[i + 1]) {
      cache = true;
      cacheFile = args[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--cache-file=")) {
      cache = true;
      cacheFile = arg.split("=").slice(1).join("=");
      continue;
    }
    if (arg === "--retries" && args[i + 1]) {
      retries = Number(args[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith("--retries=")) {
      retries = Number(arg.split("=")[1]);
      continue;
    }
    if (arg === "--retry-delay" && args[i + 1]) {
      retryDelayMs = Number(args[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith("--retry-delay=")) {
      retryDelayMs = Number(arg.split("=")[1]);
      continue;
    }
    if (arg === "--timeout" && args[i + 1]) {
      timeoutMs = Number(args[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith("--timeout=")) {
      timeoutMs = Number(arg.split("=")[1]);
      continue;
    }
    if (arg === "--site" && args[i + 1]) {
      addList(sites, args[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith("--site=")) {
      addList(sites, arg.split("=").slice(1).join("="));
      continue;
    }
    if (!arg.startsWith("--") && !query) {
      query = arg;
    } else if (!arg.startsWith("--") && query) {
      query += ` ${arg}`;
    }
  }

  return {
    query: query.trim() || "trendyol satici api",
    num: Number.isFinite(num) ? Math.min(Math.max(Math.trunc(num), 1), 10) : 5,
    isImage,
    sites,
    output,
    pretty,
    variants,
    expand,
    dedupe,
    summarize,
    retries: Number.isFinite(retries)
      ? Math.min(Math.max(Math.trunc(retries), 1), 10)
      : 3,
    retryDelayMs: Number.isFinite(retryDelayMs)
      ? Math.min(Math.max(Math.trunc(retryDelayMs), 0), 30000)
      : 500,
    timeoutMs: Number.isFinite(timeoutMs)
      ? Math.min(Math.max(Math.trunc(timeoutMs), 1000), 60000)
      : 10000,
    start: Number.isFinite(start)
      ? Math.min(Math.max(Math.trunc(start), 1), 100)
      : 1,
    lang: lang.trim(),
    country: country.trim(),
    exact: exact.trim(),
    exclude,
    includePaths,
    excludePaths,
    minCount: Number.isFinite(minCount)
      ? Math.min(Math.max(Math.trunc(minCount), 1), 1000)
      : 1,
    top: Number.isFinite(top) ? Math.min(Math.max(Math.trunc(top), 0), 1000) : 0,
    savePath: savePath.trim(),
    fields: fields.trim(),
    cache,
    cacheTtl: Number.isFinite(cacheTtl)
      ? Math.min(Math.max(Math.trunc(cacheTtl), 1), 86400)
      : 300,
    cacheFile: cacheFile.trim(),
    showHelp
  };
}

async function run() {
  const options = parseArgs();
  if (options.showHelp) {
    printHelp();
    return;
  }
  if (!enabled) {
    console.log(`${scriptLabel} skipped (set GOOGLE_TEST_ENABLED=true to run).`);
    return;
  }

  const {
    query,
    num,
    isImage,
    sites,
    output,
    pretty,
    variants,
    expand,
    dedupe,
    summarize,
    retries,
    retryDelayMs,
    timeoutMs,
    start,
    lang,
    country,
    exact,
    exclude,
    includePaths,
    excludePaths,
    minCount,
    top,
    savePath,
    fields,
    cache,
    cacheTtl,
    cacheFile
  } = options;
  const key = requireEnv("GOOGLE_CSE_API_KEY");
  const cx = requireEnv("GOOGLE_CSE_CX");

  const lr = lang ? (lang.startsWith("lang_") ? lang : `lang_${lang}`) : "";
  const cr = country
    ? country.startsWith("country")
      ? country
      : `country${country.toUpperCase()}`
    : "";
  const excludeTerms = exclude.length ? exclude.join(" ") : "";

  const queries = variants ? buildQueryVariants(query, expand) : [query];
  const cachePath = cache ? resolveCachePath(cacheFile) : "";
  const cacheTtlMs = cacheTtl * 1000;
  let cacheState;
  if (cache) {
    cacheState = readCache(cachePath);
  }

  const results = [];
  for (const baseQuery of queries) {
    const siteQuery = buildFullQuery(
      baseQuery,
      sites,
      includePaths,
      excludePaths
    );
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", key);
    url.searchParams.set("cx", cx);
    url.searchParams.set("q", siteQuery);
    url.searchParams.set("num", String(num));
    url.searchParams.set("start", String(start));
    if (isImage) {
      url.searchParams.set("searchType", "image");
    }
    if (lr) {
      url.searchParams.set("lr", lr);
    }
    if (cr) {
      url.searchParams.set("cr", cr);
    }
    if (exact) {
      url.searchParams.set("exactTerms", exact);
    }
    if (excludeTerms) {
      url.searchParams.set("excludeTerms", excludeTerms);
    }
    if (fields) {
      url.searchParams.set("fields", fields);
    }

    const cacheKey = url.toString();
    let data;
    if (cache) {
      const entry = cacheState.entries?.[cacheKey];
      if (entry && Date.now() - entry.ts <= cacheTtlMs) {
        data = entry.data;
      }
    }
    if (!data) {
      const res = await fetchWithRetry(
        url.toString(),
        retries,
        retryDelayMs,
        timeoutMs
      );
      const fetched = await res.json();
      if (!res.ok || fetched.error) {
        const message =
          fetched.error?.message || `Request failed: ${res.status}`;
        throw new Error(message);
      }
      data = fetched;
      if (cache) {
        if (!cacheState) {
          cacheState = { version: 1, entries: {} };
        }
        cacheState.entries[cacheKey] = { ts: Date.now(), data };
        writeCache(cachePath, cacheState);
      }
    }

    const items = Array.isArray(data.items) ? data.items : [];
    results.push({ query: siteQuery, count: items.length, items });
  }

  const totalCount = results.reduce((sum, result) => sum + result.count, 0);
  let summary = summarize ? buildSummary(results) : [];
  let dedupedItems = dedupe ? dedupeResults(results) : [];
  if (summarize) {
    summary.sort(
      (a, b) =>
        (b.count || 0) - (a.count || 0) ||
        (a.title || "").localeCompare(b.title || "")
    );
    if (minCount > 1) {
      summary = summary.filter((entry) => (entry.count || 0) >= minCount);
    }
  }
  if (dedupe) {
    dedupedItems.sort(
      (a, b) =>
        (b.queries?.length || 0) - (a.queries?.length || 0) ||
        (a.title || "").localeCompare(b.title || "")
    );
  }
  if (top > 0) {
    if (summarize) {
      summary = summary.slice(0, top);
    }
    if (dedupe) {
      dedupedItems = dedupedItems.slice(0, top);
    }
  }

  let outputText = "";
  if (output === "json") {
    const baseMeta = {
      isImage,
      sites,
      start,
      lang: lr,
      country: cr,
      exact,
      exclude,
      includePaths,
      excludePaths,
      fields
    };
    if (summarize) {
      const payload = {
        totalCount,
        totalUnique: summary.length,
        ...baseMeta,
        items: summary
      };
      outputText = JSON.stringify(payload, null, pretty ? 2 : 0);
    } else if (dedupe) {
      const payload = {
        totalCount,
        totalUnique: dedupedItems.length,
        ...baseMeta,
        items: dedupedItems
      };
      outputText = JSON.stringify(payload, null, pretty ? 2 : 0);
    } else if (results.length > 1) {
      const payload = {
        totalCount,
        ...baseMeta,
        queries: results.map((result) => ({
          query: result.query,
          count: result.count,
          items: mapItems(result.items)
        }))
      };
      outputText = JSON.stringify(payload, null, pretty ? 2 : 0);
    } else {
      const result = results[0] || {
        query: buildFullQuery(query, sites, includePaths, excludePaths),
        count: 0,
        items: []
      };
      const payload = {
        query: result.query,
        count: result.count,
        ...baseMeta,
        items: mapItems(result.items)
      };
      outputText = JSON.stringify(payload, null, pretty ? 2 : 0);
    }
  } else if (output === "csv") {
    if (summarize) {
      outputText = buildSummaryCsv(summary);
    } else if (dedupe) {
      outputText = buildDedupeCsv(dedupedItems);
    } else {
      const chunks = [];
      let includeHeader = true;
      for (const result of results) {
        const chunk = buildCsv(result.query, result.items, includeHeader);
        if (chunk) {
          chunks.push(chunk);
        }
        includeHeader = false;
      }
      if (!chunks.length) {
        chunks.push(buildCsv(buildFullQuery(query, sites, includePaths, excludePaths), [], true));
      }
      outputText = chunks.join("\n");
    }
  } else {
    if (summarize) {
      outputText = buildSummaryText(summary);
    } else if (dedupe) {
      outputText = buildDedupeText(dedupedItems);
    } else if (results.length > 1) {
      const lines = [];
      results.forEach((result, index) => {
        lines.push(`Query: ${result.query}`);
        if (!result.items.length) {
          lines.push("No results.");
        } else {
          const list = result.items.map((item, itemIndex) => {
            const title = item.title || "Untitled";
            const link = isImage ? item.link : item.link;
            const host = item.displayLink || "";
            return `${itemIndex + 1}. ${title} ${host ? `- ${host}` : ""} - ${link}`;
          });
          lines.push(...list);
        }
        if (index < results.length - 1) {
          lines.push("");
        }
      });
      outputText = lines.join("\n");
    } else {
      const result = results[0];
      if (!result || !result.items.length) {
        outputText = "No results.";
      } else {
        const list = result.items.map((item, index) => {
          const title = item.title || "Untitled";
          const link = isImage ? item.link : item.link;
          const host = item.displayLink || "";
          return `${index + 1}. ${title} ${host ? `- ${host}` : ""} - ${link}`;
        });

        outputText = `Query: ${result.query}\n${list.join("\n")}`;
      }
    }
  }

  const autoCsvSave =
    savePath &&
    savePath.toLowerCase() === "auto" &&
    output === "text" &&
    (summarize || dedupe);
  const saveFormat = autoCsvSave ? "csv" : output;
  const resolvedSavePath = resolveSavePath(savePath, saveFormat);
  if (resolvedSavePath) {
    let saveText = outputText;
    if (saveFormat !== output) {
      if (saveFormat === "csv") {
        if (summarize) {
          saveText = buildSummaryCsv(summary);
        } else if (dedupe) {
          saveText = buildDedupeCsv(dedupedItems);
        }
      } else if (saveFormat === "json") {
        const payload = {
          totalCount,
          totalUnique: summarize
            ? summary.length
            : dedupe
              ? dedupedItems.length
              : undefined
        };
        saveText = JSON.stringify(payload, null, pretty ? 2 : 0);
      }
    }
    fs.writeFileSync(resolvedSavePath, saveText, "utf8");
    if (savePath && savePath.toLowerCase() === "auto") {
      console.error(`Saved to ${resolvedSavePath}`);
    }
  }
  console.log(outputText);
}

run().catch((error) => {
  console.error(`${scriptLabel} failed:`, error.message || error);
  process.exitCode = 1;
});
