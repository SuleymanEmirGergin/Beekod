import "../../env.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteerExtra.use(StealthPlugin());

/**
 * Look for visible product code / barcode on page
 */
async function findVisibleBarcode() {
    console.log("=== Finding Visible Barcode in Product Specs ===\n");
    
    const sites = [
        { 
            name: "Trendyol", 
            url: "https://www.trendyol.com/apple/iphone-15-128-gb-p-761103009",
            selectors: [
                'div[data-testid="product-info"]',
                '.product-attributes',
                '.product-info',
                'table',
                '[class*="spec"]',
                '[class*="attribute"]',
                '[class*="detail"]'
            ]
        },
        { 
            name: "N11", 
            url: "https://www.n11.com/urun/apple-iphone-15-128-gb-mavi-4832970",
            selectors: [
                '.product-spec',
                '.specs',
                'table',
                '[class*="spec"]',
                '[class*="property"]'
            ]
        }
    ];
    
    const browser = await puppeteerExtra.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    
    for (const site of sites) {
        console.log(`\n--- ${site.name} ---`);
        console.log(`URL: ${site.url.substring(0, 60)}...`);
        
        const page = await browser.newPage();
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        await page.setViewport({ width: 1920, height: 1080 });
        
        try {
            await page.goto(site.url, { waitUntil: "networkidle2", timeout: 30000 });
            
            // Scroll to load all content
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
            await new Promise(r => setTimeout(r, 1000));
            
            // Search for barcode-related text in page
            const barcodeInfo = await page.evaluate(() => {
                const searchTerms = ['barkod', 'barcode', 'ürün kodu', 'product code', 'ean', 'gtin', 'stok kodu'];
                const results: string[] = [];
                
                // Get all text content and search for patterns
                const allText = document.body.innerText.toLowerCase();
                
                for (const term of searchTerms) {
                    const idx = allText.indexOf(term);
                    if (idx !== -1) {
                        // Get surrounding text
                        const snippet = allText.substring(Math.max(0, idx - 20), idx + 50);
                        results.push(`Found "${term}": ...${snippet}...`);
                    }
                }
                
                // Also look for 13-digit patterns near "kod" or "code"
                const codePattern = /(kod|code)[^\d]*(\d{8,13})/gi;
                let match;
                while ((match = codePattern.exec(document.body.innerText)) !== null) {
                    results.push(`Code pattern: ${match[0]}`);
                }
                
                return results;
            });
            
            if (barcodeInfo.length > 0) {
                console.log("Found barcode-related content:");
                barcodeInfo.forEach(info => console.log(`  ${info}`));
            } else {
                console.log("No barcode-related text found on page");
            }
            
            // Try to click on "Özellikler" or similar tab
            const tabs = await page.$$('[class*="tab"], [role="tab"]');
            console.log(`Found ${tabs.length} tabs on page`);
            
        } catch (error) {
            console.log(`Error: ${error}`);
        } finally {
            await page.close();
        }
    }
    
    await browser.close();
}

findVisibleBarcode().catch(console.error);
