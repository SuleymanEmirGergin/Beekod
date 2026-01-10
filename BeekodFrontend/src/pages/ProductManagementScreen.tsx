import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, createProduct, Product, formatCurrency } from '../services/products';
import { SidebarV2 } from '../layouts/SidebarV2';

import { ToastV2 } from '../components/shared/';
import { HelpModal } from '../components/HelpModal';
import {
  Bell,
  HelpCircle,
  Download,
  Plus,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowUpRight,
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
  // ... (keep state same)
  // Re-declare state vars here isn't needed for replace, just context matching
  // We will target the Import block and the Stats block separately in one multi-replace if possible, or just huge chunk.
  // Actually, replace_file_content doesn't support multi-range well in one go unless I provide the whole file or a contiguous block.
  // The imports are at the top (lines 9-22) and stats are at 310-347. They are far apart.
  // I will use multi_replace for this.

  // WAIT, I must use multi_replace. switching tool.

  const [showFilters, setShowFilters] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', message: '' });
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [brandFilter, setBrandFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

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

  // AI Handlers
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

  // Fetch products
  const { data: backendProducts = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  // Create Product Mutation
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
      bgColor: 'bg-gray-50',
      barcode: p.barcode,
      sku: p.sku || p.barcode,
      stock: { value: stockValue, level: stockLevel, label: stockLabel },
      basePrice: formatCurrency(p.price, p.currency),
      margin: null,
      marketplaces:
        p.marketplace_links?.map((m) => ({
          name: m.marketplace,
          icon: m.marketplace.charAt(0).toUpperCase(),
          color: m.marketplace.toLowerCase().includes('trendyol') ? 'bg-orange-500' : 'bg-blue-500',
        })) || [],
      status: { label: 'Aktif', color: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
      specs: {}, // Simplified
      warning: undefined,
    };
  });

  // Filter Logic
  const filteredProducts = products.filter((product) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchLower) ||
      product.barcode.toLowerCase().includes(searchLower) ||
      product.sku.toLowerCase().includes(searchLower);

    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(product.status.label);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setBrandFilter('All');
    setStatusFilter([]);
    setShowFilters(false);
  };

  const handleAddProduct = () => {
    setShowAddProductModal(true);
  };

  const handleSaveNewProduct = () => {
    if (!newProductName || !newProductPrice || !newProductStock) {
      setToastMessage({
        title: 'Doğrulama Hatası',
        message: 'Lütfen zorunlu alanları doldurun',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    createProductMutation.mutate({
      name: newProductName,
      sku: newProductSKU || `SKU-${Date.now()}`,
      barcode: newProductBarcode || `${Date.now()}`,
      price: parseFloat(newProductPrice),
      stock: parseInt(newProductStock),
      category: newProductCategory,
      description: newProductDescription,
      currency: 'TRY',
      images: []
    });
  };

  const handleAIInsights = () => {
    setShowAIModal(true);
  }

  return (
    <div className="flex h-screen bg-[#FDFDFD] font-sans overflow-hidden">
      <SidebarV2
        activeItem="products"
        onNavigate={onNavigate}
        userName="Emir"
        userEmail="emir@beekod.com"
        ordersBadge={12}
      />

      <div className="flex-1 flex flex-col h-screen relative">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-purple-50/50 to-blue-50/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-yellow-50/50 to-orange-50/30 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 z-20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-900 rounded-lg text-white shadow-lg shadow-gray-200">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Ürün Yönetimi</h1>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <span className="text-[#F5B800]">Envanter</span>
                  <span>›</span>
                  <span>Tüm Ürünler</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-100 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-50 hover:border-purple-200 transition-all shadow-sm hover:shadow-md"
                onClick={handleAIInsights}
              >
                <Sparkles className="w-4 h-4" />
                AI İçgörüleri
              </button>

              <div className="h-8 w-px bg-gray-200 mx-2" />

              <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-xl transition-all relative border border-gray-100 group">
                <Bell className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
              </button>
              <button
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-xl transition-all border border-gray-100 group"
                onClick={() => setShowHelpModal(true)}
              >
                <HelpCircle className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-8 py-6 pb-20 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-[#F5B800] border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 text-sm font-medium animate-pulse">Ürünler yükleniyor...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 animate-in slide-in-from-top-4 duration-500">
                {/* Stats Row - Left Aligned Modern Dock */}
                <div className="flex flex-wrap items-stretch justify-start gap-5 mb-8 animate-in slide-in-from-left-4 duration-500">

                  {/* Stats Group - Dark Theme for Contrast */}
                  <div className="flex items-center p-1.5 bg-[#1A1A1A] rounded-2xl shadow-xl shadow-gray-200 border border-gray-800">
                    <div className="px-5 py-3 flex flex-col justify-center border-r border-gray-700/50">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Toplam</p>
                      <p className="text-2xl font-bold text-white leading-none">{products.length}</p>
                    </div>

                    <div className="px-5 py-3 flex flex-col justify-center border-r border-gray-700/50">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Kritik</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-white leading-none">{products.filter(p => p.stock.level === 'low').length}</p>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      </div>
                    </div>

                    <div className="px-5 py-3 flex flex-col justify-center">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Aktif</p>
                      <p className="text-2xl font-bold text-[#F5B800] leading-none">{products.filter(p => p.status.label === 'Aktif').length}</p>
                    </div>
                  </div>

                  {/* Quick Action Card - Modern Glass */}
                  <div
                    onClick={handleAddProduct}
                    className="group cursor-pointer flex items-center gap-4 px-6 py-2 bg-white border-2 border-dashed border-gray-300 hover:border-[#F5B800] rounded-2xl transition-all hover:shadow-[0_8px_30px_rgb(245,184,0,0.15)] hover:scale-[1.02] active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#F5B800]/10 flex items-center justify-center text-[#F5B800] group-hover:bg-[#F5B800] group-hover:text-black transition-colors">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">Hızlı Ekle</p>
                      <p className="text-[10px] text-gray-500 font-medium group-hover:text-[#F5B800] transition-colors">Yeni Stok Girişi</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#F5B800] ml-2 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                  </div>

                </div>

                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                  <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Filter className="h-4 w-4 text-gray-400 group-focus-within:text-[#F5B800] transition-colors" />
                    </div>
                    <input
                      type="text"
                      placeholder="İsim, barkod veya SKU ile ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:border-[#F5B800] focus:ring-4 focus:ring-yellow-50 sm:text-sm transition-all shadow-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${showFilters ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    >
                      <Filter className="w-4 h-4" />
                      Filtreler
                    </button>

                    <div className="h-8 w-px bg-gray-200" />

                    <button
                      onClick={() => setShowImportModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      İçe Aktar
                    </button>
                    <button
                      onClick={handleAddProduct}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-xl text-sm font-bold shadow-lg shadow-yellow-100 hover:shadow-yellow-200 hover:-translate-y-0.5 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Ürün Ekle
                    </button>
                  </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6 animate-in slide-in-from-top-2">
                    <div className="flex flex-wrap gap-4">
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#F5B800] hover:bg-white transition-colors cursor-pointer"
                      >
                        <option value="All">Kategori: Hepsi</option>
                        <option value="Electronics">Elektronik</option>
                        <option value="Computers">Bilgisayar</option>
                        <option value="Wearables">Giyilebilir Teknoloji</option>
                        <option value="Audio">Ses Sistemleri</option>
                      </select>

                      <select
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#F5B800] hover:bg-white transition-colors cursor-pointer"
                      >
                        <option value="All">Marka: Hepsi</option>
                        <option value="Apple">Apple</option>
                        <option value="Samsung">Samsung</option>
                        <option value="Sony">Sony</option>
                      </select>

                      <select
                        value={statusFilter[0] || 'All'}
                        onChange={(e) => setStatusFilter(e.target.value === 'All' ? [] : [e.target.value])}
                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#F5B800] hover:bg-white transition-colors cursor-pointer"
                      >
                        <option value="All">Durum: Hepsi</option>
                        <option value="Aktif">Aktif</option>
                        <option value="Pasif">Pasif</option>
                      </select>

                      {(categoryFilter !== 'All' || brandFilter !== 'All' || statusFilter.length > 0) && (
                        <button
                          onClick={handleClearAllFilters}
                          className="text-sm text-red-500 hover:text-red-700 font-medium px-2 py-2"
                        >
                          Temizle
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Products Table / List */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="w-8 px-6 py-4">
                          <input type="checkbox" className="rounded border-gray-300 text-[#F5B800] focus:ring-[#F5B800]" />
                        </th>
                        <th className="text-left text-xs font-bold text-gray-400 px-6 py-4 uppercase tracking-wider">Ürün Bilgisi</th>
                        <th className="text-left text-xs font-bold text-gray-400 px-6 py-4 uppercase tracking-wider">Stok Durumu</th>
                        <th className="text-left text-xs font-bold text-gray-400 px-6 py-4 uppercase tracking-wider">Fiyat</th>
                        <th className="text-left text-xs font-bold text-gray-400 px-6 py-4 uppercase tracking-wider">Platformlar</th>
                        <th className="text-left text-xs font-bold text-gray-400 px-6 py-4 uppercase tracking-wider">Durum</th>
                        <th className="text-right text-xs font-bold text-gray-400 px-6 py-4 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                      {filteredProducts.map((product, idx) => (
                        <tr
                          key={product.id}
                          className="group hover:bg-yellow-50/10 transition-colors cursor-pointer animate-in fade-in slide-in-from-bottom-2"
                          style={{ animationDelay: `${idx * 50}ms` }}
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowProductDetail(true);
                          }}
                        >
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" className="rounded border-gray-300 text-[#F5B800] focus:ring-[#F5B800]" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 p-1 flex-shrink-0 relative overflow-hidden group-hover:border-[#F5B800] transition-colors">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900 group-hover:text-[#F5B800] transition-colors">{product.name}</div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5">{product.barcode}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="font-bold text-gray-700">{product.stock.value} Adet</span>
                                {product.stock.level === 'low' && <span className="text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Kritik</span>}
                              </div>
                              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${product.stock.level === 'high' ? 'bg-green-500' :
                                    product.stock.level === 'medium' ? 'bg-blue-500' : 'bg-red-500'
                                    }`}
                                  style={{ width: `${Math.min((product.stock.value / 1000) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-gray-900">{product.basePrice}</div>
                            <div className="text-xs text-green-600 font-medium">+12% Margin</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex -space-x-2 overflow-hidden">
                              {product.marketplaces.length > 0 ? (
                                product.marketplaces.map((mp, i) => (
                                  <div key={i} className={`inline-block h-6 w-6 rounded-full ring-2 ring-white ${mp.color} flex items-center justify-center text-[10px] text-white font-bold shadow-sm`}>
                                    {mp.icon}
                                  </div>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">Listelenmedi</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.status.color} border border-transparent`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${product.status.dot}`}></span>
                              {product.status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-400">
                              <Package className="w-12 h-12 mb-3 opacity-20" />
                              <p className="text-lg font-medium text-gray-900">Ürün Bulunamadı</p>
                              <p className="text-sm">Arama kriterlerinize uygun ürün yok.</p>
                              <button onClick={handleClearAllFilters} className="mt-4 text-[#F5B800] hover:underline font-medium">Filtreleri Temizle</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
          )}

            </main>
      </div>



      <ToastV2
        title={toastMessage.title}
        message={toastMessage.message}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={handleAddProduct}
        className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-[#F5B800] text-gray-900 rounded-full shadow-lg flex items-center justify-center z-30"
      >
        <Plus className="w-6 h-6" />
      </button>

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">AI Ürün İçgörüleri</h3>
                  <p className="text-sm text-gray-500">Envanteriniz için akıllı öneriler</p>
                </div>
              </div>
              <button onClick={() => setShowAIModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4 p-4 bg-green-50 rounded-2xl border border-green-100">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-1">Yüksek Talep Uyarısı</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    <strong>Ultra Phone X Pro</strong> bu hafta %47 daha fazla arama hacmine sahip.
                    Stoku 200 birim artırmayı düşünün.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-1">Düşük Stok Uyarısı</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    <strong>ZenithBook Pro 15"</strong> için sadece 12 adet kaldı. Satış hızına göre 5 gün içinde yenileyin.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowAIModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl text-sm font-medium transition-colors"
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
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-200 transition-all hover:scale-[1.02]"
              >
                Raporu E-posta Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {showHelpModal && <HelpModal page="products" onClose={() => setShowHelpModal(false)} />}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-8">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">Yeni Ürün Ekle</h2>
              <button onClick={() => setShowAddProductModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="p-8 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Adı</label>
                  <input value={newProductName} onChange={e => setNewProductName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800] focus:bg-white transition-all outline-none" placeholder="Örn: iPhone 15 Pro" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Barkod</label>
                  <input value={newProductBarcode} onChange={e => setNewProductBarcode(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800] focus:bg-white transition-all outline-none" placeholder="869..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                  <input value={newProductSKU} onChange={e => setNewProductSKU(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800] focus:bg-white transition-all outline-none" placeholder="STOCK-001" />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fiyat (TL)</label>
                  <input type="number" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800] focus:bg-white transition-all outline-none" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stok</label>
                  <input type="number" value={newProductStock} onChange={e => setNewProductStock(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800] focus:bg-white transition-all outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                  <div className="relative">
                    <select value={newProductCategory} onChange={e => setNewProductCategory(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800] focus:bg-white transition-all outline-none appearance-none">
                      <option>Electronics</option>
                      <option>Computers</option>
                      <option>Fashion</option>
                    </select>
                    <button onClick={handleAISuggestCategory} disabled={isSuggestingCategory} className="absolute right-2 top-2 p-1.5 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200" title="AI İle Öner">
                      {isSuggestingCategory ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Description with AI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between">
                  <span>Açıklama</span>
                  <button onClick={handleAIDescription} disabled={isGeneratingDescription} className="text-xs font-bold text-purple-600 flex items-center gap-1 hover:text-purple-700">
                    {isGeneratingDescription ? 'Yazılıyor...' : <><Sparkles className="w-3 h-3" /> AI ile Yaz</>}
                  </button>
                </label>
                <textarea value={newProductDescription} onChange={e => setNewProductDescription(e.target.value)} rows={4} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800] focus:bg-white transition-all outline-none resize-none" placeholder="Ürün özelliklerini girin..." />
              </div>

              {/* Image Placeholder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Görseli</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#F5B800] transition-colors cursor-pointer bg-gray-50">
                  <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Yüklemek için tıklayın veya sürükleyip bırakın</p>
                </div>
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

            <div className="sticky bottom-0 bg-gray-50 px-8 py-5 border-t border-gray-200 flex justify-end gap-3 rounded-b-3xl">
              <button onClick={() => setShowAddProductModal(false)} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">İptal</button>
              <button onClick={handleSaveNewProduct} className="px-6 py-3 bg-[#F5B800] text-gray-900 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">Ürünü Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal - Shadow UI / Depth Design */}
      {showProductDetail && selectedProduct && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl h-[600px] rounded-[32px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex animate-in zoom-in-95 duration-300 relative group">

            {/* Close Button - Floating */}
            <button
              onClick={() => setShowProductDetail(false)}
              className="absolute top-6 right-6 z-20 p-2.5 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl text-gray-400 hover:text-gray-900 transition-all hover:scale-110 active:scale-95 border border-white/50"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Column: Immersive Image */}
            <div className="w-2/5 relative h-full bg-gray-100 overflow-hidden">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />

              {/* Floating Status Badge on Image */}
              <div className="absolute top-6 left-6">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-md border border-white/10 ${selectedProduct.status.label === 'Aktif' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                  {selectedProduct.status.label}
                </span>
              </div>

              {/* Bottom Info on Image */}
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <p className="text-sm font-medium text-gray-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-8 h-[1px] bg-white/50"></span>
                  {selectedProduct.category}
                </p>
                <h3 className="text-3xl font-bold leading-tight mb-4 shadow-black drop-shadow-md">
                  {selectedProduct.name}
                </h3>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-mono border border-white/10">
                    {selectedProduct.sku}
                  </div>
                  <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-mono border border-white/10 flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {selectedProduct.id}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Details & Actions */}
            <div className="w-3/5 p-10 bg-white flex flex-col h-full relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-50/50 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F5B800]"></span>
                    Performans Özeti
                  </h4>

                  {/* Shadow Cards Grid */}
                  <div className="grid grid-cols-2 gap-5">
                    <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group/card">
                      <p className="text-xs text-gray-400 font-medium uppercase mb-1">Satış Fiyatı</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-gray-900 group-hover/card:text-[#F5B800] transition-colors">{selectedProduct.basePrice}</span>
                        <span className="text-xs text-green-500 font-medium">+KDV</span>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group/card">
                      <p className="text-xs text-gray-400 font-medium uppercase mb-1">Stok Durumu</p>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-bold ${selectedProduct.stock.level === 'low' ? 'text-red-500' : 'text-gray-900 group-hover/card:text-blue-600'} transition-colors`}>
                          {selectedProduct.stock.value}
                        </span>
                        <span className="text-xs text-gray-400">Adet</span>
                      </div>
                      {selectedProduct.stock.level === 'low' && (
                        <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full mt-2 inline-block">Kritik Seviye</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Bağlı Platformlar
                  </h4>
                  <div className="space-y-3">
                    {selectedProduct.marketplaces?.length > 0 ? (
                      selectedProduct.marketplaces.map((mp: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-blue-50/30 hover:border-blue-100 hover:shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl ${mp.color} flex items-center justify-center text-white shadow-lg shadow-gray-200`}>
                              {mp.icon}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{mp.name}</p>
                              <p className="text-xs text-gray-500">Son Güncelleme: 2s önce</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-xs font-medium text-green-600">Yayında</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center">
                        <Package className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400">Henüz bir pazaryerine bağlı değil</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-6 border-t border-gray-100 flex gap-4 mt-auto">
                <button className="flex-1 py-4 rounded-xl border-2 border-gray-100 text-gray-700 font-bold text-sm tracking-wide hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-[0.98]">
                  GEÇMİŞİ GÖR
                </button>
                <button
                  onClick={() => {
                    setToastMessage({ title: 'Düzenle', message: 'Editör yükleniyor...' });
                    setShowToast(true);
                  }}
                  className="flex-[2] py-4 rounded-xl bg-gray-900 text-white font-bold text-sm tracking-wide shadow-xl shadow-gray-200 hover:shadow-2xl hover:bg-black hover:-translate-y-1 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  DÜZENLE
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
