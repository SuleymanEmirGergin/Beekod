import dotenv from "dotenv";
dotenv.config();

// MUST import after dotenv.config()
import { googleSearchService } from "./src/services/googleSearchService.js";
import { unifiedMarketplaceSearch } from "./src/services/unifiedMarketplaceSearch.js";
import fs from "fs";

async function runDiagnostic() {
    console.log("Starting Deep Search Diagnostic...");
    const query = "iphone 15";

    try {
        // 1. Check RAW Google Results
        console.log("Checking RAW Google results...");
        const rawResults = await googleSearchService.findProduct("iphone 17");
        console.log(`Raw results count: ${rawResults.length}`);

        const rawInfo = rawResults.map(r => ({
            title: r.title,
            link: r.link,
            price: r.price,
            hasImage: !!r.image,
            pagemap: (r as any)._rawPagemap // I should probably keep a ref in googleSearchService for debugging
        }));

        // 2. Run Unified Search
        console.log("Running Unified Marketplace Search...");
        const finalResults = await unifiedMarketplaceSearch(query);

        const diagnosticInfo = {
            query,
            rawResults: rawInfo,
            finalResults: finalResults.map(r => ({
                site: r.site,
                title: r.title,
                price: r.price,
                hasImage: !!r.image,
                source: r.source,
                image: r.image
            }))
        };

        fs.writeFileSync("search_diagnostic_output.json", JSON.stringify(diagnosticInfo, null, 2));
        console.log("Diagnostic complete. Results saved to search_diagnostic_output.json");

    } catch (error) {
        console.error("Diagnostic failed:", error);
    }
}

runDiagnostic();
