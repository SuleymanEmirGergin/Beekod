import "../../env.js";

async function runHBTests() {
    const results: string[] = [];
    const merchantId = "5ebd80f7-c313-4ceb-88ce-55663516129e";
    const serviceKey = process.env.HEPSIBURADA_API_KEY;
    const userName = "TeginAcc";
    
    const baseUrl = "https://listing-external.hepsiburada.com";
    const path = `/listings/merchantid/${merchantId}`;
    
    const configs = [
        { name: "MerchantID:ServiceKey", u: merchantId, p: serviceKey },
        { name: "TeginAcc:ServiceKey", u: userName, p: serviceKey }
    ];

    for (const config of configs) {
        const auth = Buffer.from(`${config.u}:${config.p}`).toString("base64");
        try {
            const res = await fetch(`${baseUrl}${path}`, {
                method: "GET",
                headers: {
                    "Authorization": `Basic ${auth}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            });
            const text = await res.text();
            results.push(`--- ${config.name} ---`);
            results.push(`Status: ${res.status} ${res.statusText}`);
            results.push(`Body: ${text.substring(0, 100)}...`);
        } catch (e: any) {
            results.push(`--- ${config.name} --- Error: ${e.message}`);
        }
    }

    console.log("FINAL_RESULTS_START");
    console.log(results.join("\n"));
    console.log("FINAL_RESULTS_END");
}

runHBTests();
