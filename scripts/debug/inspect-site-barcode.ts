import "../../env.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteerExtra.use(StealthPlugin());

async function inspectSite(siteName: string, url: string) {
    console.log(`\n=== ${siteName} Barcode Inspector ===\n`);
    console.log(`URL: ${url}\n`);
    
    const browser = await puppeteerExtra.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.goto(url, { waitUntil: "networkidle2", timeout: 25000 });
    
    // Extract JSON-LD
    const jsonLd = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        return Array.from(scripts).map(s => {
            try { return JSON.parse(s.textContent || "{}"); }
            catch { return null; }
        }).filter(Boolean);
    });
    
    console.log("--- JSON-LD Data ---");
    if (jsonLd.length > 0) {
        console.log(JSON.stringify(jsonLd.slice(0, 2), null, 2).substring(0, 1500));
    } else {
        console.log("No JSON-LD found");
    }
    
    // Search for barcode patterns in scripts
    const scriptData = await page.evaluate(() => {
        const result: any = {};
        const scripts = Array.from(document.querySelectorAll('script'));
        
        for (const s of scripts) {
            const text = s.textContent || "";
            
            // Look for various barcode patterns
            const patterns = [
                /"barcode"\s*:\s*"(\d+)"/,
                /"gtin\d*"\s*:\s*"(\d+)"/,
                /"sku"\s*:\s*"([^"]+)"/,
                /"productCode"\s*:\s*"([^"]+)"/,
                /"code"\s*:\s*"(\d+)"/,
                /"ean"\s*:\s*"(\d+)"/,
                /"productId"\s*:\s*"([^"]+)"/,
                /PRODUCT_DETAIL_APP_STATE/,
                /__NEXT_DATA__/,
            ];
            
            for (const p of patterns) {
                const match = text.match(p);
                if (match) {
                    const key = p.source.replace(/[\\"\s:()]+/g, '').substring(0, 20);
                    result[key] = match[1] || "FOUND";
                }
            }
        }
        
        return result;
    });
    
    console.log("\n--- Script Pattern Matches ---");
    console.log(JSON.stringify(scriptData, null, 2));
    
    await browser.close();
}

const site = process.argv[2] || "Trendyol";
const urls: Record<string, string> = {
    "Trendyol": "https://www.trendyol.com/apple/iphone-15-128-gb-p-761103009",
    "N11": "https://www.n11.com/urun/apple-iphone-15-128-gb-mavi-4832970",
    "Ciceksepeti": "https://www.ciceksepeti.com/elidor-sampuan-guclendirici-bakim-700-ml-p-4076971",
    "Pazarama": "https://www.pazarama.com/apple-iphone-15-128gb-siyah-p-12345",
    "PttAVM": "https://www.pttavm.com/apple-iphone-15-128-gb-siyah"
};

inspectSite(site, urls[site] || urls["Trendyol"]).catch(console.error);
