
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getInventory,
  updateProductStock,
  deleteProduct,
  updateInventoryProduct,
  InventoryProduct,
  getPriceSuggestion,
  syncProductToMarketplaces,
  getStockHistory,
  bulkDeleteProducts,
  bulkSyncProducts,
  getInventoryPredictions,
  ProductPrediction,
} from '../services/inventory';
import { getProductQRCode } from '../services/ai';
import { StockHistoryModal } from '../components/products/StockHistoryModal';
import { SidebarV2 } from '../layouts/SidebarV2';
import { Button } from '../components/shared/';
import { UpdateInventoryModal } from '../components/UpdateInventoryModal';
import { ToastV2 } from '../components/shared/';
import { Badge } from '../components/shared/';
import {
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Loader2,
  QrCode as QrCodeIcon,
  Download,
  X,
  Bell,
  HelpCircle,
  Package,
  Minus,
  Edit,
  Trash2,
  Zap,
  RefreshCw,
  History,
  Sparkles,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { generateBulkSocialContent } from '../services/social';
import { ForecastingWidget } from '../components/Analytics/ForecastingWidget';

interface InventoryManagementScreenProps {
  onNavigate: (screen: string) => void;
}

// Ensure local Product interface matches service or use service's type
// We can just alias or reuse the service type which is cleaner
type Product = InventoryProduct;

export function InventoryManagementScreen({ onNavigate }: InventoryManagementScreenProps) {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', message: '' });
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentQR, setCurrentQR] = useState<{
    barcode: string;
    name: string;
    dataUrl: string;
  } | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [pricingSuggestions, setPricingSuggestions] = useState<Record<string, any>>({});
  const [selectedProductPricing, setSelectedProductPricing] = useState<any>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [predictions, setPredictions] = useState<Record<string, ProductPrediction>>({});
  const [showBulkCampaignModal, setShowBulkCampaignModal] = useState(false);
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);
  const [generatedCampaigns, setGeneratedCampaigns] = useState<
    Array<{ barcode: string; content: string }>
  >([]);
  const [campaignPlatform, setCampaignPlatform] = useState('Instagram');

  const handleViewQRCode = async (product: any) => {
    setIsGeneratingQR(true);
    try {
      const qrDataUrl = await getProductQRCode(product.barcode);
      setCurrentQR({ barcode: product.barcode, name: product.name, dataUrl: qrDataUrl });
      setShowQRModal(true);
    } catch (err) {
      setToastMessage({ title: 'Error', message: 'Failed to generate QR code' });
      setShowToast(true);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleSyncProduct = async (product: Product) => {
    setIsSyncing(product.id);
    try {
      const result = await syncProductToMarketplaces(product.barcode);
      if (result.success) {
        setToastMessage({
          title: 'Sync Successful',
          message: 'Product synced to all marketplaces.',
        });
      } else {
        const failed = result.results.filter((r: any) => r.status === 'failed').length;
        setToastMessage({
          title: 'Sync Completed',
          message: `Synced with warnings.${failed} failed.`,
        });
      }
      setShowToast(true);
    } catch (err) {
      setToastMessage({ title: 'Error', message: 'Sync failed. Check connection.' });
      setShowToast(true);
    } finally {
      setIsSyncing(null);
    }
  };

  const [inventory, setInventory] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, [searchQuery]); // Reload when search changes (debounce ideally, but simple for now)

  const loadInventory = async () => {
    try {
      const data = await getInventory(searchQuery);
      setInventory(data);
    } catch (error) {
      console.error('Failed to load inventory', error);
      setToastMessage({ title: 'Error', message: 'Failed to load inventory' });
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const loadPredictions = async () => {
    try {
      const preds = await getInventoryPredictions();
      const predMap: Record<string, ProductPrediction> = {};
      preds.forEach((p) => (predMap[p.barcode] = p));
      setPredictions(predMap);
    } catch (err) {
      console.error('Failed to load predictions', err);
    }
  };

  const loadPricingInsights = async () => {
    // Only fetch for first 10 products for performance or keep it simple
    const productsToCheck = inventory.slice(0, 15);
    for (const prod of productsToCheck) {
      try {
        const suggestion = await getPriceSuggestion(prod.barcode);
        if (suggestion && suggestion.suggestedPrice !== suggestion.currentPrice) {
          setPricingSuggestions((prev: Record<string, any>) => ({
            ...prev,
            [prod.barcode]: suggestion,
          }));
        }
      } catch (err) {
        console.error(`Failed to get pricing for ${prod.barcode}`, err);
      }
    }
  };

  useEffect(() => {
    if (inventory.length > 0) {
      loadPricingInsights();
      loadPredictions();
    }
  }, [inventory]);

  const handleUpdate = async (
    productId: string,
    newQuantity: number,
    newPrice: string,
    alertSettings?: { enabled: boolean; threshold: number },
  ) => {
    try {
      const product = inventory.find((p) => p.id === productId);
      if (!product) return;

      // Prepare data for update. Note: newPrice is string "1299.00" or similar
      // We need to parse it.
      const priceNum = parseFloat(newPrice.replace(/[^0-9.-]+/g, ''));

      await updateInventoryProduct(product.barcode, {
        name: product.name,
        stock: newQuantity,
        price: isNaN(priceNum) ? product.numericPrice : priceNum,
        category: product.category,
        sku: product.sku,
        alertThreshold: alertSettings?.enabled ? alertSettings.threshold : undefined,
        costPrice: product.costPrice, // Preserve existing cost price
      });

      setToastMessage({ title: 'Success', message: 'Product updated successfully' });
      loadInventory(); // Refresh
      setShowToast(true);
    } catch (error) {
      console.error('Update failed', error);
      setToastMessage({ title: 'Error', message: 'Failed to update product' });
      setShowToast(true);
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProductForEdit(product);
    setIsModalOpen(true);
  };

  const handleQuickStockChange = async (productId: string, change: number) => {
    try {
      const product = inventory.find((p) => p.id === productId);
      if (!product) return;

      // Optimistic update
      setInventory((prev: Product[]) =>
        prev.map((p: Product) => {
          if (p.id === productId) {
            const newQuantity = Math.max(0, p.stock + change);
            let newStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
            if (newQuantity === 0) newStatus = 'Out of Stock';
            else if (newQuantity < 30) newStatus = 'Low Stock';

            return { ...p, stock: newQuantity, status: newStatus };
          }
          return p;
        }),
      );

      // Call API
      await updateProductStock(product.barcode, change); // Use barcode as identifier for update

      setToastMessage({
        title: 'Stock Updated',
        message: `${change > 0 ? 'Added' : 'Removed'} ${Math.abs(change)} unit(s)`,
      });
      setShowToast(true);
    } catch (error) {
      console.error('Failed to update stock', error);
      // Revert on error (could be simpler just to reload)
      loadInventory();
      setToastMessage({ title: 'Error', message: 'Failed to update stock' });
      setShowToast(true);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${productName}" ? This action cannot be undone.`,
      )
    ) {
      try {
        // productId is mapped to barcode in the service
        const success = await deleteProduct(productId);
        if (success) {
          setToastMessage({ title: 'Success', message: 'Product deleted successfully' });
          loadInventory();
        } else {
          setToastMessage({ title: 'Error', message: 'Failed to delete product' });
        }
      } catch (error) {
        console.error('Delete failed', error);
        setToastMessage({ title: 'Error', message: 'An error occurred while deleting' });
      }
      setShowToast(true);
    }
  };

  const handleViewHistory = async (product: Product) => {
    setSelectedProductForHistory(product);
    setHistoryLoading(true);
    setShowHistoryModal(true);
    try {
      const history = await getStockHistory(product.barcode);
      setStockHistory(history);
    } catch (err) {
      console.error('Failed to load history', err);
      setToastMessage({ title: 'Error', message: 'Failed to load stock history' });
      setShowToast(true);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRemoveBackground = async (product: Product) => {
    setIsRemovingBg(product.id);
    try {
      // Simulated for Faz 5 demo
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setInventory((prev: Product[]) =>
        prev.map((p: Product) =>
          p.id === product.id
            ? {
              ...p,
              image:
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop',
            }
            : p,
        ),
      );

      setToastMessage({ title: 'AI Studio', message: 'Arkaplan başarıyla temizlendi!' });
      setShowToast(true);
    } catch (err) {
      setToastMessage({ title: 'Error', message: 'Arkaplan silme başarısız oldu.' });
      setShowToast(true);
    } finally {
      setIsRemovingBg(null);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(inventory.map((p) => p.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`${selectedItems.length} ürünü silmek istediğinize emin misiniz?`)) {
      setIsBulkDeleting(true);
      try {
        const success = await bulkDeleteProducts(selectedItems);
        if (success) {
          setToastMessage({ title: 'Başarılı', message: `${selectedItems.length} ürün silindi.` });
          setSelectedItems([]);
          loadInventory();
        }
      } catch (err) {
        setToastMessage({ title: 'Hata', message: 'Toplu silme başarısız.' });
      } finally {
        setIsBulkDeleting(false);
        setShowToast(true);
      }
    }
  };

  const handleBulkSync = async () => {
    setIsBulkSyncing(true);
    try {
      await bulkSyncProducts(selectedItems);
      setToastMessage({ title: 'Başarılı', message: 'Seçili ürünler senkronize edildi.' });
      setSelectedItems([]);
    } catch (err) {
      setToastMessage({ title: 'Hata', message: 'Toplu senkronizasyon başarısız.' });
    } finally {
      setIsBulkSyncing(false);
      setShowToast(true);
    }
  };

  const handleBulkCampaign = async () => {
    setIsGeneratingCampaign(true);
    setShowBulkCampaignModal(true);
    try {
      const results = await generateBulkSocialContent(selectedItems, campaignPlatform);
      setGeneratedCampaigns(results);
      setToastMessage({
        title: 'Başarılı',
        message: `${selectedItems.length} ürün için kampanya metinleri oluşturuldu.`,
      });
    } catch (err) {
      setToastMessage({ title: 'Hata', message: 'Kampanya oluşturma başarısız.' });
    } finally {
      setIsGeneratingCampaign(false);
      setShowToast(true);
    }
  };

  const filteredInventory = inventory;

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarV2
        activeItem="inventory"
        onNavigate={onNavigate}
        userName="Emir"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Ana Sayfa</span>
              <span>›</span>
              <span className="text-gray-900">Envanter Yönetimi</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </button>
              <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <HelpCircle className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-8 h-8 rounded-full bg-[#F5B800] flex items-center justify-center text-sm">
                BK
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl text-gray-900 mb-2">Envanter Yönetimi</h1>
            <p className="text-gray-500">Ürün stok seviyelerini ve fiyatlandırmayı yönetin.</p>
          </div>

          <div className="mb-8">
            <ForecastingWidget />
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Ürün adı, SKU veya kategori ile ara..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#F5B800] transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Envanter Güncelle
            </Button>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedItems.length === inventory.length && inventory.length > 0}
                      className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Ürün
                  </th>
                  <th className="px-3 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-3 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-3 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Fiyat
                  </th>
                  <th className="px-3 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Maaliyet
                  </th>
                  <th className="px-3 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Stok
                  </th>
                  <th className="px-3 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Eşik
                  </th>
                  <th className="px-3 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">
                    Tahmini Bitiş
                  </th>
                  <th className="px-3 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInventory.map((product) => (
                  <tr
                    key={product.id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('a')) return;
                      navigate(`/products/${product.barcode}/edit`);
                    }}
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedItems.includes(product.id) ? 'bg-yellow-50/30' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(product.id)}
                        onChange={() => handleSelectItem(product.id)}
                        className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 flex-shrink-0 relative group">
                          {/* Chatbot-Style Dynamic Vector Logic */}
                          {(() => {
                            // --- Dynamic SVG Generator (Ported from Chatbot) ---
                            const getVectorImage = (name: string) => {
                              const n = name.toLowerCase();
                              let model = "15";
                              if (n.includes("14")) model = "14";
                              else if (n.includes("13")) model = "13";
                              else if (n.includes("12")) model = "12";
                              else if (n.includes("11")) model = "11";

                              let color = "black";
                              if (n.includes("beyaz") || n.includes("white")) color = "white";
                              else if (n.includes("mavi") || n.includes("blue")) color = "blue";
                              else if (n.includes("yeşil") || n.includes("green")) color = "green";
                              else if (n.includes("pembe") || n.includes("pink")) color = "pink";
                              else if (n.includes("sarı") || n.includes("yellow")) color = "yellow";
                              else if (n.includes("mor") || n.includes("purple")) color = "purple";

                              // Colors
                              let frameHex = "#777";
                              let backHex = "#333";
                              if (color === "white") { frameHex = "#D1CDDA"; backHex = "#F9F9F9"; }
                              else if (color === "blue") { frameHex = "#4A90E2"; backHex = "#A1C9F5"; }
                              else if (color === "black") { frameHex = "#1c1c1e"; backHex = "#2B2B2B"; }
                              else if (color === "green") { frameHex = "#415A4C"; backHex = "#DCE8D8"; }
                              else if (color === "pink") { frameHex = "#B86E86"; backHex = "#FADADD"; }
                              else if (color === "yellow") { frameHex = "#9E9138"; backHex = "#FBF6C7"; }
                              else if (color === "purple") { frameHex = "#5e5ce6"; backHex = "#e8e0ff"; }

                              const hasDiagonalCam = !(["11", "12"].some(m => model.includes(m)));

                              const camSVG = hasDiagonalCam ? `
                                  <rect x="115" y="65" width="80" height="80" rx="18" fill="${frameHex}" fill-opacity="0.3"/>
                                  <circle cx="135" cy="85" r="16" fill="#111" stroke="#222" stroke-width="2"/>
                                  <circle cx="175" cy="125" r="16" fill="#111" stroke="#222" stroke-width="2"/>
                                  <circle cx="175" cy="80" r="4" fill="#FFFFEE" opacity="0.6"/> 
                                ` : `
                                  <rect x="115" y="65" width="50" height="90" rx="18" fill="${frameHex}" fill-opacity="0.3"/>
                                  <circle cx="140" cy="85" r="16" fill="#111" stroke="#222" stroke-width="2"/>
                                  <circle cx="140" cy="125" r="16" fill="#111" stroke="#222" stroke-width="2"/>
                                `;

                              const svg = `
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
                                    <defs>
                                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                            <feDropShadow dx="0" dy="10" stdDeviation="15" flood-opacity="0.15"/>
                                        </filter>
                                    </defs>
                                    <rect x="100" y="50" width="200" height="400" rx="30" fill="${backHex}" filter="url(#shadow)" stroke="${frameHex}" stroke-width="4"/>
                                    <circle cx="200" cy="220" r="18" fill="white" fill-opacity="0.9" />
                                    ${camSVG}
                                </svg>`;

                              return `data:image/svg+xml;base64,${btoa(svg)}`;
                            };

                            // Only apply vector logic if it's likely a phone and has no user image
                            // But user wants "2nd photo style" which IS this style.
                            // So we prefer this generated image if the name matches iPhone.

                            let displaySrc = product.image;
                            const isPhone = product.name.toLowerCase().includes('iphone');

                            if (isPhone) {
                              displaySrc = getVectorImage(product.name);
                            }

                            return (
                              <div className={`w-full h-full rounded-lg flex items-center justify-center relative overflow-hidden ${isPhone ? '' : 'bg-gray-50 border border-gray-100'}`}>
                                {displaySrc ? (
                                  <img
                                    src={displaySrc}
                                    alt={product.name}
                                    onError={(e) => {
                                      if (isPhone) return; // Vectors shouldn't fail
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.parentElement?.classList.add('fallback-active');
                                      // Add fallback content
                                    }}
                                    className="w-full h-full object-contain hover:scale-110 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-gray-400">
                                    <Package className="w-4 h-4 mb-0.5 opacity-50" />
                                  </div>
                                )}

                                {/* Fallback visible only if img is missing/hidden */}
                                {!displaySrc && (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 -z-10">
                                    <Package className="w-4 h-4 mb-0.5 opacity-50" />
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {isRemovingBg === product.id && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg z-20">
                              <Loader2 className="w-4 h-4 text-white animate-spin" />
                            </div>
                          )}
                        </div>
                        <div className="max-w-[200px]">
                          <p className="text-xs text-gray-900 truncate font-medium">{product.name}</p>
                          <p className="text-[10px] text-gray-500">{product.barcode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-600">{product.sku}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-600">{product.category}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">{product.price}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-600">
                        {product.costPrice ? `₺${product.costPrice}` : '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleQuickStockChange(product.id, -10)}
                          className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs text-gray-900 min-w-[2.5rem] text-center">
                          {product.stock}
                        </span>
                        <button
                          onClick={() => handleQuickStockChange(product.id, 10)}
                          className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge
                        variant={
                          product.status === 'In Stock'
                            ? 'success'
                            : product.status === 'Low Stock'
                              ? 'warning'
                              : 'error'
                        }
                        className="text-xs"
                      >
                        {product.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-medium">
                      {product.alertThreshold ?? 10}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {predictions[product.barcode] ? (
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-xs font-bold ${predictions[product.barcode].daysRemaining < 7 ? 'text-red-500' : 'text-gray-900'}`}
                          >
                            {predictions[product.barcode].daysRemaining === Infinity
                              ? '∞'
                              : `${predictions[product.barcode].daysRemaining} gün`}
                          </span>
                          {predictions[product.barcode].daysRemaining < 7 &&
                            predictions[product.barcode].daysRemaining !== Infinity && (
                              <span className="text-[10px] text-red-400 flex items-center gap-0.5 animate-pulse">
                                <AlertTriangle className="w-2 h-2" /> Riskli
                              </span>
                            )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewQRCode(product)}
                          disabled={isGeneratingQR}
                          className="p-1.5 hover:bg-yellow-50 rounded-md transition-colors"
                          title="Generate QR Code"
                        >
                          {isGeneratingQR ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F5B800]" />
                          ) : (
                            <QrCodeIcon className="w-3.5 h-3.5 text-gray-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleRemoveBackground(product)}
                          disabled={isRemovingBg !== null}
                          className="p-1.5 hover:bg-blue-50 rounded-md transition-colors"
                          title="AI Arkaplan Silleme"
                        >
                          {isRemovingBg === product.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                          ) : (
                            <Zap className="w-3.5 h-3.5 text-blue-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleSyncProduct(product)}
                          disabled={isSyncing !== null}
                          className="p-1.5 hover:bg-green-50 rounded-md transition-colors"
                          title="Sync to Marketplaces"
                        >
                          {isSyncing === product.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-green-600" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleViewHistory(product)}
                          className="p-1.5 hover:bg-orange-50 rounded-md transition-colors"
                          title="Stok Geçmişi"
                        >
                          <History className="w-3.5 h-3.5 text-orange-600" />
                        </button>
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                          title="Edit product"
                        >
                          <Edit className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="p-1.5 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {inventory.length === 0 && (
              <div className="py-16 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Ürün bulunamadı</p>
              </div>
            )}
          </div>

          {/* Bulk Action Bar */}
          {selectedItems.length > 0 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white border border-gray-200 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-8 duration-300">
              <div className="flex items-center gap-2 pr-6 border-r border-gray-100">
                <span className="flex items-center justify-center w-6 h-6 bg-yellow-500 text-white text-xs font-bold rounded-full">
                  {selectedItems.length}
                </span>
                <span className="text-sm font-medium text-gray-700">ürün seçildi</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleBulkSync}
                  disabled={isBulkSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isBulkSyncing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Toplu Senkronize
                </button>
                <button
                  onClick={handleBulkCampaign}
                  disabled={isGeneratingCampaign}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isGeneratingCampaign ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  AI Kampanya Oluştur
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isBulkDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Toplu Sil
                </button>
                <button
                  onClick={() => setSelectedItems([])}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <UpdateInventoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleUpdate}
        selectedProduct={selectedProductForEdit}
      />

      <StockHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        productName={selectedProductForHistory?.name || ''}
        history={stockHistory}
        loading={historyLoading}
      />

      {/* QR Code Modal */}
      {showQRModal && currentQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Ürün QR Kodu</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
                <img src={currentQR.dataUrl} alt="QR Code" className="w-48 h-48" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 text-center mb-1">
                {currentQR.name}
              </h4>
              <p className="text-xs text-gray-500 mb-6">{currentQR.barcode}</p>

              <a
                href={currentQR.dataUrl}
                download={`qr - ${currentQR.barcode}.png`}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 font-medium rounded-xl transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                PNG İndir
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <ToastV2
        title={toastMessage.title}
        message={toastMessage.message}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {showPricingModal && selectedProductPricing && (
        <PricingDetailsModal
          suggestion={selectedProductPricing}
          product={inventory.find((p) => p.barcode === selectedProductPricing.barcode)}
          onClose={() => setShowPricingModal(false)}
          onApply={async (newPrice) => {
            try {
              const prod = inventory.find((p) => p.barcode === selectedProductPricing.barcode);
              if (prod) {
                await updateInventoryProduct(prod.barcode, {
                  ...prod,
                  price: newPrice,
                  stock: prod.stock,
                  sku: prod.sku,
                });
                setToastMessage({ title: 'Başarılı', message: 'Fiyat optimize edildi!' });
                setShowToast(true);
                setShowPricingModal(false);
                loadInventory();
              }
            } catch (err) {
              setToastMessage({ title: 'Hata', message: 'Fiyat güncellenemedi.' });
              setShowToast(true);
            }
          }}
        />
      )}

      {showBulkCampaignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">AI Toplu Kampanya Sihirbazı</h3>
                  <p className="text-xs text-gray-500">{selectedItems.length} ürün seçildi</p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkCampaignModal(false)}
                className="p-2 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
              {isGeneratingCampaign ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
                    <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 animate-bounce" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-900">
                      AI Kampanyanızı Hazırlıyor...
                    </p>
                    <p className="text-sm text-gray-500">
                      Her ürün için platforma özel viral metinler oluşturuluyor.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedCampaigns.map((camp, idx) => {
                    const product = inventory.find((p) => p.barcode === camp.barcode);
                    return (
                      <div
                        key={idx}
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-purple-200 transition-colors group"
                      >
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-50">
                          <img src={product?.image} className="w-10 h-10 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate">
                              {product?.name}
                            </h4>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                              {camp.barcode}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 ml-auto">
                            <span className="text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                              {product?.stock || 0}
                            </span>
                          </div>
                          <Badge
                            variant="success"
                            className="bg-purple-50 text-purple-600 border-purple-100"
                          >
                            AI Hazır
                          </Badge>
                        </div>
                        <div className="relative">
                          <textarea
                            value={camp.content}
                            onChange={(e) => {
                              const newCamps = [...generatedCampaigns];
                              newCamps[idx].content = e.target.value;
                              setGeneratedCampaigns(newCamps);
                            }}
                            className="w-full h-32 text-xs text-gray-700 bg-gray-50 rounded-lg p-3 border-none focus:ring-1 focus:ring-purple-200 resize-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <select
                  value={campaignPlatform}
                  onChange={(e) => setCampaignPlatform(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-purple-500"
                >
                  <option>Instagram</option>
                  <option>TikTok</option>
                  <option>Facebook</option>
                  <option>Twitter</option>
                </select>
                <button
                  onClick={handleBulkCampaign}
                  disabled={isGeneratingCampaign}
                  className="flex items-center gap-2 text-sm text-purple-600 font-medium hover:text-purple-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isGeneratingCampaign ? 'animate-spin' : ''}`} />
                  Tekrar Oluştur
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkCampaignModal(false)}
                  className="px-6 py-2 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Kapat
                </button>
                <button
                  disabled={isGeneratingCampaign || generatedCampaigns.length === 0}
                  onClick={() => {
                    setToastMessage({
                      title: 'Planlandı!',
                      message: 'Tüm metinler sosyal medya planlayıcısına aktarıldı.',
                    });
                    setShowToast(true);
                    setShowBulkCampaignModal(false);
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-200 shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Planlayıcıya Aktar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple Pricing Modal Component helper
function PricingDetailsModal({
  suggestion,
  product,
  onClose,
  onApply,
}: {
  suggestion: any;
  product: any;
  onClose: () => void;
  onApply: (newPrice: number) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Dinamik Fiyat Önerisi</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-sm text-blue-800 leading-relaxed">{suggestion.reason}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-[10px] text-gray-500 block uppercase mb-1">Mevcut Fiyat</span>
              <span className="text-lg font-bold text-gray-900">
                {suggestion.currentPrice} {suggestion.currency}
              </span>
            </div>
            <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
              <span className="text-[10px] text-green-600 block uppercase mb-1">
                Önerilen Fiyat
              </span>
              <span className="text-lg font-bold text-green-700">
                {suggestion.suggestedPrice} {suggestion.currency}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">
              Rakip Karşılaştırması
            </h4>
            <div className="space-y-2">
              {suggestion.competitors.map((comp: any) => (
                <div
                  key={comp.platform}
                  className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded-lg text-sm"
                >
                  <span className="text-gray-700 font-medium">{comp.platform}</span>
                  <span className="text-gray-900 font-bold">
                    {comp.price} {comp.currency}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              Kapat
            </button>
            <button
              onClick={() => onApply(suggestion.suggestedPrice)}
              className="flex-[2] py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg shadow-lg"
            >
              Fiyatı Güncelle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
