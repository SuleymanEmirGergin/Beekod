import "../../env.js";

async function huntForHepsiburadaProducts() {
    console.log("=== Hepsiburada Ürün Avı ===\n");
    
    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID; // UUID
    const apiKey = process.env.HEPSIBURADA_API_KEY;
    const auth = Buffer.from(`${merchantId}:${apiKey}`).toString("base64");
    
    // Hepsiburada uses different domains for different things
    const commonPrefixes = [
        "https://listing-external.hepsiburada.com",
        "https://mpop-gateway.hepsiburada.com",
        "https://api.hepsiburada.com"
    ];

    // Common listing and search patterns
    const endpoints = [
        `/listings/merchantid/${merchantId}`,
        `/listings/v2/merchantid/${merchantId}`,
        `/listings/v3/merchantid/${merchantId}`,
        `/import/listings/merchantid/${merchantId}`,
        `/inventory-uploads/merchant/${merchantId}`,
        `/listing/merchantid/${merchantId}`,
        `/items/merchantid/${merchantId}`
    ];

    console.log(`Merchant ID: ${merchantId}`);
    console.log(`Auth Header present: ${!!auth}`);

    for (const prefix of commonPrefixes) {
        console.log(`\n--- Domain: ${prefix} ---`);
        for (const path of endpoints) {
            const url = `${prefix}${path}`;
            console.log(`Testing: ${url}`);
            try {
                const res = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Authorization": `Basic ${auth}`,
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    }
                });

                console.log(`  > Status: ${res.status} ${res.statusText}`);
                if (res.ok) {
                    const data = await res.json();
                    const count = data.listings?.length || data.totalElements || (Array.isArray(data) ? data.length : "obj");
                    console.log(`  ✅ Başarılı! Veri özeti:`, JSON.stringify(data).substring(0, 150));
                    if (count > 0 || (typeof count === 'number' && count > 0)) {
                        console.log(`  🌟 BULDUM! Sayı: ${count}`);
                    }
                } else {
                    const errorText = await res.text();
                    console.log(`  ❌ Hata: ${errorText.substring(0, 100)}`);
                }
            } catch (e: any) {
                console.log(`  ❌ Network Error: ${e.message}`);
            }
        }
    }
}

huntForHepsiburadaProducts();
