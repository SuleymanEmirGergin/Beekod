import "../../env.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteerExtra.use(StealthPlugin());

/**
 * Intercept network requests to find barcode API calls
 */
async function interceptBarcodeRequests() {
    console.log("=== Network Intercept: Finding Barcode Data ===\n");
    
    const testUrl = "https://www.trendyol.com/apple/iphone-15-128-gb-p-761103009";
    
    const browser = await puppeteerExtra.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    
    const page = await browser.newPage();
    
    const foundData: { url: string; data: string }[] = [];
    
    // Intercept all responses
    page.on('response', async (response: any) => {
        const url = response.url();
        
        // Look for XHR/fetch calls that might contain product data
        if (url.includes('api') || url.includes('product') || url.includes('detail')) {
            try {
                const contentType = response.headers()['content-type'] || '';
                if (contentType.includes('json')) {
                    const text = await response.text();
                    if (text.includes('barcode') || text.includes('gtin')) {
                        console.log(`\n✅ Found potential barcode data!`);
                        console.log(`URL: ${url.substring(0, 80)}...`);
                        
                        // Extract barcode
                        const barcodeMatch = text.match(/"barcode"\s*:\s*"(\d+)"/);
                        if (barcodeMatch) {
                            console.log(`Barcode: ${barcodeMatch[1]}`);
                        }
                        
                        foundData.push({ url, data: text.substring(0, 500) });
                    }
                }
            } catch {
                // Ignore errors reading response
            }
        }
    });
    
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log("Navigating to Trendyol...");
    await page.goto(testUrl, { waitUntil: "networkidle2", timeout: 30000 });
    
    // Wait a bit for additional XHR calls
    await new Promise(r => setTimeout(r, 3000));
    
    console.log(`\n--- Summary ---`);
    console.log(`Found ${foundData.length} API calls with barcode/gtin`);
    
    // Also check window object for product data
    const windowData = await page.evaluate(() => {
        const w = window as any;
        const keys = ['__PRODUCT_DETAIL_APP_STATE__', 'productDetail', '__INITIAL_STATE__', 'TYPageData'];
        const found: any = {};
        for (const k of keys) {
            if (w[k]) {
                found[k] = "EXISTS";
                try {
                    const str = JSON.stringify(w[k]);
                    const barcodeMatch = str.match(/"barcode"\s*:\s*"(\d+)"/);
                    if (barcodeMatch) found[k + "_barcode"] = barcodeMatch[1];
                } catch {}
            }
        }
        return found;
    });
    
    console.log("\n--- Window Objects ---");
    console.log(JSON.stringify(windowData, null, 2));
    
    await browser.close();
}

interceptBarcodeRequests().catch(console.error);
