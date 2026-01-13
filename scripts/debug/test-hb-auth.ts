import "../../env.js";
import { hepsiburadaService } from "../../src/services/hepsiburadaService.js";

async function testHBAuth() {
    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID || "";
    const password = process.env.HEPSIBURADA_API_PASSWORD || "";
    const username = process.env.HEPSIBURADA_API_USERNAME || "";

    const combinations = [
        { u: username, p: password, label: "Username + Password" },
        { u: merchantId, p: password, label: "MerchantId + Password" }
    ];

    for (const combo of combinations) {
        console.log(`--- Testing Hepsiburada: ${combo.label} ---`);
        const credentials = `${combo.u}:${combo.p}`;
        const base64 = Buffer.from(credentials).toString("base64");
        const url = `https://listing-external.hepsiburada.com/listings/merchantid/${merchantId}?offset=0&limit=1`;
        
        try {
            const resp = await fetch(url, {
                headers: { "Authorization": `Basic ${base64}`, "Accept": "application/json" }
            });
            console.log(`Status: ${resp.status}`);
            const body = await resp.text();
            console.log(`Body: ${body.substring(0, 100)}`);
        } catch (e: any) {
            console.log(`Error: ${e.message}`);
        }
    }
}

testHBAuth();
