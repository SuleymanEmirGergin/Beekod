import "../../env.js";

function checkEnvFormat() {
    const mid = process.env.HEPSIBURADA_MERCHANT_ID || "";
    const key = process.env.HEPSIBURADA_API_KEY || "";
    
    console.log("=== Hepsiburada Format Kontrolü ===");
    console.log(`Merchant ID Length: ${mid.length}`);
    console.log(`Merchant ID is UUID: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mid)}`);
    console.log(`Merchant ID is Numeric: ${/^\d+$/.test(mid)}`);
    
    console.log(`API Key Length: ${key.length}`);
    console.log(`API Key starts with 'h': ${key.toLowerCase().startsWith('h')}`);
}

checkEnvFormat();
