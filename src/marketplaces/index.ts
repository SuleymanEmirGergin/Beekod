import { MarketplaceName, MarketplaceProvider } from "../services/marketplace/types.js";
import { StubMarketplaceProvider } from "../services/marketplace/providers/stubProvider.js";
import { AmazonProvider } from "../services/marketplace/providers/amazonProvider.js";
import { TrendyolProvider } from "../services/marketplace/providers/trendyolProvider.js";
import { HepsiburadaProvider } from "../services/marketplace/providers/hepsiburadaProvider.js";
import { N11Provider } from "../services/marketplace/providers/n11Provider.js";
import { CiceksepetiProvider } from "../services/marketplace/providers/ciceksepetiProvider.js";
import { PttavmProvider } from "../services/marketplace/providers/pttavmProvider.js";
import { PazaramaProvider } from "../services/marketplace/providers/pazaramaProvider.js";
import { ShopifyProvider } from "../services/marketplace/providers/shopifyProvider.js";
import { WoocommerceProvider } from "../services/marketplace/providers/woocommerceProvider.js";
// import { googleSearch } from "./api/googleSearch.js";

const providers: Record<MarketplaceName, MarketplaceProvider> = {
  Amazon: new AmazonProvider(),
  Trendyol: new TrendyolProvider(),
  Hepsiburada: new HepsiburadaProvider(),
  N11: new N11Provider(),
  Ciceksepeti: new CiceksepetiProvider(),
  PttAVM: new PttavmProvider(),
  Pazarama: new PazaramaProvider(),
  Shopify: new ShopifyProvider(),
  Woocommerce: new WoocommerceProvider(),
};

function normalizeMarketplaceName(value: string) {
  return value.trim().toLowerCase();
}

export function getMarketplaceProvider(name: string): MarketplaceProvider | null {
  const normalized = normalizeMarketplaceName(name);
  const match = (Object.keys(providers) as MarketplaceName[]).find(
    (item) => normalizeMarketplaceName(item) === normalized,
  );
  return match ? providers[match] : null;
}

export function listMarketplaceProviders() {
  return (Object.keys(providers) as MarketplaceName[]).map((name) => ({
    name,
    configured: providers[name].isConfigured(),
    config: providers[name].getConfigStatus(),
    token: providers[name].getTokenStatus(),
  }));
}
export function getMarketplaceProviders() {
  return (Object.keys(providers) as MarketplaceName[]).map((name) => providers[name]);
}

export function getMarketplaceProviderStatus(name: string) {
  const provider = getMarketplaceProvider(name);
  if (!provider) {
    return null;
  }
  return {
    name: provider.name,
    configured: provider.isConfigured(),
    config: provider.getConfigStatus(),
    token: provider.getTokenStatus(),
  };
}

// Export removed

