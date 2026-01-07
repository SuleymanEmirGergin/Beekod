
import fs from 'fs';

async function run() {
    const url = "https://www.n11.com/urun/apple-iphone-15-128-gb-apple-turkiye-garantili-43821353";
    console.log(`Fetching ${url}...`);

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
                "Referer": "https://www.google.com/"
            }
        });

        if (!response.ok) {
            console.error("Failed to fetch:", response.status, response.statusText);
            return;
        }

        const html = await response.text();
        fs.writeFileSync("debug_n11_raw.html", html);
        console.log("Saved debug_n11_raw.html");

        // Quick look for JSON-LD
        const jsonLdCount = (html.match(/<script type="application\/ld\+json">/gi) || []).length;
        console.log(`Found ${jsonLdCount} JSON-LD blocks.`);

    } catch (e) {
        console.error(e);
    }
}

run();
