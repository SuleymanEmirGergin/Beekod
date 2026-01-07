import api from './api';

export interface MarketplaceListing {
  marketplace: string;
  barcode: string;
  title: string;
  price: number;
  stock: number;
  currency: string;
  active: boolean;
}

export interface MarketplaceProviderInfo {
  provider: string;
  status: string;
  message: string;
  count?: number;
}

export interface ListingsResponse {
  items: MarketplaceListing[];
  providers: MarketplaceProviderInfo[];
  source: 'live' | 'db';
}

export const getMarketplaceListings = async (
  barcode?: string,
  marketplace?: string,
): Promise<ListingsResponse> => {
  const params: any = { source: 'live' };
  if (barcode) params.barcode = barcode;
  if (marketplace) params.marketplace = marketplace;

  const { data } = await api.get('/marketplace/listings', { params });
  return data;
};

export const syncProductToMarketplace = async (
  barcode: string,
  marketplace: string,
  action: 'sync' | 'price' | 'stock' | 'activate' | 'deactivate',
  value?: any,
): Promise<any> => {
  const { data } = await api.put('/marketplace/listings', {
    barcode,
    marketplace,
    action,
    value,
  });
  return data;
};

export const bulkSyncProduct = async (
  barcode: string,
  action: 'sync' | 'price' | 'stock' | 'activate' | 'deactivate',
  marketplaces?: string[],
): Promise<any> => {
  const { data } = await api.put('/marketplace/listings/bulk', {
    barcode,
    action,
    marketplaces,
  });
  return data;
};

export const getMarketplaceStats = async (): Promise<any[]> => {
  const { data } = await api.get('/marketplace/listings/stats');
  return data.items;
};
