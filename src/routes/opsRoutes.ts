import { Router } from "express";
import { requireAdminKey } from "../middleware/adminKey.js";
import { logger } from "../logger.js";
import { getMetricsSnapshot } from "../metrics.js";
import { getJobStats } from "../services/jobQueue.js";
import { generateDataQualityReport } from "../services/dataQualityService.js";

const router = Router();

router.get("/ops/metrics", requireAdminKey, async (_req, res) => {
  const metrics = getMetricsSnapshot();
  const jobs = await getJobStats();
  res.json({ ...metrics, jobs });
});

router.get("/ops/data-quality", requireAdminKey, async (_req, res) => {
  try {
    const report = await generateDataQualityReport();
    res.json(report);
  } catch (error) {
    logger.error("ops.data_quality_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "data_quality_failed" });
  }
});

router.get("/ops", requireAdminKey, (_req, res) => {
  res.type("html").send(renderHtml());
});

function renderHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ops Dashboard</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #0f172a;
        --panel: #111827;
        --text: #e5e7eb;
        --muted: #94a3b8;
        --accent: #f59e0b;
      }
      body {
        margin: 0;
        font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
        background: linear-gradient(140deg, #0f172a, #1f2937 55%, #0b1220);
        color: var(--text);
      }
      header {
        padding: 24px 32px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
      }
      h1 {
        margin: 0;
        font-size: 22px;
        letter-spacing: 0.2px;
      }
      main {
        padding: 24px 32px 40px;
        display: grid;
        gap: 18px;
      }
      .grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .card {
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 12px;
        padding: 16px;
      }
      .label {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      .value {
        font-size: 20px;
        margin-top: 6px;
      }
      .section-title {
        font-size: 14px;
        color: var(--muted);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        font-family: "Consolas", "Courier New", monospace;
        font-size: 12px;
        color: #e2e8f0;
      }
      .muted {
        color: var(--muted);
        font-size: 12px;
      }
      .error {
        border-left: 3px solid var(--accent);
        padding-left: 10px;
      }
      .form-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }
      .form-row input,
      .form-row select {
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(148, 163, 184, 0.35);
        color: var(--text);
        border-radius: 10px;
        padding: 8px 10px;
        font-size: 12px;
        min-width: 180px;
      }
      .form-row button {
        background: var(--accent);
        border: none;
        color: #111827;
        border-radius: 10px;
        padding: 8px 14px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }
      .form-row button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .form-row input.small {
        min-width: 120px;
        width: 120px;
      }
    </style>
  </head>
  <body>
    <header>
      <h1>Ops Dashboard</h1>
      <div class="muted">Auto refresh every 5s</div>
    </header>
    <main>
      <div class="grid" id="summary"></div>
      <div class="grid">
        <div class="card">
          <div class="section-title">Request Breakdown</div>
          <pre id="breakdown">Loading...</pre>
        </div>
        <div class="card">
          <div class="section-title">Outbound Breakdown</div>
          <pre id="outbound">Loading...</pre>
        </div>
        <div class="card">
          <div class="section-title">Memory</div>
          <pre id="memory">Loading...</pre>
        </div>
      </div>
      <div class="card">
        <div class="section-title">Recent Errors (5xx)</div>
        <div id="errors" class="muted">Loading...</div>
      </div>
      <div class="card">
        <div class="section-title">Outbound Errors (5xx/timeout)</div>
        <div id="outbound-errors" class="muted">Loading...</div>
      </div>
      <div class="card">
        <div class="section-title">Process Issues</div>
        <div id="process-issues" class="muted">Loading...</div>
      </div>
      <div class="card">
        <div class="section-title">Batch Request Result</div>
        <div class="form-row">
          <input id="batch-id" placeholder="Batch request id" />
          <select id="batch-marketplace">
            <option value="Trendyol">Trendyol</option>
            <option value="Hepsiburada">Hepsiburada</option>
            <option value="Amazon">Amazon</option>
          </select>
          <button id="batch-fetch">Fetch</button>
        </div>
        <pre id="batch-result" class="muted">Enter a batch request id.</pre>
      </div>
      <div class="card">
        <div class="section-title">Marketplace Listings</div>
        <div class="form-row">
          <select id="list-marketplace">
            <option value="Trendyol">Trendyol</option>
            <option value="Hepsiburada">Hepsiburada</option>
            <option value="Amazon">Amazon</option>
            <option value="All">All</option>
          </select>
          <select id="list-status">
            <option value="">Status: any</option>
            <option value="active">Status: active</option>
            <option value="inactive">Status: inactive</option>
          </select>
          <select id="list-source">
            <option value="">Source: auto</option>
            <option value="live">Source: live</option>
            <option value="db">Source: db</option>
          </select>
          <input id="list-barcode" placeholder="Barcode (optional)" />
          <input id="list-limit" class="small" placeholder="Limit" />
          <button id="list-fetch">Fetch</button>
        </div>
        <pre id="list-result" class="muted">Fetch marketplace listings.</pre>
      </div>
    </main>
    <script>
      const summary = document.getElementById("summary");
      const breakdown = document.getElementById("breakdown");
      const outbound = document.getElementById("outbound");
      const memory = document.getElementById("memory");
      const errors = document.getElementById("errors");
      const outboundErrors = document.getElementById("outbound-errors");
      const processIssues = document.getElementById("process-issues");
      const batchIdInput = document.getElementById("batch-id");
      const batchMarketplace = document.getElementById("batch-marketplace");
      const batchFetch = document.getElementById("batch-fetch");
      const batchResult = document.getElementById("batch-result");
      const listMarketplace = document.getElementById("list-marketplace");
      const listStatus = document.getElementById("list-status");
      const listSource = document.getElementById("list-source");
      const listBarcode = document.getElementById("list-barcode");
      const listLimit = document.getElementById("list-limit");
      const listFetch = document.getElementById("list-fetch");
      const listResult = document.getElementById("list-result");

      function fmtBytes(value) {
        if (value == null) return "-";
        const units = ["B", "KB", "MB", "GB"];
        let size = value;
        let idx = 0;
        while (size >= 1024 && idx < units.length - 1) {
          size /= 1024;
          idx += 1;
        }
        return size.toFixed(1) + " " + units[idx];
      }

      function renderSummary(data) {
        const outboundData = data.outbound || {};
        const jobStats = data.jobs || { byStatus: {}, deadLetters: 0 };
        const items = [
          { label: "Uptime (sec)", value: data.uptimeSec },
          { label: "Started At", value: data.startedAt },
          { label: "Requests", value: data.requests.total },
          { label: "Avg Latency (ms)", value: data.requests.avgMs },
          { label: "Max Latency (ms)", value: data.requests.maxMs },
          { label: "Outbound Requests", value: outboundData.total ?? 0 },
          { label: "Outbound Avg (ms)", value: outboundData.avgMs ?? 0 },
          { label: "Jobs Queued", value: jobStats.byStatus?.queued ?? 0 },
          { label: "Jobs Running", value: jobStats.byStatus?.running ?? 0 },
          { label: "Jobs Failed", value: jobStats.byStatus?.failed ?? 0 },
          { label: "Dead Letters", value: jobStats.deadLetters ?? 0 }
        ];
        summary.innerHTML = items
          .map((item) => \`
            <div class="card">
              <div class="label">\${item.label}</div>
              <div class="value">\${item.value}</div>
            </div>
          \`)
          .join("");
      }

      function renderErrors(list) {
        if (!list.length) {
          errors.textContent = "No 5xx errors recorded.";
          return;
        }
        errors.innerHTML = list
          .map((item) => \`
            <div class="error">
              <div>\${item.at} - \${item.method} \${item.path}</div>
              <div class="muted">Status: \${item.statusCode} | \${item.durationMs}ms</div>
            </div>
          \`)
          .join("<br/>");
      }

      function renderOutboundErrors(list) {
        if (!list.length) {
          outboundErrors.textContent = "No outbound errors recorded.";
          return;
        }
        outboundErrors.innerHTML = list
          .map((item) => \`
            <div class="error">
              <div>\${item.at} - \${item.target}</div>
              <div class="muted">Status: \${item.statusCode} | \${item.durationMs}ms</div>
            </div>
          \`)
          .join("<br/>");
      }

      function renderProcessIssues(list) {
        if (!list.length) {
          processIssues.textContent = "No process issues recorded.";
          return;
        }
        processIssues.innerHTML = list
          .map((item) => \`
            <div class="error">
              <div>\${item.at} - \${item.type}: \${item.message}</div>
              <div class="muted">\${item.name || "Error"}\${item.requestId ? " | " + item.requestId : ""}</div>
            </div>
          \`)
          .join("<br/>");
      }

      async function refresh() {
        const res = await fetch("/ops/metrics");
        const data = await res.json();
        renderSummary(data);
        breakdown.textContent = JSON.stringify(
          { byMethod: data.requests.byMethod, byStatus: data.requests.byStatus },
          null,
          2
        );
        outbound.textContent = JSON.stringify(
          { byTarget: data.outbound?.byTarget || {}, byStatus: data.outbound?.byStatus || {} },
          null,
          2
        );
        memory.textContent = JSON.stringify(
          {
            rss: fmtBytes(data.memory.rss),
            heapUsed: fmtBytes(data.memory.heapUsed),
            heapTotal: fmtBytes(data.memory.heapTotal)
          },
          null,
          2
        );
        renderErrors(data.errors || []);
        renderOutboundErrors(data.outbound?.errors || []);
        renderProcessIssues(data.processIssues?.recent || []);
      }

      async function fetchBatchResult() {
        const batchId = batchIdInput.value.trim();
        if (!batchId) {
          batchResult.textContent = "Enter a batch request id.";
          return;
        }
        batchFetch.disabled = true;
        batchResult.textContent = "Loading...";
        try {
          const marketplace = batchMarketplace.value;
          const url = \`/marketplace/batch-requests/\${encodeURIComponent(batchId)}?marketplace=\${encodeURIComponent(marketplace)}\`;
          const res = await fetch(url);
          const payload = await res.json();
          batchResult.textContent = JSON.stringify(payload, null, 2);
        } catch (error) {
          batchResult.textContent = "Failed to fetch batch result.";
        } finally {
          batchFetch.disabled = false;
        }
      }

      async function fetchMarketplaceListings() {
        const params = new URLSearchParams();
        const marketplace = listMarketplace.value;
        const status = listStatus.value;
        const source = listSource.value;
        const barcode = listBarcode.value.trim();
        const limit = listLimit.value.trim();
        if (marketplace && marketplace !== "All") {
          params.set("marketplace", marketplace);
        }
        if (status) {
          params.set("status", status);
        }
        if (source) {
          params.set("source", source);
        }
        if (barcode) {
          params.set("barcode", barcode);
        }
        if (limit) {
          params.set("limit", limit);
        }

        listFetch.disabled = true;
        listResult.textContent = "Loading...";
        try {
          const url = \`/marketplace/listings\${params.toString() ? \`?\${params.toString()}\` : ""}\`;
          const res = await fetch(url);
          const payload = await res.json();
          listResult.textContent = JSON.stringify(payload, null, 2);
        } catch (error) {
          listResult.textContent = "Failed to fetch listings.";
        } finally {
          listFetch.disabled = false;
        }
      }

      batchFetch.addEventListener("click", fetchBatchResult);
      batchIdInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          fetchBatchResult();
        }
      });
      listFetch.addEventListener("click", fetchMarketplaceListings);
      listBarcode.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          fetchMarketplaceListings();
        }
      });

      refresh();
      setInterval(refresh, 5000);
    </script>
  </body>
</html>`;
}

export { router as opsRouter };
