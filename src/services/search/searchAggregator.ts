import { SearchAdapter, SearchResultItem } from "./types.js";
import { TrendyolAdapter } from "./adapters/trendyolAdapter.js";
import { N11Adapter } from "./adapters/n11Adapter.js";
import { HepsiburadaAPIAdapter } from "./adapters/hepsiburadaAPIAdapter.js";
import { HepsiburadaAdapter } from "./adapters/hepsiburadaAdapter.js";
import { CiceksepetiAdapter } from "./adapters/ciceksepetiAdapter.js";
import { PttAVMAdapter } from "./adapters/pttavmAdapter.js";
import { PazaramaAdapter } from "./adapters/pazaramaAdapter.js";

const adapters: SearchAdapter[] = [
  new TrendyolAdapter(),
  new HepsiburadaAPIAdapter(), // API-based for merchant products
  new HepsiburadaAdapter(), // Puppeteer-based scraper for general products
  new N11Adapter(),
  new CiceksepetiAdapter(),
  new PttAVMAdapter(),
  new PazaramaAdapter(),
];

export async function universalProductSearch(query: string): Promise<{
  results: SearchResultItem[];
  total: number;
  sources: string[];
  timeMs: number;
}> {
  const start = Date.now();
  const results: SearchResultItem[] = [];
  const sources: string[] = [];

  // Run all adapters in parallel with individual timeout
  const promises = adapters.map(async (adapter) => {
    try {
      const racePromise = Promise.race([
        adapter.search(query),
        new Promise<SearchResultItem[]>((_, reject) => setTimeout(() => reject(new Error("Adapter Timeout")), 12000)),
      ]);

      const items = await racePromise;
      if (items.length > 0) {
        results.push(...items);
        sources.push(adapter.name);
      }
    } catch (error) {}
  });

  await Promise.allSettled(promises);

  // Sort by price (ascending) as a default useful comparison
  results.sort((a, b) => a.price - b.price);

  return {
    results,
    total: results.length,
    sources,
    timeMs: Date.now() - start,
  };
}
