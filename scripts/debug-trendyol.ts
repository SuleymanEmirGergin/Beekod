import "../env.js";
import { getBrowser, createPage } from "../src/services/scraper/browser.js";
import * as cheerio from "cheerio";
import * as fs from "fs/promises";

async function run() {
    const query = "iphone 13";
    let page;

    try {
        console.log("[Debug] Launching browser...");
        const browser = await getBrowser();
        page = await createPage(browser);

        const url = `https://www.trendyol.com/sr?q=${encodeURIComponent(query)}`;
        console.log(`[Debug] Navigating to: ${url}`);

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

        // Try to wait for product cards
        try {
            await page.waitForSelector('.p-card-wrppr', { timeout: 5000 });
            console.log("[Debug] Found .p-card-wrppr selector");
        } catch (e) {
            console.log("[Debug] .p-card-wrppr NOT found");
        }

        // Get page content
        const content = await page.content();

        // Save to file for inspection
        await fs.writeFile("trendyol-debug.html", content);
        console.log("[Debug] Saved page HTML to trendyol-debug.html");

        // Try to parse with cheerio
        const $ = cheerio.load(content);

        console.log("\n[Debug] Testing selectors:");
        console.log(`  .p-card-wrppr count: ${$('.p-card-wrppr').length}`);
        console.log(`  .prdct-desc-cntnr-name count: ${$('.prdct-desc-cntnr-name').length}`);
        console.log(`  .product-name count: ${$('.product-name').length}`);
        console.log(`  .prc-box-dscntd count: ${$('.prc-box-dscntd').length}`);

        // Try alternative selectors
        console.log(`\n[Debug] Alternative selectors:`);
        console.log(`  [data-test-id] count: ${$('[data-test-id]').length}`);
        console.log(`  article count: ${$('article').length}`);
        console.log(`  .product-card count: ${$('.product-card').length}`);

        // Sample first few product-looking elements
        console.log(`\n[Debug] Sample of classes found:`);
        $('[class*="card"]').slice(0, 5).each((i, el) => {
            console.log(`  ${i + 1}. ${$(el).attr('class')}`);
        });

    } catch (error) {
        console.error("[Debug] Error:", error);
    } finally {
        if (page) await page.close();
    }
}

run();
