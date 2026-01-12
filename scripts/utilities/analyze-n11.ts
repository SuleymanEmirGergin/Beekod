import { getBrowser, closeBrowser, createPage } from "../src/services/scraper/browser.js";
import fs from "fs";

async function main() {
    console.log("N11 HTML analizi yapılıyor...");
    try {
        const browser = await getBrowser();
        const page = await createPage(browser);
        const url = "https://www.n11.com/arama?q=iphone";

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 3000));

        const html = await page.content();
        fs.writeFileSync("n11-products.html", html);

        const selectors = [
            '.column',
            '.pro',
            'li.column',
            'ul.list li',
            '[class*="product"]'
        ];

        console.log("\nBulunan Selector'lar:");
        for (const sel of selectors) {
            try {
                const count = await page.$$eval(sel, els => els.length);
                if (count > 0) {
                    console.log(`✓ ${sel}: ${count} adet`);
                }
            } catch { }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await closeBrowser();
    }
}

main();
