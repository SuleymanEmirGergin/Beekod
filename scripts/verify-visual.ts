import "../env.js";
import { runVisualSearch } from "../src/services/visualSearchService.js";
import fs from "fs/promises";
import path from "path";

async function run() {
    const imagePath = process.argv[2];
    if (!imagePath) {
        console.error("Usage: tsx scripts/verify-visual.ts <path-to-image>");
        process.exit(1);
    }

    console.log(`Analyzing image: ${imagePath}`);
    try {
        const buffer = await fs.readFile(imagePath);
        const result = await runVisualSearch(buffer);

        console.log("\n--- Visual Search Result ---");
        console.log("Detected Product Query:", result.detectedProduct);
        console.log("Found Items:", result.items.length);

        result.items.forEach((item, index) => {
            console.log(`\n${index + 1}. ${item.title}`);
            console.log(`   Price: ${item.price} ${item.currency || ""}`);
            console.log(`   Link: ${item.link}`);
        });

    } catch (error) {
        console.error("Visual Search failed:", error);
    }
}

run();
