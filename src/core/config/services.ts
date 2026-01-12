/**
 * External Services Configuration
 * @module core/config/services
 */

import { parseNumber, parseBoolean, parseStore, parseReadSource } from "./env.js";

const env = process.env;

export const googleConfig = {
  cseApiKey: (env.GOOGLE_CSE_API_KEY ?? "").trim(),
  cseCx: (env.GOOGLE_CSE_CX ?? "").trim(),
};

export const searchConfig = {
  defaultNum: parseNumber("SEARCH_DEFAULT_NUM", 5, { min: 1, max: 10, integer: true }),
  imageDefaultNum: parseNumber("IMAGE_SEARCH_DEFAULT_NUM", 3, { min: 1, max: 10, integer: true }),
  gl: env.SEARCH_GL ?? "",
  hl: env.SEARCH_HL ?? "",
  siteDefault: env.SEARCH_SITE_DEFAULT ?? "",
};

export const storesConfig = {
  marketplace: parseStore("MARKETPLACE_STORE", "db"),
  sales: parseStore("SALES_STORE", "mock"),
};

export const marketplaceConfig = {
  readSource: parseReadSource("MARKETPLACE_READ_SOURCE", "db"),
  liveRetryEnabled: parseBoolean("MARKETPLACE_LIVE_RETRY_ENABLED", false),
  mode: (process.env.MARKETPLACE_MODE?.trim().toLowerCase() === "mock" ? "mock" : "live") as "mock" | "live",
};

export const imagesConfig = {
  storagePath: env.IMAGE_STORAGE_PATH ?? "storage/images",
  publicBase: env.IMAGE_PUBLIC_BASE ?? "/static/images",
  defaultProfile: env.IMAGE_DEFAULT_PROFILE ?? "trendyol_square",
  maxUploadBytes: parseNumber("IMAGE_MAX_BYTES", 8 * 1024 * 1024, { min: 1, integer: true }),
  requireAdmin: parseBoolean("IMAGE_REQUIRE_ADMIN", false),
  profilesPath: env.IMAGE_PROFILES_PATH ?? "data/image-profiles.json",
  profilesDefaultPath: env.IMAGE_PROFILES_DEFAULT_PATH ?? "data/image-profiles.default.json",
  profileSetsPath: env.IMAGE_PROFILE_SETS_PATH ?? "data/marketplace-image-sets.json",
  profileSetsDefaultPath: env.IMAGE_PROFILE_SETS_DEFAULT_PATH ?? "data/marketplace-image-sets.default.json",
  barcodeScanEnabled: parseBoolean("BARCODE_SCAN_ENABLED", false),
};

export const dataConfig = {
  marketplacePath: env.MARKETPLACE_DATA_PATH ?? "data/mock_marketplace.csv",
  productPath: env.PRODUCT_DATA_PATH ?? "data/mock_products.csv",
  salesPath: env.SALES_DATA_PATH ?? "data/mock_sales.csv",
  contentConfigPath: env.CONTENT_CONFIG_PATH ?? "data/content-config.json",
  contentConfigDefaultPath: env.CONTENT_CONFIG_DEFAULT_PATH ?? "data/content-config.default.json",
  marketplaceMappingPath: env.MARKETPLACE_MAPPING_PATH ?? "data/marketplace-mappings.json",
  marketplaceMappingDefaultPath: env.MARKETPLACE_MAPPING_DEFAULT_PATH ?? "data/marketplace-mappings.default.json",
  templates: {
    mappings: "data/templates/content_mappings.json",
    seo: "data/templates/seo_templates.json",
    social: "data/templates/social_templates.json",
  },
};

export type GoogleConfig = typeof googleConfig;
export type SearchConfig = typeof searchConfig;
export type StoresConfig = typeof storesConfig;
export type MarketplaceConfig = typeof marketplaceConfig;
export type ImagesConfig = typeof imagesConfig;
export type DataConfig = typeof dataConfig;
