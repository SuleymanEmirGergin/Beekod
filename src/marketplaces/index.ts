import { MarketplaceName, MarketplaceProvider } from "./types.js";
import { StubMarketplaceProvider } from "./stubProvider.js";
import { AmazonProvider } from "./amazonProvider.js";
import { TrendyolProvider } from "./trendyolProvider.js";
import { HepsiburadaProvider } from "./hepsiburadaProvider.js";
import { N11Provider } from "./n11Provider.js";
import { CiceksepetiProvider } from "./ciceksepetiProvider.js";
import { PttavmProvider } from "./pttavmProvider.js";
import { PazaramaProvider } from "./pazaramaProvider.js";
import { ShopifyProvider } from "./shopifyProvider.js";
import { WoocommerceProvider } from "./woocommerceProvider.js";
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

