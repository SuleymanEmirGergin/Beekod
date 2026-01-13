import {
  MarketplaceActionResult,
  MarketplaceConfigStatus,
  MarketplaceListResult,
  MarketplaceListing,
  MarketplaceOrderResult,
  MarketplaceProductPayload,
  MarketplaceTokenStatus,
  MarketplaceUpdatePayload,
} from "../types.js";
import { getProviderConfigStatus, isMarketplaceDryRun, logMarketplaceEvent } from "../../../config.js";
import { ok, fail, Result } from "../../../utils/result.js";
import { XMLParser } from "fast-xml-parser";

import { BaseMarketplaceProvider } from "./baseProvider.js";

export class N11Provider extends BaseMarketplaceProvider {
  name = "N11" as const;
  private credentials?: Record<string, string | number>;

  setCredentials(credentials: Record<string, string | number>) {
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
    return { appKey: String(appKey), appSecret: String(appSecret) };
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
    const finalStatus = Object.assign({}, baseStatus, { configured, missing });
    logMarketplaceEvent(this.name, "config_check", finalStatus);
    return finalStatus;
  }

  getTokenStatus(): MarketplaceTokenStatus {
    return this.isConfigured() ? { status: "unknown" } : { status: "missing" };
  }

  isConfigured() {
    return this.getConfigStatus().configured;
  }

  async refreshToken(): Promise<Result<MarketplaceActionResult>> {
    return fail(new Error("N11 uses API key. Token refresh is not supported."));
  }

  async upsertProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("upsertProduct"));
    const auth = this.getAuth();
    if (!auth) return ok({ status: "not_configured", message: "Missing credentials" });

    const soapBody = this.buildProductSaveRequest({
      barcode: payload.barcode,
      title: payload.name,
      price: payload.price,
      stock: payload.stock,
      categoryId: parseInt(String(this.pickCred(["N11_CATEGORY_ID", "categoryId"]) || "0"), 10),
      brandId: parseInt(String(this.pickCred(["N11_BRAND_ID", "brandId"]) || "0"), 10),
    });
    try {
      const resp = await this.soapRequest("SaveProduct", soapBody, payload.barcode);
      return ok(resp);
    } catch (e: unknown) {
      return fail(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async updateListing(payload: MarketplaceUpdatePayload): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("updateListing"));
    const auth = this.getAuth();
    if (!auth) return ok({ status: "not_configured", message: "Missing credentials" });

    const soapBody = this.buildPriceStockUpdateRequest({
      productId: payload.barcode,
      price: payload.price,
      stock: payload.stock,
    });
    try {
      const resp = await this.soapRequest("UpdateStockByStockSellerCode", soapBody, payload.barcode);
      return ok(resp);
    } catch (e: unknown) {
      return fail(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async syncFromProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
    return this.upsertProduct(payload);
  }

  async listListings(_params?: { status?: "active" | "inactive"; barcode?: string; size?: number }): Promise<Result<MarketplaceListResult>> {
    if (!this.isConfigured()) {
      const nc = this.notConfigured("listListings");
      return ok({ status: nc.status, message: nc.message, items: [] });
    }
    
    const auth = this.getAuth();
    const pageSize = _params?.size ?? 100;
    const maxPages = 50; // Safety limit
    const allItems: MarketplaceListing[] = [];
    let currentPage = 0;
    let hasMore = true;

    while (hasMore && currentPage < maxPages) {
      const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas">
  <soapenv:Header/>
  <soapenv:Body>
    <sch:GetProductListRequest>
      <auth>
        <appKey>${this.escapeXml(auth!.appKey)}</appKey>
        <appSecret>${this.escapeXml(auth!.appSecret)}</appSecret>
      </auth>
      <pagingData><currentPage>${currentPage}</currentPage><pageSize>${pageSize}</pageSize></pagingData>
    </sch:GetProductListRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

      const response = await this.soapRequest("GetProductList", soapBody);
      if (response.status !== "ok") {
        if (currentPage === 0) {
          return ok({ status: response.status, message: response.message, items: [] });
        }
        break;
      }

      const xml = (response as { data: string })?.data;
      const doc = this.parseSoapXml(xml);
      const body = this.getSoapBody(doc);
      const resp = this.pickFirst<Record<string, any>>(body, ["GetProductListResponse", "getProductListResponse"]);
      const products = this.asArray<Record<string, any>>(resp?.products?.product ?? resp?.products?.products?.product);

      const currency = (process.env.N11_CURRENCY || "TRY");
      const pageItems: MarketplaceListing[] = products.map(p => {
        const rawPrice = p.displayPrice || p.price || p.salePrice || 0;
        const price = typeof rawPrice === "number" ? rawPrice : this.toNumber(rawPrice) || 0;
        
        const rawStock = p.stockItems?.stockItem?.quantity || 0;
        const stock = typeof rawStock === "number" ? rawStock : this.toNumber(rawStock) || 0;

        return {
          marketplace: this.name,
          barcode: p.productSellerCode || p.sellerStockCode,
          title: p.title || "",
          price,
          stock,
          active: String(p.saleStatus) === "2",
          currency,
          brand: p.brand?.name || "",
          category: p.category?.name || "",
          attributes: {
            brand: p.brand?.name || "",
            category: p.category?.name || "",
            approvalStatus: String(p.approvalStatus || "")
          },
          variants: []
        };
      }).filter(x => !!x.barcode);

      allItems.push(...pageItems);

      // Check pagination info
      const pagingData = resp?.pagingData;
      const totalCount = Number(pagingData?.totalCount || 0);
      const pageCount = Number(pagingData?.pageCount || 1);
      
      currentPage++;
      hasMore = pageItems.length === pageSize && currentPage < pageCount;
    }

    return ok({ status: "ok", items: allItems, message: `${allItems.length} ürün (${currentPage} sayfa)` });
  }

  async getNewOrders(_params?: { startDate?: string; endDate?: string }): Promise<Result<MarketplaceOrderResult>> {
    if (!this.isConfigured()) {
      const nc = this.notConfigured("getNewOrders");
      return ok({ status: nc.status, message: nc.message, orders: [] });
    }

    const auth = this.getAuth();
    if (!auth) return ok({ status: "not_configured", orders: [], message: "Missing N11 credentials" });

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
         return ok({ status: "failed", message: response.message || "Failed to fetch N11 orders", orders: [] });
    }

    try {
        const xml = response.data as string;
        const doc = this.parseSoapXml(xml);
        const body = this.getSoapBody(doc);
        const resp = this.pickFirst<any>(body, ["DetailedOrderListResponse", "detailedOrderListResponse"]);
        
        let orderList = this.asArray<any>(resp?.orderList?.order);
        
        const orders = orderList.map((o: Record<string, any>) => {
             const items = this.asArray<Record<string, any>>(o.itemList?.item).map((item: Record<string, any>) => ({
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

        return ok({ status: "ok", message: "ok", orders });

    } catch (e: any) {
        return ok({ status: "failed", message: "Parse error: " + e.message, orders: [] });
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

  private async soapRequest(action: string, body: string, _barcode?: string): Promise<MarketplaceActionResult> {
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
    } catch (e: unknown) {
      return { status: "failed", message: e instanceof Error ? e.message : String(e) };
    }
  }

  private resolveSoapEndpoint(action: string): string {
    const base = String(this.pickCred(["N11_API_BASE", "N11_API_ENDPOINT", "apiBase"]) || "https://api.n11.com");
    const service = action.toLowerCase().includes("order") ? "orderService" : "productService";
    return `${base.replace(/\/$/, "")}/ws/${service}/`;
  }

  private escapeXml(str: string): string {
    return String(str || "").replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c] || c));
  }

  private parseSoapXml(xml: string): Record<string, any> {
    return new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, trimValues: true }).parse(xml);
  }

  private getSoapBody(doc: Record<string, any>): any { return doc?.Envelope?.Body ?? doc?.Body ?? doc; }

  private asArray<T>(v: any): T[] { return v ? (Array.isArray(v) ? v : [v]) : []; }

  private pickFirst<T>(obj: any, keys: string[]): T | undefined {
    for (const k of keys) { if (obj && obj[k] != null) return obj[k]; }
    return undefined;
  }

  private toNumber(v: any): number | undefined {
    const n = parseFloat(String(v).replace(/\./g, "").replace(",", "."));
    return isNaN(n) ? undefined : n;
  }

  // Removed private notConfigured as it's already protected in BaseMarketplaceProvider

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
      category: { id: parseInt(String(this.pickCred(["N11_CATEGORY_ID", "categoryId"]) || "0"), 10) },
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
