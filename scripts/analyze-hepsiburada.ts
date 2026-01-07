import { getBrowser, closeBrowser, createPage } from "../src/services/scraper/browser.js";
import fs from "fs";

async function main() {
    console.log("Hepsiburada HTML analizi yapılıyor...");
    try {
        const browser = await getBrowser();
        const page = await createPage(browser);
        const url = "https://www.hepsiburada.com/ara?q=iphone 13";

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 3000)); // Wait for JS

        const html = await page.content();
        fs.writeFileSync("hepsiburada-products.html", html);

        // Check for common product selectors
        const selectors = [
            'li[id^="i"]',
            '.productListContent',
            '[data-test-id="product-card"]',
            'article',
            '.product-item',
            'ul.product-list li'
        ];

        console.log("\nBulunan Selector'lar:");
        for (const sel of selectors) {
            try {
                const count = await page.$$eval(sel, els => els.length);
                if (count > 0) {
                    console.log(`✓ ${sel}: ${count} adet`);

                    // İlk elementi detaylı incele
                    const firstEl = await page.$$(sel);
                    if (firstEl[0]) {
                        const classes = await firstEl[0].evaluate(el => el.className);
                        console.log(`  Classes: ${classes}`);
                    }
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
