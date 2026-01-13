import "../../env.js";

async function testPttAVMDetailed() {
    const username = process.env.PTTAVM_USERNAME || "";
    const password = process.env.PTTAVM_PASSWORD || "";
    
    console.log("PttAVM Username:", username);
    console.log("PttAVM Password:", password ? "****" : "MISSING");
    
    // Try different ShopId values (0, 1, 2, etc.)
    const shopIds = [0, 1, 2];
    
    for (const shopId of shopIds) {
        console.log(`\n=== Testing ShopId: ${shopId} ===`);
        
        const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soapenv:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>${username}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${password}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <tem:StokKontrolListesi>
      <tem:ShopId>${shopId}</tem:ShopId>
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
            const res = await fetch("https://ws.pttavm.com:93/service.svc", {
                method: "POST",
                headers: {
                    "Content-Type": "text/xml; charset=utf-8",
                    "SOAPAction": "http://tempuri.org/IService/StokKontrolListesi"
                },
                body: soapEnvelope
            });
            
            const body = await res.text();
            
            // Count products (look for Barkod tags)
            const barkodCount = (body.match(/<a:Barkod>/g) || []).length;
            const urunAdiCount = (body.match(/<a:UrunAdi>/g) || []).length;
            
            console.log("Status:", res.status);
            console.log("Products (Barkod count):", barkodCount);
            console.log("Products (UrunAdi count):", urunAdiCount);
            
            if (barkodCount > 0 || urunAdiCount > 0) {
                console.log("\n✅ FOUND PRODUCTS!");
                // Show first product
                const firstProduct = body.match(/<a:StokKontrolData>([\s\S]*?)<\/a:StokKontrolData>/);
                if (firstProduct) {
                    console.log("First product preview:", firstProduct[0].substring(0, 500));
                }
                break; // Found it, no need to try more shopIds
            }
            
        } catch (e: any) {
            console.log("Error:", e.message);
        }
    }
    
    // Also try GetMagazalarim to see available shops
    console.log("\n\n=== Trying to get Shop list (GetMagazalarim) ===");
    const shopListEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soapenv:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>${username}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${password}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <tem:GetMagazalarim/>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
        const res = await fetch("https://ws.pttavm.com:93/service.svc", {
            method: "POST",
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                "SOAPAction": "http://tempuri.org/IService/GetMagazalarim"
            },
            body: shopListEnvelope
        });
        
        const body = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", body.substring(0, 800));
    } catch (e: any) {
        console.log("Error:", e.message);
    }
}

testPttAVMDetailed();
