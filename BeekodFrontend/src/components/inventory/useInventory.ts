/**
 * useInventory Hook
 * State management for inventory screen
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getInventory,
  updateProductStock,
  deleteProduct,
  updateInventoryProduct,
  InventoryProduct,
  getPriceSuggestion,
  syncProductToMarketplaces,
  getStockPredictions,
  StockPrediction,
  PriceSuggestion,
} from '../../services/inventory';
import { toast } from 'sonner';

export type Product = InventoryProduct;

export interface InventoryState {
  products: Product[];
  loading: boolean;
  error: string | null;
  selectedItems: Set<string>;
  searchQuery: string;
  filterStatus: 'all' | 'low' | 'out';
  predictions: StockPrediction[];
  pricingSuggestions: Map<string, PriceSuggestion>;
}

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all');
  const [predictions, setPredictions] = useState<StockPrediction[]>([]);
  const [pricingSuggestions, setPricingSuggestions] = useState<Map<string, PriceSuggestion>>(new Map());

  // Load inventory
  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInventory();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError('Envanter yüklenemedi');
      toast.error('Envanter yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load predictions
  const loadPredictions = useCallback(async () => {
    try {
      const data = await getStockPredictions();
      setPredictions(data);
    } catch {
      console.error('Tahminler yüklenemedi');
    }
  }, []);

  // Load pricing insights for a product
  const loadPricingInsight = useCallback(async (barcode: string) => {
    try {
      const suggestion = await getPriceSuggestion(barcode);
      if (suggestion) {
        setPricingSuggestions(prev => new Map(prev).set(barcode, suggestion));
      }
    } catch {
      console.error('Fiyat önerisi yüklenemedi');
    }
  }, []);

  // Update product
  const handleUpdate = useCallback(async (
    productId: string,
    newQuantity: number,
    newPrice: string,
    alertSettings?: { enabled: boolean; threshold: number }
  ) => {
    try {
      await updateInventoryProduct(productId, {
        stock: newQuantity,
        price: parseFloat(newPrice),
        lowStockAlert: alertSettings?.enabled,
        lowStockThreshold: alertSettings?.threshold,
      });
      
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, stock: newQuantity, price: parseFloat(newPrice) }
          : p
      ));
      
      toast.success('Ürün güncellendi');
    } catch {
      toast.error('Güncelleme başarısız');
    }
  }, []);

  // Quick stock change
  const handleQuickStockChange = useCallback(async (productId: string, change: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newStock = Math.max(0, product.stock + change);
    try {
      await updateProductStock(productId, newStock);
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, stock: newStock } : p
      ));
      toast.success(`Stok güncellendi: ${newStock}`);
    } catch {
      toast.error('Stok güncellenemedi');
    }
  }, [products]);

  // Delete product
  const handleDeleteProduct = useCallback(async (productId: string) => {
    try {
      await deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      setSelectedItems(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      toast.success('Ürün silindi');
    } catch {
      toast.error('Silme başarısız');
    }
  }, []);

  // Sync to marketplaces
  const handleSyncProduct = useCallback(async (product: Product) => {
    try {
      await syncProductToMarketplaces(product.barcode);
      toast.success('Ürün pazaryerlerine senkronize edildi');
    } catch {
      toast.error('Senkronizasyon başarısız');
    }
  }, []);

  // Selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(products.map(p => p.id)));
    } else {
      setSelectedItems(new Set());
    }
  }, [products]);

  const handleSelectItem = useCallback((id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Bulk operations
  const handleBulkDelete = useCallback(async () => {
    for (const id of selectedItems) {
      await handleDeleteProduct(id);
    }
    setSelectedItems(new Set());
  }, [selectedItems, handleDeleteProduct]);

  const handleBulkSync = useCallback(async () => {
    const selectedProducts = products.filter(p => selectedItems.has(p.id));
    for (const product of selectedProducts) {
      await handleSyncProduct(product);
    }
    toast.success(`${selectedProducts.length} ürün senkronize edildi`);
  }, [selectedItems, products, handleSyncProduct]);

  // Initialize
  useEffect(() => {
    loadInventory();
    loadPredictions();
  }, [loadInventory, loadPredictions]);

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterStatus === 'low') return p.stock > 0 && p.stock <= (p.lowStockThreshold || 10);
    if (filterStatus === 'out') return p.stock === 0;
    return true;
  });

  return {
    // State
    products: filteredProducts,
    allProducts: products,
    loading,
    error,
    selectedItems,
    searchQuery,
    filterStatus,
    predictions,
    pricingSuggestions,
    
    // Setters
    setSearchQuery,
    setFilterStatus,
    
    // Actions
    loadInventory,
    loadPredictions,
    loadPricingInsight,
    handleUpdate,
    handleQuickStockChange,
    handleDeleteProduct,
    handleSyncProduct,
    handleSelectAll,
    handleSelectItem,
    handleBulkDelete,
    handleBulkSync,
  };
}
