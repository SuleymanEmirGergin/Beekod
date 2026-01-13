import fs from 'fs';
import { logger } from './logger.js';
const html = fs.readFileSync("debug_hb_raw.html", "utf-8");
const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
if (jsonLdMatches) {
    logger.info(`Found ${jsonLdMatches.length} JSON-LD blocks.`);
    jsonLdMatches.forEach((match, i) => {
        try {
            const content = match.replace(/<script[^>]*>|<\/script>/gi, "");
            const data = JSON.parse(content);
            fs.writeFileSync(`debug_hb_json_${i}.json`, JSON.stringify(data, null, 2));
            logger.info(`Saved debug_hb_json_${i}.json`);
        } catch (e) {
            logger.error(`Error parsing block ${i}`, { error: (e as Error).message });
        }
    });
} else {
    logger.info("No JSON-LD found");
}
