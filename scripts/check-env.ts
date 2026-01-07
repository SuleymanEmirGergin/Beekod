
import 'dotenv/config';

const REQUIRED_ENV: Record<string, string[]> = {
    Trendyol: ["TRENDYOL_API_BASE", "TRENDYOL_API_KEY", "TRENDYOL_API_SECRET", "TRENDYOL_SUPPLIER_ID"],
    Hepsiburada: ["HEPSIBURADA_API_BASE", "HEPSIBURADA_API_KEY", "HEPSIBURADA_API_SECRET"],
    N11: ["N11_API_BASE", "N11_API_KEY", "N11_API_SECRET"],
    Ciceksepeti: ["CICEKSEPETI_API_KEY"],
    PttAVM: ["PTTAVM_API_USER", "PTTAVM_API_PASS"],
    Pazarama: ["PAZARAMA_API_KEY"]
};

console.log("Checking Marketplace API Keys...\n");

for (const [marketplace, keys] of Object.entries(REQUIRED_ENV)) {
    console.log(`[${marketplace}]`);
    let allSet = true;
    for (const key of keys) {
        const val = process.env[key];
        const isSet = !!(val && val.trim() && val !== 'your_api_key_here'); // Basic check for default values too
        const display = isSet ? "✅ Present" : "❌ Missing";
        console.log(`  ${key}: ${display}`);
        if (!isSet) allSet = false;
    }
    console.log(allSet ? `  => Status: READY 🟢` : `  => Status: INCOMPLETE 🔴`);
    console.log("");
}
