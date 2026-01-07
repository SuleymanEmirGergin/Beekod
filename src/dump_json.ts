
import fs from 'fs';
const html = fs.readFileSync("debug_hb_raw.html", "utf-8");
const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
if (jsonLdMatches) {
    console.log(`Found ${jsonLdMatches.length} JSON-LD blocks.`);
    jsonLdMatches.forEach((match, i) => {
        try {
            const content = match.replace(/<script[^>]*>|<\/script>/gi, "");
            const data = JSON.parse(content);
            fs.writeFileSync(`debug_hb_json_${i}.json`, JSON.stringify(data, null, 2));
            console.log(`Saved debug_hb_json_${i}.json`);
        } catch (e) {
            console.error(`Error parsing block ${i}:`, (e as Error).message);
        }
    });
} else {
    console.log("No JSON-LD found");
}
