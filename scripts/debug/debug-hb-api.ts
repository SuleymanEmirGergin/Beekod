import "../../env.js";

async function debugHepsiburadaAPI() {
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║       HEPSİBURADA API DEBUG                                  ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");
    
    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID;
    const apiKey = process.env.HEPSIBURADA_API_KEY;
    const apiBase = process.env.HEPSIBURADA_API_BASE;
    
    console.log("📌 Environment Variables:");
    console.log(`   HEPSIBURADA_MERCHANT_ID: ${merchantId}`);
    console.log(`   HEPSIBURADA_API_KEY: ${apiKey?.substring(0, 4)}****`);
    console.log(`   HEPSIBURADA_API_BASE: ${apiBase}`);
    
    // Test different endpoints
    const endpoints = [
        // Listing API - listing-external
        `https://listing-external.hepsiburada.com/listings/merchantid/${merchantId}?limit=5&offset=0`,
        // MPOP Gateway
        `https://mpop-gateway.hepsiburada.com/listings/merchantid/${merchantId}?limit=5&offset=0`,
        // Direct mpop
        `https://mpop.hepsiburada.com/product/api/listings?limit=5`,
    ];
    
    const authHeader = `Basic ${Buffer.from(merchantId + ":" + apiKey).toString("base64")}`;
    console.log(`\n📌 Auth Header: ${authHeader.substring(0, 20)}...`);
    
    for (const url of endpoints) {
        console.log(`\n--- Testing: ${url.substring(0, 60)}... ---`);
        
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": authHeader,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                }
            });
            
            console.log(`   Status: ${response.status} ${response.statusText}`);
            
            const text = await response.text();
            console.log(`   Response: ${text.substring(0, 200)}...`);
            
            if (response.ok) {
                console.log(`   ✅ SUCCESS!`);
            }
        } catch (e) {
            console.log(`   ❌ Error: ${e}`);
        }
    }
}

debugHepsiburadaAPI().catch(console.error);
