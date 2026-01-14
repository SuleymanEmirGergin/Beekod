/**
 * Integrations Module Constants
 * Static configuration for marketplace integrations
 */

import trendyolLogo from 'figma:asset/1230e43a58a5ec2cbca646dd9964cda0a5eb57b2.png';
import hepsiburadaLogo from 'figma:asset/563328772dcd4f9d76dd21b5abc99b99a49e8f70.png';

export interface MarketplaceConfig {
  id: string;
  name: string;
  description: string;
  logo?: string;
  logoText?: string;
  logoColor: string;
  logoBgColor: string;
  fields: { key: string; label: string; type: 'text' | 'password' }[];
}

export const MARKETPLACES: MarketplaceConfig[] = [
  {
    id: 'trendyol',
    name: 'Trendyol',
    description: 'Full inventory & order synchronization enabled.',
    logo: trendyolLogo,
    logoColor: 'text-orange-600',
    logoBgColor: 'bg-orange-50 border-orange-100',
    fields: [
      { key: 'supplierId', label: 'Supplier ID', type: 'text' },
      { key: 'apiKey', label: 'API Key', type: 'password' },
      { key: 'apiSecret', label: 'API Secret', type: 'password' },
    ],
  },
  {
    id: 'hepsiburada',
    name: 'Hepsiburada',
    description: 'Connect your account to start syncing.',
    logo: hepsiburadaLogo,
    logoColor: 'text-orange-600',
    logoBgColor: 'bg-orange-50 border-orange-100',
    fields: [
      { key: 'merchantId', label: 'Merchant ID', type: 'text' },
      { key: 'apiKey', label: 'API Key', type: 'password' },
    ],
  },
  {
    id: 'n11',
    name: 'N11',
    description: 'Asenkron ürün ve sipariş yönetimi.',
    logoText: 'n11',
    logoColor: 'text-orange-600',
    logoBgColor: 'bg-orange-50 border-orange-100',
    fields: [
      { key: 'appKey', label: 'App Key', type: 'text' },
      { key: 'appSecret', label: 'App Secret', type: 'password' },
    ],
  },
  {
    id: 'pazarama',
    name: 'Pazarama',
    description: 'İş Bankası iştiraki pazar yeri entegrasyonu.',
    logoText: 'pzr',
    logoColor: 'text-blue-600',
    logoBgColor: 'bg-blue-50 border-blue-100',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password' },
    ],
  },
  {
    id: 'pttavm',
    name: 'PTTAVM',
    description: 'Kamu güvencesi ile hızlı entegrasyon.',
    logoText: 'ptt',
    logoColor: 'text-yellow-600',
    logoBgColor: 'bg-yellow-50 border-yellow-100',
    fields: [
      { key: 'username', label: 'Kullanıcı Adı', type: 'text' },
      { key: 'password', label: 'Şifre', type: 'password' },
    ],
  },
  {
    id: 'ciceksepeti',
    name: 'Çiçeksepeti',
    description: 'Milyonlarca hediye gönderimine aracılık edin.',
    logoText: 'çs',
    logoColor: 'text-pink-600',
    logoBgColor: 'bg-pink-50 border-pink-100',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'text' },
    ],
  },
];

export const ECOMMERCE_PLATFORMS = [
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Kendi web sitenizi Beekod ile güçlendirin.',
    logoText: 'sh',
    logoColor: 'text-green-600',
    logoBgColor: 'bg-green-50 border-green-100',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Wordpress sitemizle tam senkronizasyon.',
    logoText: 'wc',
    logoColor: 'text-purple-600',
    logoBgColor: 'bg-purple-50 border-purple-100',
  },
];

export const SYNC_FREQUENCIES = [
  'Every 15 Minutes',
  'Every 30 Minutes',
  'Every Hour',
  'Manual Only',
];
