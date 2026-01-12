import "../env.js";
import { analyzePricing } from "../src/services/pricingService.js";

async function run() {
    const productName = process.argv[2] || "iPhone 15 128GB";
    const myCost = process.argv[3] ? Number(process.argv[3]) : undefined;

    console.log(`Analyzing pricing for: ${productName} (Cost: ${myCost ?? "Not set"})`);

    try {
        const result = await analyzePricing({
            productName,
            myCost,
            locale: "tr"
        });

        if (!result) {
            console.log("No result found.");
            return;
        }

        console.log("\n--- Market Stats ---");
        console.log(`Min: ${result.marketStats.min}`);
        console.log(`Max: ${result.marketStats.max}`);
        console.log(`Avg: ${result.marketStats.avg}`);
        console.log(`Competitors: ${result.marketStats.competitorCount}`);

        console.log("\n--- AI Recommendation ---");
        console.log(result.recommendation);

    } catch (error) {
        console.error("Pricing Analysis failed:", error);
    }
}

run();
