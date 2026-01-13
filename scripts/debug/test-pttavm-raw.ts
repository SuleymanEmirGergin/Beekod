import "../../env.js";
import crypto from "crypto";

async function testPttAVMRaw() {
    const username = process.env.PTTAVM_USERNAME || "";
    const password = process.env.PTTAVM_PASSWORD || "";
    
    console.log("PttAVM Username:", username ? username.substring(0, 5) + "..." : "MISSING");
    console.log("PttAVM Password:", password ? "****" : "MISSING");
    
    if (!username || !password) {
        console.log("Missing credentials!");
        return;
    }
    
    const url = "https://ws.pttavm.com:93/service.svc";
    const soapAction = "http://tempuri.org/IService/StokKontrolListesi";
    
    // WS-Security setup
    const created = new Date().toISOString();
    const nonce = crypto.randomBytes(16).toString("base64");
    const sha1 = crypto.createHash("sha1");
    sha1.update(Buffer.from(nonce, "base64"));
    sha1.update(Buffer.from(created, "utf8"));
    sha1.update(Buffer.from(password, "utf8"));
    const passwordDigest = sha1.digest("base64");
    
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" xmlns:ptt="http://schemas.datacontract.org/2004/07/PttAVM.Services.DTO">
  <soapenv:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
      <wsse:UsernameToken wsu:Id="UsernameToken-1">
        <wsse:Username>${username}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">${passwordDigest}</wsse:Password>
        <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${nonce}</wsse:Nonce>
        <wsu:Created>${created}</wsu:Created>
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

    console.log("\nCalling PttAVM SOAP API...");
    
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
        console.log("\nResponse (first 2000 chars):\n", body.substring(0, 2000));
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

testPttAVMRaw();
