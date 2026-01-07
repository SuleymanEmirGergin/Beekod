import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, createProduct, Product, formatCurrency } from '../services/products';
import { SidebarV2 } from '../layouts/SidebarV2';
import { SearchBar } from '../components/shared/';
import { ChatWidget } from '../components/ChatWidget';
import { ToastV2 } from '../components/shared/';
import { HelpModal } from '../components/HelpModal';
import {
  Bell,
  HelpCircle,
  Download,
  Plus,
  Sparkles,
  ChevronDown,
  X,
  AlertTriangle,
  TrendingUp,
  Package,
  Clock,
  Filter,
} from 'lucide-react';
import { VariantEditor } from '../components/products/VariantEditor';
import { UniversalSearchModal } from '../components/products/UniversalSearchModal';
import { generateAIDescription, suggestAICategory } from '../services/ai';

interface ProductManagementScreenProps {
  onNavigate: (screen: string) => void;
}

export function ProductManagementScreen({ onNavigate }: ProductManagementScreenProps) {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMoreFiltersModal, setShowMoreFiltersModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', message: '' });
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [brandFilter, setBrandFilter] = useState('All');
  const [supplierFilter, setSupplierFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<string[]>(['Active']);
  const [stockLevelFilter, setstockLevelFilter] = useState<string[]>([]);

  // New product form states
  const [newProductName, setNewProductName] = useState('');
  const [newProductSKU, setNewProductSKU] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Electronics');
  const [newProductBarcode, setNewProductBarcode] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('');
  const [newProductStatus, setNewProductStatus] = useState('Active');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductVariants, setNewProductVariants] = useState<any[]>([]);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);

  const handleAIDescription = async () => {
    if (!newProductName) {
      setToastMessage({ title: 'Giriş Gerekli', message: 'Lütfen önce bir ürün adı girin.' });
      setShowToast(true);
      return;
    }
    setIsGeneratingDescription(true);
    try {
      const desc = await generateAIDescription(newProductName, newProductCategory);
      setNewProductDescription(desc);
      setToastMessage({ title: 'AI Başarılı', message: 'Açıklama başarıyla oluşturuldu!' });
    } catch (err) {
      setToastMessage({ title: 'AI Hatası', message: 'Açıklama oluşturulamadı.' });
    } finally {
      setIsGeneratingDescription(false);
      setShowToast(true);
    }
  };

  const handleAISuggestCategory = async () => {
    if (!newProductName) {
      setToastMessage({ title: 'Giriş Gerekli', message: 'Lütfen önce bir ürün adı girin.' });
      setShowToast(true);
      return;
    }
    setIsSuggestingCategory(true);
    try {
      const category = await suggestAICategory(newProductName);
      setNewProductCategory(category);
      setToastMessage({ title: 'AI Başarılı', message: `Önerilen kategori: ${category}` });
    } catch (err) {
      setToastMessage({ title: 'AI Hatası', message: 'Kategori önerilemedi.' });
    } finally {
      setIsSuggestingCategory(false);
      setShowToast(true);
    }
  };

  const queryClient = useQueryClient();

  // Fetch products from backend
  const { data: backendProducts = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  // Mutation for adding product
  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setToastMessage({
        title: 'Ürün Eklendi',
        message: `${newProductName} envantere başarıyla eklendi`,
      });
      setShowToast(true);
      setShowAddProductModal(false);
      resetForm();
      setTimeout(() => setShowToast(false), 3000);
    },
    onError: () => {
      setToastMessage({
        title: 'Hata',
        message: 'Ürün oluşturulamadı. Lütfen tekrar deneyin.',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    },
  });

  // Map backend data to UI format
  const products = backendProducts.map((p: Product) => {
    const stockValue = p.stock || 0;
    let stockLevel = 'high';
    let stockLabel = 'In Stock';

    if (stockValue === 0) {
      stockLevel = 'low';
      stockLabel = 'Stokta Yok';
    } else if (stockValue < 50) {
      stockLevel = 'low';
      stockLabel = 'Azalıyor';
    } else if (stockValue < 200) {
      stockLevel = 'medium';
      stockLabel = 'Stokta Var';
    }

    return {
      id: p._id || p.barcode,
      name: p.name,
      category: p.category || 'Uncategorized',
      image: p.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      bgColor: 'bg-gray-50', // Default background
      barcode: p.barcode,
      sku: p.sku || p.barcode,
      stock: { value: stockValue, level: stockLevel, label: stockLabel },
      basePrice: formatCurrency(p.price, p.currency),
      margin: null, // Backend doesn't calculate margin dynamically yet
      marketplaces:
        p.marketplace_links?.map((m) => ({
          name: m.marketplace,
          icon: m.marketplace.charAt(0).toUpperCase(),
          color: m.marketplace.toLowerCase().includes('trendyol') ? 'bg-orange-500' : 'bg-blue-500',
        })) || [],
      status: { label: 'Aktif', color: 'bg-green-50 text-green-700', dot: 'bg-green-500' }, // Defaulting to Active
      specs: {}, // Specs are schematic in UI but unstructured in backend for now
      warning: undefined,
    };
  });

  const resetForm = () => {
    setNewProductName('');
    setNewProductSKU('');
    setNewProductCategory('Electronics');
    setNewProductBarcode('');
    setNewProductPrice('');
    setNewProductStock('');
    setNewProductStatus('Active');
    setNewProductDescription('');
    setNewProductVariants([]);
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Product Name', 'SKU', 'Barcode', 'Category', 'Base Price', 'Stock', 'Status'];
    const csvContent = [
      headers.join(','),
      ...products.map((p) =>
        [
          `"${p.name}"`,
          p.sku,
          p.barcode,
          p.category,
          p.basePrice,
          p.stock.value,
          p.status.label,
        ].join(','),
      ),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `beekod-products-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage({
      title: 'Dışa Aktarma Başarılı',
      message: `${products.length} ürün CSV dosyasına aktarıldı`,
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAIInsights = () => {
    setShowAIModal(true);
  };

  const handleAddProduct = () => {
    setShowAddProductModal(true);
  };

  const handleSaveNewProduct = () => {
    if (
      !newProductName ||
      !newProductSKU ||
      !newProductBarcode ||
      !newProductPrice ||
      !newProductStock
    ) {
      setToastMessage({
        title: 'Doğrulama Hatası',
        message: 'Lütfen tüm zorunlu alanları doldurun',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    const stockValue = parseInt(newProductStock);

    createProductMutation.mutate({
      name: newProductName,
      sku: newProductSKU,
      barcode: newProductBarcode,
      price: parseFloat(newProductPrice),
      stock: stockValue,
      category: newProductCategory,
      description: newProductDescription,
      images: [], // TODO: Add real image upload
    });
  };

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setBrandFilter('All');
    setSupplierFilter('All');
    setStatusFilter([]);
    setstockLevelFilter([]);
    setShowFilters(false);
  };

  const handleRemoveFilter = (filterType: string) => {
    if (filterType === 'status') {
      setStatusFilter([]);
      if (
        categoryFilter === 'All' &&
        brandFilter === 'All' &&
        supplierFilter === 'All' &&
        stockLevelFilter.length === 0
      ) {
        setShowFilters(false);
      }
    }
  };

  // Apply all filters
  const filteredProducts = products.filter((product) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchLower) ||
      product.barcode.toLowerCase().includes(searchLower) ||
      product.sku.toLowerCase().includes(searchLower);

    // Category filter
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;

    // Status filter
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(product.status.label);

    // Stock level filter
    const matchesStockLevel =
      stockLevelFilter.length === 0 || stockLevelFilter.includes(product.stock.level);

    return matchesSearch && matchesCategory && matchesStatus && matchesStockLevel;
  });

  // Count active filters
  const activeFilterCount =
    (categoryFilter !== 'All' ? 1 : 0) +
    (brandFilter !== 'All' ? 1 : 0) +
    (supplierFilter !== 'All' ? 1 : 0) +
    (statusFilter.length > 0 ? 1 : 0) +
    (stockLevelFilter.length > 0 ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarV2
        activeItem="products"
        onNavigate={onNavigate}
        userName="Emir"
        userEmail="emir@beekod.com"
        ordersBadge={12}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <button
                onClick={() => onNavigate('inventory')}
                className="text-[#B8934D] hover:text-[#A07D3D] hover:underline"
              >
                Envanter
              </button>
              <span>›</span>
              <span className="text-gray-900">Tüm Ürünler</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-lg text-sm hover:bg-purple-50 transition-colors"
                onClick={handleAIInsights}
              >
                <Sparkles className="w-4 h-4" />
                AI İçgörüleri Sor
              </button>
              <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </button>
              <button
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setShowHelpModal(true)}
              >
                <HelpCircle className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {/* Page header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl text-gray-900 mb-1">Ürün Yönetimi</h1>
              <p className="text-sm text-[#B8934D]">
                Stok seviyelerini, fiyatlandırmayı ve pazar yeri listelerini yönetin.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                URL / Arama ile İçe Aktar
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={handleExport}
              >
                <Download className="w-4 h-4" />
                Dışa Aktar
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
                onClick={handleAddProduct}
              >
                <Plus className="w-4 h-4" />
                Ürün Ekle
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="İsim, barkod veya SKU ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F5B800] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setShowFilters(true);
                  }}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#F5B800] transition-colors"
                >
                  <option value="All">Kategori: Hepsi</option>
                  <option value="Electronics">Elektronik</option>
                  <option value="Computers">Bilgisayar</option>
                  <option value="Wearables">Giyilebilir Teknoloji</option>
                  <option value="Audio">Ses Sistemleri</option>
                </select>
                <select
                  value={brandFilter}
                  onChange={(e) => {
                    setBrandFilter(e.target.value);
                    setShowFilters(true);
                  }}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#F5B800] transition-colors"
                >
                  <option value="All">Marka: Hepsi</option>
                  <option value="Apple">Apple</option>
                  <option value="Samsung">Samsung</option>
                  <option value="Sony">Sony</option>
                </select>
                <select
                  value={supplierFilter}
                  onChange={(e) => {
                    setSupplierFilter(e.target.value);
                    setShowFilters(true);
                  }}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#F5B800] transition-colors"
                >
                  <option value="All">Tedarikçi: Hepsi</option>
                  <option value="Wholesale Co">Wholesale Co</option>
                  <option value="Tech Distributor">Tech Distributor</option>
                </select>
                <button
                  onClick={() => setShowMoreFiltersModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                  Daha Fazla Filtre
                  {stockLevelFilter.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-[#F5B800] text-gray-900 rounded text-xs">
                      {stockLevelFilter.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {hasActiveFilters && showFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Active Filters:</span>
                {categoryFilter !== 'All' && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    <span>Category: {categoryFilter}</span>
                    <button onClick={() => setCategoryFilter('All')}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {brandFilter !== 'All' && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm">
                    <span>Brand: {brandFilter}</span>
                    <button onClick={() => setBrandFilter('All')}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {supplierFilter !== 'All' && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                    <span>Supplier: {supplierFilter}</span>
                    <button onClick={() => setSupplierFilter('All')}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {statusFilter.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm">
                    <span>Status: {statusFilter.join(', ')}</span>
                    <button onClick={() => setStatusFilter([])}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {stockLevelFilter.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm">
                    <span>
                      Stock:{' '}
                      {stockLevelFilter
                        .map((s) => (s === 'low' ? 'Low' : s === 'medium' ? 'Medium' : 'High'))
                        .join(', ')}
                    </span>
                    <button onClick={() => setstockLevelFilter([])}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <button
                  onClick={handleClearAllFilters}
                  className="text-sm text-[#B8934D] hover:text-[#A07D3D] transition-colors"
                >
                  Temizle
                </button>
              </div>
            )}
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="w-8 px-4 py-3">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </th>
                  <th className="text-left text-xs text-[#B8934D] px-4 py-3 uppercase tracking-wider">
                    Ürün Bilgisi
                  </th>
                  <th className="text-left text-xs text-[#B8934D] px-4 py-3 uppercase tracking-wider">
                    Barkod (SKU)
                  </th>
                  <th className="text-left text-xs text-[#B8934D] px-4 py-3 uppercase tracking-wider">
                    Stok
                  </th>
                  <th className="text-left text-xs text-[#B8934D] px-4 py-3 uppercase tracking-wider">
                    Temel Fiyat
                  </th>
                  <th className="text-left text-xs text-[#B8934D] px-4 py-3 uppercase tracking-wider">
                    Pazar Yeri
                  </th>
                  <th className="text-left text-xs text-[#B8934D] px-4 py-3 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="text-left text-xs text-[#B8934D] px-4 py-3 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 ${product.bgColor} rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden`}
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <button
                            onClick={() => navigate(`/products/${product.barcode}/edit`)}
                            className="text-sm text-gray-900 mb-0.5 hover:text-[#F5B800] transition-colors text-left"
                          >
                            {product.name}
                          </button>
                          <div className="text-xs text-[#B8934D]">Kategori: {product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm text-gray-900">{product.barcode}</div>
                        <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${product.stock.level === 'high'
                                ? 'bg-green-500'
                                : product.stock.level === 'medium'
                                  ? 'bg-blue-500'
                                  : 'bg-orange-500'
                                }`}
                              style={{
                                width: `${Math.min((product.stock.value / 1000) * 100, 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-900">{product.stock.value}</div>
                          {product.stock.level === 'low' && (
                            <div className="flex items-center gap-1 text-xs text-orange-600">
                              <AlertTriangle className="w-3 h-3" />
                              Düşük Stok
                            </div>
                          )}
                          {product.stock.level !== 'low' && (
                            <div className="text-xs text-green-700">{product.stock.label}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm text-gray-900">{product.basePrice}</div>
                        {product.margin && (
                          <div className="text-xs text-gray-500">Margin: {product.margin}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {product.warning ? (
                        <span className="text-sm text-orange-600">{product.warning}</span>
                      ) : (
                        <div className="flex items-center gap-1">
                          {product.marketplaces.map((mp: any, idx: number) => (
                            <div
                              key={idx}
                              className={`w-6 h-6 ${mp.color} rounded-full flex items-center justify-center`}
                              title={mp.name}
                            >
                              <span className="text-xs text-white">{mp.icon}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 ${product.status.dot} rounded-full`}></div>
                        <span className={`text-sm ${product.status.color}`}>
                          {product.status.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                <span className="text-gray-900">500</span> üründen <span className="text-gray-900">1-10</span> arası gösteriliyor
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <ChevronDown className="w-4 h-4 rotate-90 text-gray-600" />
                </button>
                <button className="px-3 py-1.5 bg-[#F5B800] text-gray-900 rounded-lg text-sm">
                  1
                </button>
                <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  2
                </button>
                <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  3
                </button>
                <span className="px-2 text-gray-400">...</span>
                <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  50
                </button>
                <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <ChevronDown className="w-4 h-4 -rotate-90 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Chat Button */}
      <ChatWidget />

      {/* Universal Search / Import Modal */}
      {showImportModal && (
        <UniversalSearchModal
          onClose={() => setShowImportModal(false)}
          onImportSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
          }}
        />
      )}

      {/* AI Insights Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl text-gray-900">AI Ürün İçgörüleri</h3>
              </div>
              <button onClick={() => setShowAIModal(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-lg p-5 mb-6">
              <h4 className="text-sm text-gray-900 mb-2">Optimizasyon Önerileri</h4>
              <p className="text-sm text-gray-700">
                Envanterinize ve pazar trendlerine dayanarak, satışlarınızı en üst düzeye çıkarmak için kişiselleştirilmiş öneriler.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-900 mb-1">Yüksek Talep Uyarısı</p>
                  <p className="text-xs text-gray-600">
                    <strong>Ultra Phone X Pro</strong> bu hafta %47 daha fazla arama hacmine sahip.
                    Stoku 200 birim artırmayı düşünün.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-900 mb-1">Düşük Stok Uyarısı</p>
                  <p className="text-xs text-gray-600">
                    <strong>ZenithBook Pro 15"</strong> için sadece 12 adet kaldı. Satış hızına göre 5 gün içinde yenileyin.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <Package className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-900 mb-1">Pazar Yeri Genişlemesi</p>
                  <p className="text-xs text-gray-600">
                    <strong>SonicBlast Headphones</strong> Amazon'da iyi performans gösteriyor.
                    eBay ve Shopify'da da listelemeyi düşünün.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-900 mb-1">Mevsimsel Fırsat</p>
                  <p className="text-xs text-gray-600">
                    Elektronik kategorisi Q1'de %35 artış görüyor. Yaklaşan talep artışına stok hazırlayın.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAIModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm transition-colors"
              >
                Kapat
              </button>
              <button
                onClick={() => {
                  setShowAIModal(false);
                  setToastMessage({
                    title: 'Rapor Oluşturuldu',
                    message: 'Tam AI içgörü raporu e-postanıza gönderildi',
                  });
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 3000);
                }}
                className="flex-1 px-4 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
              >
                Tam Rapor Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl text-gray-900">Yeni Ürün Ekle</h3>
              <button onClick={() => setShowAddProductModal(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-5 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Ürün Adı</label>
                  <input
                    type="text"
                    placeholder="örn. iPhone 15 Pro Max"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F5B800]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">SKU</label>
                  <input
                    type="text"
                    placeholder="örn. PRD-001"
                    value={newProductSKU}
                    onChange={(e) => setNewProductSKU(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F5B800]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm text-gray-700">Kategori</label>
                    <button
                      onClick={handleAISuggestCategory}
                      disabled={isSuggestingCategory}
                      className="flex items-center gap-1 text-[10px] text-[#F5B800] hover:text-[#E5A800] font-medium transition-colors"
                      type="button"
                    >
                      <Sparkles
                        className={`w-3 h-3 ${isSuggestingCategory ? 'animate-pulse' : ''}`}
                      />
                      AI Öner
                    </button>
                  </div>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F5B800]"
                  >
                    <option>Electronics</option>
                    <option>Computers</option>
                    <option>Wearables</option>
                    <option>Audio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Barcode</label>
                  <input
                    type="text"
                    placeholder="örn. 890123456789"
                    value={newProductBarcode}
                    onChange={(e) => setNewProductBarcode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F5B800]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Taban Fiyat</label>
                  <input
                    type="text"
                    placeholder="₺0,00"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F5B800]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Başlangıç Stok</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F5B800]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Durum</label>
                  <select
                    value={newProductStatus}
                    onChange={(e) => setNewProductStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F5B800]"
                  >
                    <option>Aktif</option>
                    <option>Taslak</option>
                    <option>Arşivlendi</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-gray-700">Açıklama</label>
                  <button
                    onClick={handleAIDescription}
                    disabled={isGeneratingDescription}
                    className="flex items-center gap-1 text-[10px] text-[#F5B800] hover:text-[#E5A800] font-medium transition-colors"
                    type="button"
                  >
                    <Sparkles
                      className={`w-3 h-3 ${isGeneratingDescription ? 'animate-pulse' : ''}`}
                    />
                    AI Oluştur
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="Ürün açıklaması..."
                  value={newProductDescription}
                  onChange={(e) => setNewProductDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F5B800] resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Ürün Görseli</label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-[#F5B800] transition-colors cursor-pointer">
                  <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Yüklemek için tıklayın veya sürükleyip bırakın</p>
                  <p className="text-xs text-gray-400 mt-1">
                    SVG, PNG, JPG veya GIF (maks. 800x400px)
                  </p>
                </div>

                <div className="mt-6">
                  <VariantEditor
                    initialVariants={newProductVariants}
                    basePrice={Number(newProductPrice) || 0}
                    baseStock={Number(newProductStock) || 0}
                    onChange={setNewProductVariants}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveNewProduct}
                  className="flex-1 px-4 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
                >
                  Ürün Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* More Filters Modal */}
      {showMoreFiltersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F5B800] rounded-lg flex items-center justify-center">
                  <Filter className="w-5 h-5 text-gray-900" />
                </div>
                <h3 className="text-xl text-gray-900">Daha Fazla Filtre</h3>
              </div>
              <button onClick={() => setShowMoreFiltersModal(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-6 mb-6">
              <div>
                <label className="block text-sm text-gray-900 mb-3">Ürün Durumu</label>
                <div className="space-y-2">
                  {['Active', 'Draft', 'Archived'].map((status) => (
                    <label key={status} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={statusFilter.includes(status)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setStatusFilter([...statusFilter, status]);
                          } else {
                            setStatusFilter(statusFilter.filter((s) => s !== status));
                          }
                          setShowFilters(true);
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-[#F5B800] focus:ring-[#F5B800]"
                      />
                      <span className="text-sm text-gray-700">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-900 mb-3">Stok Seviyesi</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stockLevelFilter.includes('high')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setstockLevelFilter([...stockLevelFilter, 'high']);
                        } else {
                          setstockLevelFilter(stockLevelFilter.filter((s) => s !== 'high'));
                        }
                        setShowFilters(true);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-[#F5B800] focus:ring-[#F5B800]"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Yüksek Stok (200+)</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stockLevelFilter.includes('medium')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setstockLevelFilter([...stockLevelFilter, 'medium']);
                        } else {
                          setstockLevelFilter(stockLevelFilter.filter((s) => s !== 'medium'));
                        }
                        setShowFilters(true);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-[#F5B800] focus:ring-[#F5B800]"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Orta Stok (50-199)</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stockLevelFilter.includes('low')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setstockLevelFilter([...stockLevelFilter, 'low']);
                        } else {
                          setstockLevelFilter(stockLevelFilter.filter((s) => s !== 'low'));
                        }
                        setShowFilters(true);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-[#F5B800] focus:ring-[#F5B800]"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Düşük Stok (0-49)</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStatusFilter([]);
                  setstockLevelFilter([]);
                  setShowMoreFiltersModal(false);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm transition-colors"
              >
                Sıfırla
              </button>
              <button
                onClick={() => setShowMoreFiltersModal(false)}
                className="flex-1 px-4 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
              >
                Filtreleri Uygula
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <ToastV2
          title={toastMessage.title}
          message={toastMessage.message}
          isVisible={showToast}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Product Detail Modal */}
      {showProductDetail && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h3 className="text-base text-gray-900">Ürün Detayları</h3>
              <button onClick={() => setShowProductDetail(false)}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="grid grid-cols-3 gap-4">
                {/* Left Column - Product Image & Basic Info */}
                <div className="col-span-1">
                  <div
                    className={`w-full aspect-square ${selectedProduct.bgColor} rounded-xl flex items-center justify-center overflow-hidden mb-3`}
                  >
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">Category</p>
                      <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs">
                        {selectedProduct.category}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">Status</p>
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-1.5 h-1.5 ${selectedProduct.status.dot} rounded-full`}
                        ></div>
                        <span className={`text-xs ${selectedProduct.status.color}`}>
                          {selectedProduct.status.label}
                        </span>
                      </div>
                    </div>
                    {selectedProduct.marketplaces && selectedProduct.marketplaces.length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-500 mb-1">Listelendi</p>
                        <div className="flex items-center gap-1.5">
                          {selectedProduct.marketplaces.map((mp: any, idx: number) => (
                            <div
                              key={idx}
                              className={`w-6 h-6 ${mp.color} rounded-full flex items-center justify-center`}
                              title={mp.name}
                            >
                              <span className="text-[10px] text-white">{mp.icon}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle Column - Product Details */}
                <div className="col-span-1">
                  <h4 className="text-sm text-gray-900 mb-2.5 leading-tight">
                    {selectedProduct.name}
                  </h4>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                      <span className="text-[10px] text-gray-500">Barcode</span>
                      <span className="text-xs text-gray-900">{selectedProduct.barcode}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                      <span className="text-[10px] text-gray-500">SKU</span>
                      <span className="text-xs text-gray-900">{selectedProduct.sku}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                      <span className="text-[10px] text-gray-500">Base Price</span>
                      <span className="text-xs text-gray-900">{selectedProduct.basePrice}</span>
                    </div>
                    {selectedProduct.margin && (
                      <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                        <span className="text-[10px] text-gray-500">Margin</span>
                        <span className="text-xs text-green-700">{selectedProduct.margin}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                      <span className="text-[10px] text-gray-500">Stock Quantity</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-900">
                          {selectedProduct.stock.value} units
                        </span>
                        {selectedProduct.stock.level === 'low' && (
                          <AlertTriangle className="w-3 h-3 text-orange-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Specifications */}
                <div className="col-span-1">
                  <h5 className="text-xs text-gray-900 mb-2">Özellikler</h5>

                  {selectedProduct.specs && (
                    <div className="space-y-1">
                      {Object.entries(selectedProduct.specs).map(([key, value]) => (
                        <div key={key} className="flex items-start justify-between py-1">
                          <span className="text-[10px] text-gray-500 capitalize leading-tight">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-[10px] text-gray-900 text-right ml-2 leading-tight">
                            {value as string}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-gray-100">
              <button
                onClick={() => setShowProductDetail(false)}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-xs transition-colors"
              >
                Kapat
              </button>
              <button className="px-3.5 py-1.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-xs transition-colors">
                Ürünü Düzenle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <HelpModal page={'products' as any} onClose={() => setShowHelpModal(false)} />
      )}
    </div>
  );
}
