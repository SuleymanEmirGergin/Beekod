import { useState, useEffect } from 'react';
import { SidebarV2 } from '../layouts/SidebarV2';
import {
  RefreshCw,
  Link,
  AlertCircle,
  CheckCircle2,
  Globe,
  Package,
  TrendingUp,
  History,
  ArrowRight,
  ExternalLink,
  Store,
  LayoutGrid,
  Search,
  Filter,
  MoreHorizontal,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getMarketplaceListings,
  bulkSyncProduct,
  ListingsResponse,
  MarketplaceListing,
} from '../services/marketplace';
import { getInventory, InventoryProduct } from '../services/inventory';
import { toast } from 'sonner';

interface MarketplaceSyncScreenProps {
  onNavigate: (screen: string) => void;
}

export function MarketplaceSyncScreen({ onNavigate }: MarketplaceSyncScreenProps) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listingsData, inventoryData] = await Promise.all([
        getMarketplaceListings(),
        getInventory(),
      ]);
      setListings(listingsData.items);
      setInventory(inventoryData);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSync = async (barcode: string) => {
    setSyncing(barcode);
    try {
      await bulkSyncProduct(barcode, 'sync');
      toast.success('Ürün tüm pazaryerlerine senkronize edildi');
      loadData();
    } catch (error) {
      toast.error('Senkronizasyon hatası');
    } finally {
      setSyncing(null);
    }
  };

  const getMarketplaceStatus = (barcode: string, marketplace: string) => {
    const listing = listings.find((l) => l.barcode === barcode && l.marketplace === marketplace);
    if (!listing) return 'not_listed';
    return listing.active ? 'active' : 'inactive';
  };

  const filteredInventory = inventory.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm),
  );

  const marketplaces = ['Trendyol', 'Hepsiburada', 'N11', 'Ciceksepeti', 'PttAVM', 'Pazarama'];

  return (
    <div className="flex h-screen bg-[#FDFCF9]">
      <SidebarV2 activeItem="marketplace-sync" onNavigate={onNavigate} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 font-display">
                Pazaryeri Senkronizasyonu
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Tüm mağazalarınızı tek bir merkezden yönetin.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Tazele
            </button>
            <button
              onClick={() => toast.info('AI Akıllı Eşleme özelliği yakında aktif olacak.')}
              className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-xl shadow-gray-200 hover:bg-black transition-all"
            >
              <Zap className="w-4 h-4 text-yellow-400 fill-current" /> Akıllı Eşleme (AI)
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                label: 'Toplam Listeleme',
                value: listings.length,
                icon: Package,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
              },
              {
                label: 'Aktif Satışta',
                value: listings.filter((l) => l.active).length,
                icon: CheckCircle2,
                color: 'text-green-600',
                bg: 'bg-green-50',
              },
              {
                label: 'Eksik Eşleşme',
                value: filteredInventory.length * marketplaces.length - listings.length,
                icon: AlertCircle,
                color: 'text-orange-600',
                bg: 'bg-orange-50',
              },
              {
                label: 'Global Görünürlük',
                value: '88%',
                icon: Globe,
                color: 'text-purple-600',
                bg: 'bg-purple-50',
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5"
              >
                <div
                  className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}
                >
                  <stat.icon className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ürün adı veya barkod ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>
              <button
                onClick={() => toast.info('Detaylı filtreler yakında eklenecek.')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-100 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" /> Filtreler
              </button>
            </div>
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl ml-4">
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <History className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Product Table */}
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Ürün Bilgisi
                  </th>
                  {marketplaces.map((m) => (
                    <th
                      key={m}
                      className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center"
                    >
                      {m}
                    </th>
                  ))}
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                    Aksiyon
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInventory.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&q=80')] bg-cover">
                          {/* Image Placeholder */}
                          <div className="absolute inset-0 bg-black/5"></div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                            {product.name}
                          </p>
                          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">
                            {product.barcode}
                          </p>
                        </div>
                      </div>
                    </td>
                    {marketplaces.map((m) => {
                      const status = getMarketplaceStatus(product.barcode, m);
                      return (
                        <td key={m} className="px-4 py-5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {status === 'active' ? (
                              <div className="w-8 h-8 bg-green-50 text-green-600 rounded-full flex items-center justify-center shadow-sm">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            ) : status === 'inactive' ? (
                              <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center opacity-50">
                                <AlertCircle className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center">
                                <Link className="w-4 h-4" />
                              </div>
                            )}
                            <span
                              className={`text-[9px] font-black uppercase ${status === 'active' ? 'text-green-600' : 'text-gray-300'}`}
                            >
                              {status === 'active'
                                ? 'AKTİF'
                                : status === 'inactive'
                                  ? 'PASİF'
                                  : 'BAĞLI DEĞİL'}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => handleBulkSync(product.barcode)}
                        disabled={syncing === product.barcode}
                        className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-orange-500 hover:text-orange-600 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                      >
                        {syncing === product.barcode ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        Senkr. Et
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
