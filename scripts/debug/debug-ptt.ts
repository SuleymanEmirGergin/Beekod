import { PttAVMAdapter } from "../src/services/search/adapters/pttavmAdapter.js";
import { getBrowser, closeBrowser, createPage } from "../src/services/scraper/browser.js";
import fs from "fs";

async function main() {
    console.log("Debugging PttAVM...");
    try {
        const browser = await getBrowser();
        const page = await createPage(browser);
        const url = "https://www.pttavm.com/arama?q=kulaklik";

        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for product list
        try {
            await page.waitForSelector(".product-list-box-container", { timeout: 10000 });
            console.log("Selector found!");
        } catch (e) {
            console.log("Selector timeout!");
        }

        const content = await page.content();
        console.log(`HTML length: ${content.length}`);

        fs.writeFileSync("ptt-debug.html", content);

        // Basic check
        if (content.includes("product-list-box-container")) {
            console.log("Success: Found product items in HTML");
        } else {
            console.log("Fail: No product items found");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await closeBrowser();
    }
}

main();
