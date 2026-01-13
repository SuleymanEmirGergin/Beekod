import fs from 'fs';
import { logger } from './logger.js';

async function run() {
    const url = "https://www.hepsiburada.com/samsung-galaxy-s23-256-gb-8-gb-ram-samsung-turkiye-garantili-siyah-pm-HBC00003P2GFX";
    logger.info(`Fetching HTML for: ${url}`);

    // Custom fetch headers
    const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7"
        }
    });

    const html = await response.text();
    fs.writeFileSync("debug_hb_raw.html", html);
    logger.info(`Saved debug_hb_raw.html (${html.length} bytes)`);
}

run().catch((e) => logger.error("Fatal error", { error: e }));
