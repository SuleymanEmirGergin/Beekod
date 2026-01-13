import "../../env.js";

async function clearDebug() {
    const hbMid = process.env.HEPSIBURADA_MERCHANT_ID || "";
    const hbUser = process.env.HEPSIBURADA_API_USERNAME || "";
    const hbPass = process.env.HEPSIBURADA_API_PASSWORD || "";
    const hbAuth = Buffer.from(`${hbUser}:${hbPass}`).toString("base64");
    
    console.log("--- TEST HEPSIBURADA ---");
    try {
        const r = await fetch(`https://listing-external.hepsiburada.com/listings/merchantid/${hbMid}?offset=0&limit=1`, {
            headers: { "Authorization": `Basic ${hbAuth}`, "Accept": "application/json" }
        });
        const text = await r.text();
        console.log("HB Status:", r.status);
        console.log("HB Body Start:", text.substring(0, 300));
    } catch (e: any) { console.log("HB Fetch Error:", e.message); }

    const pUser = process.env.PTTAVM_USERNAME || "";
    const pPass = process.env.PTTAVM_PASSWORD || "";
    const pSoap = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soapenv:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>${pUser}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${pPass}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body><tem:StokKontrolListesi><tem:ShopId>0</tem:ShopId><tem:SearchPage>1</tem:SearchPage></tem:StokKontrolListesi></soapenv:Body>
</soapenv:Envelope>`;

    console.log("\n--- TEST PTTAVM ---");
    try {
        const r = await fetch("https://ws.pttavm.com:93/service.svc", {
            method: "POST",
            headers: { "Content-Type": "text/xml; charset=utf-8", "SOAPAction": "http://tempuri.org/IService/StokKontrolListesi" },
            body: pSoap
        });
        const text = await r.text();
        console.log("PTTAVM Status:", r.status);
        console.log("PTTAVM Body Start:", text.substring(0, 300));
    } catch (e: any) { console.log("PTTAVM Fetch Error:", e.message); }
}

clearDebug();
