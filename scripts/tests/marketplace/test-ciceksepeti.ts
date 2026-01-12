import "../env.js";
import { requestJson } from "../src/marketplaces/httpClient.js";
import { CiceksepetiProvider } from "../src/marketplaces/ciceksepetiProvider.js";

async function main() {
    const provider = new CiceksepetiProvider();
    const status = provider.getConfigStatus();
    if (!provider.isConfigured()) {
        console.log("Ciceksepeti is not configured.");
        console.log("Missing env:", status.missing);
        return;
    }

    const endpoint = process.env.CICEKSEPETI_API_ENDPOINT || "https://apis.ciceksepeti.com/api/v1";
    const apiKey = process.env.CICEKSEPETI_API_KEY || "";
    const url = `${endpoint}/Products?Page=1&PageSize=1`;

    const response = await requestJson<any>({
        method: "GET",
        url,
        headers: {
            "x-api-key": apiKey,
            accept: "application/json"
        }
    });

    console.log("Ciceksepeti GET products status:", response.status);
    console.log("Raw:", response.raw || "(empty)");
}

main().catch((err) => {
    console.error("Ciceksepeti test failed:", err);
    process.exitCode = 1;
});
