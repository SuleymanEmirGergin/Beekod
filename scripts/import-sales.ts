import "../env.js";
import { config } from "../src/config.js";
import { loadSalesFromFile } from "../src/services/salesMock.js";
import { clearSalesRecords, insertSalesRecords } from "../src/services/salesStoreDb.js";

const args = process.argv.slice(2);
const replace = args.includes("--replace");
const fileArg = args.find((arg) => !arg.startsWith("--"));
const filePath = fileArg ?? config.data.salesPath;

async function main() {
  const records = await loadSalesFromFile(filePath);
  if (!records.length) {
    console.log("[import-sales] No rows found.");
    return;
  }
  if (replace) {
    await clearSalesRecords();
  }
  const inserted = await insertSalesRecords(records);
  console.log(
    `[import-sales] Imported ${inserted} record(s) from ${filePath}${replace ? " (replace)" : ""}.`
  );
}

main().catch((error) => {
  console.error("[import-sales] Failed:", error);
  process.exitCode = 1;
});
