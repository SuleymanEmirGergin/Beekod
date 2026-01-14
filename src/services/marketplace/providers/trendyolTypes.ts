/**
 * Trendyol Provider Types
 * Type definitions extracted from trendyolProvider.ts
 */

export type TrendyolResponse = {
  success?: boolean;
  errorCode?: string;
  errorMessage?: string;
  batchRequestId?: string;
};

export type TrendyolProductAttribute = {
  attributeId: number;
  attributeValueId?: number;
  customAttributeValue?: string;
};

export type TrendyolSizeVariant = {
  attributeValueId: number;
  label?: string;
};

export type TrendyolProductDefaults = {
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

export interface TrendyolAddress {
  fullAddress: string;
  address1: string;
  address2: string;
  city: string;
  district: string;
  postalCode: string;
  countryCode: string;
  fullName: string;
}

export interface TrendyolOrderLine {
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

export interface TrendyolOrder {
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
