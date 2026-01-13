import "../../env.js";

async function inspectHBKeys() {
    const mid = process.env.HEPSIBURADA_MERCHANT_ID || "";
    const user = process.env.HEPSIBURADA_API_USERNAME || "";
    const pass = process.env.HEPSIBURADA_API_PASSWORD || "";
    const hbAuth = Buffer.from(`${user}:${pass}`).toString("base64");
    
    try {
        const r = await fetch(`https://listing-external.hepsiburada.com/listings/merchantid/${mid}?offset=0&limit=1`, {
            headers: { "Authorization": `Basic ${hbAuth}`, "Accept": "application/json" }
        });
        const data = await r.json();
        const first = Array.isArray(data) ? data[0] : (data.listings?.[0] || data);
        console.log("=== HB FIRST ITEM KEYS ===");
        console.log(JSON.stringify(Object.keys(first)));
        console.log("=== HB FIRST ITEM PREVIEW ===");
        console.log(JSON.stringify(first, null, 2).substring(0, 1000));
    } catch (e: any) { console.error(e.message); }
}

inspectHBKeys();
