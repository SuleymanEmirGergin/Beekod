import { MarketplaceProvider, MarketplaceConfigStatus, MarketplaceActionResult, MarketplaceProductPayload, MarketplaceTokenStatus, MarketplaceListResult, MarketplaceUpdatePayload } from "./types.js";
import { getProviderConfigStatus } from "./config.js";
import { logMarketplaceEvent } from "./logger.js";
import crypto from "crypto";

export class PttavmProvider implements MarketplaceProvider {
  name = "PttAVM" as const;
  private credentials?: Record<string, any>;

  setCredentials(credentials: Record<string, any>) {
    this.credentials = credentials;
  }

  private pickCred(keys: string[]) {
    if (this.credentials) {
      for (const k of keys) {
        if (this.credentials[k]) return this.credentials[k];
      }
    }
    return this.pickEnv(keys);
  }

  private pickEnv(names: string[]): string | undefined {
    for (const n of names) {
      const v = process.env[n];
      if (v && String(v).trim()) return String(v).trim();
    }
    return undefined;
  }

  private getAuth() {
    const username = this.pickCred(["PTTAVM_USERNAME", "username"]);
    const password = this.pickCred(["PTTAVM_PASSWORD", "password"]);
    if (!username || !password) return null;
    return { username, password };
  }

  getConfigStatus(): MarketplaceConfigStatus {
    const baseStatus = getProviderConfigStatus(this.name);
    const auth = this.getAuth();

    const missing: string[] = [];
    if (!auth?.username) missing.push("PTTAVM_USERNAME");
    if (!auth?.password) missing.push("PTTAVM_PASSWORD");

    return Object.assign({}, baseStatus, { configured: missing.length === 0, missing });
  }

  isConfigured(): boolean {
    return this.getConfigStatus().configured;
  }

  getTokenStatus(): MarketplaceTokenStatus {
    return this.isConfigured() ? { status: "unknown" } : { status: "missing" };
  }

  async refreshToken(): Promise<MarketplaceActionResult> {
    return { status: "failed", message: "Not applicable" };
  }

  async listListings(): Promise<MarketplaceListResult> {
    return { status: "ok", items: [], message: "Not implemented yet" };
  }

  async getNewOrders(): Promise<import("./types.js").MarketplaceOrderResult> {
    return { status: "ok", orders: [], message: "Not implemented yet" };
  }

  async upsertProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
    if (!this.isConfigured()) return { status: "not_configured", message: "Config missing" };
    const body = `
        <product>
            <Barkod>${payload.barcode}</Barkod>
            <UrunAdi>${payload.name}</UrunAdi>
            <Fiyat>${payload.price}</Fiyat>
            <Stok>${payload.stock}</Stok>
            <KdvOran>20</KdvOran>
            <UrunAciklama>${payload.name}</UrunAciklama>
            <Desi>1</Desi>
            <Durum>1</Durum>
            ${payload.images?.length ? `<Resimler>${payload.images.map(url => `<ResimUrl>${url}</ResimUrl>`).join("")}</Resimler>` : ""}
        </product>
      `;
    return this.soapRequest("UrunKayit", body);
  }

  async updateListing(payload: MarketplaceUpdatePayload): Promise<MarketplaceActionResult> {
    if (!this.isConfigured()) return { status: "not_configured", message: "Config missing" };
    const body = `
        <stokFiyat>
            <Barkod>${payload.barcode}</Barkod>
            ${payload.price ? `<Fiyat>${payload.price}</Fiyat>` : ""}
            ${payload.stock ? `<Stok>${payload.stock}</Stok>` : ""}
        </stokFiyat>
      `;
    return this.soapRequest("StokFiyatGuncelle", body);
  }

  async syncFromProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
    return this.upsertProduct(payload);
  }

  private async soapRequest(action: string, contentXml: string): Promise<MarketplaceActionResult> {
    const auth = this.getAuth();
    if (!auth) return { status: "not_configured", message: "Missing auth" };

    const url = "https://ws.pttavm.com:93/service.svc";
    const created = new Date().toISOString();
    const nonce = crypto.randomBytes(16).toString("base64");

    const sha1 = crypto.createHash("sha1");
    sha1.update(Buffer.from(nonce, "base64"));
    sha1.update(Buffer.from(created, "utf8"));
    sha1.update(Buffer.from(auth.password, "utf8"));
    const passwordDigest = sha1.digest("base64");

    const soapEnv = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" xmlns:ptt="http://schemas.datacontract.org/2004/07/PttAVM.Services.DTO">
   <soapenv:Header>
      <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
         <wsse:UsernameToken wsu:Id="UsernameToken-1">
            <wsse:Username>${auth.username}</wsse:Username>
            <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">${passwordDigest}</wsse:Password>
            <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soul-string-1.0#Base64Binary">${nonce}</wsse:Nonce>
            <wsu:Created>${created}</wsu:Created>
         </wsse:UsernameToken>
      </wsse:Security>
   </soapenv:Header>
   <soapenv:Body><tem:${action}>${contentXml}</tem:${action}></soapenv:Body>
</soapenv:Envelope>`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "SOAPAction": `http://tempuri.org/IService/${action}`
        },
        body: soapEnv
      });

      const text = await res.text();
      logMarketplaceEvent({ provider: this.name, action, status: res.ok ? "ok" : "failed", message: res.ok ? "Success" : text });
      return { status: res.ok ? "ok" : "failed", message: text, data: text } as any;

    } catch (err: any) {
      return { status: "failed", message: err.message };
    }
  }
}
