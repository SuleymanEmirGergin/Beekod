
import 'dotenv/config';
import { TrendyolProvider } from "../src/marketplaces/trendyolProvider.js";
import { PazaramaProvider } from "../src/marketplaces/pazaramaProvider.js";
import { CiceksepetiProvider } from "../src/marketplaces/ciceksepetiProvider.js";
import { HepsiburadaProvider } from "../src/marketplaces/hepsiburadaProvider.js";
import { N11Provider } from "../src/marketplaces/n11Provider.js";
import { PttAVMProvider } from "../src/marketplaces/pttavmProvider.js";
import { logger } from "../src/logger.js";

// Silent logger for the test
logger.transports.forEach((t) => (t.silent = true));

async function checkProvider(name: string, provider: any) {
    console.log(`\nTesting ${name}...`);
    try {
        if (!provider.isConfigured()) {
            console.log(`❌ ${name} is NOT configured in .env`);
            return;
        }

        console.log(`✅ ${name} configuration detected.`);

        // Try a basic operation or auth check
        if (typeof provider.checkAuth === 'function') {
            const auth = await provider.checkAuth();
            if (auth) console.log(`✅ ${name} API connection verified.`);
            else console.log(`❌ ${name} API connection failed.`);
        } else {
            console.log(`ℹ️  ${name} instantiated successfully (No direct auth check method available).`);
        }

    } catch (error: any) {
        console.log(`❌Error testing ${name}:`, error.message);
    }
}

async function run() {
    console.log("🚀 Starting Integration Connectivity Tests...");

    await checkProvider("Trendyol", new TrendyolProvider());
    await checkProvider("Pazarama", new PazaramaProvider());
    await checkProvider("Ciceksepeti", new CiceksepetiProvider());
    await checkProvider("Hepsiburada", new HepsiburadaProvider());
    await checkProvider("N11", new N11Provider());
    await checkProvider("PttAVM", new PttAVMProvider());

    console.log("\nDone.");
}

run();
