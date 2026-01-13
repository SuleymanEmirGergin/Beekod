import "../../env.js";

async function testHBEndpoints() {
    const mid = process.env.HEPSIBURADA_MERCHANT_ID || "";
    const user = process.env.HEPSIBURADA_API_USERNAME || "";
    const pass = process.env.HEPSIBURADA_API_PASSWORD || "";
    
    console.log("MerchantID:", mid);
    console.log("Username:", user);
    console.log("Password:", pass ? "****" : "MISSING");
    
    const auth = Buffer.from(`${user}:${pass}`).toString("base64");
    
    const endpoints = [
        `https://listing-external.hepsiburada.com/listings/merchantid/${mid}?offset=0&limit=2`,
        `https://mpop.hepsiburada.com/product/api/products/all-products-of-merchant/${mid}?page=0&size=2`,
        `https://mpop.hepsiburada.com/listings/merchantid/${mid}?offset=0&limit=2`
    ];
    
    for (const url of endpoints) {
        console.log("\n--- Testing:", url.substring(0, 60) + "...");
        try {
            const res = await fetch(url, {
                headers: {
                    "Authorization": `Basic ${auth}`,
                    "Accept": "application/json",
                    "User-Agent": "BeekodIntegration"
                }
            });
            console.log("Status:", res.status, res.statusText);
            if (res.status === 200) {
                const text = await res.text();
                console.log("SUCCESS! Response:", text.substring(0, 300));
            }
        } catch (e: any) {
            console.log("Error:", e.message);
        }
    }
}

testHBEndpoints();
