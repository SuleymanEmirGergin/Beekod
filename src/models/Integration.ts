export type ProviderId =
  | "trendyol"
  | "hepsiburada"
  | "n11"
  | "pazarama"
  | "pttavm"
  | "ciceksepeti"
  | "shopify"
  | "woocommerce";

export interface IIntegrationConfig {
  // Common
  syncProducts: boolean;
  syncOrders: boolean;
  autoSyncFrequency: string;
  autoPriceUpdates: boolean;
  stockNotifications: boolean;
  orderAutoImport: boolean;

  // Marketplace Specific
  merchantId?: string;
  apiKey?: string;
  apiSecret?: string;
  supplierId?: string;
  webhookUrl?: string;

  // Shopify
  shopDomain?: string; // e.g. my-store.myshopify.com
  accessToken?: string; // Admin API Access Token

  // WooCommerce
  storeUrl?: string; // e.g. https://mystore.com
  consumerKey?: string;
  consumerSecret?: string;

  // Generic
  [key: string]: any;
}

export interface IIntegration {
  providerId: string;
  name: string;
  connected: boolean;
  lastSync?: string;
  itemsSynced?: number;
  config: IIntegrationConfig;
  createdAt?: Date;
  updatedAt?: Date;
}
