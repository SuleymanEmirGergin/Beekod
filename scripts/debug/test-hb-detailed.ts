import "../../env.js";

async function testHB() {
    console.log("=== Hepsiburada Detaylı Test ===\n");
    
    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID;
    const apiKey = process.env.HEPSIBURADA_API_KEY;
    
    console.log("Credentials:");
    console.log(`  Merchant ID: ${merchantId?.substring(0, 5)}...`);
    console.log(`  API Key: ${apiKey?.substring(0, 5)}...`);
    
    // Test with correct base URL
    const baseUrls = [
        "https://mpop-gateway.hepsiburada.com",
        "https://listing-external.hepsiburada.com",
        "https://api.hepsiburada.com"
    ];
    
    const auth = Buffer.from(`${merchantId}:${apiKey}`).toString("base64");
    
    for (const baseUrl of baseUrls) {
        console.log(`\n📡 Testing: ${baseUrl}`);
        try {
            const res = await fetch(`${baseUrl}/listings/merchantid/${merchantId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Basic ${auth}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            });
            console.log(`   Status: ${res.status} ${res.statusText}`);
            if (res.ok) {
                const data = await res.json();
                console.log(`   ✅ Response:`, JSON.stringify(data).substring(0, 200));
            } else {
                const text = await res.text();
                console.log(`   ❌ Error:`, text.substring(0, 200));
            }
        } catch (e: any) {
            console.log(`   ❌ Network Error:`, e.message);
        }
    }
}

testHB();
