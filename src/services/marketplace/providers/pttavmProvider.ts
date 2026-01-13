import {
  MarketplaceActionResult,
  MarketplaceConfigStatus,
  MarketplaceListResult,
  MarketplaceListing,
  MarketplaceOrder,
  MarketplaceOrderResult,
  MarketplaceProductPayload,
  MarketplaceTokenStatus,
  MarketplaceUpdatePayload,
} from "../types.js";
import { getProviderConfigStatus, logMarketplaceEvent } from "../../../config.js";
import { logger } from "../../../logger.js";
import { BaseMarketplaceProvider } from "./baseProvider.js";
import { ok, fail, Result } from "../../../utils/result.js";
import { XMLParser } from "fast-xml-parser";
import * as nodeCrypto from "node:crypto";

// ============================================================
// PttavmProvider Implementation
// ============================================================

export class PttavmProvider extends BaseMarketplaceProvider {
  name = "PttAVM" as const;
  private credentials?: Record<string, string>;
  private xmlParser: XMLParser;

  constructor() {
    super();
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      removeNSPrefix: true,
    });
  }

  private getAuth() {
    const username = process.env.PTTAVM_USERNAME;
    const password = process.env.PTTAVM_PASSWORD;
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

  async refreshToken(): Promise<Result<MarketplaceActionResult>> {
    return fail(new Error("PttAVM uses username/password. Token refresh is not supported."));
  }

  async listListings(params?: {
    status?: "active" | "inactive";
    barcode?: string;
    page?: number;
    shopId?: number;
    size?: number;
  }): Promise<Result<MarketplaceListResult>> {
    if (!this.isConfigured()) {
      const nc = this.notConfigured("listListings");
      return ok({ status: nc.status, message: nc.message, items: [] });
    }

    try {
      const barcode = params?.barcode || "";
      const shopId = params?.shopId || 0;
      const maxPages = 100; // Safety limit - PttAVM pages can have 1000 items so 100 pages = 100k max
      const allItems: MarketplaceListing[] = [];
      let currentPage = params?.page || 1;
      let hasMore = true;

      logger.info("pttavm.listListings.starting", { barcode, shopId });

      while (hasMore && currentPage <= maxPages) {
        const soapAction = "http://tempuri.org/IService/StokKontrolListesi";
        const soapBody = `
          <tem:StokKontrolListesi>
            <tem:ShopId>${shopId}</tem:ShopId>
            ${barcode ? `<tem:SearchBarkod>${barcode}</tem:SearchBarkod>` : ""}
            <tem:SearchPage>${currentPage}</tem:SearchPage>
          </tem:StokKontrolListesi>
        `;

        const result = await this.soapRequest(soapAction, soapBody);

        if (result.status !== "ok") {
          if (currentPage === 1) {
            return ok({ status: "failed", items: [], message: result.message });
          }
          break;
        }

        const pageItems = this.parseListingsFromResponse(result.data as string);
        allItems.push(...pageItems);

        // Log progress for large fetches
        if (currentPage % 10 === 0) {
          logger.info("pttavm.listListings.progress", { 
            page: currentPage, 
            fetched: allItems.length 
          });
        }

        currentPage++;
        // PttAVM returns ~1000 items per page
        hasMore = pageItems.length >= 900;
      }

      logMarketplaceEvent(this.name, "listListings", {
        status: "ok",
        message: `Fetched ${allItems.length} products from ${currentPage - 1} pages`,
      });

      return ok({
        status: "ok",
        items: allItems,
        message: `${allItems.length} ürün (${currentPage - 1} sayfa)`,
      });

    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      logger.error("pttavm.listListings.exception", { error: error.message });
      return fail(error);
    }
  }

  /**
   * Parse listings from SOAP XML response
   */
  private parseListingsFromResponse(xmlData: string): any[] {
    try {
      const parsed = this.xmlParser.parse(xmlData);
      
      const envelope = parsed.Envelope || parsed;
      const body = envelope.Body || envelope;
      const response = body.StokKontrolListesiResponse;
      const result = response?.StokKontrolListesiResult;

      logger.debug("pttavm.parseListings.structure", { 
        hasEnvelope: !!parsed.Envelope,
        hasBody: !!body,
        hasResponse: !!response,
        hasResult: !!result,
        resultKeys: result ? Object.keys(result) : []
      });

      if (!result) {
        logger.debug("pttavm.parseListings.no_result", { xmlSnippet: xmlData.substring(0, 500) });
        return [];
      }

      // Products are under StokKontrolDetay
      let urunler = result.StokKontrolDetay || result.StokKontrolData || result.Urunler || [];
      if (!Array.isArray(urunler)) urunler = [urunler];

      return urunler.map((u: Record<string, any>) => {
        const kdvsiz = parseFloat(u.KDVsiz) || 0;
        const kdvli = parseFloat(u.KDVli) || 0;
        const price = kdvli > 0 ? kdvli : kdvsiz;

        const images = [u.Resim1Url, u.Resim2Url, u.Resim3Url].filter(url => url && url.length > 5);

        return {
          barcode: String(u.Barkod || ""),
          sku: String(u.UrunKodu || u.Barkod || ""),
          name: String(u.UrunAdi || ""),
          price,
          stock: parseInt(u.Miktar) || 0,
          currency: "TRY",
          isActive: String(u.Aktif).toLowerCase() === "true" || u.Durum === "Mevcut",
          marketplace: "PttAVM",
          /* Rich Data */
          brand: String(u.Marka || ""),
          category: String(u.AltKategoriAdi || u.TedarikciAltKategoriAdi || ""),
          description: String(u.UzunAciklama || u.Aciklama || ""),
          imageUrl: images[0],
          images: images,
          attributes: {
            brand: String(u.Marka || ""),
            category: String(u.AltKategoriAdi || ""),
            subCategory: String(u.AltKategoriAdi_2 || ""),
            condition: String(u.Durum || ""),
            vatRate: String(u.KDV || "20")
          },
          variants: []
        };
      }).filter((p: any) => p.barcode || p.title);
    } catch (e: unknown) {
      logger.error("pttavm.parseListings.error", { error: e });
      return [];
    }
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
  }): Promise<Result<MarketplaceOrderResult>> {
    if (!this.isConfigured()) {
      const nc = this.notConfigured("getNewOrders");
      return ok({ status: nc.status, message: nc.message, orders: [] });
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
        return ok({ status: "failed", orders: [], message: result.message });
      }

      // Parse XML response
      const orders = this.parseOrdersFromResponse(result.data as string, useV2);

      logMarketplaceEvent(this.name, "getNewOrders", {
        status: "ok",
        message: `Fetched ${orders.length} orders`,
      });

      return ok({
        status: "ok",
        orders,
        message: `${orders.length} sipariş çekildi`,
      });

    } catch (e: unknown) {
      logger.error("pttavm.getNewOrders.exception", { error: e });
      return fail(e instanceof Error ? e : new Error(String(e)));
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

      return siparisler.map((s: unknown) => this.normalizeOrder(s as Record<string, any>));

    } catch (e: unknown) {
      logger.error("pttavm.parseOrders.error", { error: e });
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
      items: (items as any[]),
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

  async upsertProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("upsertProduct"));

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

    try {
      const result = await this.soapRequest("http://tempuri.org/IService/UrunKayit", `<tem:UrunKayit>${body}</tem:UrunKayit>`);
      return ok(result);
    } catch (e: any) {
      return fail(e);
    }
  }

  async updateListing(payload: MarketplaceUpdatePayload): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("updateListing"));

    const body = `
      <tem:stokFiyat>
        <ptt:Barkod>${payload.barcode}</ptt:Barkod>
        ${payload.price !== undefined ? `<ptt:Fiyat>${payload.price}</ptt:Fiyat>` : ""}
        ${payload.stock !== undefined ? `<ptt:Stok>${payload.stock}</ptt:Stok>` : ""}
      </tem:stokFiyat>
    `;

    try {
      const result = await this.soapRequest("http://tempuri.org/IService/StokFiyatGuncelle", `<tem:StokFiyatGuncelle>${body}</tem:StokFiyatGuncelle>`);
      return ok(result);
    } catch (e: any) {
      return fail(e);
    }
  }

  async syncFromProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
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
    const nonce = nodeCrypto.randomBytes(16).toString("base64");

    // WS-Security Password Digest
    const sha1 = nodeCrypto.createHash("sha1");
    sha1.update(Buffer.from(nonce, "base64"));
    sha1.update(Buffer.from(created, "utf8"));
    // sha1.update(Buffer.from(auth.password, "utf8"));
    // const passwordDigest = sha1.digest("base64");

    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" xmlns:ptt="http://schemas.datacontract.org/2004/07/PttAVM.Services.DTO">
  <soapenv:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
      <wsse:UsernameToken wsu:Id="UsernameToken-1">
        <wsse:Username>${auth.username}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${auth.password}</wsse:Password>
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

      logMarketplaceEvent(this.name, soapAction.split("/").pop() || "unknown", {
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

    } catch (err: unknown) {
      logger.error("pttavm.soapRequest.exception", { error: err });
      return { status: "failed", message: String(err) };
    }
  }
}
