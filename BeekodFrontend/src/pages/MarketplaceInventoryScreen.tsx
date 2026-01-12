import { useState, useEffect } from 'react';
import { SidebarV2 } from '../layouts/SidebarV2';
import {
    getConsolidatedInventory,
    bulkUpdateMarketplacePrice,
    optimizeProductContent,
    saveRepricerConfig,
    getRepricerConfig
} from '../services/inventory';
import {
    Package,
    Search,
    RefreshCw,
    Settings2,
    ArrowRight,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    LayoutGrid,
    List,
    Edit3,
    ExternalLink,
    ChevronDown,
    Loader2,
    Sparkles,
    Zap,
    BarChart3,
    X
} from 'lucide-react';
import { Card } from '../components/shared/';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export function MarketplaceInventoryScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [newPrice, setNewPrice] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    // AI & Repricer state
    const [showAIModal, setShowAIModal] = useState(false);
    const [showRepricerModal, setShowRepricerModal] = useState(false);
    const [aiResult, setAiResult] = useState<any>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [repricerConfig, setRepricerConfig] = useState({
        minPrice: '',
        maxPrice: '',
        targetPosition: 'lowest'
    });

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        setLoading(true);
        try {
            const data = await getConsolidatedInventory();
            setInventory(data);
        } catch (error) {
            toast.error('Envanter yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkPriceUpdate = async () => {
        if (!selectedProduct || !newPrice) return;
        setIsUpdating(true);
        try {
            await bulkUpdateMarketplacePrice(selectedProduct.barcode, parseFloat(newPrice), selectedProduct.marketplaces);
            toast.success('Fiyat başarıyla güncellendi');
            setShowUpdateModal(false);
            loadInventory();
        } catch (error) {
            toast.error('Fiyat güncellenirken hata oluştu');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleOptimize = async () => {
        if (!selectedProduct) return;
        setIsOptimizing(true);
        try {
            const result = await optimizeProductContent(selectedProduct.title, 'Bu ürün için AI açıklaması oluşturuluyor...');
            setAiResult(result);
            toast.success('AI optimizasyonu tamamlandı!');
        } catch (error) {
            toast.error('AI optimizasyonu sırasında hata oluştu');
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleSaveRepricer = async () => {
        if (!selectedProduct) return;
        try {
            await saveRepricerConfig({
                barcode: selectedProduct.barcode,
                minPrice: parseFloat(repricerConfig.minPrice),
                maxPrice: parseFloat(repricerConfig.maxPrice),
                targetPosition: repricerConfig.targetPosition,
                enabled: true
            });
            toast.success('Repricer ayarları kaydedildi ve aktif edildi!');
            setShowRepricerModal(false);
        } catch (error) {
            toast.error('Repricer ayarları kaydedilemedi');
        }
    };

    const filteredInventory = inventory.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode.includes(searchQuery)
    );

    return (
        <div className="flex h-screen bg-[#F8FAFC] dark:bg-slate-900 transition-colors duration-300">
            <SidebarV2 activeItem="marketplace-inventory" onNavigate={onNavigate} />

            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Background Gradients */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] -z-10 rounded-full" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] -z-10 rounded-full" />

                <header className="px-8 py-6 flex items-center justify-between border-b border-gray-100 bg-white/50 backdrop-blur-md">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Package className="text-amber-500" />
                            MERKEZİ PAZARYERİ ENVANTERİ
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">Bağlı tüm mağazalarınızın stok ve fiyat kontrolü.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <List size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                        <button
                            onClick={loadInventory}
                            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:border-amber-500 transition-all text-slate-600 hover:text-amber-500"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8">
                    {/* Search & Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 ring-amber-500 transition-all"
                                placeholder="Ürün adı, barkod veya SKU ara..."
                            />
                        </div>

                        <Card className="flex items-center gap-4 p-4 border-none shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                                <CheckCircle className="text-amber-600" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">AKTİF LİSTELEME</div>
                                <div className="text-xl font-black text-slate-800">{inventory.length}</div>
                            </div>
                        </Card>

                        <Card className="flex items-center gap-4 p-4 border-none shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                <TrendingUp className="text-blue-600" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOPLAM STOK</div>
                                <div className="text-xl font-black text-slate-800">
                                    {inventory.reduce((acc, curr) => acc + curr.totalStock, 0)}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="animate-spin text-amber-500" size={40} />
                            <p className="font-bold text-slate-400 animate-pulse">Envanter taranıyor...</p>
                        </div>
                    ) : viewMode === 'table' ? (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ürün Detayı</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pazaryerleri</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiyat Aralığı</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Toplam Stok</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredInventory.map((item) => (
                                        <tr key={item.barcode} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200">
                                                        {item.image ? (
                                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package size={24} className="text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-800 line-clamp-1">{item.title}</div>
                                                        <div className="text-xs font-mono text-slate-400">{item.barcode}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center -space-x-2">
                                                    {item.marketplaces.map((mp: string) => (
                                                        <div key={mp} className="w-8 h-8 rounded-full border-2 border-white bg-white shadow-sm flex items-center justify-center overflow-hidden" title={mp}>
                                                            <span className="text-[10px] font-black uppercase text-amber-600">
                                                                {mp.slice(0, 2)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-sm font-black text-slate-800">
                                                    ₺{item.minPrice} - ₺{item.maxPrice}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${item.totalStock > 20 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {item.totalStock} Adet
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedProduct(item);
                                                            setShowAIModal(true);
                                                        }}
                                                        className="p-2 hover:bg-purple-100 rounded-xl text-purple-600 transition-all opacity-0 group-hover:opacity-100"
                                                        title="AI ile Optimize Et"
                                                    >
                                                        <Sparkles size={18} />
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            setSelectedProduct(item);
                                                            const existingConfig = await getRepricerConfig(item.barcode);
                                                            if (existingConfig) {
                                                                setRepricerConfig({
                                                                    minPrice: existingConfig.minPrice.toString(),
                                                                    maxPrice: existingConfig.maxPrice.toString(),
                                                                    targetPosition: existingConfig.targetPosition
                                                                });
                                                            } else {
                                                                setRepricerConfig({
                                                                    minPrice: item.minPrice.toString(),
                                                                    maxPrice: item.maxPrice.toString(),
                                                                    targetPosition: 'lowest'
                                                                });
                                                            }
                                                            setShowRepricerModal(true);
                                                        }}
                                                        className="p-2 hover:bg-blue-100 rounded-xl text-blue-600 transition-all opacity-0 group-hover:opacity-100"
                                                        title="Repricer Ayarları"
                                                    >
                                                        <Zap size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedProduct(item)}
                                                        className="p-2 hover:bg-amber-100 rounded-xl text-amber-600 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredInventory.map((item) => (
                                <motion.div
                                    layout
                                    key={item.barcode}
                                    className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all relative overflow-hidden group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform overflow-hidden">
                                            {item.image ? (
                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package size={28} className="text-slate-400" />
                                            )}
                                        </div>
                                        <div className="flex -space-x-1.5">
                                            {item.marketplaces.map((mp: string) => (
                                                <div key={mp} className="w-6 h-6 rounded-full border border-white bg-slate-50 flex items-center justify-center text-[8px] font-black uppercase text-slate-600 shadow-sm" title={mp}>
                                                    {mp.slice(0, 1)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-bold text-slate-800 line-clamp-2 mb-2 h-10">{item.title}</h3>

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase">ORTALAMA FİYAT</p>
                                            <p className="text-sm font-black text-amber-500">₺{((item.minPrice + item.maxPrice) / 2).toFixed(2)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">STOK</p>
                                            <p className="text-sm font-black text-slate-800">{item.totalStock}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedProduct(item)}
                                        className="absolute top-4 right-4 p-2 bg-slate-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-amber-500 hover:text-white"
                                    >
                                        <Settings2 size={16} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </main>

                {/* Update Modal */}
                <AnimatePresence>
                    {selectedProduct && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white rounded-[40px] shadow-2xl max-w-lg w-full overflow-hidden border border-white/20"
                            >
                                <div className="p-10 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h2 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight">GLOBAL FİYAT GÜNCELLE</h2>
                                            <p className="text-xs font-bold text-slate-400">Tüm pazaryerlerinde fiyatı tek tıkla senkronize et.</p>
                                        </div>
                                        <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center">
                                            <Edit3 className="text-amber-500" size={32} />
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center font-black text-amber-500">
                                            {selectedProduct.marketplaces.length}
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-slate-400 uppercase">ETKİLENECEK MAĞAZA</div>
                                            <div className="text-sm font-bold text-slate-700">{selectedProduct.marketplaces.join(', ')}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">YENİ BİRİM FİYAT (TRY)</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">₺</span>
                                            <input
                                                autoFocus
                                                type="number"
                                                value={newPrice}
                                                onChange={(e) => setNewPrice(e.target.value)}
                                                className="w-full bg-slate-100 border-none rounded-[24px] py-6 pl-14 pr-8 text-3xl font-black text-slate-900 focus:ring-4 ring-amber-500/10 transition-all placeholder:text-slate-300"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={() => setSelectedProduct(null)}
                                            className="flex-1 py-5 rounded-[24px] font-black text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
                                        >
                                            Vazgeç
                                        </button>
                                        <button
                                            onClick={handleBulkPriceUpdate}
                                            disabled={isUpdating || !newPrice}
                                            className="flex-[2] py-5 bg-amber-500 hover:bg-amber-600 shadow-xl shadow-amber-500/20 text-white rounded-[24px] font-black border-b-4 border-amber-700 transition-all active:translate-y-1 active:border-b-0 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                                        >
                                            {isUpdating ? <Loader2 className="animate-spin" /> : <RefreshCw size={16} />}
                                            Fiyatı Eşitle
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* AI Optimization Modal */}
                <AnimatePresence>
                    {showAIModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden"
                            >
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                                            <Sparkles size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-800">AI Ürün Optimizasyonu</h2>
                                            <p className="text-sm font-medium text-slate-400">Ürününüzü yapay zeka ile uçurun</p>
                                        </div>
                                    </div>
                                    <button onClick={() => {
                                        setShowAIModal(false);
                                        setAiResult(null);
                                    }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                </div>

                                <div className="p-8 space-y-6">
                                    {!aiResult ? (
                                        <div className="text-center py-10 space-y-4">
                                            <p className="text-slate-500 font-medium">Bu ürünün başlık ve açıklamasını AI ile modernize edelim mi?</p>
                                            <button
                                                onClick={handleOptimize}
                                                disabled={isOptimizing}
                                                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black shadow-lg shadow-purple-200 transition-all flex items-center gap-4 mx-auto disabled:opacity-50"
                                            >
                                                {isOptimizing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                                                {isOptimizing ? 'İşleniyor...' : 'AI ile Optimize Et'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">YENİ BAŞLIK</label>
                                                <div className="p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-800 border border-purple-100">
                                                    {aiResult.title}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">YENİ AÇIKLAMA</label>
                                                <div className="p-4 bg-slate-50 rounded-2xl text-xs font-medium text-slate-600 border border-slate-100 whitespace-pre-wrap max-h-40 overflow-y-auto">
                                                    {aiResult.description}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">ANAHTAR KELİMELER</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {aiResult.keywords.map((k: string) => (
                                                        <span key={k} className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase">#{k}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    toast.success('Optimizasyon başarıyla uygulandı!');
                                                    setShowAIModal(false);
                                                    setAiResult(null);
                                                }}
                                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black transition-all hover:bg-slate-800"
                                            >
                                                Varyantları Güncelle
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Repricer Modal */}
                <AnimatePresence>
                    {showRepricerModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden"
                            >
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                                            <Zap size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-800">Repricer Ayarları</h2>
                                            <p className="text-sm font-medium text-slate-400">Otomatik rekabetçi fiyatlandırma</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowRepricerModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">MİNİMUM FİYAT</label>
                                            <input
                                                type="number"
                                                value={repricerConfig.minPrice}
                                                onChange={(e) => setRepricerConfig({ ...repricerConfig, minPrice: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="₺0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">MAKSİMUM FİYAT</label>
                                            <input
                                                type="number"
                                                value={repricerConfig.maxPrice}
                                                onChange={(e) => setRepricerConfig({ ...repricerConfig, maxPrice: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="₺0.00"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">HEDEF KONUM</label>
                                        <select
                                            value={repricerConfig.targetPosition}
                                            onChange={(e) => setRepricerConfig({ ...repricerConfig, targetPosition: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                        >
                                            <option value="lowest">En Düşük Fiyat (Buybox Odaklı)</option>
                                            <option value="average">Ortalama Fiyat</option>
                                            <option value="buybox">Tam Buybox Konumu</option>
                                        </select>
                                    </div>

                                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
                                        <BarChart3 className="text-blue-600 shrink-0" size={20} />
                                        <p className="text-xs font-medium text-blue-700 leading-relaxed">
                                            Repricer aktif edildiğinde sistem rakiplerinizi her saat başı kontrol eder ve fiyatınızı güvenli sınırda tutar.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleSaveRepricer}
                                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 transition-all hover:bg-blue-700"
                                    >
                                        Repricer'ı Aktif Et
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
