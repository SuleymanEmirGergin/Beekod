import { N11Adapter } from "../src/services/search/adapters/n11Adapter.js";
import { getBrowser, closeBrowser, createPage } from "../src/services/scraper/browser.js";
import fs from "fs";

async function main() {
    console.log("Debugging N11...");
    const adapter = new N11Adapter();
    try {
        // We can't use adapter.search directly to debug page content unless we modify adapter.
        // So let's reproduce adapter logic here.
        const browser = await getBrowser();
        const page = await createPage(browser);
        const url = "https://www.n11.com/arama?q=iphone";

        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        console.log("Taking screenshot...");
        await page.screenshot({ path: 'n11-debug.png' });

        const content = await page.content();
        fs.writeFileSync("n11-debug.html", content);
        console.log(`HTML length: ${content.length}`);

        if (content.includes("bot") || content.includes("captcha")) {
            console.log("DETECTED AS BOT!");
        } else {
            console.log("No obvious bot text found.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await closeBrowser();
    }
}

main();
