import { MarketplaceProvider, MarketplaceConfigStatus, MarketplaceActionResult, MarketplaceProductPayload, MarketplaceTokenStatus, MarketplaceListResult, MarketplaceUpdatePayload, MarketplaceOrderResult, MarketplaceOrder } from "./types.js";
import { getProviderConfigStatus } from "./config.js";
import { logMarketplaceEvent } from "./logger.js";
import { logger } from "../logger.js";
import crypto from "crypto";
import { XMLParser } from "fast-xml-parser";

// ============================================================
// PTTAVM ORDER STATUS MAPPING (from documentation)
// ============================================================

const PTTAVM_ORDER_STATUS_MAP: Record<string, string> = {
  "Beklemede": "Beklemede",
  "Onaylandı": "Onaylandı",
  "Kargoya Verildi": "Kargoya Verildi",
  "Teslim Edildi": "Teslim Edildi",
  "İptal": "İptal",
  "İade": "İade",
};

// ============================================================
// PTTAVM PROVIDER
// ============================================================

export class PttavmProvider implements MarketplaceProvider {
  name = "PttAVM" as const;
  private credentials?: Record<string, any>;
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      removeNSPrefix: true,
    });
  }

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
    return { status: "failed", message: "Not applicable - WS-Security based" };
  }

  // ============================================================
  // listListings() - NOT SUPPORTED (Doküman yok)
  // ============================================================
  async listListings(params?: {
    status?: "active" | "inactive";
    barcode?: string;
  }): Promise<MarketplaceListResult> {
    // PttAVM için ürün listeleme endpoint'i sağlanan dokümanda yok
    // Seçenek 1: Unsupported döndür
    logger.warn("pttavm.listListings.not_supported", {
      message: "PttAVM ürün listeleme endpoint'i sağlanan dokümanda yok. PttAVM ürün listeleme servisi/WSDL paylaşılmalı."
    });

    logMarketplaceEvent({
      provider: this.name,
      action: "listListings",
      status: "failed",
      message: "API endpoint not available in documentation",
    });

    return {
      status: "failed",
      items: [],
      message: "PttAVM ürün listeleme API'si desteklenmiyor. Doküman eksik - lütfen PttAVM ürün listeleme servisi/WSDL'si sağlayın."
    };
  }

  // ============================================================
  // getNewOrders() - SOAP SiparisKontrolListesiV2
  // ============================================================
  async getNewOrders(params?: {
    startDate?: string;
    endDate?: string;
    orderId?: number;
    activeOnly?: boolean;
    useV2?: boolean;
    urunKirilim?: boolean;
  }): Promise<MarketplaceOrderResult> {
    if (!this.isConfigured()) {
      return { status: "not_configured", orders: [], message: "Config missing" };
    }

    try {
      // Default date range: last 30 days (max allowed)
      const endDate = params?.endDate || this.formatDate(new Date());
      const startDate = params?.startDate || this.formatDate(this.getDateDaysAgo(30));

      // AktifSiparisler: 1 = kargo bekleyenler, 0 = tüm siparişler
      const aktifSiparisler = params?.activeOnly ? 1 : 0;

      // Use V2 by default (more features)
      const useV2 = params?.useV2 ?? true;
      const orderId = params?.orderId ?? 0;
      const urunKirilim = params?.urunKirilim ? 1 : 0;

      logger.info("pttavm.getNewOrders.request", {
        startDate,
        endDate,
        aktifSiparisler,
        useV2,
        orderId
      });

      let soapBody: string;
      let soapAction: string;

      if (useV2) {
        // SiparisKontrolListesiV2
        soapAction = "http://tempuri.org/IService/SiparisKontrolListesiV2";
        soapBody = `
          <tem:SiparisKontrolListesiV2>
            <tem:BaslangicTarihi>${startDate}</tem:BaslangicTarihi>
            <tem:BitisTarihi>${endDate}</tem:BitisTarihi>
            <tem:AktifSiparisler>${aktifSiparisler}</tem:AktifSiparisler>
            <tem:orderId>${orderId}</tem:orderId>
            <tem:UrunKirilim>${urunKirilim}</tem:UrunKirilim>
          </tem:SiparisKontrolListesiV2>
        `;
      } else {
        // SiparisKontrolListesi (V1)
        soapAction = "http://tempuri.org/IService/SiparisKontrolListesi";
        soapBody = `
          <tem:SiparisKontrolListesi>
            <tem:BaslangicTarihi>${startDate}</tem:BaslangicTarihi>
            <tem:BitisTarihi>${endDate}</tem:BitisTarihi>
            <tem:AktifSiparisler>${aktifSiparisler}</tem:AktifSiparisler>
          </tem:SiparisKontrolListesi>
        `;
      }

      const result = await this.soapRequest(soapAction, soapBody);

      if (result.status !== "ok") {
        return { status: "failed", orders: [], message: result.message };
      }

      // Parse XML response
      const orders = this.parseOrdersFromResponse(result.data as string, useV2);

      logMarketplaceEvent({
        provider: this.name,
        action: "getNewOrders",
        status: "ok",
        message: `Fetched ${orders.length} orders`,
      });

      return {
        status: "ok",
        orders,
        message: `${orders.length} sipariş çekildi`,
      };

    } catch (e: any) {
      logger.error("pttavm.getNewOrders.exception", { error: e.message });
      return { status: "failed", orders: [], message: e.message };
    }
  }

  /**
   * Parse orders from SOAP XML response
   */
  private parseOrdersFromResponse(xmlData: string, isV2: boolean): MarketplaceOrder[] {
    try {
      const parsed = this.xmlParser.parse(xmlData);

      // Navigate to result - structure varies but typically:
      // Envelope > Body > SiparisKontrolListesiResponse > SiparisKontrolListesiResult
      const envelope = parsed?.Envelope || parsed;
      const body = envelope?.Body || envelope;

      const responseKey = isV2 ? "SiparisKontrolListesiV2Response" : "SiparisKontrolListesiResponse";
      const resultKey = isV2 ? "SiparisKontrolListesiV2Result" : "SiparisKontrolListesiResult";

      const response = body?.[responseKey];
      const result = response?.[resultKey];

      if (!result) {
        logger.warn("pttavm.parseOrders.no_result", {
          hasEnvelope: !!envelope,
          hasBody: !!body,
          hasResponse: !!response
        });
        return [];
      }

      // Result could be an array of orders or contain Siparisler array
      let siparisler = result?.Siparisler || result?.Siparis || result;

      if (!siparisler) return [];

      // Ensure array
      if (!Array.isArray(siparisler)) {
        siparisler = [siparisler];
      }

      return siparisler.map((s: any) => this.normalizeOrder(s));

    } catch (e: any) {
      logger.error("pttavm.parseOrders.error", { error: e.message });
      return [];
    }
  }

  /**
   * Normalize PttAVM order to standard format
   */
  private normalizeOrder(s: any): MarketplaceOrder {
    // Extract items from Urunler or UrunListesi
    const urunler = s.Urunler || s.UrunListesi || s.Urun || [];
    const items = (Array.isArray(urunler) ? urunler : [urunler])
      .filter((u: any) => u)
      .map((u: any) => ({
        barcode: u.Barkod || u.UrunKodu,
        sku: u.StokKodu || u.Barkod,
        name: u.UrunAdi,
        quantity: parseInt(u.Adet) || 1,
        unitPrice: parseFloat(u.BirimFiyat) || 0,
        totalPrice: parseFloat(u.ToplamFiyat) || parseFloat(u.BirimFiyat) * parseInt(u.Adet) || 0,
        status: u.Durum || "Beklemede",
      }));

    return {
      orderNumber: s.SiparisNo || s.SiparisId?.toString(),
      orderId: s.SiparisId?.toString() || s.SiparisNo,
      marketplace: "PttAVM",
      orderDate: s.SiparisTarihi || s.Tarih,
      totalAmount: parseFloat(s.ToplamTutar) || items.reduce((sum: number, i: any) => sum + i.totalPrice, 0),
      currency: "TRY",
      status: s.SiparisDurumu || s.Durum || "Beklemede",
      statusCode: s.DurumKodu,
      customer: {
        name: s.MusteriAdi || `${s.Ad || ""} ${s.Soyad || ""}`.trim(),
        email: s.Email,
        phone: s.Telefon || s.CepTelefon,
      },
      shippingAddress: {
        fullAddress: s.Adres || s.TeslimatAdresi,
        city: s.Il || s.Sehir,
        district: s.Ilce,
        postalCode: s.PostaKodu,
      },
      cargoInfo: {
        cargoCompany: s.KargoFirma,
        trackingNumber: s.KargoTakipNo,
      },
      items,
    };
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get date N days ago
   */
  private getDateDaysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  // ============================================================
  // EXISTING METHODS
  // ============================================================

  async upsertProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
    if (!this.isConfigured()) return { status: "not_configured", message: "Config missing" };

    const body = `
      <tem:urun>
        <ptt:Barkod>${payload.barcode}</ptt:Barkod>
        <ptt:UrunAdi>${this.escapeXml(payload.name)}</ptt:UrunAdi>
        <ptt:Fiyat>${payload.price}</ptt:Fiyat>
        <ptt:Stok>${payload.stock}</ptt:Stok>
        <ptt:KdvOran>20</ptt:KdvOran>
        <ptt:UrunAciklama>${this.escapeXml(payload.name)}</ptt:UrunAciklama>
        <ptt:Desi>1</ptt:Desi>
        <ptt:Durum>1</ptt:Durum>
        ${payload.images?.length ? `<ptt:Resimler>${payload.images.map(url => `<ptt:ResimUrl>${url}</ptt:ResimUrl>`).join("")}</ptt:Resimler>` : ""}
      </tem:urun>
    `;

    return this.soapRequest("http://tempuri.org/IService/UrunKayit", `<tem:UrunKayit>${body}</tem:UrunKayit>`);
  }

  async updateListing(payload: MarketplaceUpdatePayload): Promise<MarketplaceActionResult> {
    if (!this.isConfigured()) return { status: "not_configured", message: "Config missing" };

    const body = `
      <tem:stokFiyat>
        <ptt:Barkod>${payload.barcode}</ptt:Barkod>
        ${payload.price !== undefined ? `<ptt:Fiyat>${payload.price}</ptt:Fiyat>` : ""}
        ${payload.stock !== undefined ? `<ptt:Stok>${payload.stock}</ptt:Stok>` : ""}
      </tem:stokFiyat>
    `;

    return this.soapRequest("http://tempuri.org/IService/StokFiyatGuncelle", `<tem:StokFiyatGuncelle>${body}</tem:StokFiyatGuncelle>`);
  }

  async syncFromProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
    return this.upsertProduct(payload);
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * Make SOAP request with WS-Security headers
   */
  private async soapRequest(soapAction: string, contentXml: string): Promise<MarketplaceActionResult> {
    const auth = this.getAuth();
    if (!auth) return { status: "not_configured", message: "Missing auth" };

    const url = "https://ws.pttavm.com:93/service.svc";
    const created = new Date().toISOString();
    const nonce = crypto.randomBytes(16).toString("base64");

    // WS-Security Password Digest
    const sha1 = crypto.createHash("sha1");
    sha1.update(Buffer.from(nonce, "base64"));
    sha1.update(Buffer.from(created, "utf8"));
    sha1.update(Buffer.from(auth.password, "utf8"));
    const passwordDigest = sha1.digest("base64");

    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" xmlns:ptt="http://schemas.datacontract.org/2004/07/PttAVM.Services.DTO">
  <soapenv:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
      <wsse:UsernameToken wsu:Id="UsernameToken-1">
        <wsse:Username>${auth.username}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">${passwordDigest}</wsse:Password>
        <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${nonce}</wsse:Nonce>
        <wsu:Created>${created}</wsu:Created>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    ${contentXml}
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      logger.debug("pttavm.soapRequest", { soapAction, url });

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "SOAPAction": soapAction
        },
        body: soapEnvelope
      });

      const text = await res.text();

      logMarketplaceEvent({
        provider: this.name,
        action: soapAction.split("/").pop() || "unknown",
        status: res.ok ? "ok" : "failed",
        message: res.ok ? "Success" : `HTTP ${res.status}`
      });

      if (!res.ok) {
        logger.error("pttavm.soapRequest.http_error", { status: res.status, body: text.substring(0, 500) });
      }

      return {
        status: res.ok ? "ok" : "failed",
        message: res.ok ? "Success" : `HTTP ${res.status}`,
        data: text
      };

    } catch (err: any) {
      logger.error("pttavm.soapRequest.exception", { error: err.message });
      return { status: "failed", message: err.message };
    }
  }
}
