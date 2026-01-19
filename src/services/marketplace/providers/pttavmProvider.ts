import {
  MarketplaceActionResult,
  MarketplaceConfigStatus,
  MarketplaceListResult,
  MarketplaceListing,
  MarketplaceOrder,
  MarketplaceOrderResult,
  MarketplaceProductPayload,
  MarketplaceReviewResult,
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

  async healthCheck(): Promise<AdapterHealthResult> {
    const start = Date.now();
    const checks: Array<{ name: string; ok: boolean; message?: string }> = [];

    const config = this.getConfigStatus();
    const isConfigured = config.configured;
    checks.push({
      name: "Configuration",
      ok: isConfigured,
      message: isConfigured ? "Settings loaded" : `Missing: ${config.missing?.join(", ")}`
    });

    const auth = this.getAuth();
    if (isConfigured) {
        checks.push({ name: "Auth", ok: !!auth, message: auth ? "Creds Present" : "Missing Creds" });
    }

    const configStatus = isConfigured ? "READY" : "NOT_READY";
    const capabilityStatus = "READY";

    const overallStatus = (configStatus === "READY" && capabilityStatus === "READY" && checks.every(c => c.ok))
      ? "READY"
      : (configStatus === "READY" ? "PARTIAL" : "NOT_READY");

    return {
      marketplace: this.name,
      status: overallStatus,
      configStatus,
      capabilityStatus,
      checks,
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString()
    };
  }

  async refreshToken(): Promise<Result<MarketplaceActionResult>> {
    return fail(new Error("PttAVM uses username/password. Token refresh is not supported."));
  }

  async listListings(params?: {
    status?: "active" | "inactive";
    barcode?: string;
    deep?: boolean;
    page?: number;
    pageSize?: number;
    shopId?: number;
  }): Promise<Result<MarketplaceListResult>> {
    if (!this.isConfigured()) {
      const nc = this.notConfigured("listListings");
      return ok({ status: nc.status, message: nc.message, items: [] });
    }

    try {
      const barcode = params?.barcode || "";
      const shopId = params?.shopId || 0;
      const maxPages = 100; // Safety limit
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

        if (currentPage % 10 === 0) {
          logger.info("pttavm.listListings.progress", { 
            page: currentPage, 
            fetched: allItems.length 
          });
        }

        currentPage++;
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

  private parseListingsFromResponse(xmlData: string): MarketplaceListing[] {
    try {
      const parsed = this.xmlParser.parse(xmlData) as Record<string, any>;
      
      const envelope = parsed.Envelope || parsed;
      const body = envelope.Body || envelope;
      const response = body.StokKontrolListesiResponse;
      const result = response?.StokKontrolListesiResult;

      if (!result) {
        return [];
      }

      let urunler = result.StokKontrolDetay || result.StokKontrolData || result.Urunler || [];
      if (!Array.isArray(urunler)) urunler = [urunler];

      return urunler.map((u: Record<string, any>) => {
        const kdvsiz = parseFloat(u.KDVsiz) || 0;
        const kdvli = parseFloat(u.KDVli) || 0;
        const price = kdvli > 0 ? kdvli : kdvsiz;

        const images = [u.Resim1Url, u.Resim2Url, u.Resim3Url].filter(url => url && url.length > 5);

        return {
          barcode: String(u.Barkod || ""),
          title: String(u.UrunAdi || ""),
          price,
          stock: parseInt(u.Miktar) || 0,
          currency: "TRY",
          active: String(u.Aktif).toLowerCase() === "true" || u.Durum === "Mevcut",
          marketplace: this.name,
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
      }).filter((p: MarketplaceListing) => p.barcode || p.title);
    } catch (e: unknown) {
      logger.error("pttavm.parseListings.error", { error: String(e) });
      return [];
    }
  }

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
      const endDate = params?.endDate || this.formatDate(new Date());
      const startDate = params?.startDate || this.formatDate(this.getDateDaysAgo(30));
      const aktifSiparisler = params?.activeOnly ? 1 : 0;
      const useV2 = params?.useV2 ?? true;
      const orderId = params?.orderId ?? 0;
      const urunKirilim = params?.urunKirilim ? 1 : 0;

      let soapBody: string;
      let soapAction: string;

      if (useV2) {
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
      logger.error("pttavm.getNewOrders.exception", { error: String(e) });
      return fail(e instanceof Error ? e : new Error(String(e)));
    }
  }

  private parseOrdersFromResponse(xmlData: string, isV2: boolean): MarketplaceOrder[] {
    try {
      const parsed = this.xmlParser.parse(xmlData) as Record<string, any>;

      const envelope = parsed?.Envelope || parsed;
      const body = envelope?.Body || envelope;

      const responseKey = isV2 ? "SiparisKontrolListesiV2Response" : "SiparisKontrolListesiResponse";
      const resultKey = isV2 ? "SiparisKontrolListesiV2Result" : "SiparisKontrolListesiResult";

      const response = body?.[responseKey];
      const result = response?.[resultKey];

      if (!result) {
        return [];
      }

      let siparisler = result?.Siparisler || result?.Siparis || result;

      if (!siparisler) return [];

      if (!Array.isArray(siparisler)) {
        siparisler = [siparisler];
      }

      return siparisler.map((s: unknown) => this.normalizeOrder(s as Record<string, any>));

    } catch (e: unknown) {
      logger.error("pttavm.parseOrders.error", { error: String(e) });
      return [];
    }
  }

  private normalizeOrder(s: Record<string, any>): MarketplaceOrder {
    const urunler = s.Urunler || s.UrunListesi || s.Urun || [];
    const items = (Array.isArray(urunler) ? urunler : [urunler])
      .filter((u: Record<string, any> | undefined) => u)
      .map((u: Record<string, any>) => ({
        barcode: String(u.Barkod || u.UrunKodu || ""),
        sku: String(u.StokKodu || u.Barkod || ""),
        name: String(u.UrunAdi || ""),
        quantity: parseInt(u.Adet) || 1,
        unitPrice: parseFloat(u.BirimFiyat) || 0,
        totalPrice: parseFloat(u.ToplamFiyat) || parseFloat(u.BirimFiyat) * (parseInt(u.Adet) || 1) || 0,
        status: String(u.Durum || "Beklemede"),
      }));

    return {
      orderNumber: String(s.SiparisNo || s.SiparisId || ""),
      orderId: String(s.SiparisId || s.SiparisNo || ""),
      marketplace: this.name,
      orderDate: String(s.SiparisTarihi || s.Tarih || ""),
      totalAmount: parseFloat(s.ToplamTutar) || items.reduce((sum: number, i) => sum + i.totalPrice, 0),
      currency: "TRY",
      status: String(s.SiparisDurumu || s.Durum || "Beklemede"),
      statusCode: s.DurumKodu,
      customer: {
        name: String(s.MusteriAdi || `${s.Ad || ""} ${s.Soyad || ""}`).trim(),
        email: s.Email,
        phone: s.Telefon || s.CepTelefon,
      },
      shippingAddress: {
        fullAddress: String(s.Adres || s.TeslimatAdresi || ""),
        city: String(s.Il || s.Sehir || ""),
        district: String(s.Ilce || ""),
        postalCode: String(s.PostaKodu || ""),
      },
      cargoInfo: {
        cargoCompany: s.KargoFirma,
        trackingNumber: s.KargoTakipNo,
      },
      items,
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getDateDaysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

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
    } catch (e: unknown) {
      return fail(e instanceof Error ? e : new Error(String(e)));
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
    } catch (e: unknown) {
      return fail(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async syncFromProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
    return this.upsertProduct(payload);
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  private async soapRequest(soapAction: string, contentXml: string): Promise<MarketplaceActionResult> {
    const auth = this.getAuth();
    if (!auth) return { status: "not_configured", message: "Missing auth" };

    const url = "https://ws.pttavm.com:93/service.svc";

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

      return {
        status: res.ok ? "ok" : "failed",
        message: res.ok ? "Success" : `HTTP ${res.status}`,
        data: text
      };

    } catch (err: unknown) {
      logger.error("pttavm.soapRequest.exception", { error: String(err) });
      return { status: "failed", message: String(err) };
    }
  }

  protected notConfigured(op: string): MarketplaceActionResult {
    const result = {
      status: "not_configured",
      message: `${this.name} provider is not configured for ${op}. Missing ${this.getConfigStatus().missing?.join(", ")}`,
    } satisfies MarketplaceActionResult;
    logMarketplaceEvent(this.name, op, {
      status: result.status,
      message: result.message,
    });
    return result;
  }

  /**
   * Get price competition data
   * Note: PttAVM SOAP API doesn't provide a direct competitor pricing endpoint
   */
  async getPriceCompetition(barcodes: string[]): Promise<Result<{ barcode: string; lowestPrice: number; winningSeller?: string; competitorCount?: number }[]>> {
    if (!this.isConfigured()) return fail(new Error("Not configured"));
    if (!barcodes || barcodes.length === 0) return ok([]);

    try {
      const results: { barcode: string; lowestPrice: number; winningSeller?: string; competitorCount?: number }[] = [];

      for (const barcode of barcodes) {
        // We use our own listing data as fallback
        const listResult = await this.listListings({ barcode });
        
        if (!listResult.ok || listResult.value.items.length === 0) {
          results.push({ barcode, lowestPrice: 0, competitorCount: 0 });
          continue;
        }

        const ourListing = listResult.value.items[0];
        
        results.push({
          barcode,
          lowestPrice: ourListing.price,
          winningSeller: "CurrentSeller",
          competitorCount: 1
        });
      }

      logMarketplaceEvent(this.name, "getPriceCompetition", {
        status: "ok",
        message: `Analyzed ${barcodes.length} products`
      });

      return ok(results);
    } catch (error: unknown) {
      return fail(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get product reviews
   */
  async getProductReviews(barcode: string): Promise<Result<MarketplaceReviewResult>> {
    if (!this.isConfigured()) return fail(new Error("Not configured"));
    if (!barcode) return fail(new Error("Barcode required"));

    logMarketplaceEvent(this.name, "getProductReviews", {
      status: "ok",
      message: `Reviews not directly accessible via SOAP API for ${barcode}`
    });

    return ok({
      status: "ok",
      message: "PttAVM yorum API'si SOAP üzerinden erişilebilir değil",
      reviews: []
    });
  }
}
