import fs from "fs/promises";
import { isMarketplaceDryRun } from "./config.js";
import { logMarketplaceEvent } from "./logger.js";
import { MarketplaceListing } from "../types.js";
import { requestJson } from "./httpClient.js";
import {
  MarketplaceActionResult,
  MarketplaceListResult,
  MarketplaceProductPayload,
  MarketplaceUpdatePayload,
} from "./types.js";
import { BaseMarketplaceProvider } from "./baseProvider.js";

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

export class TrendyolProvider extends BaseMarketplaceProvider {
  name = "Trendyol" as const;

  async refreshToken(): Promise<MarketplaceActionResult> {
    return {
      status: "failed",
      message: "Trendyol uses API key/secret. Token refresh is not supported.",
    };
  }

  async upsertProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
    if (!this.isConfigured()) {
      return this.notConfigured("upsertProduct");
    }

    let defaults: TrendyolProductDefaults = {};
    try {
      defaults = await this.loadProductDefaults();
    } catch (error) {
      const message = error instanceof Error ? error.message : "product_defaults_invalid";
      return { status: "failed", message };
    }

    const payloadImages = this.normalizeImages(payload.images);
    const images = payloadImages ?? defaults.images;
    const missingDefaults = this.getMissingUpsertDefaults(defaults, Boolean(images?.length));
    if (missingDefaults.length) {
      return {
        status: "not_configured",
        message: `missing_product_defaults: ${missingDefaults.join(", ")}`,
      };
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
    const body = {
      items,
    };

    return this.request("POST", path, body, payload.barcode);
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

  async updateListing(payload: MarketplaceUpdatePayload): Promise<MarketplaceActionResult> {
    if (!this.isConfigured()) {
      return this.notConfigured("updateListing");
    }
    if (!payload.barcode) {
      return { status: "failed", message: "barcode_required" };
    }
    if (payload.price == null && payload.stock == null && payload.active == null) {
      return { status: "failed", message: "price_or_stock_required" };
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

    const result = await this.request("POST", path, body, payload.barcode);
    return result;
  }

  async syncFromProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
    if (!this.isConfigured()) {
      return this.notConfigured("syncFromProduct");
    }
    return this.updateListing({
      barcode: payload.barcode,
      price: payload.price,
      stock: payload.stock,
      title: payload.name,
    });
  }

  async listListings(params?: { status?: "active" | "inactive"; barcode?: string }): Promise<MarketplaceListResult> {
    if (!this.isConfigured()) {
      return {
        status: "not_configured",
        message: `${this.name} provider not configured for listListings.`,
        items: [],
      };
    }
    if (isMarketplaceDryRun()) {
      return {
        status: "ok",
        message: "dry_run",
        items: [],
      };
    }
    const path = process.env.TRENDYOL_PRODUCT_LIST_PATH ?? "";
    if (!path) {
      return {
        status: "not_configured",
        message: "TRENDYOL_PRODUCT_LIST_PATH is missing.",
        items: [],
      };
    }

    const response = await this.requestRaw("GET", path);
    if (!response.ok) {
      return { status: response.status, message: response.message, items: [] };
    }

    const items = this.mapListingItems(response.data);
    const filtered = items.filter((item) => {
      if (params?.barcode && item.barcode.toLowerCase() !== params.barcode.toLowerCase()) {
        return false;
      }
      if (params?.status === "active") {
        return item.active;
      }
      if (params?.status === "inactive") {
        return !item.active;
      }
      return true;
    });
    return { status: "ok", message: response.message, items: filtered };
  }

  async getNewOrders(params?: { startDate?: string; endDate?: string }): Promise<any> {
    if (!this.isConfigured()) {
      return { status: "not_configured", message: "Trendyol not configured", orders: [] };
    }

    // Trendyol Order Fetching Docs: https://developers.trendyol.com/tr/siparis-entegrasyonu/siparisleri-cekme
    // Path: /suppliers/{supplierId}/orders
    const supplierId = process.env.TRENDYOL_SUPPLIER_ID ?? "";
    let path = `/suppliers/${supplierId}/orders`;

    // Add query parameters if provided
    const queryParams: string[] = [];
    if (params?.startDate) queryParams.push(`startDate=${new Date(params.startDate).getTime()}`);
    if (params?.endDate) queryParams.push(`endDate=${new Date(params.endDate).getTime()}`);
    if (queryParams.length) path += `?${queryParams.join("&")}`;

    const response = await this.requestRaw("GET", path);
    if (!response.ok) {
      return { status: response.status, message: response.message, orders: [] };
    }

    // Map Trendyol orders to our internal MarketplaceOrder format
    const trendyolOrders = (response.data as any)?.content || [];
    const mappedOrders = trendyolOrders.map((order: any) => ({
      marketplace: this.name,
      orderNumber: order.orderNumber,
      customerName: `${order.customerFirstName} ${order.customerLastName}`,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      customerAddress: `${order.shipmentAddress.address1} ${order.shipmentAddress.address2 || ""}, ${order.shipmentAddress.city}, ${order.shipmentAddress.district}`,
      items: order.lines.map((line: any) => ({
        sku: line.merchantSku,
        barcode: line.barcode,
        name: line.productName,
        price: line.salesCampaignId > 0 ? line.discountedPrice : line.price,
        quantity: line.quantity,
      })),
      totalAmount: order.totalPrice,
      currency: order.currencyCode || "TRY",
      orderDate: new Date(order.orderDate).toISOString(),
      status: order.orderStatus,
    }));

    return {
      status: "ok",
      message: `Synced ${mappedOrders.length} orders`,
      orders: mappedOrders,
    };
  }

  async getBatchRequestResult(batchRequestId: string): Promise<MarketplaceActionResult> {
    if (!this.isConfigured()) {
      return this.notConfigured("getBatchRequestResult");
    }
    const trimmed = batchRequestId.trim();
    if (!trimmed) {
      return { status: "failed", message: "batch_request_id_required" };
    }

    const supplierId = process.env.TRENDYOL_SUPPLIER_ID ?? "";
    const sellerId = process.env.TRENDYOL_SELLER_ID ?? supplierId;
    const path =
      process.env.TRENDYOL_BATCH_REQUEST_RESULT_PATH ??
      "https://apigw.trendyol.com/integration/product/sellers/{sellerId}/products/batch-requests/{batchRequestId}";
    const endpoint = path
      .replace("{supplierId}", supplierId)
      .replace("{sellerId}", sellerId)
      .replace("{batchRequestId}", encodeURIComponent(trimmed));

    const response = await this.requestRaw("GET", endpoint);
    if (!response.ok) {
      return { status: response.status, message: response.message, data: response.data };
    }
    return {
      status: "ok",
      message: response.message,
      requestId: response.requestId,
      data: response.data,
    };
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
    const listings: MarketplaceListing[] = [];
    for (const entry of rawItems) {
      if (!entry || typeof entry !== "object") {
        continue;
      }
      const item = entry as Record<string, unknown>;
      const barcode =
        this.normalizeString(item.barcode) ??
        this.normalizeString(item.stockCode) ??
        this.normalizeString(item.productMainId);
      if (!barcode) {
        continue;
      }
      const price =
        this.normalizeNumber(item.salePrice) ??
        this.normalizeNumber(item.listPrice) ??
        this.normalizeNumber(item.price) ??
        0;
      const stock =
        this.normalizeNumber(item.quantity) ??
        this.normalizeNumber(item.stock) ??
        this.normalizeNumber(item.availableStock) ??
        0;
      const currency = this.normalizeString(item.currencyType) ?? this.normalizeString(item.currency) ?? "TRY";
      const title =
        this.normalizeString(item.title) ??
        this.normalizeString(item.productName) ??
        this.normalizeString(item.name) ??
        barcode;
      const active =
        this.normalizeBoolean(item.onSale) ??
        this.normalizeBoolean(item.approved) ??
        this.normalizeBoolean(item.isActive) ??
        true;

      listings.push({
        marketplace: this.name,
        barcode,
        price: Number.isFinite(price) ? price : 0,
        stock: Number.isFinite(stock) ? Math.trunc(stock) : 0,
        currency,
        title,
        active,
      });
    }
    return listings;
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
      logMarketplaceEvent({
        provider: this.name,
        action: "request",
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
      const response = await requestJson<TrendyolResponse | Record<string, unknown> | string>({
        method,
        url,
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          "User-Agent": userAgent,
        },
        body: body != null && method !== "GET" ? body : undefined,
        timeoutMs,
        retry,
        rateLimit,
        circuitBreaker,
        metrics: { target: `marketplace:${this.name}` },
      });

      const parsed = response.data && typeof response.data === "object" ? (response.data as TrendyolResponse) : null;

      if (!response.ok) {
        const cfRay = response.headers["cf-ray"];
        const cfCache = response.headers["cf-cache-status"];
        const cfMeta = cfRay || cfCache ? ` cf-ray=${cfRay ?? "-"} cf-cache=${cfCache ?? "-"}` : "";
        const message = (parsed?.errorMessage || response.raw || `HTTP ${response.status}`) + cfMeta;
        logMarketplaceEvent({
          provider: this.name,
          action: "request",
          status: "failed",
          message,
          barcode,
        });
        return { ok: false, status: "failed", message, data: response.data ?? response.raw };
      }

      const requestId = parsed?.batchRequestId;
      const message = parsed?.errorMessage || "ok";
      const result = {
        ok: true,
        status: "ok" as const,
        message,
        requestId,
        data: response.data ?? response.raw,
      };

      logMarketplaceEvent({
        provider: this.name,
        action: "request",
        status: result.status,
        message: result.message,
        barcode,
        requestId,
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "request_failed";
      logMarketplaceEvent({
        provider: this.name,
        action: "request",
        status: "failed",
        message,
        barcode,
      });
      return { ok: false, status: "failed", message };
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
