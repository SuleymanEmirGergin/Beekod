import "dotenv/config";
import { XMLParser } from "fast-xml-parser";

async function inspectN11Raw() {
    const appKey = process.env.N11_API_KEY;
    const appSecret = process.env.N11_API_SECRET;
    
    if (!appKey || !appSecret) {
        console.error("Missing credentials in .env");
        return;
    }

    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas">
  <soapenv:Header/>
  <soapenv:Body>
    <sch:GetProductListRequest>
      <auth>
        <appKey>${appKey}</appKey>
        <appSecret>${appSecret}</appSecret>
      </auth>
      <pagingData><currentPage>0</currentPage><pageSize>3</pageSize></pagingData>
    </sch:GetProductListRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

    console.log("Sending request to N11...");
    const res = await fetch("https://api.n11.com/ws/productService/", {
        method: "POST",
        headers: { "Content-Type": "text/xml; charset=utf-8" },
        body: soapBody
    });

    const raw = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, trimValues: true });
    const doc = parser.parse(raw);
    const body = doc?.Envelope?.Body ?? doc?.Body ?? doc;
    const resp = body?.GetProductListResponse || body?.getProductListResponse;
    const products = resp?.products?.product;

    console.log("=== RAW PRODUCT DATA (First Item) ===");
    if (Array.isArray(products)) {
        console.log(JSON.stringify(products[0], null, 2));
    } else if (products) {
        console.log(JSON.stringify(products, null, 2));
    } else {
        console.log("No products found or different structure:", JSON.stringify(resp, null, 2));
    }
}

inspectN11Raw().catch(console.error);
