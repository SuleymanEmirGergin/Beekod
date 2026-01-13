import "../../env.js";
import { requestJson } from "../../src/services/marketplace/httpClient.js";

async function getMerchantDetails() {
    console.log("=== Hepsiburada Mağaza Detayları ===\n");
    
    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID;
    const apiKey = process.env.HEPSIBURADA_API_KEY;
    const auth = Buffer.from(`${merchantId}:${apiKey}`).toString("base64");
    
    // Most likely endpoint for merchant info
    const url = `https://listing-external.hepsiburada.com/merchants/${merchantId}`;
    
    console.log(`URL: ${url}`);
    
    try {
        const data: any = await requestJson(url, {
            method: "GET",
            headers: {
                "Authorization": `Basic ${auth}`,
                "Accept": "application/json"
            }
        });
        
        console.log("✅ Başarılı!");
        console.log("Mağaza Bilgileri:", JSON.stringify(data, null, 2));
        
        if (data.id && typeof data.id === 'number') {
            console.log(`🌟 Sayısal Merchant ID bulundu: ${data.id}`);
        }
    } catch (e: any) {
        console.error("❌ Hata:", e.message);
        if (e.response) {
            console.error("Response Data:", e.response.data);
        }
    }
}

getMerchantDetails();
