import { MarketplaceProvider } from "./types.js";
import { TrendyolProvider } from "./providers/trendyolProvider.js";
import { HepsiburadaProvider } from "./providers/hepsiburadaProvider.js";
import { N11Provider } from "./providers/n11Provider.js";
import { CiceksepetiProvider } from "./providers/ciceksepetiProvider.js";
import { PttavmProvider } from "./providers/pttavmProvider.js";
import { PazaramaProvider } from "./providers/pazaramaProvider.js";
import { AmazonProvider } from "./providers/amazonProvider.js";
import { ShopifyProvider } from "./providers/shopifyProvider.js";
import { WoocommerceProvider } from "./providers/woocommerceProvider.js";
import { fail } from "../../utils/result.js";

const providers: Record<string, MarketplaceProvider> = {
  Trendyol: new TrendyolProvider(),
  Hepsiburada: new HepsiburadaProvider(),
  N11: new N11Provider(),
  Ciceksepeti: new CiceksepetiProvider(),
  PttAVM: new PttavmProvider(),
  Pazarama: new PazaramaProvider(),
  Amazon: new AmazonProvider(),
  Shopify: new ShopifyProvider(),
  Woocommerce: new WoocommerceProvider(),
};

function normalizeMarketplaceName(value: string) {
  return value.trim().toLowerCase();
}

export function getMarketplaceProvider(name: string): MarketplaceProvider | null {
  const normalized = normalizeMarketplaceName(name);
  const match = Object.keys(providers).find(
    (item) => normalizeMarketplaceName(item) === normalized,
  );
  return match ? providers[match] : null;
}

export function listMarketplaceProviders() {
  return Object.keys(providers).map((name) => ({
    name,
    configured: providers[name].isConfigured(),
    config: providers[name].getConfigStatus(),
    token: providers[name].getTokenStatus(),
  }));
}

export function getMarketplaceProviders(): MarketplaceProvider[] {
  return Object.values(providers);
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

export async function getPriceCompetition(marketplace: string, barcodes: string[]) {
  const provider = getMarketplaceProvider(marketplace);
  if (!provider || !provider.getPriceCompetition) {
    return fail(new Error(`Marketplace ${marketplace} does not support price competition analysis`));
  }
  return provider.getPriceCompetition(barcodes);
}
