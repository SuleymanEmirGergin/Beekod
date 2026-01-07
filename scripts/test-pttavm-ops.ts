import "../env.js";

type SoapResult = {
  operation: string;
  status: number;
  ok: boolean;
  fault: boolean;
  snippet: string;
};

function buildEnvelope(body: string, user: string, pass: string) {
  return `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:tem="http://tempuri.org/"
                  xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <soapenv:Header>
    <wsse:Security soapenv:mustUnderstand="1">
      <wsse:UsernameToken>
        <wsse:Username>${user}</wsse:Username>
        <wsse:Password>${pass}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    ${body}
  </soapenv:Body>
</soapenv:Envelope>`;
}

async function callSoap(operation: string, body: string, endpoint: string, user: string, pass: string): Promise<SoapResult> {
  const soapAction = `"http://tempuri.org/IService/${operation}"`;
  const payload = buildEnvelope(body, user, pass);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: soapAction
    },
    body: payload
  });

  const text = await response.text();
  const fault = text.includes(":Fault") || text.includes("Fault>");
  const snippet = text.replace(/\s+/g, " ").trim().slice(0, 320);

  return {
    operation,
    status: response.status,
    ok: response.ok,
    fault,
    snippet
  };
}

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

async function main() {
  const endpoint = process.env.PTTAVM_API_ENDPOINT || process.env.PTTAVM_SERVICE_URL || "";
  const user = process.env.PTTAVM_API_USER || "";
  const pass = process.env.PTTAVM_API_PASS || "";

  if (!endpoint || !user || !pass) {
    console.log("Missing PTTAVM config:", {
      endpoint: endpoint ? "ok" : "missing",
      user: user ? "ok" : "missing",
      pass: pass ? "ok" : "missing"
    });
    return;
  }

  const operations: Array<{ name: string; body: string }> = [
    { name: "GetVersion", body: "<tem:GetVersion/>" },
    { name: "KullaniciTedarikciBilgisiGetir", body: "<tem:KullaniciTedarikciBilgisiGetir/>" },
    { name: "KategoriListesi", body: "<tem:KategoriListesi/>" },
    { name: "AltKategoriListesi", body: "<tem:AltKategoriListesi/>" },
    { name: "GetMainCategories", body: "<tem:GetMainCategories/>" },
    { name: "GetCategory", body: "<tem:GetCategory><tem:id>0</tem:id></tem:GetCategory>" },
    {
      name: "GetCategoryTree",
      body: "<tem:GetCategoryTree><tem:parent_id xsi:nil=\"true\"/><tem:last_update xsi:nil=\"true\"/></tem:GetCategoryTree>"
    },
    {
      name: "ServiceState",
      body: "<tem:ServiceState><tem:token xsi:nil=\"true\"/></tem:ServiceState>"
    },
    {
      name: "ServiceState_token_user",
      body: `<tem:ServiceState><tem:token>${user}</tem:token></tem:ServiceState>`
    },
    {
      name: "ServiceState_token_pass",
      body: `<tem:ServiceState><tem:token>${pass}</tem:token></tem:ServiceState>`
    },
    {
      name: "StokKontrolListesi",
      body:
        "<tem:StokKontrolListesi>" +
        "<tem:ShopId>0</tem:ShopId>" +
        "<tem:SearchKategoriId>0</tem:SearchKategoriId>" +
        "<tem:SearchAltKategoriId>0</tem:SearchAltKategoriId>" +
        "<tem:SearchUrunAdi xsi:nil=\"true\"/>" +
        "<tem:SearchBarkod xsi:nil=\"true\"/>" +
        "<tem:SearchAktifPasif>0</tem:SearchAktifPasif>" +
        "<tem:SearchMevcut>0</tem:SearchMevcut>" +
        "<tem:SearchTedarikciKategoriId>0</tem:SearchTedarikciKategoriId>" +
        "<tem:SearchYeniKategoriId xsi:nil=\"true\"/>" +
        "<tem:SearchPage>1</tem:SearchPage>" +
        "</tem:StokKontrolListesi>"
    },
    {
      name: "GetProductsWithVariants",
      body: "<tem:GetProductsWithVariants><tem:page>1</tem:page><tem:size>1</tem:size></tem:GetProductsWithVariants>"
    },
    {
      name: "SiparisKontrolListesi",
      body:
        `<tem:SiparisKontrolListesi>` +
        `<tem:BaslangicTarihi>${isoDaysAgo(7)}</tem:BaslangicTarihi>` +
        `<tem:BitisTarihi>${new Date().toISOString()}</tem:BitisTarihi>` +
        `<tem:AktifSiparisler>1</tem:AktifSiparisler>` +
        `</tem:SiparisKontrolListesi>`
    },
    {
      name: "SiparisKontrolListesiV2",
      body:
        `<tem:SiparisKontrolListesiV2>` +
        `<tem:BaslangicTarihi>${isoDaysAgo(7)}</tem:BaslangicTarihi>` +
        `<tem:BitisTarihi>${new Date().toISOString()}</tem:BitisTarihi>` +
        `<tem:AktifSiparisler>1</tem:AktifSiparisler>` +
        `</tem:SiparisKontrolListesiV2>`
    },
    {
      name: "SiparisDetay",
      body: "<tem:SiparisDetay><tem:SiparisNo xsi:nil=\"true\"/></tem:SiparisDetay>"
    },
    {
      name: "KargoBilgiListesi",
      body: "<tem:KargoBilgiListesi><tem:orderId xsi:nil=\"true\"/></tem:KargoBilgiListesi>"
    }
  ];

  for (const op of operations) {
    try {
      const result = await callSoap(op.name, op.body, endpoint, user, pass);
      const marker = result.ok && !result.fault ? "OK" : "FAIL";
      console.log(`[${marker}] ${result.operation} -> HTTP ${result.status}`);
      console.log(result.snippet || "(empty)");
      console.log("----");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`[ERROR] ${op.name}: ${message}`);
      console.log("----");
    }
  }
}

main().catch((err) => {
  console.error("PTTAVM ops test failed:", err);
  process.exitCode = 1;
});
