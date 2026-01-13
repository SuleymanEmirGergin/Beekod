import "../../env.js";

async function testBothAPIs() {
    // === HEPSIBURADA ===
    console.log("=== HEPSIBURADA ===");
    const hbMerchantId = process.env.HEPSIBURADA_MERCHANT_ID || "";
    const hbUsername = process.env.HEPSIBURADA_API_USERNAME || "";
    const hbPassword = process.env.HEPSIBURADA_API_PASSWORD || "";
    
    console.log("MerchantID:", hbMerchantId ? hbMerchantId.substring(0, 10) + "..." : "MISSING");
    console.log("Username:", hbUsername || "MISSING (will fallback to MerchantID)");
    console.log("Password:", hbPassword ? "****" : "MISSING");
    
    const hbUser = hbUsername || hbMerchantId;
    const hbAuth = Buffer.from(`${hbUser}:${hbPassword}`).toString("base64");
    const hbUrl = `https://listing-external.hepsiburada.com/listings/merchantid/${hbMerchantId}?offset=0&limit=5`;
    
    console.log("\nUsing Auth User:", hbUser.substring(0, 10) + "...");
    console.log("Calling:", hbUrl);
    
    try {
        const hbRes = await fetch(hbUrl, {
            headers: {
                "Accept": "application/json",
                "Authorization": `Basic ${hbAuth}`,
                "User-Agent": "BeekodIntegration"
            }
        });
        console.log("Status:", hbRes.status, hbRes.statusText);
        const hbBody = await hbRes.text();
        console.log("Response:", hbBody.substring(0, 500));
    } catch (e: any) {
        console.error("HB Error:", e.message);
    }
    
    // === PTTAVM ===
    console.log("\n\n=== PTTAVM ===");
    const pttUsername = process.env.PTTAVM_USERNAME || "";
    const pttPassword = process.env.PTTAVM_PASSWORD || "";
    
    console.log("Username:", pttUsername);
    console.log("Password:", pttPassword ? "****" : "MISSING");
    
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soapenv:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>${pttUsername}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${pttPassword}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <tem:StokKontrolListesi>
      <tem:ShopId>0</tem:ShopId>
      <tem:SearchKategoriId>0</tem:SearchKategoriId>
      <tem:SearchAltKategoriId>0</tem:SearchAltKategoriId>
      <tem:SearchUrunAdi></tem:SearchUrunAdi>
      <tem:SearchBarkod></tem:SearchBarkod>
      <tem:SearchAktifPasif>1</tem:SearchAktifPasif>
      <tem:SearchMevcut>2</tem:SearchMevcut>
      <tem:SearchTedarikciKategoriId>0</tem:SearchTedarikciKategoriId>
      <tem:SearchYeniKategoriId>0</tem:SearchYeniKategoriId>
      <tem:SearchPage>1</tem:SearchPage>
    </tem:StokKontrolListesi>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
        const pttRes = await fetch("https://ws.pttavm.com:93/service.svc", {
            method: "POST",
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                "SOAPAction": "http://tempuri.org/IService/StokKontrolListesi"
            },
            body: soapEnvelope
        });
        
        console.log("Status:", pttRes.status, pttRes.statusText);
        const pttBody = await pttRes.text();
        
        // Count products
        const productCount = (pttBody.match(/<a:Barkod>/g) || []).length;
        console.log("Products found in response:", productCount);
        
        if (productCount > 0) {
            console.log("\nFirst product preview:");
            const firstProduct = pttBody.match(/<a:StokKontrolData>([\s\S]*?)<\/a:StokKontrolData>/);
            if (firstProduct) console.log(firstProduct[0].substring(0, 800));
        } else {
            console.log("\nFull response:", pttBody.substring(0, 1500));
        }
    } catch (e: any) {
        console.error("PttAVM Error:", e.message);
    }
}

testBothAPIs();
