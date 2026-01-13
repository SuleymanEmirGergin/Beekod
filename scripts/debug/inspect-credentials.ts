import "../../env.js";
import { listMarketplaceProviders } from "../../src/services/marketplace/index.ts";

async function inspectCredentials() {
    console.log("=== Marketplace API Credentials Evaluation ===\n");
    const providers = listMarketplaceProviders();
    const table = [];

    for (const p of providers) {
        table.push({
            Marketplace: p.name,
            Configured: p.configured ? "✅" : "❌",
            Mode: p.config.mode,
            MissingKeys: p.config.missing.join(", ") || "None",
            TokenStatus: p.token.status
        });
    }

    console.table(table);
}

inspectCredentials().catch(console.error);
