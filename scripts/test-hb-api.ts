import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

async function testHepsiburadaAPI() {
    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID || "";
    const username = process.env.HEPSIBURADA_API_USERNAME || "";
    const password = process.env.HEPSIBURADA_API_PASSWORD || "";
    const baseURL = process.env.HEPSIBURADA_API_URL || "https://listing-external.hepsiburada.com";

    console.log("\n🔍 Hepsiburada API Test\n");
    console.log("Config:");
    console.log(`  Base URL: ${baseURL}`);
    console.log(`  Merchant ID: ${merchantId || "(missing)"}`);
    console.log(`  Username: ${username || "(missing)"}`);
    console.log(`  Password: ${password ? "***" : "(missing)"}`);
    console.log("");

    if (!merchantId || !username || !password) {
        console.error("❌ Missing credentials!");
        return;
    }

    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    try {
        console.log("📡 Making API request...");
        const response = await axios.get(
            `${baseURL}/listings/merchantid/${merchantId}`,
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    offset: 0,
                    limit: 10
                },
                timeout: 15000
            }
        );

        console.log("\n✅ Success!");
        console.log(`Status: ${response.status}`);
        console.log(`Total listings: ${response.data?.listings?.length || 0}`);

        if (response.data?.listings?.length > 0) {
            console.log("\nFirst 3 products:");
            response.data.listings.slice(0, 3).forEach((listing: any, i: number) => {
                console.log(`  ${i + 1}. ${listing.productName || listing.name || "N/A"}`);
                console.log(`     Price: ${listing.price} TL`);
                console.log(`     SKU: ${listing.hepsiburadaSku || listing.merchantSku}`);
            });
        }
    } catch (error: any) {
        console.error("\n❌ API Request Failed!");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Message: ${error.response.statusText}`);
            console.error(`Data:`, error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testHepsiburadaAPI();
