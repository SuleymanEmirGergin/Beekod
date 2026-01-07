import api from './api';

export interface InventoryProduct {
  id: string; // We'll use barcode or _id as unique key
  name: string;
  sku: string;
  category: string;
  price: string; // Formatted price
  numericPrice: number;
  costPrice?: number;
  stock: number; // Changed from quantity to match backend
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  image: string;
  barcode: string;
  alertThreshold?: number;
}

const formatPrice = (price: number, currency: string = 'TRY') => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(price);
};

const determineStatus = (quantity: number, threshold: number = 30): InventoryProduct['status'] => {
  if (quantity === 0) return 'Out of Stock';
  if (quantity < threshold) return 'Low Stock';
  return 'In Stock';
};

const mapBackendProductToInventory = (product: any): InventoryProduct => {
  return {
    id: product.barcode, // Barcode is unique enough for inventory view
    name: product.name,
    sku: product.product_code || product.barcode, // Fallback to barcode if no SKU
    category: product.category || 'Uncategorized',
    price: `₺${product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
    numericPrice: product.price,
    costPrice: product.cost_price,
    stock: product.stock,
    status: determineStatus(product.stock, product.alert_threshold),
    image:
      product.images && product.images.length > 0
        ? product.images[0]
        : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    barcode: product.barcode,
    alertThreshold: product.alert_threshold,
  };
};

export const getInventory = async (search?: string): Promise<InventoryProduct[]> => {
  const params = search ? { search } : {};
  const response = await api.get('/products', { params });
  return (response.data.items || []).map(mapBackendProductToInventory);
};

export const updateProductStock = async (
  barcode: string,
  change: number,
): Promise<InventoryProduct> => {
  const action = change > 0 ? 'increase' : 'decrease';
  const value = Math.abs(change);

  const response = await api.put(`/products/${barcode}/stock`, {
    action,
    value,
  });

  return mapBackendProductToInventory(response.data.item);
};

export const updateInventoryProduct = async (barcode: string, data: any) => {
  // For full update, we might use the Upsert endpoint or specific field updates.
  // The UI currently has "Update Inventory" modal which might want to update price too.
  // Let's assume we use the general UPSERT logic or specific field updates.
  // For now, let's just support stock update via this service helper if needed,
  // but the Modal usually requires more fields.
  // If we simply want to update fields, we can use POST /products (Upsert)

  // Construct payload for upsert
  const payload = {
    barcode: barcode,
    name: data.name,
    stock: parseInt(data.stock),
    price: data.price,
    cost_price: data.costPrice,
    category: data.category,
    product_code: data.sku,
    alert_threshold: data.alertThreshold ? parseInt(data.alertThreshold) : undefined,
    // Preserve other fields? Ideally yes.
  };

  const response = await api.post('/products', payload);
  return mapBackendProductToInventory(response.data.item);
};

export const deleteProduct = async (barcode: string): Promise<boolean> => {
  try {
    await api.delete(`/products/${barcode}`);
    return true;
  } catch (error) {
    console.error('Failed to delete product', error);
    return false;
  }
};

export const getPriceSuggestion = async (barcode: string) => {
  const response = await api.get(`/products/${barcode}/price-suggestion`);
  return response.data;
};

export const syncProductToMarketplaces = async (barcode: string) => {
  try {
    const response = await api.post(`/products/${barcode}/sync`);
    return response.data;
  } catch (error) {
    console.error('Failed to sync product', error);
    throw error;
  }
};

export const getStockHistory = async (barcode: string) => {
  const response = await api.get(`/products/${barcode}/history`);
  return response.data;
};

export const bulkDeleteProducts = async (barcodes: string[]): Promise<boolean> => {
  try {
    await api.post('/products/bulk-delete', { barcodes });
    return true;
  } catch (error) {
    console.error('Failed to bulk delete products', error);
    return false;
  }
};

export const bulkSyncProducts = async (barcodes: string[]): Promise<void> => {
  await api.post('/products/bulk-sync', { barcodes });
};

export interface ProductPrediction {
  barcode: string;
  salesVelocity: number;
  daysRemaining: number;
  estimatedStockoutDate: string | null;
}

export const getInventoryPredictions = async (): Promise<ProductPrediction[]> => {
  const response = await api.get('/products/predictions');
  return response.data;
};

// --- Consolidated Marketplace Inventory (Phase 6) ---

export const getConsolidatedInventory = async (): Promise<any[]> => {
  const response = await api.get('/inventory/consolidated');
  return response.data.inventory;
};

export const bulkUpdateMarketplacePrice = async (barcode: string, price: number, marketplaces: string[]) => {
  const response = await api.post('/inventory/bulk-update', {
    barcode,
    price,
    marketplaces
  });
  return response.data;
};

// --- AI & Repricer (Phase 9) ---

export const optimizeProductContent = async (title: string, description: string) => {
  const response = await api.post('/ai/optimize-content', { title, description });
  return response.data;
};

export const saveRepricerConfig = async (config: any) => {
  const response = await api.post('/repricer/config', config);
  return response.data;
};

export const getRepricerConfig = async (barcode: string) => {
  const response = await api.get(`/repricer/config/${barcode}`);
  return response.data.config;
};

export const visualSearch = async (imageFile: File) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  const response = await api.post('/inventory/visual-search', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
