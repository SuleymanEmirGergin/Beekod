import "../env.js";
import { requestJson } from "../src/marketplaces/httpClient.js";
import { PttAVMProvider } from "../src/marketplaces/pttavmProvider.js";

async function main() {
    const provider = new PttAVMProvider();
    const status = provider.getConfigStatus();
    if (!provider.isConfigured()) {
        console.log("PttAVM is not configured.");
        console.log("Missing env:", status.missing);
        return;
    }

    const endpoint = process.env.PTTAVM_API_ENDPOINT || "https://api.pttavm.com";
    const apiKey = process.env.PTTAVM_API_KEY || "";
    const url = `${endpoint}/api/products?page=1&pageSize=1`;

    const response = await requestJson<any>({
        method: "GET",
        url,
        headers: {
            Authorization: `Bearer ${apiKey}`
        }
    });

    console.log("PttAVM GET products status:", response.status);
    console.log("Raw:", response.raw || "(empty)");
}

main().catch((err) => {
    console.error("PttAVM test failed:", err);
    process.exitCode = 1;
});
