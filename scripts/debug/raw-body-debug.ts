import "../../env.js";

async function rawDebug() {
    // HB
    const mid = process.env.HEPSIBURADA_MERCHANT_ID || "";
    const user = process.env.HEPSIBURADA_API_USERNAME || "";
    const pass = process.env.HEPSIBURADA_API_PASSWORD || "";
    const hbAuth = Buffer.from(`${user}:${pass}`).toString("base64");
    
    console.log("=== HB RAW ===");
    try {
        const r = await fetch(`https://listing-external.hepsiburada.com/listings/merchantid/${mid}?offset=0&limit=1`, {
            headers: { "Authorization": `Basic ${hbAuth}`, "Accept": "application/json" }
        });
        console.log("Status:", r.status);
        console.log("Body:", await r.text());
    } catch (e: any) { console.error(e.message); }

    // PttAVM
    const pUsername = process.env.PTTAVM_USERNAME || "";
    const pPassword = process.env.PTTAVM_PASSWORD || "";
    const soap = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soapenv:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>${pUsername}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${pPassword}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body><tem:StokKontrolListesi><tem:ShopId>0</tem:ShopId><tem:SearchPage>1</tem:SearchPage></tem:StokKontrolListesi></soapenv:Body>
</soapenv:Envelope>`;

    console.log("\n=== PTTAVM RAW ===");
    try {
        const r = await fetch("https://ws.pttavm.com:93/service.svc", {
            method: "POST",
            headers: { "Content-Type": "text/xml; charset=utf-8", "SOAPAction": "http://tempuri.org/IService/StokKontrolListesi" },
            body: soap
        });
        console.log("Status:", r.status);
        console.log("Body:", await r.text());
    } catch (e: any) { console.error(e.message); }
}

rawDebug();
