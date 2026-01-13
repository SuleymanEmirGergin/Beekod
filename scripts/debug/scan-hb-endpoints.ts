import "../../env.js";

async function deepTestHB() {
    console.log("=== Hepsiburada Derin Tarama ===\n");
    
    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID;
    const apiKey = process.env.HEPSIBURADA_API_KEY;
    const auth = Buffer.from(`${merchantId}:${apiKey}`).toString("base64");
    const baseUrl = "https://listing-external.hepsiburada.com";
    
    // Test diverse endpoints commonly used in HB API
    const targets = [
        { name: "Listings v2", path: `/listings/merchantid/${merchantId}` },
        { name: "Listings package", path: `/packages/merchantid/${merchantId}` },
        { name: "Merchant info", path: `/merchants/${merchantId}` },
        { name: "Active Listings", path: `/listings/merchantid/${merchantId}?status=Active` },
        { name: "All Listings", path: `/listings/merchantid/${merchantId}?limit=100` },
        { name: "Category List", path: `/categories/merchantid/${merchantId}` },
    ];
    
    for (const target of targets) {
        console.log(`\n🔍 Deneniyor: ${target.name} (${target.path})`);
        try {
            const res = await fetch(`${baseUrl}${target.path}`, {
                method: "GET",
                headers: {
                    "Authorization": `Basic ${auth}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            });
            
            console.log(`   Durum: ${res.status} ${res.statusText}`);
            const text = await res.text();
            try {
                const json = JSON.parse(text);
                console.log(`   Yanıt (Snippet):`, JSON.stringify(json).substring(0, 300));
                
                if (json.listings && json.listings.length > 0) {
                    console.log(`   ✅ BULDUM! ${json.listings.length} ürün var.`);
                }
                if (Array.isArray(json) && json.length > 0) {
                     console.log(`   ✅ BULDUM! ${json.length} öğe var.`);
                }
            } catch {
                console.log(`   Yanıt (Text):`, text.substring(0, 200));
            }
        } catch (e: any) {
            console.log(`   ❌ Hata: ${e.message}`);
        }
    }
}

deepTestHB();
