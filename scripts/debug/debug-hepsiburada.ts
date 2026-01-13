import { getBrowser, closeBrowser, createPage } from "../../src/services/scraper/browser.js";

async function main() {
    console.log("Debugging Hepsiburada - Sayfa 30 saniye açık kalacak...");
    try {
        const browser = await getBrowser();
        const page = await createPage(browser);
        const url = "https://www.hepsiburada.com/ara?q=iphone 13";

        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        console.log("\n⏰ 30 SANİYE BEKLE - ŞİMDİ INSPECT ET!");
        console.log("Ürün kartlarına sağ tıkla → İncele → Class isimlerini kopyala\n");

        // 30 saniye bekle
        await new Promise(r => setTimeout(r, 30000));

        console.log("\nZaman doldu, kapanıyor...");

    } catch (e) {
        console.error(e);
    } finally {
        await closeBrowser();
    }
}

main();
