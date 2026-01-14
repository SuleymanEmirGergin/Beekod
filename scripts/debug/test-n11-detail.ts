import "dotenv/config";
import { XMLParser } from "fast-xml-parser";

async function testDetail() {
    const auth = {
        appKey: process.env.N11_API_KEY,
        appSecret: process.env.N11_API_SECRET
    };

    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas">
  <soapenv:Header/>
  <soapenv:Body>
    <sch:GetProductBySellerCodeRequest>
      <auth>
        <appKey>${auth.appKey}</appKey>
        <appSecret>${auth.appSecret}</appSecret>
      </auth>
      <sellerCode>BGAJHAV-4328</sellerCode>
    </sch:GetProductBySellerCodeRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

    const res = await fetch("https://api.n11.com/ws/productService/", {
        method: "POST",
        headers: { "Content-Type": "text/xml; charset=utf-8" },
        body: soapBody
    });

    const raw = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, trimValues: true });
    const doc = parser.parse(raw);
    const body = doc?.Envelope?.Body ?? doc?.Body ?? doc;
    const resp = body?.GetProductBySellerCodeResponse || body?.getProductBySellerCodeResponse;
    const product = resp?.product;

    console.log("=== DETAILED PRODUCT DATA ===");
    console.log(JSON.stringify(product, null, 2));
}

testDetail().catch(console.error);
