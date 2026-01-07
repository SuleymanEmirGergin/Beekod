import { googleSearch } from "../src/marketplaces/api/googleSearch.js";

const query =
  process.argv.slice(2).join(" ").trim() ||
  process.env.MARKETPLACE_SEARCH_QUERY ||
  "Trendyol satici API dokumantasyon";
const limitRaw = Number(process.env.MARKETPLACE_SEARCH_LIMIT ?? 5);
const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 10) : 5;

(async () => {
  try {
    const results = await googleSearch(query, limit);
    console.log("[Marketplace] googleSearch demo:", results);
  } catch (error) {
    console.error("[Marketplace] googleSearch demo failed", error);
    process.exitCode = 1;
  }
})();
