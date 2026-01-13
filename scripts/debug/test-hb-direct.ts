import "../../env.js";

async function testHB() {
    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID || process.env.HB_MERCHANT_ID || "";
    const serviceKey = process.env.HEPSIBURADA_API_PASSWORD || process.env.HB_SERVICE_KEY || "";
    
    console.log("MerchantID:", merchantId ? merchantId.substring(0, 10) + "..." : "MISSING");
    console.log("ServiceKey:", serviceKey ? "****" + serviceKey.substring(serviceKey.length - 4) : "MISSING");
    
    const baseUrl = "https://listing-external.hepsiburada.com";
    const url = `${baseUrl}/listings/merchantid/${merchantId}?offset=0&limit=5`;
    
    console.log("\nCalling:", url);
    
    const credentials = `${merchantId}:${serviceKey}`;
    const auth = Buffer.from(credentials).toString("base64");
    
    try {
        const res = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Basic ${auth}`,
                "User-Agent": "BeekodIntegration"
            }
        });
        
        console.log("Status:", res.status, res.statusText);
        const body = await res.text();
        console.log("Response:", body.substring(0, 1000));
    } catch (e: any) {
        console.error("Fetch Error:", e.message);
    }
}

testHB();
