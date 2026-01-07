import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Globe,
    Sparkles,
    ArrowRight,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    ChevronLeft,
    Rocket,
    Plus
} from 'lucide-react';
import { SidebarV2 } from '../layouts/SidebarV2';
import {
    searchDiscoveryProducts,
    extractProductDetails,
    generateAIListing,
    publishProductToMarketplaces,
    DiscoveryProduct,
    CanonicalProduct,
    AIListingDraft
} from '../services/discoveryService';
import { toast } from 'sonner';

interface DiscoveryLandingScreenProps {
    onNavigate: (screen: string) => void;
}

export function DiscoveryLandingScreen({ onNavigate }: DiscoveryLandingScreenProps) {
    const [step, setStep] = useState<'search' | 'results' | 'edit' | 'publishing'>('search');
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<DiscoveryProduct[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<CanonicalProduct | null>(null);
    const [aiDrafts, setAiDrafts] = useState<Record<string, AIListingDraft>>({});
    const [publishingProgress, setPublishingProgress] = useState(0);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const data = await searchDiscoveryProducts(query);
            setResults(data);
            setStep('results');
        } catch (error) {
            toast.error('Arama sırasında bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProduct = async (url: string) => {
        setLoading(true);
        try {
            const product = await extractProductDetails(url);
            setSelectedProduct(product);

            // AI Draft for primary marketplace (e.g. Trendyol)
            const trendyolDraft = await generateAIListing(product, 'Trendyol');
            setAiDrafts({ Trendyol: trendyolDraft });

            setStep('edit');
        } catch (error) {
            toast.error('Ürün detayları alınamadı.');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!selectedProduct) return;

        setStep('publishing');
        setPublishingProgress(10);

        try {
            const marketplaces = ['Trendyol', 'N11']; // Simplified for demo
            const { jobIds } = await publishProductToMarketplaces({
                productData: selectedProduct,
                marketplaces,
                userId: '1' // Assuming demo user
            });

            // Simulate progress for visual feel (real polling would be better but keeping it simple)
            let progress = 20;
            const interval = setInterval(() => {
                progress += 15;
                if (progress >= 100) {
                    clearInterval(interval);
                    setPublishingProgress(100);
                    toast.success('Ürünler başarıyla kuyruğa eklendi!');
                    setTimeout(() => onNavigate('dashboard'), 2000);
                } else {
                    setPublishingProgress(progress);
                }
            }, 500);

        } catch (error) {
            toast.error('Yayınlama sırasında bir hata oluştu.');
            setStep('edit');
        }
    };

    return (
        <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950 font-sans">
            <SidebarV2 activeItem="discovery" onNavigate={onNavigate} userName="Admin" userEmail="admin@beekod.io" />

            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-12 flex items-center justify-between">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight"
                            >
                                Ürün Keşfi <span className="text-amber-500 font-black italic">AI</span>
                            </motion.h1>
                            <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                                Google'da ara, AI ile zenginleştir, saniyeler içinde tüm pazaryerlerinde yayınla.
                            </p>
                        </div>

                        {step !== 'search' && (
                            <button
                                onClick={() => setStep('search')}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-amber-600 transition-colors"
                            >
                                <ChevronLeft size={18} /> Yeni Arama
                            </button>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {/* STEP 1: SEARCH */}
                        {step === 'search' && (
                            <motion.div
                                key="search"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col items-center justify-center pt-20"
                            >
                                <div className="w-full max-w-2xl relative">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                    <form onSubmit={handleSearch} className="relative flex items-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-2 shadow-2xl overflow-hidden">
                                        <Search className="ml-4 text-neutral-400" size={24} />
                                        <input
                                            type="text"
                                            placeholder="Ürün adı, barkod veya marka girin..."
                                            className="flex-1 px-4 py-4 bg-transparent outline-none text-lg text-neutral-800 dark:text-neutral-100"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-xl transition-all flex items-center gap-2 h-full shadow-lg shadow-amber-500/30"
                                        >
                                            {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                                            Keşfet
                                        </button>
                                    </form>
                                </div>

                                <div className="mt-8 flex gap-4">
                                    {['iPhone 15 Pro Max', 'Xiaomi Air Fryer', 'Dyson V15'].map(hint => (
                                        <button
                                            key={hint}
                                            onClick={() => { setQuery(hint); handleSearch(); }}
                                            className="px-4 py-2 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500 hover:border-amber-500 transition-all shadow-sm"
                                        >
                                            {hint}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: RESULTS */}
                        {step === 'results' && (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {results.map((res, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="group relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
                                        onClick={() => handleSelectProduct(res.sourceUrl)}
                                    >
                                        <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                                            {res.thumbnail ? (
                                                <img src={res.thumbnail} alt={res.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <Globe size={48} className="text-neutral-300" />
                                            )}
                                        </div>
                                        <div className="p-5">
                                            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 line-clamp-2 min-h-[3rem]">
                                                {res.title}
                                            </h3>
                                            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                                {res.snippet}
                                            </p>
                                            <div className="mt-4 flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 italic">Google Kaynağı</span>
                                                <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-neutral-800 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                                                    <Plus size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {/* STEP 3: EDIT & AI */}
                        {step === 'edit' && selectedProduct && (
                            <motion.div
                                key="edit"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                            >
                                {/* Left Panel: Preview */}
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 overflow-hidden">
                                        <img
                                            src={selectedProduct.images[0] || 'https://via.placeholder.com/400'}
                                            alt="Preview"
                                            className="w-full aspect-square object-contain rounded-2xl bg-neutral-50 dark:bg-neutral-800 mb-6"
                                        />
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {selectedProduct.images.slice(1, 4).map((img, i) => (
                                                <img key={i} src={img} className="w-16 h-16 rounded-lg object-cover border border-neutral-100 flex-shrink-0" />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
                                        <Sparkles className="text-amber-500 shrink-0" />
                                        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                                            Bu içerik Gemini Pro tarafından pazaryeri standartlarına uygun olarak optimize edildi.
                                        </p>
                                    </div>
                                </div>

                                {/* Right Panel: AI Editor */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
                                        <div className="mb-6 flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                                            <div className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-black text-neutral-500">TRENDYOL TASLAĞI</div>
                                            <div className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-black text-neutral-500">N11 TASLAĞI</div>
                                        </div>

                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-xs font-black text-neutral-400 mb-2 tracking-widest uppercase">Pazaryeri Başlığı</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl text-lg font-bold focus:ring-2 ring-amber-500"
                                                    defaultValue={aiDrafts.Trendyol?.title}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-black text-neutral-400 mb-2 tracking-widest uppercase">Ürün Açıklaması (AI Optimize)</label>
                                                <textarea
                                                    rows={8}
                                                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl text-sm leading-relaxed focus:ring-2 ring-amber-500"
                                                    defaultValue={aiDrafts.Trendyol?.description}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-8 flex items-center justify-between pt-6 border-t border-neutral-100 dark:border-neutral-800">
                                            <div className="flex -space-x-2">
                                                {['https://cdn-icons-png.flaticon.com/512/12431/12431874.png', 'https://cdn-icons-png.flaticon.com/512/12431/12431875.png'].map((icon, i) => (
                                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-white shrink-0">
                                                        <img src={icon} className="w-full h-full grayscale opacity-50" />
                                                    </div>
                                                ))}
                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-400">+4</div>
                                            </div>

                                            <button
                                                onClick={handlePublish}
                                                className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-black px-10 py-4 rounded-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl"
                                            >
                                                <Rocket size={20} /> YAYINLA
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: PUBLISHING PROGRESS */}
                        {step === 'publishing' && (
                            <motion.div
                                key="publishing"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center pt-20"
                            >
                                <div className="w-32 h-32 relative mb-8">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-neutral-100 dark:text-neutral-800" />
                                        <circle
                                            cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                                            className="text-amber-500 transition-all duration-500 ease-out"
                                            strokeDasharray={364.4}
                                            strokeDashoffset={364.4 - (364.4 * publishingProgress) / 100}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {publishingProgress < 100 ? (
                                            <Rocket className="text-amber-500 animate-bounce" size={40} />
                                        ) : (
                                            <CheckCircle2 className="text-green-500" size={40} />
                                        )}
                                    </div>
                                </div>

                                <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">
                                    {publishingProgress < 100 ? 'Senkronizasyon Başlatıldı...' : 'Harika! İşlem Tamam.'}
                                </h2>
                                <p className="text-neutral-500 text-center max-w-sm">
                                    Ürününüz Trendyol, N11 ve Pazarama kuyruğuna eklendi. Arka planda işlenmeye devam ediyor.
                                </p>

                                <div className="mt-8 w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 divide-y divide-neutral-50 dark:divide-neutral-800">
                                    {['Trendyol', 'N11', 'Hepsiburada'].map(mp => (
                                        <div key={mp} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${publishingProgress > 50 ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                                                <span className="text-sm font-bold">{mp}</span>
                                            </div>
                                            <span className="text-xs font-black text-neutral-400">KUYRUKTA</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-neutral-950/20 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-amber-500" size={48} />
                        <p className="text-sm font-black text-neutral-500 uppercase tracking-widest">Veriler İşleniyor...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
