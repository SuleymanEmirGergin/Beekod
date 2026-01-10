import { MarketplaceListing } from "../types.js";
export { MarketplaceListing };

export type MarketplaceName = "Amazon" | "Trendyol" | "Hepsiburada" | "N11" | "Ciceksepeti" | "PttAVM" | "Pazarama" | "Shopify" | "Woocommerce";

export type MarketplaceActionStatus = "ok" | "queued" | "not_configured" | "failed";

export type MarketplaceActionResult = {
  status: MarketplaceActionStatus;
  message: string;
  requestId?: string;
  data?: unknown;
};

export type MarketplaceListResult = {
  status: MarketplaceActionStatus;
  message: string;
  items: MarketplaceListing[];
};

export type MarketplaceMode = "mock" | "live";

export type MarketplaceConfigStatus = {
  mode: MarketplaceMode;
  missing: string[];
  configured: boolean;
};

export type MarketplaceTokenStatus = {
  status: "missing" | "valid" | "expired" | "unknown";
  expiresAt?: string;
};

export type MarketplaceProductPayload = {
  barcode: string;
  name: string;
  price: number;
  stock: number;
  currency: string;
  images?: string[] | Array<{ url: string }>;
};

export type MarketplaceUpdatePayload = {
  barcode: string;
  price?: number;
  stock?: number;
  active?: boolean;
  title?: string;
};

export type MarketplaceOrderItem = {
  sku?: string;
  barcode: string;
  name: string;
  price?: number;
  unitPrice?: number;
  totalPrice?: number;
  quantity: number;
  image?: string;
  status?: string;
  statusCode?: number;
};

export type MarketplaceOrder = {
  marketplace: MarketplaceName;
  orderNumber: string;
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  // Structured customer info (new)
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  // Structured shipping address (new)
  shippingAddress?: {
    fullAddress?: string;
    city?: string;
    district?: string;
    postalCode?: string;
  };
  // Cargo info (new)
  cargoInfo?: {
    cargoCompany?: string;
    trackingNumber?: string;
  };
  items: MarketplaceOrderItem[];
  totalAmount: number;
  currency: string;
  orderDate: string;
  status: string;
  statusCode?: number;
  deliveryType?: string;
};

export type MarketplaceOrderResult = {
  status: MarketplaceActionStatus;
  message: string;
  orders: MarketplaceOrder[];
};

export type MarketplaceProvider = {
  name: MarketplaceName;
  getConfigStatus: () => MarketplaceConfigStatus;
  getTokenStatus: () => MarketplaceTokenStatus;
  isConfigured: () => boolean;
  refreshToken: () => Promise<MarketplaceActionResult>;
  upsertProduct: (payload: MarketplaceProductPayload) => Promise<MarketplaceActionResult>;
  updateListing: (payload: MarketplaceUpdatePayload) => Promise<MarketplaceActionResult>;
  syncFromProduct: (payload: MarketplaceProductPayload) => Promise<MarketplaceActionResult>;
  listListings: (params?: { status?: "active" | "inactive"; barcode?: string }) => Promise<MarketplaceListResult>;
  getNewOrders: (params?: { startDate?: string; endDate?: string }) => Promise<MarketplaceOrderResult>;
  getBatchRequestResult?: (batchRequestId: string) => Promise<MarketplaceActionResult>;
  setCredentials?: (credentials: Record<string, any>) => void;
};
