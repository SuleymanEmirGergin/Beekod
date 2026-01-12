import "dotenv/config";
import { getProviderConfigStatus, isMarketplaceDryRun } from "./config.js";
import { XMLParser } from "fast-xml-parser";
import { logMarketplaceEvent } from "./logger.js";
import {
  MarketplaceActionResult,
  MarketplaceConfigStatus,
  MarketplaceListResult,
  MarketplaceListing,
  MarketplaceProductPayload,
  MarketplaceProvider,
  MarketplaceOrderResult,
  MarketplaceTokenStatus,
  MarketplaceUpdatePayload,
} from "./types.js";

export class N11Provider implements MarketplaceProvider {
  name = "N11" as const;
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

  private getAuth(): { appKey: string; appSecret: string } | null {
    const appKey = this.pickCred(["N11_API_KEY", "appKey", "apiKey"]);
    const appSecret = this.pickCred(["N11_API_SECRET", "appSecret", "apiSecret"]);
    if (!appKey || !appSecret) return null;
    return { appKey, appSecret };
  }

  getConfigStatus(): MarketplaceConfigStatus {
    const baseStatus = getProviderConfigStatus(this.name);
    const auth = this.getAuth();
    const apiBase = this.pickCred(["N11_API_BASE", "N11_API_ENDPOINT", "apiBase"]);

    const missing: string[] = [];
    if (!apiBase) missing.push("N11_API_BASE");
    if (!auth?.appKey) missing.push("N11_API_KEY");
    if (!auth?.appSecret) missing.push("N11_API_SECRET");

    const configured = missing.length === 0;
    return Object.assign({}, baseStatus, { configured, missing });
  }

  getTokenStatus(): MarketplaceTokenStatus {
    return this.isConfigured() ? { status: "unknown" } : { status: "missing" };
  }

  isConfigured() {
    return this.getConfigStatus().configured;
  }

  async refreshToken(): Promise<MarketplaceActionResult> {
    return { status: "failed", message: "N11 uses API key. Token refresh is not supported." };
  }

  async upsertProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
    if (!this.isConfigured()) return this.notConfigured("upsertProduct");
    const auth = this.getAuth();
    if (!auth) return { status: "not_configured", message: "Missing credentials" };

    const soapBody = this.buildProductSaveRequest({
      barcode: payload.barcode,
      title: payload.name,
      price: payload.price,
      stock: payload.stock,
      categoryId: parseInt(this.pickCred(["N11_CATEGORY_ID", "categoryId"]) || "0", 10),
      brandId: parseInt(this.pickCred(["N11_BRAND_ID", "brandId"]) || "0", 10),
    });
    return this.soapRequest("SaveProduct", soapBody, payload.barcode);
  }

  async updateListing(payload: MarketplaceUpdatePayload): Promise<MarketplaceActionResult> {
    if (!this.isConfigured()) return this.notConfigured("updateListing");
    const auth = this.getAuth();
    if (!auth) return { status: "not_configured", message: "Missing credentials" };

    const soapBody = this.buildPriceStockUpdateRequest({
      productId: payload.barcode,
      price: payload.price,
      stock: payload.stock,
    });
    return this.soapRequest("UpdateStockByStockSellerCode", soapBody, payload.barcode);
  }

  async syncFromProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
    return this.updateListing(payload);
  }

  async listListings(params?: { status?: "active" | "inactive"; barcode?: string }): Promise<MarketplaceListResult> {
    if (!this.isConfigured()) return { status: "not_configured", items: [], message: "N11 not configured" };
    const auth = this.getAuth();
    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas">
  <soapenv:Header/>
  <soapenv:Body>
    <sch:GetProductListRequest>
      <auth>
        <appKey>${this.escapeXml(auth!.appKey)}</appKey>
        <appSecret>${this.escapeXml(auth!.appSecret)}</appSecret>
      </auth>
      <pagingData><currentPage>0</currentPage><pageSize>100</pageSize></pagingData>
    </sch:GetProductListRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

    const response = await this.soapRequest("GetProductList", soapBody);
    if (response.status !== "ok") return { status: response.status, message: response.message, items: [] };

    const xml = (response as any)?.data;
    const doc = this.parseSoapXml(xml);
    const body = this.getSoapBody(doc);
    const resp = this.pickFirst<any>(body, ["GetProductListResponse", "getProductListResponse"]);
    const products = this.asArray<any>(resp?.products?.product ?? resp?.products?.products?.product);

    const currency = (process.env.N11_CURRENCY || "TRY");
    let items: MarketplaceListing[] = products.map(p => ({
      marketplace: this.name,
      barcode: p.productSellerCode || p.sellerStockCode,
      title: p.title || "",
      price: this.toNumber(p.salePrice) || 0,
      stock: this.toNumber(p.stockItems?.stockItem?.quantity) || 0,
      active: true, // simplified
      currency
    })).filter(x => !!x.barcode);

    return { status: "ok", items, message: "Success" };
  }

  async getNewOrders(params?: { startDate?: string; endDate?: string }): Promise<MarketplaceOrderResult> {
    if (!this.isConfigured()) return { status: "not_configured", orders: [], message: "N11 not configured" };

    const auth = this.getAuth();
    if (!auth) return { status: "not_configured", orders: [], message: "Missing N11 credentials" };

    // Standard SOAP Request for N11 DetailedOrderList
    // We typically ask for "New" (Paid) or "Approved" orders.
    // Status strings: "New", "Approved", "Rejected", "Shipped", "Delivered", "Completed"
    // We'll ask for 'Approved' (Paid orders waiting for shipment)
    
    // Date Filtering? usually standard N11 allows search by status primarily for fulfillment.
    
    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas">
   <soapenv:Header/>
   <soapenv:Body>
      <sch:DetailedOrderListRequest>
         <auth>
            <appKey>${this.escapeXml(auth.appKey)}</appKey>
            <appSecret>${this.escapeXml(auth.appSecret)}</appSecret>
         </auth>
         <searchData>
            <status>Approved</status> 
         </searchData>
         <pagingData>
            <currentPage>0</currentPage>
            <pageSize>100</pageSize>
         </pagingData>
      </sch:DetailedOrderListRequest>
   </soapenv:Body>
</soapenv:Envelope>`;

    const response = await this.soapRequest("DetailedOrderList", soapBody);
    if (response.status !== "ok" || !response.data) {
         return { status: "failed", message: response.message || "Failed to fetch N11 orders", orders: [] };
    }

    try {
        const xml = response.data as string;
        const doc = this.parseSoapXml(xml);
        const body = this.getSoapBody(doc);
        const resp = this.pickFirst<any>(body, ["DetailedOrderListResponse", "detailedOrderListResponse"]);
        
        let orderList = this.asArray<any>(resp?.orderList?.order);
        
        const orders = orderList.map((o: any) => {
             const items = this.asArray<any>(o.itemList?.item).map((item: any) => ({
                 sku: item.sellerStockCode || item.productId,
                 barcode: item.productSellerCode || item.sellerStockCode,
                 name: item.productName,
                 price: Number(item.price || 0),
                 quantity: Number(item.quantity || 1)
             }));

             return {
                 marketplace: this.name,
                 orderNumber: o.orderNumber,
                 customerName: o.buyer?.fullName,
                 customerEmail: o.buyer?.email,
                 customerPhone: o.buyer?.gsmNumber, // N11 specific
                 customerAddress: o.billingAddress?.address || o.shippingAddress?.address,
                 items,
                 totalAmount: Number(o.billingTemplate?.originalPrice || 0), // Typically total
                 currency: "TRY",
                 orderDate: o.createDate, // e.g. "20/12/2023 10:00"
                 status: o.status // "Approved"
             };
        });

        return { status: "ok", message: "ok", orders };

    } catch (e: any) {
        return { status: "failed", message: "Parse error: " + e.message, orders: [] };
    }
  }

  private buildProductSaveRequest(p: any) {
    const auth = this.getAuth();
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas">
  <soapenv:Header/>
  <soapenv:Body>
    <sch:SaveProductRequest>
      <auth>
        <appKey>${this.escapeXml(auth!.appKey)}</appKey>
        <appSecret>${this.escapeXml(auth!.appSecret)}</appSecret>
      </auth>
      <product>
        <productSellerCode>${this.escapeXml(p.barcode)}</productSellerCode>
        <title>${this.escapeXml(p.title)}</title>
        <category><id>${p.categoryId}</id></category>
        <salePrice>${p.price}</salePrice>
        <brand><id>${p.brandId}</id></brand>
        <stockItems><stockItem><quantity>${p.stock}</quantity><sellerStockCode>${this.escapeXml(p.barcode)}</sellerStockCode></stockItem></stockItems>
      </product>
    </sch:SaveProductRequest>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  private buildPriceStockUpdateRequest(p: any) {
    const auth = this.getAuth();
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas">
  <soapenv:Header/>
  <soapenv:Body>
    <sch:UpdateStockByStockSellerCodeRequest>
      <auth>
        <appKey>${this.escapeXml(auth!.appKey)}</appKey>
        <appSecret>${this.escapeXml(auth!.appSecret)}</appSecret>
      </auth>
      <stockItems><stockItem>
          <sellerStockCode>${this.escapeXml(p.productId)}</sellerStockCode>
          ${p.stock != null ? `<quantity>${p.stock}</quantity>` : ""}
          ${p.price != null ? `<optionPrice>${p.price}</optionPrice>` : ""}
      </stockItem></stockItems>
    </sch:UpdateStockByStockSellerCodeRequest>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  private async soapRequest(action: string, body: string, barcode?: string): Promise<MarketplaceActionResult> {
    const endpoint = this.resolveSoapEndpoint(action);
    if (isMarketplaceDryRun()) return { status: "ok", message: "dry_run" };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/xml; charset=utf-8" },
        body
      });
      const raw = await res.text();
      return { status: res.ok ? "ok" : "failed", message: res.ok ? "ok" : raw, data: raw } as any;
    } catch (e: any) {
      return { status: "failed", message: e.message };
    }
  }

  private resolveSoapEndpoint(action: string): string {
    const base = this.pickCred(["N11_API_BASE", "N11_API_ENDPOINT", "apiBase"]) || "https://api.n11.com";
    const service = action.toLowerCase().includes("order") ? "orderService" : "productService";
    return `${base.replace(/\/$/, "")}/ws/${service}/`;
  }

  private escapeXml(str: string): string {
    return String(str || "").replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c] || c));
  }

  private parseSoapXml(xml: string): any {
    return new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, trimValues: true }).parse(xml);
  }

  private getSoapBody(doc: any): any { return doc?.Envelope?.Body ?? doc?.Body ?? doc; }

  private asArray<T>(v: any): T[] { return v ? (Array.isArray(v) ? v : [v]) : []; }

  private pickFirst<T>(obj: any, keys: string[]): T | undefined {
    for (const k of keys) { if (obj && obj[k] != null) return obj[k]; }
    return undefined;
  }

  private toNumber(v: any): number | undefined {
    const n = parseFloat(String(v).replace(/\./g, "").replace(",", "."));
    return isNaN(n) ? undefined : n;
  }

  private notConfigured(action: string): MarketplaceActionResult {
    return { status: "not_configured", message: `N11 not configured for ${action}` };
  }

  async createProductTask(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
    const auth = this.getAuth();
    if (!auth) return { status: "not_configured", message: "Missing auth" };
    const body = {
      productSellerCode: payload.barcode,
      title: payload.name,
      price: payload.price,
      currencyType: payload.currency || "TL",
      images: payload.images?.map(url => ({ url })),
      stockItems: [{ quantity: payload.stock, sellerStockCode: payload.barcode }],
      category: { id: parseInt(this.pickCred(["N11_CATEGORY_ID", "categoryId"]) || "0", 10) },
    };

    try {
      const res = await fetch("https://api.n11.com/ms/product/tasks/product-create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "appKey": auth.appKey, "appSecret": auth.appSecret },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      return { status: "ok", message: "Task created", data: { taskId: data.taskId || data.result?.taskId } };
    } catch (e: any) { return { status: "failed", message: e.message }; }
  }

  async checkTaskStatus(taskId: string): Promise<MarketplaceActionResult> {
    const auth = this.getAuth();
    if (!auth) return { status: "not_configured", message: "Missing auth" };
    try {
      const res = await fetch(`https://api.n11.com/ms/product/tasks/${taskId}`, {
        method: "GET",
        headers: { "appKey": auth.appKey, "appSecret": auth.appSecret }
      });
      return { status: "ok", message: "Task status retrieved", data: await res.json() };
    } catch (e: any) { return { status: "failed", message: e.message }; }
  }
}
