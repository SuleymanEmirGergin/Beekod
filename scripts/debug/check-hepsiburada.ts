import "../../env.js";

async function checkHepsiburada() {
    console.log("=== Hepsiburada API Diagnostik ===\n");
    
    // Check env variables
    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID;
    const apiKey = process.env.HEPSIBURADA_API_KEY;
    const apiPassword = process.env.HEPSIBURADA_API_PASSWORD;
    
    console.log("📋 ENV Değişkenleri:");
    console.log(`  HEPSIBURADA_MERCHANT_ID: ${merchantId ? "✅ Set" : "❌ Missing"}`);
    console.log(`  HEPSIBURADA_API_KEY: ${apiKey ? "✅ Set" : "❌ Missing"}`);
    console.log(`  HEPSIBURADA_API_PASSWORD: ${apiPassword ? "✅ Set" : "❌ Missing"}`);
    
    if (!merchantId || !apiKey) {
        console.error("\n❌ Eksik credentials! Lütfen .env dosyasını kontrol edin.");
        return;
    }
    
    // Test different endpoints
    const endpoints = [
        { name: "Merchant Info", path: `/merchants/${merchantId}`, method: "GET" },
        { name: "Listings V2", path: `/listings/merchantid/${merchantId}`, method: "GET" },
        { name: "Stock Info", path: `/stock/${merchantId}`, method: "GET" },
        { name: "Inventory", path: `/inventory-uploads/merchant/${merchantId}`, method: "GET" },
    ];
    
    const baseUrl = "https://mpop-gateway.hepsiburada.com";
    const auth = Buffer.from(`${merchantId}:${apiKey}`).toString("base64");
    
    console.log("\n🔍 Endpoint Testleri:\n");
    
    for (const ep of endpoints) {
        try {
            const response = await fetch(`${baseUrl}${ep.path}`, {
                method: ep.method,
                headers: {
                    "Authorization": `Basic ${auth}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            });
            
            const status = response.status;
            const statusText = response.statusText;
            let bodySnippet = "";
            
            try {
                const text = await response.text();
                bodySnippet = text.substring(0, 100);
            } catch {}
            
            const icon = status >= 200 && status < 300 ? "✅" : status === 401 ? "🔐" : status === 403 ? "🚫" : "❌";
            console.log(`${icon} ${ep.name}: ${status} ${statusText}`);
            if (status !== 200) {
                console.log(`   Body: ${bodySnippet}...`);
            }
        } catch (e: any) {
            console.log(`❌ ${ep.name}: ${e.message}`);
        }
    }
    
    console.log("\n📌 Öneriler:");
    console.log("1. Hepsiburada Satıcı Paneli > Entegrasyon Ayarları'nı kontrol edin");
    console.log("2. API erişim yetkilerinin aktif olduğundan emin olun");
    console.log("3. Merchant ID'nin doğru olduğunu doğrulayın");
    console.log("4. Hesapta en az 1 aktif ürün olması gerekiyor");
}

checkHepsiburada();
