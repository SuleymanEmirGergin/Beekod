import "../../env.js";
import { XMLParser } from "fast-xml-parser";

async function analyzePttAVM() {
    const username = process.env.PTTAVM_USERNAME || "";
    const password = process.env.PTTAVM_PASSWORD || "";
    
    const soap = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soapenv:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>${username}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${password}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body><tem:StokKontrolListesi><tem:ShopId>0</tem:ShopId><tem:SearchPage>1</tem:SearchPage></tem:StokKontrolListesi></soapenv:Body>
</soapenv:Envelope>`;

    try {
        const r = await fetch("https://ws.pttavm.com:93/service.svc", {
            method: "POST",
            headers: { "Content-Type": "text/xml; charset=utf-8", "SOAPAction": "http://tempuri.org/IService/StokKontrolListesi" },
            body: soap
        });
        const xml = await r.text();
        console.log("Status:", r.status);
        
        const parser = new XMLParser({ removeNSPrefix: true });
        const obj = parser.parse(xml);
        
        console.log("--- Object Structure Deep ---");
        // Print recursive structure with keys
        const printStructure = (o: any, depth = 0) => {
            if (depth > 10) return;
            if (o && typeof o === 'object') {
                for (const k of Object.keys(o)) {
                    console.log('  '.repeat(depth) + k + (Array.isArray(o[k]) ? ` [Array(${o[k].length})]` : ''));
                    printStructure(o[k], depth + 1);
                }
            }
        };
        printStructure(obj);
        
        // Save full XML to file for manual inspection if needed
        const fs = await import("fs");
        fs.writeFileSync("pttavm_full_response.xml", xml);
        console.log("\nFull XML saved to pttavm_full_response.xml");

    } catch (e: any) { console.error(e.message); }
}

analyzePttAVM();
