import "../../env.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteerExtra.use(StealthPlugin());

/**
 * Deep search for barcode in page content
 */
async function deepSearchBarcode() {
    console.log("=== Deep Barcode Search ===\n");
    
    const testUrl = "https://www.trendyol.com/apple/iphone-15-128-gb-p-761103009";
    
    const browser = await puppeteerExtra.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log("Navigating to Trendyol...");
    await page.goto(testUrl, { waitUntil: "networkidle2", timeout: 30000 });
    
    // 1. Search full page HTML for EAN-13 patterns
    const pageContent = await page.content();
    console.log(`\nPage size: ${pageContent.length} chars`);
    
    // Find all 13-digit numbers that look like EAN
    const ean13Pattern = /\b0?[0-9]{12,13}\b/g;
    const matches = pageContent.match(ean13Pattern) || [];
    const uniqueMatches = [...new Set(matches)].filter(m => m.length >= 12);
    
    console.log(`\n--- Potential EAN/GTIN numbers found: ${uniqueMatches.length} ---`);
    console.log(uniqueMatches.slice(0, 20).join("\n"));
    
    // 2. Check for product ID in URL vs content
    const productIdMatch = testUrl.match(/p-(\d+)/);
    if (productIdMatch) {
        console.log(`\nProduct ID from URL: ${productIdMatch[1]}`);
        
        // Search for this ID in page to find related data
        const productId = productIdMatch[1];
        const idMatches = pageContent.match(new RegExp(`"${productId}"[^}]*}`, 'g')) || [];
        console.log(`Found ${idMatches.length} references to product ID in page`);
    }
    
    // 3. Look for specific product data structures
    const dataPatterns = [
        /"merchantId"\s*:\s*(\d+)/,
        /"productId"\s*:\s*(\d+)/,
        /"contentId"\s*:\s*(\d+)/,
        /"stockCode"\s*:\s*"([^"]+)"/,
        /data-content-id="(\d+)"/,
    ];
    
    console.log("\n--- Key Product Identifiers ---");
    for (const pattern of dataPatterns) {
        const match = pageContent.match(pattern);
        if (match) {
            console.log(`${pattern.source.split('"')[1]}: ${match[1]}`);
        }
    }
    
    // 4. Try Trendyol's public product API
    console.log("\n--- Testing Trendyol Public API ---");
    const contentIdMatch = pageContent.match(/data-content-id="(\d+)"/);
    if (contentIdMatch) {
        const contentId = contentIdMatch[1];
        console.log(`Content ID: ${contentId}`);
        
        // Trendyol public widget API
        const apiUrl = `https://public.trendyol.com/discovery-web-productgw-service/api/productDetail/${contentId}`;
        console.log(`Trying: ${apiUrl}`);
        
        const apiPage = await browser.newPage();
        try {
            const response = await apiPage.goto(apiUrl, { timeout: 10000 });
            const text = await response?.text();
            if (text) {
                console.log(`API Response length: ${text.length}`);
                const barcodeMatch = text.match(/"barcode"\s*:\s*"(\d+)"/);
                if (barcodeMatch) {
                    console.log(`✅ BARCODE FOUND: ${barcodeMatch[1]}`);
                } else {
                    console.log("No barcode in API response");
                    console.log("First 500 chars:", text.substring(0, 500));
                }
            }
        } catch (e) {
            console.log(`API Error: ${e}`);
        }
        await apiPage.close();
    }
    
    await browser.close();
}

deepSearchBarcode().catch(console.error);
