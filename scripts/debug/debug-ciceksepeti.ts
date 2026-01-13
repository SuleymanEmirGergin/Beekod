import { getBrowser, closeBrowser, createPage } from "../../src/services/scraper/browser.js";
import fs from "fs";

async function main() {
    console.log("Debugging Çiçek Sepeti...");
    try {
        const browser = await getBrowser();
        const page = await createPage(browser);
        const url = "https://www.ciceksepeti.com/arama?query=gul";

        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for product list
        try {
            await page.waitForSelector(".products__item", { timeout: 10000 });
            console.log("Product selector found!");
        } catch (e) {
            console.log("Product selector timeout!");
        }

        const content = await page.content();
        console.log(`HTML length: ${content.length}`);

        fs.writeFileSync("ciceksepeti-debug.html", content);

        // Basic check
        if (content.includes("bot") || content.includes("captcha") || content.includes("Cloudflare")) {
            console.log("⚠️  DETECTED AS BOT!");
        } else if (content.includes("products__item")) {
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
