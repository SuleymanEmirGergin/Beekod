import "../../env.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteerExtra.use(StealthPlugin());

async function deepInspect(siteName: string, url: string) {
    console.log(`\n=== Deep Inspection: ${siteName} ===`);
    console.log(`URL: ${url}\n`);
    
    const browser = await puppeteerExtra.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
        
        // Get full page HTML and search for 13-digit patterns (EAN/GTIN)
        const pageContent = await page.content();
        const ean13Pattern = /\b(\d{13})\b/g;
        const ean13Matches = [...new Set(pageContent.match(ean13Pattern) || [])];
        
        console.log("--- Potential EAN-13 Barcodes Found ---");
        if (ean13Matches.length > 0) {
            console.log(ean13Matches.slice(0, 10).join("\n"));
        } else {
            console.log("No 13-digit patterns found");
        }
        
        // Check for data attributes
        const dataAttrs = await page.evaluate(() => {
            const all = document.querySelectorAll('[data-barcode], [data-sku], [data-product-id], [data-gtin]');
            return Array.from(all).map(el => ({
                tag: el.tagName,
                barcode: el.getAttribute('data-barcode'),
                sku: el.getAttribute('data-sku'),
                productId: el.getAttribute('data-product-id'),
                gtin: el.getAttribute('data-gtin')
            }));
        });
        
        console.log("\n--- Data Attributes ---");
        console.log(JSON.stringify(dataAttrs.slice(0, 5), null, 2));
        
        // Check hidden inputs
        const hiddenInputs = await page.evaluate(() => {
            const inputs = document.querySelectorAll('input[type="hidden"]');
            return Array.from(inputs)
                .filter(i => {
                    const name = (i.getAttribute('name') || '').toLowerCase();
                    const id = (i.getAttribute('id') || '').toLowerCase();
                    return name.includes('barcode') || name.includes('sku') || 
                           name.includes('product') || name.includes('gtin') ||
                           id.includes('barcode') || id.includes('sku');
                })
                .map(i => ({ name: i.getAttribute('name'), value: i.getAttribute('value') }));
        });
        
        console.log("\n--- Relevant Hidden Inputs ---");
        console.log(JSON.stringify(hiddenInputs, null, 2));
        
        // Check window object for product data
        const windowData = await page.evaluate(() => {
            const w = window as any;
            const keys = ['__INITIAL_STATE__', '__NEXT_DATA__', 'dataLayer', 'productData', 
                          '__NUXT__', 'pageData', '__PRELOADED_STATE__', 'PRODUCT_DETAIL_APP_STATE'];
            const found: any = {};
            for (const k of keys) {
                if (w[k]) {
                    found[k] = "EXISTS";
                    // Try to find barcode in it
                    const str = JSON.stringify(w[k]);
                    const barcodeMatch = str.match(/"barcode"\s*:\s*"(\d+)"/);
                    if (barcodeMatch) found[k + "_barcode"] = barcodeMatch[1];
                }
            }
            return found;
        });
        
        console.log("\n--- Window Objects ---");
        console.log(JSON.stringify(windowData, null, 2));
        
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await browser.close();
    }
}

const site = process.argv[2] || "Trendyol";
const urls: Record<string, string> = {
    "Trendyol": "https://www.trendyol.com/apple/iphone-15-128-gb-p-761103009",
    "N11": "https://www.n11.com/urun/apple-iphone-15-128-gb-mavi-4832970",
    "Ciceksepeti": "https://www.ciceksepeti.com/elidor-sampuan-guclendirici-bakim-700-ml-p-4076971",
    "Pazarama": "https://www.pazarama.com/telefon-tablet/apple-iphone-15-128gb-siyah",
    "PttAVM": "https://www.pttavm.com/apple-iphone-15-128-gb-siyah"
};

deepInspect(site, urls[site] || urls["Trendyol"]).catch(console.error);
