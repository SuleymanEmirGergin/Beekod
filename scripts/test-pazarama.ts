import "../env.js";
import { PazaramaProvider } from "../src/marketplaces/pazaramaProvider.js";
import { requestJson } from "../src/marketplaces/httpClient.js";

async function main() {
    const provider = new PazaramaProvider();
    const status = provider.getConfigStatus();
    if (!provider.isConfigured()) {
        console.log("Pazarama is not configured.");
        console.log("Missing env:", status.missing);
        return;
    }

    const result = await provider.listListings();
    console.log("Pazarama listListings status:", result.status);
    if (result.message) {
        console.log("Message:", result.message);
    }
    console.log("Mode:", status.mode);
    console.log("Endpoint:", process.env.PAZARAMA_API_ENDPOINT || "https://isortagimapi.pazarama.com");
    console.log("Merchant ID:", process.env.PAZARAMA_MERCHANT_ID || "(missing)");
    if (result.items?.length) {
        console.log("Items:", result.items.slice(0, 3));
    } else {
        console.log("Items: 0");
    }

    if (result.status !== "ok") {
        const endpoint = process.env.PAZARAMA_API_ENDPOINT || "https://isortagimapi.pazarama.com";
        const merchantId = process.env.PAZARAMA_MERCHANT_ID || "";
        const apiKey = process.env.PAZARAMA_API_KEY || "";
        const url = `${endpoint}/merchants/${merchantId}/products?page=1&pageSize=1`;

        const response = await requestJson<any>({
            method: "GET",
            url,
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });

        console.log("HTTP status:", response.status);
        console.log("HTTP raw:", response.raw || "(empty)");
    }
}

main().catch((err) => {
    console.error("Pazarama test failed:", err);
    process.exitCode = 1;
});
