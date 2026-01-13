import "../../env.js";

async function testPttAVMPlain() {
    const username = process.env.PTTAVM_USERNAME || "";
    const password = process.env.PTTAVM_PASSWORD || "";
    
    console.log("PttAVM Username:", username || "MISSING");
    console.log("PttAVM Password:", password ? "****" : "MISSING");
    
    if (!username || !password) {
        console.log("Missing credentials!");
        return;
    }
    
    const url = "https://ws.pttavm.com:93/service.svc";
    const soapAction = "http://tempuri.org/IService/StokKontrolListesi";
    
    // Try with PasswordText instead of PasswordDigest
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
      <tem:ShopId>0</tem:ShopId>
      <tem:SearchKategoriId>0</tem:SearchKategoriId>
      <tem:SearchAltKategoriId>0</tem:SearchAltKategoriId>
      <tem:SearchUrunAdi></tem:SearchUrunAdi>
      <tem:SearchBarkod></tem:SearchBarkod>
      <tem:SearchAktifPasif>2</tem:SearchAktifPasif>
      <tem:SearchMevcut>2</tem:SearchMevcut>
      <tem:SearchTedarikciKategoriId>0</tem:SearchTedarikciKategoriId>
      <tem:SearchYeniKategoriId>0</tem:SearchYeniKategoriId>
      <tem:SearchPage>1</tem:SearchPage>
    </tem:StokKontrolListesi>
  </soapenv:Body>
</soapenv:Envelope>`;

    console.log("\nCalling PttAVM SOAP API with PasswordText...");
    
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                "SOAPAction": soapAction
            },
            body: soapEnvelope
        });
        
        console.log("Status:", res.status, res.statusText);
        const body = await res.text();
        
        // Check if contains products
        if (body.includes("Barkod")) {
            console.log("\n✅ Products found in response!");
            console.log("Response preview:", body.substring(0, 1500));
        } else if (body.includes("Fault")) {
            console.log("\n❌ SOAP Fault found");
            console.log("Response:", body.substring(0, 1000));
        } else {
            console.log("\nResponse:", body.substring(0, 1500));
        }
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

testPttAVMPlain();
