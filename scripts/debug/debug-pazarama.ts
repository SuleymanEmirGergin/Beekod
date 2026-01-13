import { getBrowser, closeBrowser, createPage } from "../../src/services/scraper/browser.js";
import fs from "fs";

async function main() {
    console.log("Debugging Pazarama...");
    try {
        const browser = await getBrowser();
        const page = await createPage(browser);
        const url = "https://www.pazarama.com/arama?q=iphone";

        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for product list
        try {
            await page.waitForSelector(".product-list-item, .card-product", { timeout: 10000 });
            console.log("Product selector found!");
        } catch (e) {
            console.log("Product selector timeout!");
        }

        const content = await page.content();
        console.log(`HTML length: ${content.length}`);

        fs.writeFileSync("pazarama-debug.html", content);

        // Basic check
        if (content.includes("bot") || content.includes("captcha") || content.includes("Cloudflare")) {
            console.log("⚠️  DETECTED AS BOT!");
        } else if (content.includes("product-list-item") || content.includes("card-product")) {
            console.log("✅ Success: Found product items in HTML");
        } else {
            console.log("❌ Fail: No product items found");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await closeBrowser();
    }
}

main();
