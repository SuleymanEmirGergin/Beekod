import "../env.js";
import { config } from "../src/config.js";
import { loadMarketplaceFromFile } from "../src/services/marketplaceMock.js";
import { clearMarketplaceListings, upsertMarketplaceListings } from "../src/services/marketplaceStoreDb.js";

const args = process.argv.slice(2);
const replace = args.includes("--replace");
const fileArg = args.find((arg) => !arg.startsWith("--"));
const filePath = fileArg ?? config.data.marketplacePath;

async function main() {
  const listings = await loadMarketplaceFromFile(filePath);
  if (!listings.length) {
    console.log("[import-marketplace] No rows found.");
    return;
  }
  if (replace) {
    await clearMarketplaceListings();
  }
  const saved = await upsertMarketplaceListings(listings);
  console.log(
    `[import-marketplace] Imported ${saved.length} listing(s) from ${filePath}${replace ? " (replace)" : ""}.`
  );
}

main().catch((error) => {
  console.error("[import-marketplace] Failed:", error);
  process.exitCode = 1;
});
