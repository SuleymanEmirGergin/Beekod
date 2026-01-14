import {
  MarketplaceActionResult,
  MarketplaceConfigStatus,
  MarketplaceListResult,
  MarketplaceListing,
  MarketplaceOrderResult,
  MarketplaceProductPayload,
  MarketplaceReviewResult,
  MarketplaceTokenStatus,
  MarketplaceUpdatePayload,
} from "../types.js";
import { getProviderConfigStatus, isMarketplaceDryRun, logMarketplaceEvent } from "../../../config.js";
import { ok, fail, Result } from "../../../utils/result.js";
import { XMLParser } from "fast-xml-parser";

import { BaseMarketplaceProvider } from "./baseProvider.js";
import { n11Service } from "../n11Service.js";

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
      name: payload.name,
      price: payload.price,
      stock: payload.stock,
      currency: payload.currency || "TRY",
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

  async listListings(_params?: { status?: "active" | "inactive"; barcode?: string; deep?: boolean; page?: number; pageSize?: number }): Promise<Result<MarketplaceListResult>> {
    if (!this.isConfigured()) {
      const nc = this.notConfigured("listListings");
      return ok({ status: nc.status, message: nc.message, items: [] });
    }
    
    const auth = this.getAuth();
    const pageSize = _params?.pageSize ?? 100;
    const maxPages = 50; 
    const allItems: MarketplaceListing[] = [];
    let currentPage = _params?.page ?? 0;
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
      const resp = this.pickFirst<any>(body, ["GetProductListResponse", "getProductListResponse"]);
      const products = this.asArray<Record<string, any>>(resp?.products?.product ?? resp?.products?.products?.product);

      const currency = (process.env.N11_CURRENCY || "TRY");
      const pageItems: MarketplaceListing[] = products.map(p => {
        const rawPrice = p.displayPrice || p.price || p.salePrice || 0;
        const price = typeof rawPrice === "number" ? rawPrice : this.toNumber(rawPrice) || 0;
        
        const stockItems = this.asArray<Record<string, any>>(p.stockItems?.stockItem);
        const totalStock = stockItems.reduce((acc, si) => acc + (this.toNumber(si.quantity) || 0), 0);

        const variants = stockItems.length > 1 ? stockItems.map(si => ({
          barcode: String(si.sellerStockCode || si.gtin || p.productSellerCode || ""),
          title: String(p.title || ""),
          price: this.toNumber(si.displayPrice || si.optionPrice) || price,
          stock: this.toNumber(si.quantity) || 0,
          attributes: this.asArray<Record<string, any>>(si.attributes?.attribute).reduce((acc: Record<string, string>, attr) => {
            if (attr.name) acc[attr.name] = String(attr.value || "");
            return acc;
          }, {})
        })) : [];

        let brandName = p.brand?.name || p.brand || "";
        if (!brandName && p.title) {
            brandName = String(p.title).split(" ")[0];
        }
        
        let categoryName = p.category?.name || p.category || "";
        const catId = Number(p.categoryId || p.n11CatalogGroupId);
        if (!categoryName && catId) {
            const cat = n11Service.getCategoryById(catId);
            if (cat) categoryName = cat.name;
        }
        
        if (!categoryName && p.title?.toLowerCase().includes("bagaj havuzu")) {
            categoryName = "Oto Aksesuar > Bagaj Havuzu";
        }

        return {
          marketplace: this.name,
          barcode: String(p.productSellerCode || p.sellerStockCode || ""),
          title: String(p.title || ""),
          price,
          stock: totalStock,
          active: String(p.saleStatus) === "2",
          currency,
          brand: String(brandName),
          category: String(categoryName),
          attributes: {
            brand: String(brandName),
            category: String(categoryName),
            approvalStatus: String(p.approvalStatus || ""),
            n11CatalogGroupId: String(p.n11CatalogGroupId || ""),
            categoryId: String(p.categoryId || "")
          },
          variants
        };
      }).filter(x => !!x.barcode);

      if (_params?.deep) {
        for (const item of pageItems) {
          try {
            const detailRes = await this.getProductDetail(item.barcode);
            if (detailRes.ok && detailRes.value) {
              const detail = detailRes.value;
              const imagesData = (detail.images as Record<string, unknown>)?.image;
              const images = this.asArray<{ url: string }>(imagesData).map((img) => img.url).filter(Boolean);
              if (images.length > 0) {
                item.images = images;
                item.imageUrl = images[0];
              }
              if (detail.description) item.description = String(detail.description);
            }
          } catch {
            // Silently fail for individual items
          }
        }
      }

      allItems.push(...pageItems);

      const pagingData = resp?.pagingData as Record<string, unknown> | undefined;
      const pageCount = Number(pagingData?.pageCount || 1);
      
      currentPage++;
      hasMore = pageItems.length === pageSize && currentPage < pageCount;
    }

    return ok({ status: "ok", items: allItems, message: `${allItems.length} ürün listelendi` });
  }

  async getNewOrders(_params?: { startDate?: string; endDate?: string; status?: string }): Promise<Result<MarketplaceOrderResult>> {
    if (!this.isConfigured()) {
      const nc = this.notConfigured("getNewOrders");
      return ok({ status: nc.status, message: nc.message, orders: [] });
    }

    const auth = this.getAuth();
    if (!auth) return ok({ status: "not_configured", orders: [], message: "Missing N11 credentials" });
    
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
            <status>${_params?.status || "Approved"}</status> 
         </searchData>
         <pagingData>
            <currentPage>0</currentPage>
            <pageSize>100</pageSize>
         </pagingData>
      </sch:DetailedOrderListRequest>
   </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.soapRequest("DetailedOrderList", soapBody);
      if (response.status !== "ok" || !response.data) {
           return ok({ status: "failed", message: response.message || "Failed to fetch N11 orders", orders: [] });
      }

      const xml = response.data as string;
      const doc = this.parseSoapXml(xml);
      const body = this.getSoapBody(doc);
      const resp = this.pickFirst<any>(body, ["DetailedOrderListResponse", "detailedOrderListResponse"]);
      
      const orderList = this.asArray<Record<string, any>>(resp?.orderList?.order);
      
      const orders = orderList.map((o: Record<string, any>) => {
           const items = this.asArray<Record<string, any>>(o.itemList?.item).map((item: Record<string, any>) => ({
               sku: String(item.sellerStockCode || item.productId || ""),
               barcode: String(item.productSellerCode || item.sellerStockCode || ""),
               name: String(item.productName || ""),
               price: Number(item.price || 0),
               quantity: Number(item.quantity || 1)
           }));

           return {
               marketplace: this.name,
               orderNumber: String(o.orderNumber || ""),
               customerName: String(o.buyer?.fullName || ""),
               customerEmail: String(o.buyer?.email || ""),
               customerPhone: String(o.buyer?.gsmNumber || ""),
               customerAddress: String(o.billingAddress?.address || o.shippingAddress?.address || ""),
               items,
               totalAmount: Number(o.billingTemplate?.originalPrice || 0),
               currency: "TRY",
               orderDate: String(o.createDate || ""),
               status: String(o.status || "Approved")
           };
      });

      return ok({ status: "ok", message: "ok", orders });

    } catch (e: unknown) {
        return ok({ status: "failed", message: "Parse error: " + (e instanceof Error ? e.message : String(e)), orders: [] });
    }
  }

  async getOrderDetail(orderNumber: string): Promise<Result<Record<string, any>>> {
    if (!this.isConfigured()) return ok(this.notConfigured("getOrderDetail"));
    const auth = this.getAuth();

    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas">
   <soapenv:Header/>
   <soapenv:Body>
      <sch:OrderDetailRequest>
         <auth>
            <appKey>${this.escapeXml(auth!.appKey)}</appKey>
            <appSecret>${this.escapeXml(auth!.appSecret)}</appSecret>
         </auth>
         <orderNumber>${this.escapeXml(orderNumber)}</orderNumber>
      </sch:OrderDetailRequest>
   </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.soapRequest("OrderDetail", soapBody);
      if (response.status !== "ok" || !response.data) {
          return fail(new Error(response.message || "Failed to fetch N11 order detail"));
      }

      const doc = this.parseSoapXml(response.data as string);
      const body = this.getSoapBody(doc);
      const resp = this.pickFirst<Record<string, any>>(body, ["OrderDetailResponse", "orderDetailResponse"]);
      return ok(resp?.order || {});
    } catch (e: unknown) {
        return fail(new Error("Parse error: " + (e instanceof Error ? e.message : String(e))));
    }
  }

  async approveOrder(orderItemId: string): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("approveOrder"));
    const auth = this.getAuth();

    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas">
   <soapenv:Header/>
   <soapenv:Body>
      <sch:OrderItemAcceptRequest>
         <auth>
            <appKey>${this.escapeXml(auth!.appKey)}</appKey>
            <appSecret>${this.escapeXml(auth!.appSecret)}</appSecret>
         </auth>
         <orderItem>
            <id>${this.escapeXml(orderItemId)}</id>
         </orderItem>
      </sch:OrderItemAcceptRequest>
   </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const resp = await this.soapRequest("OrderItemAccept", soapBody);
      return ok(resp);
    } catch (e: unknown) {
      return fail(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async rejectOrder(orderItemId: string, reason: string): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("rejectOrder"));
    const auth = this.getAuth();

    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas">
   <soapenv:Header/>
   <soapenv:Body>
      <sch:OrderItemRejectRequest>
         <auth>
            <appKey>${this.escapeXml(auth!.appKey)}</appKey>
            <appSecret>${this.escapeXml(auth!.appSecret)}</appSecret>
         </auth>
         <orderItem>
            <id>${this.escapeXml(orderItemId)}</id>
         </orderItem>
         <rejectReason>${this.escapeXml(reason)}</rejectReason>
      </sch:OrderItemRejectRequest>
   </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const resp = await this.soapRequest("OrderItemReject", soapBody);
      return ok(resp);
    } catch (e: unknown) {
      return fail(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async getProductDetail(sellerCode: string): Promise<Result<Record<string, any>>> {
    if (!this.isConfigured()) return ok(this.notConfigured("getProductDetail"));
    const auth = this.getAuth();

    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas">
   <soapenv:Header/>
   <soapenv:Body>
      <sch:GetProductBySellerCodeRequest>
         <auth>
            <appKey>${this.escapeXml(auth!.appKey)}</appKey>
            <appSecret>${this.escapeXml(auth!.appSecret)}</appSecret>
         </auth>
         <sellerCode>${this.escapeXml(sellerCode)}</sellerCode>
      </sch:GetProductBySellerCodeRequest>
   </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.soapRequest("GetProductBySellerCode", soapBody);
      if (response.status !== "ok" || !response.data) {
          return fail(new Error(response.message || "Failed to fetch N11 product detail"));
      }

      const doc = this.parseSoapXml(response.data as string);
      const body = this.getSoapBody(doc);
      const resp = this.pickFirst<Record<string, unknown>>(body, ["GetProductBySellerCodeResponse", "getProductBySellerCodeResponse"]);
      return ok(resp?.product || {});
    } catch (e: unknown) {
      return fail(new Error("Parse error: " + (e instanceof Error ? e.message : String(e))));
    }
  }

  private buildProductSaveRequest(p: MarketplaceProductPayload & { categoryId: number; brandId: number }) {
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
        <title>${this.escapeXml(p.name)}</title>
        <category><id>${p.categoryId}</id></category>
        <salePrice>${p.price}</salePrice>
        <brand><id>${p.brandId}</id></brand>
        <stockItems><stockItem><quantity>${p.stock}</quantity><sellerStockCode>${this.escapeXml(p.barcode)}</sellerStockCode></stockItem></stockItems>
      </product>
    </sch:SaveProductRequest>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  private buildPriceStockUpdateRequest(p: { productId: string; price?: number; stock?: number }) {
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
      return { status: res.ok ? "ok" : "failed", message: res.ok ? "ok" : raw, data: raw };
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
    const map = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" };
    return String(str || "").replace(/[<>&"']/g, c => map[c as keyof typeof map] || c);
  }

  private parseSoapXml(xml: string): Record<string, any> {
    return new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, trimValues: true }).parse(xml) as Record<string, any>;
  }

  private getSoapBody(doc: Record<string, any>): Record<string, any> { return doc?.Envelope?.Body ?? doc?.Body ?? doc; }

  private asArray<T>(v: unknown): T[] { return v ? (Array.isArray(v) ? v : [v] as unknown as T[]) : []; }

  private pickFirst<T>(obj: Record<string, any>, keys: string[]): T | undefined {
    for (const k of keys) { if (obj && obj[k] != null) return obj[k] as T; }
    return undefined;
  }

  private toNumber(v: unknown): number | undefined {
    const n = parseFloat(String(v).replace(/\./g, "").replace(",", "."));
    return isNaN(n) ? undefined : n;
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
      const data = await res.json() as { taskId?: string; result?: { taskId?: string } };
      return { status: "ok", message: "Task created", data: { taskId: data.taskId || data.result?.taskId } };
    } catch (e: unknown) { return { status: "failed", message: e instanceof Error ? e.message : String(e) }; }
  }

  async checkTaskStatus(taskId: string): Promise<MarketplaceActionResult> {
    const auth = this.getAuth();
    if (!auth) return { status: "not_configured", message: "Missing auth" };
    try {
      const res = await fetch(`https://api.n11.com/ms/product/tasks/${taskId}`, {
        method: "GET",
        headers: { "appKey": auth.appKey, "appSecret": auth.appSecret }
      });
      const data = await res.json() as { totalCount?: number };
      const totalCount = data.totalCount || 0;
      const message = `Task status retrieved. Total items: ${totalCount}`;
      return { status: "ok", message, data };
    } catch (e: unknown) { return { status: "failed", message: e instanceof Error ? e.message : String(e) }; }
  }

  /**
   * Get price competition using SOAP ProductService
   */
  async getPriceCompetition(barcodes: string[]): Promise<Result<{ barcode: string; lowestPrice: number; winningSeller?: string; competitorCount?: number }[]>> {
    if (!this.isConfigured()) return fail(new Error("Not configured"));
    if (!barcodes || barcodes.length === 0) return ok([]);

    const auth = this.getAuth();
    if (!auth) return fail(new Error("Missing auth"));

    try {
      const results: { barcode: string; lowestPrice: number; winningSeller?: string; competitorCount?: number }[] = [];

      for (const barcode of barcodes) {
        const soapBody = `
          <tem:GetProductBySellerCode>
            <tem:auth>
              <n11:appKey>${this.escapeXml(auth.appKey)}</n11:appKey>
              <n11:appSecret>${this.escapeXml(auth.appSecret)}</n11:appSecret>
            </tem:auth>
            <tem:sellerCode>${this.escapeXml(barcode)}</tem:sellerCode>
          </tem:GetProductBySellerCode>
        `;

        const response = await this.soapRequest("GetProductBySellerCode", soapBody);
        
        if (response.status !== "ok" || !response.data) {
          results.push({ barcode, lowestPrice: 0, competitorCount: 0 });
          continue;
        }

        const xml = response.data as string;
        const doc = this.parseSoapXml(xml);
        const body = this.getSoapBody(doc);
        const resp = this.pickFirst<any>(body, ["GetProductBySellerCodeResponse", "getProductBySellerCodeResponse"]);
        const product = resp?.product || resp?.Product;

        if (!product) {
          results.push({ barcode, lowestPrice: 0, competitorCount: 0 });
          continue;
        }

        const price = this.toNumber(product.displayPrice || product.price || product.salePrice) || 0;
        
        results.push({
          barcode,
          lowestPrice: price,
          winningSeller: "CurrentSeller",
          competitorCount: 1 // N11 SOAP API doesn't provide competitor data
        });
      }

      logMarketplaceEvent(this.name, "getPriceCompetition", {
        status: "ok",
        message: `Analyzed ${barcodes.length} products via SOAP`
      });

      return ok(results);
    } catch (error: unknown) {
      return fail(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get product reviews using SOAP
   * Note: N11 SOAP API has limited review support
   */
  async getProductReviews(barcode: string): Promise<Result<MarketplaceReviewResult>> {
    if (!this.isConfigured()) return fail(new Error("Not configured"));
    if (!barcode) return fail(new Error("Barcode required"));

    // N11 SOAP API doesn't provide a standard reviews endpoint
    logMarketplaceEvent(this.name, "getProductReviews", {
      status: "ok",
      message: `Reviews not available in N11 SOAP API for ${barcode}`
    });

    return ok({
      status: "ok",
      message: "N11 SOAP API'si üzerinden yorum verisi mevcut değil",
      reviews: []
    });
  }
}
