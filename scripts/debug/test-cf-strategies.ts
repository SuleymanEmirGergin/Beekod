import "../../env.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteerExtra.use(StealthPlugin());

/**
 * Try different strategies to bypass Cloudflare
 */
async function testStrategies() {
    console.log("=== Anti-Cloudflare Strategy Test ===\n");
    
    const strategies = [
        { 
            name: "Desktop Chrome",
            ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            mobile: false
        },
        {
            name: "Mobile Android",
            ua: "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
            mobile: true
        },
        {
            name: "Mobile iOS",
            ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
            mobile: true
        },
        {
            name: "Googlebot",
            ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
            mobile: false
        }
    ];
    
    const testUrl = "https://www.trendyol.com/apple/iphone-15-128-gb-p-761103009";
    
    const browser = await puppeteerExtra.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    
    for (const strategy of strategies) {
        console.log(`\n--- Testing: ${strategy.name} ---`);
        const page = await browser.newPage();
        
        try {
            await page.setUserAgent(strategy.ua);
            
            if (strategy.mobile) {
                await page.setViewport({ width: 375, height: 812, isMobile: true });
            } else {
                await page.setViewport({ width: 1920, height: 1080 });
            }
            
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            });
            
            console.log(`Navigating to Trendyol...`);
            await page.goto(testUrl, { waitUntil: "networkidle2", timeout: 25000 });
            
            // Check if we got blocked
            const pageContent = await page.content();
            const title = await page.title();
            
            console.log(`Page Title: ${title}`);
            console.log(`Content Length: ${pageContent.length} chars`);
            
            // Check for Cloudflare challenge
            if (pageContent.includes('cf-challenge') || pageContent.includes('Just a moment')) {
                console.log(`❌ Cloudflare challenge detected!`);
            } else if (pageContent.length < 5000) {
                console.log(`⚠️ Page content too short, might be blocked`);
            } else {
                console.log(`✅ Page loaded successfully!`);
                
                // Try to find barcode
                const barcodeData = await page.evaluate(() => {
                    const scripts = Array.from(document.querySelectorAll('script'));
                    for (const s of scripts) {
                        const text = s.textContent || "";
                        const match = text.match(/"barcode"\s*:\s*"(\d+)"/);
                        if (match) return match[1];
                    }
                    return null;
                });
                
                if (barcodeData) {
                    console.log(`🎉 Barcode found: ${barcodeData}`);
                } else {
                    console.log(`⚠️ No barcode in page scripts`);
                }
            }
            
        } catch (error) {
            console.log(`❌ Error: ${error}`);
        } finally {
            await page.close();
        }
    }
    
    await browser.close();
}

testStrategies().catch(console.error);
