import fs from "fs";
import path from "path";

const scriptLabel = path.basename(process.argv[1] || "trendyol-docs-index.mjs");
const scriptPrefix = path.parse(scriptLabel).name;
const DEFAULT_API_PREFIXES = [
  "/integration/",
  "/iintegration/",
  "/webhook/",
  "/sapigw/",
  "/apigw/"
];

function printHelp() {
  console.log(`Usage:
  node ${scriptLabel} --csv <path> [options]

Options:
  --csv <path>             Input CSV (from google-Test summarize output)
  --out <path>             Output docs index JSON
  --map-out <path>         Output endpoint map JSON
  --limit <n>              Limit number of docs to fetch
  --prefix <p1,p2>         Endpoint path prefixes (default /integration/,/webhook/)
  --timeout <ms>           Request timeout (default 15000)
  --retries <1-10>         Retry count (default 2)
  --retry-delay <ms>       Retry delay base (default 500)
  -h, --help               Show help`);
}

function normalizePrefix(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed === "*" || trimmed === "all") {
    return "*";
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let csvPath = "";
  let outPath = "";
  let mapOutPath = "";
  let limit = 0;
  let timeoutMs = 15000;
  let retries = 2;
  let retryDelayMs = 500;
  let prefixes = ["/integration/", "/webhook/"];
  let prefixOverride = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      return { showHelp: true };
    }
    if (arg === "--csv" && args[i + 1]) {
      csvPath = args[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--csv=")) {
      csvPath = arg.split("=").slice(1).join("=");
      continue;
    }
    if (arg === "--out" && args[i + 1]) {
      outPath = args[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--out=")) {
      outPath = arg.split("=").slice(1).join("=");
      continue;
    }
    if (arg === "--map-out" && args[i + 1]) {
      mapOutPath = args[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--map-out=")) {
      mapOutPath = arg.split("=").slice(1).join("=");
      continue;
    }
    if (arg === "--limit" && args[i + 1]) {
      limit = Number(args[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith("--limit=")) {
      limit = Number(arg.split("=")[1]);
      continue;
    }
    if (arg === "--prefix" && args[i + 1]) {
      const raw = args[i + 1];
      const values = raw
        .split(",")
        .map((value) => normalizePrefix(value))
        .filter(Boolean);
      prefixes = values;
      prefixOverride = true;
      i += 1;
      continue;
    }
    if (arg.startsWith("--prefix=")) {
      const raw = arg.split("=").slice(1).join("=");
      const values = raw
        .split(",")
        .map((value) => normalizePrefix(value))
        .filter(Boolean);
      prefixes = values;
      prefixOverride = true;
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
  }

  const normalizedPrefixes = prefixOverride
    ? prefixes.filter((value) => value !== "*")
    : prefixes;
  const allowAll = prefixOverride && prefixes.includes("*");

  return {
    csvPath: csvPath.trim(),
    outPath: outPath.trim(),
    mapOutPath: mapOutPath.trim(),
    limit: Number.isFinite(limit) ? Math.max(Math.trunc(limit), 0) : 0,
    timeoutMs: Number.isFinite(timeoutMs)
      ? Math.min(Math.max(Math.trunc(timeoutMs), 1000), 60000)
      : 15000,
    retries: Number.isFinite(retries)
      ? Math.min(Math.max(Math.trunc(retries), 1), 10)
      : 2,
    retryDelayMs: Number.isFinite(retryDelayMs)
      ? Math.min(Math.max(Math.trunc(retryDelayMs), 0), 30000)
      : 500,
    prefixes: allowAll ? [] : normalizedPrefixes,
    allowAll,
    showHelp: false
  };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          value += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(value);
      value = "";
      continue;
    }
    if (char === "\n") {
      row.push(value);
      if (row.length > 1 || row[0]) {
        rows.push(row);
      }
      row = [];
      value = "";
      continue;
    }
    if (char === "\r") {
      continue;
    }
    value += char;
  }
  if (value || row.length) {
    row.push(value);
    if (row.length > 1 || row[0]) {
      rows.push(row);
    }
  }
  return rows;
}

function readTextFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length >= 2) {
    if (buffer[0] === 0xff && buffer[1] === 0xfe) {
      return buffer.slice(2).toString("utf16le");
    }
    if (buffer[0] === 0xfe && buffer[1] === 0xff) {
      const swapped = Buffer.alloc(buffer.length - 2);
      buffer.copy(swapped, 0, 2);
      swapped.swap16();
      return swapped.toString("utf16le");
    }
  }
  if (buffer.length >= 3) {
    if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      return buffer.slice(3).toString("utf8");
    }
  }
  return buffer.toString("utf8");
}

function resolveOutputPath(value, fallbackName) {
  if (value) {
    return path.resolve(process.cwd(), value);
  }
  return path.resolve(process.cwd(), path.join("temp", fallbackName));
}

function normalizeEndpoint(raw, prefixes) {
  let pathValue = raw.trim();
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const url = new URL(raw);
      pathValue = `${url.pathname}${url.search}`;
    } catch {
      return null;
    }
  }
  if (!pathValue.startsWith("/") && prefixes.length) {
    for (const prefix of prefixes) {
      const normalizedPrefix = prefix.startsWith("/")
        ? prefix.slice(1)
        : prefix;
      if (normalizedPrefix && pathValue.startsWith(normalizedPrefix)) {
        pathValue = `/${pathValue}`;
        break;
      }
    }
  }
  pathValue = pathValue.replace(/[),.]+$/, "");
  if (!pathValue.startsWith("/")) {
    return null;
  }
  if (!prefixes.length) {
    return pathValue;
  }
  const matched = prefixes.some((prefix) => pathValue.startsWith(prefix));
  return matched ? pathValue : null;
}

function stripHtml(html) {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const withoutTags = withoutScripts.replace(/<[^>]+>/g, " ");
  return withoutTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function collectStrings(value) {
  const values = [];
  const stack = [value];
  while (stack.length) {
    const current = stack.pop();
    if (typeof current === "string") {
      values.push(current);
      continue;
    }
    if (Array.isArray(current)) {
      for (let i = current.length - 1; i >= 0; i -= 1) {
        stack.push(current[i]);
      }
      continue;
    }
    if (current && typeof current === "object") {
      for (const value of Object.values(current)) {
        stack.push(value);
      }
    }
  }
  return values;
}

function parseNextData(html) {
  const match = html.match(
    /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }
  const assignMatch = html.match(
    /__NEXT_DATA__\s*=\s*({[\s\S]*?})\s*<\/script>/i
  );
  if (assignMatch) {
    try {
      return JSON.parse(assignMatch[1]);
    } catch {
      return null;
    }
  }
  return null;
}

function extractJsonScriptData(html) {
  const results = [];
  const regex =
    /<script[^>]*type=["']application\/(?:ld\+)?json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html))) {
    const content = match[1].trim();
    if (!content) {
      continue;
    }
    try {
      results.push(JSON.parse(content));
    } catch {
      continue;
    }
  }
  return results;
}

function buildSearchSources(html) {
  const sources = [];
  const stripped = stripHtml(html);
  if (stripped) {
    sources.push(stripped);
  }
  if (html) {
    sources.push(html);
  }

  const nextData = parseNextData(html);
  if (nextData) {
    const nextStrings = collectStrings(nextData);
    const combined = nextStrings
      .filter((value) => value.includes("/") || value.includes("http"))
      .join(" ");
    if (combined) {
      sources.push(combined);
    }
  }

  const jsonScripts = extractJsonScriptData(html);
  if (jsonScripts.length) {
    const jsonStrings = jsonScripts
      .flatMap((value) => collectStrings(value))
      .filter((value) => value.includes("/") || value.includes("http"))
      .join(" ");
    if (jsonStrings) {
      sources.push(jsonStrings);
    }
  }

  return { sources, nextData };
}

function extractEndpointsFromSources(sources, filterPrefixes, searchPrefixes) {
  const endpoints = new Map();
  const knownPaths = new Set();
  const scanPrefixes =
    searchPrefixes && searchPrefixes.length ? searchPrefixes : filterPrefixes;
  for (const source of sources) {
    const text = source;
    const methodRegex =
      /\b(GET|POST|PUT|DELETE|PATCH)\b\s*(?:,|:)?\s*(https?:\/\/[^\s"'<>]+|\/[A-Za-z0-9{}._~\-\/]+(?:\?[A-Za-z0-9=&%._\-{}]+)?)/gi;
    let match;
    while ((match = methodRegex.exec(text))) {
      const method = match[1].toUpperCase();
      const raw = match[2];
      const pathValue = normalizeEndpoint(raw, filterPrefixes);
      if (!pathValue) {
        continue;
      }
      const key = `${method} ${pathValue}`;
      endpoints.set(key, { method, path: pathValue });
      knownPaths.add(pathValue);
    }

    const urlRegex = /https?:\/\/[^\s"'<>]+/gi;
    const urlMatches = text.match(urlRegex) || [];
    for (const raw of urlMatches) {
      const pathValue = normalizeEndpoint(raw, filterPrefixes);
      if (!pathValue || knownPaths.has(pathValue)) {
        continue;
      }
      const key = `UNKNOWN ${pathValue}`;
      endpoints.set(key, { method: "UNKNOWN", path: pathValue });
    }

    if (scanPrefixes.length) {
      for (const prefix of scanPrefixes) {
        const normalizedPrefix = prefix.startsWith("/")
          ? prefix.slice(1)
          : prefix;
        const escaped = normalizedPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(
          `\\/?${escaped}[A-Za-z0-9{}._~\\-\\/]+(?:\\?[A-Za-z0-9=&%._\\-{}]+)?`,
          "gi"
        );
        const matches = text.match(regex) || [];
        for (const raw of matches) {
          const pathValue = normalizeEndpoint(raw, filterPrefixes);
          if (!pathValue || knownPaths.has(pathValue)) {
            continue;
          }
          const key = `UNKNOWN ${pathValue}`;
          endpoints.set(key, { method: "UNKNOWN", path: pathValue });
        }
      }
    }
  }

  return Array.from(endpoints.values()).sort((a, b) => {
    if (a.path === b.path) {
      return a.method.localeCompare(b.method);
    }
    return a.path.localeCompare(b.path);
  });
}

function extractEndpoints(html, filterPrefixes, searchPrefixes) {
  const { sources } = buildSearchSources(html);
  return extractEndpointsFromSources(sources, filterPrefixes, searchPrefixes);
}

function buildNextDataUrls(pageUrl, buildId) {
  const url = new URL(pageUrl);
  const base = `${url.origin}/_next/data/${buildId}`;
  let pathname = url.pathname;
  const candidates = [];
  if (!pathname || pathname === "/") {
    pathname = "/index";
  }
  const normalized = pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
  candidates.push(`${base}${normalized}.json`);
  if (!normalized.endsWith("/index")) {
    candidates.push(`${base}${normalized}/index.json`);
  }
  return candidates;
}

async function fetchNextData(pageUrl, buildId, options) {
  const urls = buildNextDataUrls(pageUrl, buildId);
  for (const candidate of urls) {
    const res = await fetchWithRetry(
      candidate,
      options.retries,
      options.retryDelayMs,
      options.timeoutMs
    );
    if (!res.ok) {
      continue;
    }
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return { data, url: candidate, status: res.status };
    } catch {
      continue;
    }
  }
  return null;
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

async function main() {
  const options = parseArgs();
  if (options.showHelp) {
    printHelp();
    return;
  }
  if (!options.csvPath) {
    throw new Error("Missing --csv <path> input.");
  }

  const csvAbsolute = path.resolve(process.cwd(), options.csvPath);
  if (!fs.existsSync(csvAbsolute)) {
    throw new Error(`CSV not found: ${csvAbsolute}`);
  }

  const csvText = readTextFile(csvAbsolute);
  const rows = parseCsv(csvText);
  if (!rows.length) {
    throw new Error("CSV is empty.");
  }

  const header = rows[0].map((value) => value.trim());
  const findColumn = (name) =>
    header.findIndex((value) => value.toLowerCase() === name);
  const linkIndex = findColumn("link");
  const titleIndex = findColumn("title");
  const displayIndex = findColumn("displaylink");
  const countIndex = findColumn("count");
  const queriesIndex = findColumn("queries");

  const docs = rows
    .slice(1)
    .map((row) => {
      const link = row[linkIndex >= 0 ? linkIndex : 0]?.trim();
      if (!link) {
        return null;
      }
      return {
        url: link,
        title: titleIndex >= 0 ? (row[titleIndex] || "").trim() : "",
        displayLink: displayIndex >= 0 ? (row[displayIndex] || "").trim() : "",
        count: countIndex >= 0 ? Number(row[countIndex]) || 0 : 0,
        queries: queriesIndex >= 0 ? (row[queriesIndex] || "").trim() : ""
      };
    })
    .filter(Boolean);

  const limitedDocs =
    options.limit > 0 ? docs.slice(0, options.limit) : docs;
  if (!limitedDocs.length) {
    throw new Error("No docs found in CSV.");
  }

  const effectivePrefixes = options.allowAll
    ? DEFAULT_API_PREFIXES
    : options.prefixes;
  console.log(`Docs: ${limitedDocs.length}`);
  const indexDocs = [];
  const endpointMap = new Map();

  for (const doc of limitedDocs) {
    try {
      const res = await fetchWithRetry(
        doc.url,
        options.retries,
        options.retryDelayMs,
        options.timeoutMs
      );
      const html = await res.text();
      const { sources, nextData } = buildSearchSources(html);
      let endpoints = extractEndpointsFromSources(
        sources,
        effectivePrefixes,
        effectivePrefixes
      );
      let nextDataUrl = "";
      let nextDataStatus = null;
      if (!endpoints.length && nextData?.buildId) {
        const nextDataResult = await fetchNextData(
          doc.url,
          nextData.buildId,
          options
        );
        if (nextDataResult?.data) {
          const jsonStrings = collectStrings(nextDataResult.data)
            .filter((value) => value.includes("/") || value.includes("http"))
            .join(" ");
          if (jsonStrings) {
            endpoints = extractEndpointsFromSources(
              [jsonStrings],
              effectivePrefixes,
              effectivePrefixes
            );
          }
          nextDataUrl = nextDataResult.url;
          nextDataStatus = nextDataResult.status;
        }
      }
      const record = {
        url: doc.url,
        title: doc.title,
        displayLink: doc.displayLink,
        count: doc.count,
        queries: doc.queries,
        httpStatus: res.status,
        endpoints,
        nextDataUrl,
        nextDataStatus
      };
      indexDocs.push(record);

      for (const endpoint of endpoints) {
        const key = `${endpoint.method} ${endpoint.path}`;
        if (!endpointMap.has(key)) {
          endpointMap.set(key, {
            method: endpoint.method,
            path: endpoint.path,
            docs: []
          });
        }
        endpointMap.get(key).docs.push({
          url: doc.url,
          title: doc.title
        });
      }
    } catch (error) {
      indexDocs.push({
        url: doc.url,
        title: doc.title,
        displayLink: doc.displayLink,
        count: doc.count,
        queries: doc.queries,
        error: error.message || String(error),
        endpoints: []
      });
    }
  }

  const endpoints = Array.from(endpointMap.values()).sort((a, b) => {
    if (a.path === b.path) {
      return a.method.localeCompare(b.method);
    }
    return a.path.localeCompare(b.path);
  });

  const docsIndex = {
    generatedAt: new Date().toISOString(),
    sourceCsv: csvAbsolute,
    prefixes: options.allowAll ? ["*"] : options.prefixes,
    effectivePrefixes,
    docs: indexDocs
  };

  const endpointIndex = {
    generatedAt: new Date().toISOString(),
    sourceCsv: csvAbsolute,
    prefixes: options.allowAll ? ["*"] : options.prefixes,
    effectivePrefixes,
    endpoints
  };

  const outPath = resolveOutputPath(
    options.outPath,
    `${scriptPrefix}.json`
  );
  const mapOutPath = resolveOutputPath(
    options.mapOutPath,
    `${scriptPrefix}-endpoints.json`
  );

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.mkdirSync(path.dirname(mapOutPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(docsIndex, null, 2), "utf8");
  fs.writeFileSync(mapOutPath, JSON.stringify(endpointIndex, null, 2), "utf8");

  console.log(`Docs index: ${outPath}`);
  console.log(`Endpoint map: ${mapOutPath}`);
}

main().catch((error) => {
  console.error(`${scriptLabel} failed:`, error.message || error);
  process.exitCode = 1;
});
