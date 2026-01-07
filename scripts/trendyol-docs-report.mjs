import fs from "fs";
import path from "path";

const scriptLabel = path.basename(process.argv[1] || "trendyol-docs-report.mjs");

function printHelp() {
  console.log(`Usage:
  node ${scriptLabel} [options]

Options:
  --docs-index <path>      Docs index JSON (default temp/trendyol-docs-index.json)
  --endpoints <path>       Endpoint map JSON (default temp/trendyol-docs-index-endpoints.json)
  --summary-out <path>     Summary JSON output
  --csv-out <path>         Endpoint CSV output
  --categories-out <path>  Docs categories JSON output
  --top <n>                Top endpoints per category (default 10)
  -h, --help               Show help`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  let docsIndexPath = "";
  let endpointsPath = "";
  let summaryOut = "";
  let csvOut = "";
  let categoriesOut = "";
  let top = 10;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      return { showHelp: true };
    }
    if (arg === "--docs-index" && args[i + 1]) {
      docsIndexPath = args[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--docs-index=")) {
      docsIndexPath = arg.split("=").slice(1).join("=");
      continue;
    }
    if (arg === "--endpoints" && args[i + 1]) {
      endpointsPath = args[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--endpoints=")) {
      endpointsPath = arg.split("=").slice(1).join("=");
      continue;
    }
    if (arg === "--summary-out" && args[i + 1]) {
      summaryOut = args[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--summary-out=")) {
      summaryOut = arg.split("=").slice(1).join("=");
      continue;
    }
    if (arg === "--csv-out" && args[i + 1]) {
      csvOut = args[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--csv-out=")) {
      csvOut = arg.split("=").slice(1).join("=");
      continue;
    }
    if (arg === "--categories-out" && args[i + 1]) {
      categoriesOut = args[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--categories-out=")) {
      categoriesOut = arg.split("=").slice(1).join("=");
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
  }

  return {
    docsIndexPath: docsIndexPath.trim(),
    endpointsPath: endpointsPath.trim(),
    summaryOut: summaryOut.trim(),
    csvOut: csvOut.trim(),
    categoriesOut: categoriesOut.trim(),
    top: Number.isFinite(top) ? Math.min(Math.max(Math.trunc(top), 1), 100) : 10,
    showHelp: false
  };
}

function resolvePath(value, fallback) {
  return path.resolve(process.cwd(), value || path.join("temp", fallback));
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function categorizeEndpoint(pathValue) {
  const value = pathValue.toLowerCase();
  const rules = [
    { key: "product", match: [/\/product/, /\/urun/] },
    { key: "inventory", match: [/\/inventory/, /\/stock/, /\/price/, /\/stok/, /\/fiyat/] },
    { key: "order", match: [/\/order/, /\/siparis/] },
    { key: "return", match: [/\/return/, /\/iade/, /\/refund/] },
    { key: "shipment", match: [/\/shipment/, /\/teslimat/, /\/cargo/] },
    { key: "webhook", match: [/\/webhook/] },
    { key: "finance", match: [/\/settlement/, /\/invoice/, /\/fatura/, /\/finance/] }
  ];
  for (const rule of rules) {
    if (rule.match.some((pattern) => pattern.test(value))) {
      return rule.key;
    }
  }
  return "other";
}

function categorizeDoc(urlValue) {
  const value = urlValue.toLowerCase();
  const rules = [
    { key: "products", match: [/\/urun-entegrasyonu/, /\/product/] },
    { key: "inventory", match: [/\/stok/, /\/inventory/, /\/price/, /\/fiyat/] },
    { key: "orders", match: [/\/siparis/, /\/order/] },
    { key: "returns", match: [/\/iade/, /\/return/] },
    { key: "shipment", match: [/\/teslimat/, /\/shipment/, /\/cargo/] },
    { key: "webhook", match: [/\/webhook/] },
    { key: "questions", match: [/\/soru-cevap/, /\/question/] }
  ];
  for (const rule of rules) {
    if (rule.match.some((pattern) => pattern.test(value))) {
      return rule.key;
    }
  }
  return "other";
}

function buildEndpointCsv(endpoints) {
  const rows = [
    ["method", "path", "category", "docCount", "docTitles", "docUrls"]
      .map(csvEscape)
      .join(",")
  ];
  for (const endpoint of endpoints) {
    rows.push(
      [
        endpoint.method,
        endpoint.path,
        endpoint.category,
        endpoint.docCount,
        endpoint.docs.map((doc) => doc.title).join(" | "),
        endpoint.docs.map((doc) => doc.url).join(" | ")
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  return rows.join("\n");
}

async function main() {
  const options = parseArgs();
  if (options.showHelp) {
    printHelp();
    return;
  }

  const docsIndexPath = resolvePath(
    options.docsIndexPath,
    "trendyol-docs-index.json"
  );
  const endpointsPath = resolvePath(
    options.endpointsPath,
    "trendyol-docs-index-endpoints.json"
  );

  if (!fs.existsSync(docsIndexPath)) {
    throw new Error(`Docs index not found: ${docsIndexPath}`);
  }
  if (!fs.existsSync(endpointsPath)) {
    throw new Error(`Endpoints map not found: ${endpointsPath}`);
  }

  const docsIndex = JSON.parse(fs.readFileSync(docsIndexPath, "utf8"));
  const endpointsIndex = JSON.parse(fs.readFileSync(endpointsPath, "utf8"));
  const endpoints = Array.isArray(endpointsIndex.endpoints)
    ? endpointsIndex.endpoints
    : [];
  const docs = Array.isArray(docsIndex.docs) ? docsIndex.docs : [];

  const normalizedEndpoints = endpoints.map((endpoint) => {
    const docCount = Array.isArray(endpoint.docs) ? endpoint.docs.length : 0;
    return {
      method: endpoint.method || "UNKNOWN",
      path: endpoint.path || "",
      category: categorizeEndpoint(endpoint.path || ""),
      docCount,
      docs: Array.isArray(endpoint.docs) ? endpoint.docs : []
    };
  });

  normalizedEndpoints.sort((a, b) => {
    if (b.docCount !== a.docCount) {
      return b.docCount - a.docCount;
    }
    if (a.path === b.path) {
      return a.method.localeCompare(b.method);
    }
    return a.path.localeCompare(b.path);
  });

  const categoryMap = new Map();
  for (const endpoint of normalizedEndpoints) {
    if (!categoryMap.has(endpoint.category)) {
      categoryMap.set(endpoint.category, []);
    }
    categoryMap.get(endpoint.category).push(endpoint);
  }

  const categories = Array.from(categoryMap.entries()).map(([key, items]) => ({
    category: key,
    count: items.length,
    top: items.slice(0, options.top)
  }));

  const summary = {
    generatedAt: new Date().toISOString(),
    docsIndex: docsIndexPath,
    endpointsIndex: endpointsPath,
    totalEndpoints: normalizedEndpoints.length,
    categories,
    topEndpoints: normalizedEndpoints.slice(0, options.top)
  };

  const docsCategoriesMap = new Map();
  for (const doc of docs) {
    const category = categorizeDoc(doc.url || "");
    if (!docsCategoriesMap.has(category)) {
      docsCategoriesMap.set(category, []);
    }
    docsCategoriesMap.get(category).push({
      url: doc.url,
      title: doc.title,
      displayLink: doc.displayLink,
      count: doc.count,
      httpStatus: doc.httpStatus,
      endpointsCount: Array.isArray(doc.endpoints) ? doc.endpoints.length : 0
    });
  }

  const docsCategories = Array.from(docsCategoriesMap.entries()).map(
    ([category, items]) => ({
      category,
      count: items.length,
      items
    })
  );

  const summaryOut = resolvePath(options.summaryOut, "trendyol-docs-summary.json");
  const csvOut = resolvePath(options.csvOut, "trendyol-docs-endpoints.csv");
  const categoriesOut = resolvePath(
    options.categoriesOut,
    "trendyol-docs-categories.json"
  );

  ensureDir(summaryOut);
  ensureDir(csvOut);
  ensureDir(categoriesOut);

  fs.writeFileSync(summaryOut, JSON.stringify(summary, null, 2), "utf8");
  fs.writeFileSync(csvOut, buildEndpointCsv(normalizedEndpoints), "utf8");
  fs.writeFileSync(categoriesOut, JSON.stringify(docsCategories, null, 2), "utf8");

  console.log(`Summary: ${summaryOut}`);
  console.log(`Endpoints CSV: ${csvOut}`);
  console.log(`Doc categories: ${categoriesOut}`);
}

main().catch((error) => {
  console.error(`${scriptLabel} failed:`, error.message || error);
  process.exitCode = 1;
});
