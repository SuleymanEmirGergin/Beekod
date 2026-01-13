import { MarketplaceConfigStatus, MarketplaceMode, MarketplaceName } from "../services/marketplace/types.js";

const REQUIRED_ENV: Record<MarketplaceName, string[]> = {
  Trendyol: ["TRENDYOL_API_BASE", "TRENDYOL_API_KEY", "TRENDYOL_API_SECRET", "TRENDYOL_SUPPLIER_ID"],
  Hepsiburada: ["HEPSIBURADA_MERCHANT_ID", "HEPSIBURADA_API_USERNAME", "HEPSIBURADA_API_PASSWORD"],
  N11: ["N11_API_KEY"],
  Ciceksepeti: ["CICEKSEPETI_API_KEY"],
  PttAVM: ["PTTAVM_USERNAME", "PTTAVM_PASSWORD"],
  Pazarama: ["PAZARAMA_API_KEY", "PAZARAMA_API_SECRET"],
  Amazon: ["AMAZON_API_KEY", "AMAZON_API_SECRET"],
  Shopify: ["SHOPIFY_SHOP_URL", "SHOPIFY_ACCESS_TOKEN"],
  Woocommerce: ["WOOCOMMERCE_URL", "WOOCOMMERCE_CONSUMER_KEY", "WOOCOMMERCE_CONSUMER_SECRET"],
};

export function getMarketplaceMode(): MarketplaceMode {
  const mode = process.env.MARKETPLACE_MODE?.trim().toLowerCase();
  // Default to "live" if not explicitly set to "mock"
  return mode === "mock" ? "mock" : "live";
}

function parseBoolean(value?: string) {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export function isMarketplaceDryRun() {
  return parseBoolean(process.env.MARKETPLACE_DRY_RUN);
}

export function getProviderConfigStatus(name: MarketplaceName): MarketplaceConfigStatus {
  const mode = getMarketplaceMode();
  // Check both undefined/null and empty/whitespace-only strings
  const missing = REQUIRED_ENV[name].filter((key) => {
    const value = process.env[key];
    return !value || !value.trim();
  });
  return {
    mode,
    missing,
    configured: mode === "live" && missing.length === 0,
  };
}
