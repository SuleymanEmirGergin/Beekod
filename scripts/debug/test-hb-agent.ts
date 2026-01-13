import "../../env.js";

async function testHBAgent() {
    console.log("=== Hepsiburada User-Agent Test ===\n");
    
    const merchantId = "5ebd80f7-c313-4ceb-88ce-55663516129e";
    const serviceKey = process.env.HEPSIBURADA_API_KEY;
    const userName = "TeginAcc";
    const userAgent = process.env.HEPSIBURADA_USER_AGENT || "TeginAcc"; // User mentioned this

    const baseUrl = "https://listing-external.hepsiburada.com";
    const path = `/listings/merchantid/${merchantId}`;
    
    // Test both users with User-Agent
    const agents = [userName, "Mozilla/5.0", "Hepsiburada/1.0"];
    
    for (const agent of agents) {
        console.log(`\n📡 Deneniyor User-Agent: ${agent}`);
        const auth = Buffer.from(`${userName}:${serviceKey}`).toString("base64");
        
        try {
            const res = await fetch(`${baseUrl}${path}`, {
                method: "GET",
                headers: {
                    "Authorization": `Basic ${auth}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "User-Agent": agent
                }
            });
            console.log(`   Durum: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.log(`   Yanıt: ${text.substring(0, 150)}`);
        } catch (e: any) {
            console.log(`   ❌ Hata: ${e.message}`);
        }
    }
}

testHBAgent();
