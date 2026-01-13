import "../../env.js";
import { N11Adapter } from "../../src/services/search/adapters/n11Adapter.js";
import { TrendyolAdapter } from "../../src/services/search/adapters/trendyolAdapter.js";
import { CiceksepetiAdapter } from "../../src/services/search/adapters/ciceksepetiAdapter.js";
import { HepsiburadaAPIAdapter } from "../../src/services/search/adapters/hepsiburadaAPIAdapter.js";
import { PazaramaAdapter } from "../../src/services/search/adapters/pazaramaAdapter.js";
import { PttAVMAdapter } from "../../src/services/search/adapters/pttavmAdapter.js";

async function verifyAdapters() {
    console.log("🧪 Final Verification of ALL 6 API Adapters...");

    const check = async (name: string, adapter: any) => {
        try {
            console.log(`\n--- ${name} Adapter ---`);
            const res = await adapter.search("a"); // Broad query
            console.log(`Found: ${res.length}`);
            if(res.length > 0) {
                const p = res[0];
                console.log("Fields:", Object.keys(p).filter(k => p[k] !== undefined).join(", "));
                console.log("Stock:", p.stockCount ?? "Missing");
                console.log("Brand:", p.brand || "Missing");
                console.log("Barcode:", p.barcode || "Missing");
                console.log("Desc:", p.description ? "Has" : "Missing");
            }
        } catch(e) { console.error(`${name} Error:`, e); }
    };

    await check("N11", new N11Adapter());
    await check("Trendyol", new TrendyolAdapter());
    await check("Ciceksepeti", new CiceksepetiAdapter());
    await check("Hepsiburada", new HepsiburadaAPIAdapter());
    await check("Pazarama", new PazaramaAdapter());
    await check("PttAVM", new PttAVMAdapter());
}

verifyAdapters();
