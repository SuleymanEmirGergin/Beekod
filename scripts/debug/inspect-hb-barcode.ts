import "../../env.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteerExtra.use(StealthPlugin());

async function inspectHepsiburada() {
    console.log("=== Hepsiburada Barcode Inspector ===\n");
    
    const browser = await puppeteerExtra.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    const url = "https://www.hepsiburada.com/iphone-15-128-gb-mavi-p-HBCV00004X9ZCK";
    console.log(`Navigating to: ${url}`);
    
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    
    // Extract all JSON-LD scripts
    const jsonLdData = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        return Array.from(scripts).map(s => {
            try { return JSON.parse(s.textContent || "{}"); }
            catch { return null; }
        }).filter(Boolean);
    });
    
    console.log("\n--- JSON-LD Data ---");
    console.log(JSON.stringify(jsonLdData, null, 2));
    
    // Search for barcode patterns in window object
    const windowData = await page.evaluate(() => {
        const result: any = {};
        // Check __INITIAL_STATE__ or similar
        if ((window as any).__INITIAL_STATE__) {
            result.initialState = "Found __INITIAL_STATE__";
        }
        // Check for product detail
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const s of scripts) {
            const text = s.textContent || "";
            if (text.includes('"barcode"') || text.includes('"gtin"')) {
                const barcodeMatch = text.match(/"barcode"\s*:\s*"(\d+)"/);
                const gtinMatch = text.match(/"gtin\d*"\s*:\s*"(\d+)"/);
                if (barcodeMatch) result.barcode = barcodeMatch[1];
                if (gtinMatch) result.gtin = gtinMatch[1];
            }
        }
        return result;
    });
    
    console.log("\n--- Window/Script Data ---");
    console.log(JSON.stringify(windowData, null, 2));
    
    await browser.close();
    console.log("\nDone.");
}

inspectHepsiburada().catch(console.error);
