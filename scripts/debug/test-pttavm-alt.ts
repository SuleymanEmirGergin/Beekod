import "../../env.js";

async function testPttAVMAlt() {
    const username = process.env.PTTAVM_USERNAME || "";
    const password = process.env.PTTAVM_PASSWORD || "";
    
    // WS-Security with PasswordText
    const getAuthHeader = () => `
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>${username}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${password}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>`;

    const methods = [
        "TedarikciAltUrunListesi",
        "TedarikciUrunListesi",
        "GetMagazalarim"
    ];

    for (const method of methods) {
        console.log(`\n--- Trying Method: ${method} ---`);
        const soap = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soapenv:Header>${getAuthHeader()}</soapenv:Header>
  <soapenv:Body><tem:${method}/></soapenv:Body>
</soapenv:Envelope>`;

        try {
            const r = await fetch("https://ws.pttavm.com:93/service.svc", {
                method: "POST",
                headers: { "Content-Type": "text/xml; charset=utf-8", "SOAPAction": `http://tempuri.org/IService/${method}` },
                body: soap
            });
            const text = await r.text();
            console.log("Status:", r.status);
            console.log("Body Snippet:", text.substring(0, 500));
            if (text.includes("Barkod") || text.includes("UrunAdi")) {
                console.log("✅ SUCCESS! Found products with", method);
            }
        } catch (e: any) { console.log("Error:", e.message); }
    }
}

testPttAVMAlt();
