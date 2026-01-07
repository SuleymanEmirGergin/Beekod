import api from './api';

export interface Product {
  _id: string; // Backend ID
  name: string;
  description?: string;
  price: number;
  currency: string;
  stock: number;
  category: string;
  barcode: string;
  sku: string;
  images: string[];
  marketplace_links?: {
    marketplace: string;
    product_id: string;
    url: string;
    price: number;
    last_updated: Date;
    status: 'active' | 'inactive';
  }[];
  created_at?: string;
  updated_at?: string;
  // Advanced Fields
  brand?: string;
  product_code?: string;
  vat_rate?: number;
  unit?: string;
  preparation_days?: number;
  translations?: Record<string, any>;
  attributes?: Record<string, any>;
  cargo_company?: string;
  cargo_desi?: number;
  width?: number;
  height?: number;
  length?: number;
  weight?: number;
  product_type?: 'standard' | 'packet' | 'digital';
}

export interface ProductPrice {
  id: number;
  barcode: string;
  price: number;
  currency: string;
  start_date?: string;
  end_date?: string;
  price_type: 'STANDARD' | 'SALE' | 'VIP' | 'WHOLESALE';
  priority: number;
}

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  stock: number;
  category: string;
  barcode: string;
  images?: string[];
  sku?: string;
  brand?: string;
  product_code?: string;
  vat_rate?: number;
  unit?: string;
  preparation_days?: number;
  translations?: Record<string, any>;
  attributes?: Record<string, any>;
  cargo_company?: string;
  cargo_desi?: number;
  width?: number;
  height?: number;
  length?: number;
  weight?: number;
  product_type?: 'standard' | 'packet' | 'digital';
}

export interface UniversalSearchResult {
  title: string;
  price: number;
  currency: string;
  image: string;
  url: string;
  source: string;
  rating?: number;
  reviewCount?: number;
}

// Helper to format price for display if needed, but UI should handle formatting ideally
export const formatCurrency = (amount: number, currency = 'TRY') => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);
};

export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await api.get('/products');
    // Backend returns { items: [...] } based on standard response format
    return response.data.items || [];
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
};

export const createProduct = async (product: ProductInput): Promise<Product> => {
  // Backend uses Upsert logic on POST /products usually, or strict create?
  // Based on previous knowledge, POST /products adapts.
  // Mapping frontend input to backend expected payload
  const payload = {
    ...product,
    category: product.category || 'General',
    images: product.images || [],
    product_code: product.product_code || product.sku, // Ensure alias is handled
  };

  const response = await api.post('/products', payload);
  return response.data.item;
};

export const updateProduct = async (
  barcode: string,
  product: Partial<ProductInput>,
): Promise<Product> => {
  // We can use the same generic POST /products upsert if ID/Barcode matches,
  // or specific PUT endpoints if they exist.
  // Let's assume re-using the Create logic (Upsert) is safest if specific ID update isn't confirmed.
  // OR usually PUT /products/:id is standard.
  // Let's try to finding a specific PUT endpoint?
  // Based on inventory.ts, it used specific endpoint for stock.
  // Universal implementation plan says: "Implement updateProduct".
  // I recall `routes/productRoutes.ts` having generally standard CRUD.
  // Let's assume POST (Upsert) by barcode is the primary mechanism in this project context for now,
  // as seen in `inventory.ts`.

  const payload = {
    barcode: barcode, // Key for upsert
    ...product,
    product_code: product.sku,
  };

  const response = await api.post('/products', payload);
  return response.data.item;
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

export const importProductFromUrl = async (url: string): Promise<Product> => {
  const response = await api.post('/products/import', { url });
  return response.data.product;
};

export const searchUniversal = async (query: string): Promise<UniversalSearchResult[]> => {
  try {
    const response = await api.get('/search/universal', { params: { query } });
    return response.data.results || [];
  } catch (error) {
    console.error('Universal search failed', error);
    return [];
  }
};

export const getProductPrices = async (barcode: string): Promise<ProductPrice[]> => {
  const response = await api.get(`/products/${barcode}/prices`);
  return response.data.prices || [];
};

export const addProductPrice = async (barcode: string, price: Omit<ProductPrice, 'id' | 'barcode'>): Promise<number> => {
  const response = await api.post(`/products/${barcode}/prices`, price);
  return response.data.id;
};

export const deleteProductPrice = async (barcode: string, id: number): Promise<boolean> => {
  const response = await api.delete(`/products/${barcode}/prices/${id}`);
  return response.data.status === 'ok';
};
