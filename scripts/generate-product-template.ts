import path from "path";
import ExcelJS from "exceljs";

async function main() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Products");

  sheet.addRow(["barcode", "name", "price", "stock", "currency"]);
  sheet.addRow(["bee252525", "Bee 252525 Bracelet", 500, 5, "TRY"]);
  sheet.addRow(["bee999888", "Bee 999888 Necklace", 129, 20, "TRY"]);

  const outPath = path.resolve("data", "product-template.xlsx");
  await workbook.xlsx.writeFile(outPath);
  console.log(`Template written to ${outPath}`);
}

main().catch((error) => {
  console.error("Product template generation failed", error);
  process.exit(1);
});
