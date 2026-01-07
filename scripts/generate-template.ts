import path from "path";
import ExcelJS from "exceljs";

async function main() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Marketplace");

  sheet.addRow(["marketplace", "barcode", "price", "stock", "currency", "title", "active"]);
  sheet.addRow(["Trendyol", "bee252525", 489, 12, "TRY", "Bee 252525 Bracelet", "active"]);
  sheet.addRow(["Hepsiburada", "bee252525", 505, 7, "TRY", "Bee 252525 Bracelet", "active"]);
  sheet.addRow(["Amazon", "bee252525", 495, 5, "TRY", "Bee 252525 Bracelet", "inactive"]);
  sheet.addRow(["Trendyol", "bee999888", 129, 20, "TRY", "Bee 999888 Necklace", "active"]);

  const outPath = path.resolve("data", "template.xlsx");
  await workbook.xlsx.writeFile(outPath);
  console.log(`Template written to ${outPath}`);
}

main().catch((error) => {
  console.error("Template generation failed", error);
  process.exit(1);
});
