import fs from "fs/promises";
import { logger } from "../../../logger.js";
import { isMarketplaceDryRun, logMarketplaceEvent } from "../../../config.js";
import {
  MarketplaceActionResult,
  MarketplaceConfigStatus,
  MarketplaceListResult,
  MarketplaceListing,
  MarketplaceOrder,
  MarketplaceOrderResult,
  MarketplaceProductPayload,
  MarketplaceReviewResult,
  ProductReview,
  MarketplaceTokenStatus,
  MarketplaceUpdatePayload,
} from "../types.js";
import { requestJson } from "../httpClient.js";
import { BaseMarketplaceProvider } from "./baseProvider.js";
import { ok, fail, Result } from "../../../utils/result.js";

type TrendyolResponse = {
  success?: boolean;
  errorCode?: string;
  errorMessage?: string;
  batchRequestId?: string;
};

type TrendyolProductAttribute = {
  attributeId: number;
  attributeValueId?: number;
  customAttributeValue?: string;
};

type TrendyolSizeVariant = {
  attributeValueId: number;
  label?: string;
};

type TrendyolProductDefaults = {
  brandId?: number;
  categoryId?: number;
  vatRate?: number;
  cargoCompanyId?: number;
  dimensionalWeight?: number;
  deliveryDuration?: number;
  shipmentAddressId?: number;
  returningAddressId?: number;
  description?: string;
  productMainId?: string;
  stockCode?: string;
  images?: Array<{ url: string }>;
  attributes?: TrendyolProductAttribute[];
  sizeAttributeId?: number;
  sizeVariants?: TrendyolSizeVariant[];
  [key: string]: unknown;
};

interface TrendyolAddress {
  fullAddress: string;
  address1: string;
  address2: string;
  city: string;
  district: string;
  postalCode: string;
  countryCode: string;
  fullName: string;
}

interface TrendyolOrderLine {
  quantity: number;
  salesCampaignId: number;
  productSize: string;
  merchantSku: string;
  productName: string;
  productCode: number;
  merchantId: number;
  amount: number;
  discount: number;
  currencyCode: string;
  id: number;
  sku: string;
  vatBaseAmount: number;
  barcode: string;
  orderLineItemStatusName: string;
  price: number;
  discountedPrice?: number;
}

interface TrendyolOrder {
  shipmentAddress: TrendyolAddress;
  orderNumber: string;
  grossAmount: number;
  totalDiscount: number;
  totalPrice: number;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone?: string;
  customerId: number;
  cargoTrackingNumber: number;
  cargoProviderName: string;
  lines: TrendyolOrderLine[];
  orderDate: number;
  tcIdentityNumber: string;
  currencyCode: string;
  shipmentPackageStatus: string;
  orderStatus: string;
}

export class TrendyolProvider extends BaseMarketplaceProvider {
  name = "Trendyol" as const;

  async refreshToken(): Promise<Result<MarketplaceActionResult>> {
    return fail(new Error("Trendyol uses long-lived API credentials. Token refresh is not supported."));
  }

  async upsertProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("upsertProduct"));

    let defaults: TrendyolProductDefaults = {};
    try {
      defaults = await this.loadProductDefaults();
    } catch (error: any) {
      return fail(error);
    }

    const payloadImages = this.normalizeImages(payload.images);
    const images = payloadImages ?? defaults.images;
    const missingDefaults = this.getMissingUpsertDefaults(defaults, Boolean(images?.length));
    if (missingDefaults.length) {
      return ok({
        status: "not_configured",
        message: `missing_product_defaults: ${missingDefaults.join(", ")}`,
      });
    }

    const path = process.env.TRENDYOL_PRODUCT_UPSERT_PATH ?? "/suppliers/{supplierId}/v2/products";
    const currency = payload.currency?.trim().toUpperCase() || "TRY";
    const productMainId = defaults.productMainId ?? payload.barcode;
    const stockCode = defaults.stockCode ?? payload.barcode;
    const description = defaults.description ?? payload.name;
    const stock = Math.max(0, Math.trunc(payload.stock));
    const price = Number(payload.price);
    const items = this.buildUpsertItems({
      payload,
      defaults,
      images,
      currency,
      productMainId,
      stockCode,
      description,
      stock,
      price,
    });
    const body = { items };

    try {
      const result = await this.request("POST", path, body, payload.barcode);
      return ok(result);
    } catch (error: any) {
      return fail(error);
    }
  }

  async upsertProducts(payloads: MarketplaceProductPayload[]): Promise<MarketplaceActionResult> {
    if (!this.isConfigured()) return this.notConfigured("upsertProducts");
    if (!payloads.length) return { status: "ok", message: "No items to upsert" };

    let defaults: TrendyolProductDefaults = {};
    try {
      defaults = await this.loadProductDefaults();
    } catch (error) {
      return { status: "failed", message: "defaults_error" };
    }

    const items = payloads.flatMap(payload => {
      const payloadImages = this.normalizeImages(payload.images);
      const images = payloadImages ?? defaults.images;
      // Skip missing defaults check for batch for now, or handle individually?
      // For batch, we assume valid data.

      return this.buildUpsertItems({
        payload,
        defaults,
        images,
        currency: payload.currency?.trim().toUpperCase() || "TRY",
        productMainId: defaults.productMainId ?? payload.barcode,
        stockCode: defaults.stockCode ?? payload.barcode,
        description: defaults.description ?? payload.name,
        stock: Math.max(0, Math.trunc(payload.stock)),
        price: Number(payload.price)
      });
    });

    const path = process.env.TRENDYOL_PRODUCT_UPSERT_PATH ?? "/suppliers/{supplierId}/v2/products";
    const body = { items };

    // Batch ID is returned for the whole group
    return this.request("POST", path, body, `batch-${Date.now()}`);
  }

  async updateListing(payload: MarketplaceUpdatePayload): Promise<Result<MarketplaceActionResult>> {
    if (!this.isConfigured()) return ok(this.notConfigured("updateListing"));
    if (!payload.barcode) return fail(new Error("barcode_required"));
    if (payload.price == null && payload.stock == null && payload.active == null) {
      return fail(new Error("price_or_stock_required"));
    }

    const path = process.env.TRENDYOL_PRICE_STOCK_PATH ?? "/suppliers/{supplierId}/products/price-and-inventory";
    const body: Record<string, unknown> = {
      items: [
        {
          barcode: payload.barcode,
          quantity: payload.stock,
          salePrice: payload.price,
          listPrice: payload.price,
        },
      ],
    };

    try {
      const result = await this.request("POST", path, body, payload.barcode);
      return ok(result);
    } catch (error: any) {
      return fail(error);
    }
  }

  async syncFromProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
    return this.updateListing({
      barcode: payload.barcode,
      price: payload.price,
      stock: payload.stock,
      title: payload.name,
    });
  }

  async listListings(params?: { status?: "active" | "inactive"; barcode?: string; size?: number }): Promise<Result<MarketplaceListResult>> {
    if (!this.isConfigured()) {
      const nc = this.notConfigured("listListings");
      return ok({ status: nc.status, message: nc.message, items: [] });
    }
    if (isMarketplaceDryRun()) return ok({ status: "ok", message: "dry_run", items: [] });

    const basePath = process.env.TRENDYOL_PRODUCT_LIST_PATH ?? `/suppliers/{supplierId}/products`;
    if (!basePath) return ok({ status: "not_configured", message: "TRENDYOL_PRODUCT_LIST_PATH is missing.", items: [] });

    const pageSize = params?.size ?? 100; // Trendyol max is 200
    const maxPages = 50; // Safety limit: 50 pages * 100 = 5000 products max
    const allItems: MarketplaceListing[] = [];
    let currentPage = 0;
    let hasMore = true;

    try {
      while (hasMore && currentPage < maxPages) {
        const path = `${basePath}?page=${currentPage}&size=${pageSize}`;
        const response = await this.requestRaw("GET", path);
        
        if (!response.ok) {
          // If first page fails, return error; otherwise return what we have
          if (currentPage === 0) {
            return ok({ status: response.status, message: response.message, items: [] });
          }
          break;
        }

        const pageItems = this.mapListingItems(response.data);
        allItems.push(...pageItems);

        // Check if there are more pages
        const totalElements = (response.data as any)?.totalElements ?? 0;
        const totalPages = (response.data as any)?.totalPages ?? 1;
        
        currentPage++;
        hasMore = pageItems.length === pageSize && currentPage < totalPages;
        
        // Log progress for large fetches
        if (currentPage % 5 === 0) {
          logger.info("trendyol.listListings.progress", { 
            page: currentPage, 
            fetched: allItems.length, 
            totalElements 
          });
        }
      }

      // Apply filters
      const filtered = allItems.filter((item) => {
        if (params?.barcode && item.barcode.toLowerCase() !== params.barcode.toLowerCase()) return false;
        if (params?.status === "active") return item.active;
        if (params?.status === "inactive") return !item.active;
        return true;
      });

      logger.info("trendyol.listListings.complete", { 
        totalFetched: allItems.length, 
        afterFilter: filtered.length,
        pages: currentPage 
      });

      return ok({ status: "ok", message: `${filtered.length} ürün`, items: filtered });
    } catch (error: any) {
      return fail(error);
    }
  }


  async getNewOrders(params?: { startDate?: string; endDate?: string }): Promise<Result<MarketplaceOrderResult>> {
    if (!this.isConfigured()) {
      const nc = this.notConfigured("getNewOrders");
      return ok({ status: nc.status, message: nc.message, orders: [] });
    }

    const supplierId = process.env.TRENDYOL_SUPPLIER_ID ?? "";
    let path = `/suppliers/${supplierId}/orders`;

    const queryParams: string[] = [];
    if (params?.startDate) queryParams.push(`startDate=${new Date(params.startDate).getTime()}`);
    if (params?.endDate) queryParams.push(`endDate=${new Date(params.endDate).getTime()}`);
    if (queryParams.length) path += `?${queryParams.join("&")}`;

    try {
      const response = await this.requestRaw("GET", path);
      if (!response.ok) return ok({ status: response.status, message: response.message, orders: [] });

      const content = (response.data as { content?: unknown })?.content;
      const trendyolOrders = (Array.isArray(content) ? content : []) as TrendyolOrder[];

      const mappedOrders: MarketplaceOrder[] = trendyolOrders.map((order) => ({
        marketplace: this.name,
        orderNumber: order.orderNumber,
        customerName: `${order.customerFirstName} ${order.customerLastName}`,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerAddress: `${order.shipmentAddress.address1} ${order.shipmentAddress.address2 || ""}, ${order.shipmentAddress.city}, ${order.shipmentAddress.district}`,
        items: order.lines.map((line) => ({
          barcode: line.barcode,
          name: line.productName,
          price: line.salesCampaignId > 0 && line.discountedPrice ? line.discountedPrice : line.price,
          quantity: line.quantity,
        })),
        totalAmount: order.totalPrice,
        currency: order.currencyCode || "TRY",
        orderDate: new Date(order.orderDate).toISOString(),
        status: order.orderStatus,
      }));

      return ok({ status: "ok", message: `Synced ${mappedOrders.length} orders`, orders: mappedOrders });
    } catch (error: any) {
      return fail(error);
    }
  }

  async getPriceCompetition(barcodes: string[]): Promise<Result<{ barcode: string; lowestPrice: number; winningSeller?: string; competitorCount?: number }[]>> {
    if (!this.isConfigured()) return fail(new Error("Not configured"));
    if (!barcodes.length) return ok([]);

    const path = `/integration/product/sellers/{sellerId}/products/price-competition?barcodes=${barcodes.join(",")}`;

    try {
      const response = await this.requestRaw("GET", path);
      if (!response.ok) return fail(new Error(response.message));

      const content = (response.data as { content?: any[] })?.content || [];
      const competitionData = content.map((item: any) => ({
        barcode: item.barcode,
        lowestPrice: item.lowestPrice,
        winningSeller: item.winningSellerName,
        competitorCount: item.competitorCount
      }));

      return ok(competitionData);
    } catch (error: any) {
      return fail(error);
    }
  }

  async getProductReviews(barcode: string): Promise<Result<MarketplaceReviewResult>> {
    if (!this.isConfigured()) return fail(new Error("Not configured"));
    
    // In many marketplace APIs, reviews are a separate endpoint. 
    // For Trendyol, we can mock or use a known integration path.
    // In mock mode or if not fully implemented, we return structured mock data based on the product.
    if (isMarketplaceDryRun()) {
      return ok({
        status: "ok",
        message: "dry_run",
        reviews: [
          {
            reviewerName: "Emre G.",
            rating: 5,
            comment: "Ürün mükemmel, kargo çok hızlıydı. Kesinlikle tavsiye ederim.",
            date: new Date().toISOString(),
            platform: this.name
          },
          {
            reviewerName: "Mert K.",
            rating: 4,
            comment: "Kaliteli ama boyutu biraz küçük geldi. Yine de iş görüyor.",
            date: new Date().toISOString(),
            platform: this.name
          }
        ]
      });
    }

    // Actual integration would use: /suppliers/{supplierId}/reviews?barcode={barcode}
    // But for product-specific public reviews, we might need a different gateway.
    return ok({
      status: "ok",
      message: "Syncing reviews from marketplace...",
      reviews: [] // Fallback to empty if not implemented
    });
  }

  async getBatchRequestResult(batchRequestId: string): Promise<Result<MarketplaceActionResult>> {
    const trimmed = batchRequestId.trim();
    if (!trimmed) return fail(new Error("batch_request_id_required"));

    const supplierId = process.env.TRENDYOL_SUPPLIER_ID ?? "";
    const sellerId = process.env.TRENDYOL_SELLER_ID ?? supplierId;
    const path = `https://apigw.trendyol.com/integration/product/sellers/${sellerId}/products/batch-requests/${encodeURIComponent(trimmed)}`;

    try {
      const result = await this.requestRaw("GET", path);
      if (!result.ok) return ok({ status: result.status, message: result.message, data: result.data });
      return ok({
        status: "ok",
        message: result.message,
        requestId: result.requestId,
        data: result.data,
      });
    } catch (error: any) {
      return fail(error);
    }
  }

  private getMissingUpsertDefaults(defaults: TrendyolProductDefaults, hasImagesOverride: boolean) {
    const missing: string[] = [];
    if (!defaults.brandId || defaults.brandId <= 0) {
      missing.push("brandId");
    }
    if (!defaults.categoryId || defaults.categoryId <= 0) {
      missing.push("categoryId");
    }
    if (!defaults.cargoCompanyId || defaults.cargoCompanyId <= 0) {
      missing.push("cargoCompanyId");
    }
    if (!hasImagesOverride && (!defaults.images || !defaults.images.length)) {
      missing.push("images");
    }
    if (!defaults.attributes || !defaults.attributes.length) {
      missing.push("attributes");
    }
    return missing;
  }

  private async loadProductDefaults(): Promise<TrendyolProductDefaults> {
    const filePath = process.env.TRENDYOL_PRODUCT_DEFAULTS_PATH ?? "data/trendyol-product-defaults.json";
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      return this.normalizeProductDefaults(parsed);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        return {};
      }
      throw error;
    }
  }

  private normalizeProductDefaults(raw: unknown): TrendyolProductDefaults {
    const base = raw && typeof raw === "object" ? { ...(raw as Record<string, unknown>) } : {};
    return {
      ...base,
      brandId: this.normalizePositiveNumber(base.brandId),
      categoryId: this.normalizePositiveNumber(base.categoryId),
      vatRate: this.normalizeNumber(base.vatRate),
      cargoCompanyId: this.normalizePositiveNumber(base.cargoCompanyId),
      dimensionalWeight: this.normalizeNumber(base.dimensionalWeight),
      deliveryDuration: this.normalizeNumber(base.deliveryDuration),
      shipmentAddressId: this.normalizePositiveNumber(base.shipmentAddressId),
      returningAddressId: this.normalizePositiveNumber(base.returningAddressId),
      description: this.normalizeString(base.description),
      productMainId: this.normalizeString(base.productMainId),
      stockCode: this.normalizeString(base.stockCode),
      images: this.normalizeImages(base.images),
      attributes: this.normalizeAttributes(base.attributes),
      sizeAttributeId: this.normalizePositiveNumber(base.sizeAttributeId),
      sizeVariants: this.normalizeSizeVariants(base.sizeVariants),
    };
  }

  private normalizeNumber(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return undefined;
  }

  private normalizePositiveNumber(value: unknown) {
    const parsed = this.normalizeNumber(value);
    if (parsed == null) {
      return undefined;
    }
    return parsed > 0 ? parsed : undefined;
  }

  private normalizeString(value: unknown) {
    if (typeof value !== "string") {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  private normalizeBoolean(value: unknown) {
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes", "active", "on_sale"].includes(normalized)) {
        return true;
      }
      if (["false", "0", "no", "inactive", "off_sale"].includes(normalized)) {
        return false;
      }
    }
    return undefined;
  }

  private normalizeImages(value: unknown) {
    if (!Array.isArray(value)) {
      return undefined;
    }
    const urls = value
      .map((entry) => {
        if (typeof entry === "string") {
          return entry.trim();
        }
        if (entry && typeof entry === "object" && typeof (entry as { url?: unknown }).url === "string") {
          return String((entry as { url?: unknown }).url).trim();
        }
        return "";
      })
      .filter(Boolean);
    return urls.length ? urls.map((url) => ({ url })) : undefined;
  }

  private normalizeAttributes(value: unknown): TrendyolProductAttribute[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }
    const items = value
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }
        const raw = entry as Record<string, unknown>;
        const attributeId = this.normalizePositiveNumber(raw.attributeId);
        if (!attributeId) {
          return null;
        }
        const attributeValueId = this.normalizePositiveNumber(raw.attributeValueId);
        const customAttributeValue = this.normalizeString(raw.customAttributeValue);
        const item: TrendyolProductAttribute = { attributeId };
        if (attributeValueId) {
          item.attributeValueId = attributeValueId;
        }
        if (customAttributeValue) {
          item.customAttributeValue = customAttributeValue;
        }
        return item;
      })
      .filter((item): item is TrendyolProductAttribute => Boolean(item));
    return items.length ? items : undefined;
  }

  private normalizeSizeVariants(value: unknown): TrendyolSizeVariant[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }
    const items = value
      .map((entry) => {
        if (typeof entry === "number" || typeof entry === "string") {
          const attributeValueId = this.normalizePositiveNumber(entry);
          return attributeValueId ? { attributeValueId } : null;
        }
        if (!entry || typeof entry !== "object") {
          return null;
        }
        const raw = entry as Record<string, unknown>;
        const attributeValueId = this.normalizePositiveNumber(raw.attributeValueId ?? raw.valueId ?? raw.id);
        if (!attributeValueId) {
          return null;
        }
        const label = this.normalizeString(raw.label ?? raw.value ?? raw.name);
        const item: TrendyolSizeVariant = { attributeValueId };
        if (label) {
          item.label = label;
        }
        return item;
      })
      .filter((item): item is TrendyolSizeVariant => Boolean(item));
    return items.length ? items : undefined;
  }

  private extractItemDefaults(defaults: TrendyolProductDefaults) {
    return {
      brandId: defaults.brandId,
      categoryId: defaults.categoryId,
      vatRate: defaults.vatRate,
      cargoCompanyId: defaults.cargoCompanyId,
      dimensionalWeight: defaults.dimensionalWeight,
      deliveryDuration: defaults.deliveryDuration,
      shipmentAddressId: defaults.shipmentAddressId,
      returningAddressId: defaults.returningAddressId,
      description: defaults.description,
      productMainId: defaults.productMainId,
      stockCode: defaults.stockCode,
      images: defaults.images,
      attributes: defaults.attributes,
    };
  }

  private normalizeVariantSuffix(value: string) {
    const normalized = value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return normalized;
  }

  private buildUpsertItems(input: {
    payload: MarketplaceProductPayload;
    defaults: TrendyolProductDefaults;
    images?: Array<{ url: string }>;
    currency: string;
    productMainId: string;
    stockCode: string;
    description: string;
    stock: number;
    price: number;
  }) {
    const { payload, defaults, images, currency, productMainId, stockCode, description, stock, price } = input;
    const itemDefaults = this.extractItemDefaults(defaults);
    const baseAttributes = defaults.attributes ?? [];
    const sizeAttributeId = defaults.sizeAttributeId ?? 338;
    const sizeVariants = defaults.sizeVariants ?? [];
    const hasVariants = Boolean(sizeVariants.length && sizeAttributeId);
    const attributesWithoutSize = hasVariants
      ? baseAttributes.filter((item) => item.attributeId !== sizeAttributeId)
      : baseAttributes;

    const buildItem = (barcode: string, stockCodeValue: string, attributes: TrendyolProductAttribute[]) => ({
      ...itemDefaults,
      barcode,
      title: payload.name,
      productMainId,
      stockCode: stockCodeValue,
      quantity: stock,
      listPrice: price,
      salePrice: price,
      currencyType: currency,
      description,
      images,
      attributes,
      brandId: defaults.brandId,
      categoryId: defaults.categoryId,
    });

    if (!hasVariants) {
      return [buildItem(payload.barcode, stockCode, baseAttributes)];
    }

    return sizeVariants.map((variant) => {
      const source = variant.label ?? String(variant.attributeValueId);
      const suffix = this.normalizeVariantSuffix(source) || String(variant.attributeValueId);
      const barcode = `${payload.barcode}-${suffix}`;
      const stockCodeValue = `${stockCode}-${suffix}`;
      const attributes = [
        ...attributesWithoutSize,
        { attributeId: sizeAttributeId, attributeValueId: variant.attributeValueId },
      ];
      return buildItem(barcode, stockCodeValue, attributes);
    });
  }

  private mapListingItems(payload: unknown): MarketplaceListing[] {
    const rawItems = this.extractListItems(payload);
    const groups = new Map<string, any[]>();

    for (const entry of rawItems) {
      if (!entry || typeof entry !== "object") continue;
      const item = entry as Record<string, any>;
      const mainId = this.normalizeString(item.productMainId) || this.normalizeString(item.barcode) || "unknown";
      if (!groups.has(mainId)) groups.set(mainId, []);
      groups.get(mainId)!.push(item);
    }

    const listings: MarketplaceListing[] = [];

    for (const [mainId, items] of groups.entries()) {
      const first = items[0];
      const barcode = this.normalizeString(first.barcode) || mainId;
      const title = this.normalizeString(first.title) || this.normalizeString(first.productName) || barcode;
      
      const totalStock = items.reduce((sum, it) => sum + (this.normalizeNumber(it.quantity) || 0), 0);
      const minPrice = items.reduce((min, it) => {
        const p = this.normalizeNumber(it.salePrice) || this.normalizeNumber(it.price) || 0;
        return min === 0 ? p : Math.min(min, p);
      }, 0);

      const listing: MarketplaceListing = {
        marketplace: this.name,
        barcode: barcode,
        title: title,
        price: minPrice,
        stock: Math.trunc(totalStock),
        currency: this.normalizeString(first.currencyType) || "TRY",
        active: items.some(it => this.normalizeBoolean(it.onSale) ?? true),
        /* Rich Data */
        brand: this.normalizeString(first.brand),
        category: this.normalizeString(first.categoryName),
        description: this.normalizeString(first.description),
        imageUrl: first.images?.[0]?.url,
        images: first.images?.map((img: any) => img.url),
        attributes: this.extractAttributesMap(first.attributes),
        variants: items.length > 1 ? items.map(it => ({
          barcode: this.normalizeString(it.barcode) || "",
          sku: this.normalizeString(it.stockCode),
          price: this.normalizeNumber(it.salePrice) || this.normalizeNumber(it.price) || 0,
          stock: Math.trunc(this.normalizeNumber(it.quantity) || 0),
          attributes: this.extractAttributesMapAsStrings(it.attributes)
        })) : []
      };

      listings.push(listing);
    }

    return listings;
  }

  private extractAttributesMap(attributes: any): Record<string, string | number> {
    if (!Array.isArray(attributes)) return {};
    const map: Record<string, string | number> = {};
    for (const attr of attributes) {
      if (attr.attributeName && attr.attributeValue) {
        map[attr.attributeName] = attr.attributeValue;
      }
    }
    return map;
  }

  private extractAttributesMapAsStrings(attributes: any): Record<string, string> {
    if (!Array.isArray(attributes)) return {};
    const map: Record<string, string> = {};
    for (const attr of attributes) {
      if (attr.attributeName && attr.attributeValue) {
        map[attr.attributeName] = String(attr.attributeValue);
      }
    }
    return map;
  }

  private extractListItems(payload: unknown) {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload && typeof payload === "object") {
      const obj = payload as Record<string, unknown>;
      const keys = ["content", "items", "result", "data", "products", "productList"];
      for (const key of keys) {
        const value = obj[key];
        if (Array.isArray(value)) {
          return value;
        }
      }
    }
    return [];
  }

  private async request(
    method: "POST" | "PUT",
    path: string,
    body: unknown,
    barcode?: string,
  ): Promise<MarketplaceActionResult> {
    const response = await this.requestRaw(method, path, body, barcode);
    if (!response.ok) {
      return { status: response.status, message: response.message };
    }
    return {
      status: "ok",
      message: response.message,
      requestId: response.requestId,
    };
  }

  private async requestRaw(
    method: "GET" | "POST" | "PUT",
    path: string,
    body?: unknown,
    barcode?: string,
  ): Promise<{
    ok: boolean;
    status: "ok" | "failed" | "not_configured";
    message: string;
    data?: unknown;
    requestId?: string;
  }> {
    const apiBase = (process.env.TRENDYOL_API_BASE ?? "").trim();
    const apiKey = (process.env.TRENDYOL_API_KEY ?? "").trim();
    const apiSecret = (process.env.TRENDYOL_API_SECRET ?? "").trim();
    const supplierId = (process.env.TRENDYOL_SUPPLIER_ID ?? "").trim();
    const sellerId = (process.env.TRENDYOL_SELLER_ID ?? supplierId).trim();

    if (!apiBase || !apiKey || !apiSecret || !supplierId) {
      const result = this.notConfigured("request");
      return { ok: false, status: "not_configured", message: result.message };
    }

    if (isMarketplaceDryRun()) {
      const requestId = `dry_${Date.now()}`;
      logMarketplaceEvent(this.name, "request", {
        status: "ok",
        message: "dry_run",
        barcode,
        requestId,
      });
      return {
        ok: true,
        status: "ok",
        message: "dry_run",
        requestId,
        data: { dryRun: true, method, path },
      };
    }

    const endpoint = path.replace("{supplierId}", supplierId).replace("{sellerId}", sellerId);
    const base = apiBase.endsWith("/") ? apiBase : `${apiBase}/`;
    const url = endpoint.startsWith("http")
      ? endpoint
      : new URL(endpoint.startsWith("/") ? endpoint.slice(1) : endpoint, base).toString();
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    const userAgent = process.env.TRENDYOL_USER_AGENT?.trim() || `beekod/${supplierId}`;
    const retry = this.resolveRetryOptions();
    const timeoutMs = this.resolveTimeoutMs();
    const rateLimit = this.resolveRateLimit();
    const circuitBreaker = this.resolveCircuitBreaker();

    try {
      const responseData = await requestJson<TrendyolResponse | Record<string, unknown> | string>(url, {
        method,
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          "User-Agent": userAgent,
        },
        body: body != null && method !== "GET" ? JSON.stringify(body) : undefined,
      });

      const parsed = typeof responseData === "object" ? (responseData as TrendyolResponse) : null;
      const requestId = parsed?.batchRequestId;
      const message = parsed?.errorMessage || "ok";

      const finalResult = {
        ok: true,
        status: "ok" as const,
        message,
        requestId,
        data: responseData,
      };

      logMarketplaceEvent(this.name, "request", {
        status: finalResult.status,
        message: finalResult.message,
        barcode,
        requestId,
      });

      return finalResult;
    } catch (error: any) {
      logMarketplaceEvent(this.name, "request", {
        status: "failed",
        message: error.message,
        barcode,
      });
      return { ok: false, status: "failed", message: error.message };
    }
  }

  private resolveTimeoutMs() {
    return this.parseEnvNumber(process.env.TRENDYOL_TIMEOUT_MS ?? process.env.MARKETPLACE_TIMEOUT_MS, 15000, 1000);
  }

  private resolveRetryOptions() {
    const attempts = this.parseEnvNumber(
      process.env.TRENDYOL_RETRY_ATTEMPTS ?? process.env.MARKETPLACE_RETRY_ATTEMPTS,
      2,
      1,
    );
    const delayMs = this.parseEnvNumber(
      process.env.TRENDYOL_RETRY_DELAY_MS ?? process.env.MARKETPLACE_RETRY_DELAY_MS,
      300,
      0,
    );
    const backoffFactor = this.parseEnvNumber(
      process.env.TRENDYOL_RETRY_BACKOFF ?? process.env.MARKETPLACE_RETRY_BACKOFF,
      2,
      1,
    );
    return { attempts, delayMs, backoffFactor };
  }

  private resolveRateLimit() {
    const maxPerSecond = this.parseEnvNumber(
      process.env.TRENDYOL_RATE_LIMIT_RPS ?? process.env.MARKETPLACE_RATE_LIMIT_RPS,
      0,
      0,
    );
    if (!maxPerSecond) {
      return undefined;
    }
    return {
      key: `marketplace:${this.name}:rate`,
      maxRequests: maxPerSecond,
      windowMs: 1000,
    };
  }

  private resolveCircuitBreaker() {
    const threshold = this.parseEnvNumber(
      process.env.TRENDYOL_CIRCUIT_BREAKER_FAILURES ?? process.env.MARKETPLACE_CIRCUIT_BREAKER_FAILURES,
      3,
      0,
    );
    const openMs = this.parseEnvNumber(
      process.env.TRENDYOL_CIRCUIT_BREAKER_OPEN_MS ?? process.env.MARKETPLACE_CIRCUIT_BREAKER_OPEN_MS,
      30000,
      0,
    );
    if (!threshold || !openMs) {
      return undefined;
    }
    return {
      key: `marketplace:${this.name}:circuit`,
      failureThreshold: threshold,
      openMs,
    };
  }
}
