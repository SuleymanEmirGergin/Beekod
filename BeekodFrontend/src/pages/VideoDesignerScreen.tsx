import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarV2 } from '../layouts/SidebarV2';
import {
  Video,
  Sparkles,
  Play,
  Layers,
  Music,
  Share2,
  Download,
  Plus,
  Search,
  ChevronRight,
  Clock,
  Type,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Zap,
  Instagram,
  Youtube,
  Smartphone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getInventory, InventoryProduct } from '../services/inventory';
import { generateVideoScript, VideoScript, generateVideoMedia, generateAIVideo, checkVideoStatus } from '../services/video';
import { VideoAnalyticsTab } from '../components/VideoAnalyticsTab';
import { toast } from 'sonner';

interface VideoDesignerScreenProps {
  onNavigate: (screen: string) => void;
}

export function VideoDesignerScreen({ onNavigate }: VideoDesignerScreenProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [vibe, setVibe] = useState('Energetic');
  const [platform, setPlatform] = useState('instagram');
  const [script, setScript] = useState<VideoScript | null>(null);
  const [renderStatus, setRenderStatus] = useState<'idle' | 'rendering' | 'done'>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'designer' | 'analytics'>('designer');
  const [showMobileConfig, setShowMobileConfig] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getInventory();
      setProducts(data);
    } catch (error) {
      toast.error('Ürünler yüklenemedi');
    }
  };

  const handleGenerateScript = async () => {
    if (!selectedProduct) {
      toast.error('Lütfen bir ürün seçin');
      return;
    }
    setLoading(true);
    try {
      const data = await generateVideoScript(selectedProduct.barcode, vibe, platform);
      setScript(data);
      toast.success('Viral senaryo hazır!');
    } catch (error) {
      toast.error('Senaryo oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleRenderVideo = async () => {
    if (!script || !selectedProduct) return;
    setRenderStatus('rendering');
    try {
      // 1. Start AI Video Generation task
      const { token } = await generateAIVideo(selectedProduct.barcode, vibe);

      // 2. Poll for status
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes (5s * 60)

      const poll = async () => {
        if (attempts >= maxAttempts) {
          throw new Error('Video oluşturma zaman aşımına uğradı');
        }

        const statusData = await checkVideoStatus(token);

        if (statusData.url) {
          setVideoUrl(statusData.url);
          setRenderStatus('done');
          toast.success('Video başarıyla oluşturuldu!');
          return;
        }

        attempts++;
        setTimeout(poll, 5000);
      };

      poll();

    } catch (error) {
      toast.error('Video oluşturulamadı');
      setRenderStatus('idle');
    }
  };

  const vibes = [
    { id: 'Energetic', label: 'Enerjik', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    {
      id: 'Professional',
      label: 'Profesyonel',
      icon: CheckCircle2,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      id: 'Emotional',
      label: 'Duygusal',
      icon: Sparkles,
      color: 'text-pink-600',
      bg: 'bg-pink-100',
    },
    { id: 'Funny', label: 'Eğlenceli', icon: Play, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  const platforms = [
    { id: 'instagram', label: 'Reels', icon: Instagram },
    { id: 'tiktok', label: 'TikTok', icon: Smartphone },
    { id: 'youtube_shorts', label: 'Shorts', icon: Youtube },
  ];

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm),
  );

  return (
    <div className="flex h-screen bg-[#FDFCF9]">
      <SidebarV2
        activeItem="video-designer"
        onNavigate={onNavigate}
        userName="Emir"
        userEmail="emir@beekod.com"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 font-display">AI Video Designer</h1>
              <p className="text-xs text-gray-500 font-medium">
                Viral içerikler saniyeler içinde kapında.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex bg-gray-100 p-1 rounded-xl mr-4">
              <button
                onClick={() => setActiveTab('designer')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'designer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> Designer
                </div>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'analytics' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" /> Analytics
                </div>
              </button>
            </div>
            {script && (
              <button
                onClick={() => {
                  setScript(null);
                  setRenderStatus('idle');
                }}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
              >
                Yeni Taslak
              </button>
            )}
            <button
              onClick={() => setShowMobileConfig(!showMobileConfig)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold border border-indigo-100 transition-all active:scale-95"
            >
              <Plus className={`w-4 h-4 transition-transform ${showMobileConfig ? 'rotate-45' : ''}`} />
              Yapılandır
            </button>
            <button
              onClick={() => {
                if (!videoUrl || !script || !selectedProduct) {
                  toast.error('Önce bir video oluşturmalısınız');
                  return;
                }
                navigate('/social-scheduler', {
                  state: {
                    prefill: {
                      content: script.description + '\n\n' + script.hashtags.join(' '),
                      mediaUrl: videoUrl,
                      productId: selectedProduct.id || selectedProduct.barcode, // fallback to barcode if id missing
                      platform:
                        platform === 'instagram'
                          ? 'Instagram'
                          : platform === 'tiktok'
                            ? 'TikTok'
                            : 'YouTube',
                    },
                  },
                });
              }}
              className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-xl shadow-gray-200 hover:bg-black transition-all"
            >
              <Share2 className="w-4 h-4" /> Yayınla
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex">
          {activeTab === 'analytics' ? (
            <div className="flex-1 overflow-y-auto bg-white p-8">
              <VideoAnalyticsTab
                videoId={selectedProduct?.barcode || 'all'}
                productBarcode={selectedProduct?.barcode}
              />
            </div>
          ) : (
            <>
              {/* Left: Configuration */}
              <div
                className={`
                  ${showMobileConfig ? 'fixed inset-0 z-50 bg-white' : 'hidden'} 
                  lg:relative lg:block lg:w-[400px] border-r border-gray-100 bg-white overflow-y-auto pb-24
                `}
              >
                <div className="p-8 space-y-8 relative">
                  {/* Mobile Close Button */}
                  <button
                    onClick={() => setShowMobileConfig(false)}
                    className="lg:hidden absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
                  >
                    <Plus className="w-6 h-6 rotate-45 text-gray-400" />
                  </button>
                  {/* Product Select */}
                  <section>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                      1. ÜRÜN SEÇİMİ
                    </h3>
                    <div className="relative mb-4">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Ürün ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.barcode}
                          onClick={() => setSelectedProduct(product)}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border ${selectedProduct?.barcode === product.barcode
                            ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                            : 'bg-white border-transparent hover:bg-gray-50'
                            }`}
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          <div className="text-left overflow-hidden">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {product.name}
                            </p>
                            <p className="text-[10px] font-medium text-gray-400">{product.price}</p>
                          </div>
                          {selectedProduct?.barcode === product.barcode && (
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 ml-auto shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Vibe Select */}
                  <section>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                      2. VİDEO MODU (VIBE)
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {vibes.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setVibe(v.id)}
                          className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all group ${vibe === v.id
                            ? 'bg-white border-indigo-600 shadow-lg shadow-indigo-100 scale-105'
                            : 'bg-gray-50 border-transparent hover:border-gray-200'
                            }`}
                        >
                          <div
                            className={`w-10 h-10 ${v.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                          >
                            <v.icon className={`w-5 h-5 ${v.color}`} />
                          </div>
                          <span className="text-[11px] font-bold text-gray-700">{v.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Platform Select */}
                  <section>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                      3. PLATFORM
                    </h3>
                    <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl">
                      {platforms.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setPlatform(p.id)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold transition-all ${platform === p.id
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                          <p.icon className="w-4 h-4" />
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </section>

                  <button
                    disabled={loading || !selectedProduct}
                    onClick={handleGenerateScript}
                    className="w-full py-4 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-3 overflow-hidden group min-h-[60px] border border-transparent disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none disabled:border-gray-200 bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Sparkles className={`w-5 h-5 transition-transform ${loading || !selectedProduct ? 'text-gray-400' : 'text-white group-hover:rotate-12'}`} />
                    <span className={`font-black text-sm uppercase tracking-wide ${loading || !selectedProduct ? 'text-gray-500' : 'text-white'}`}>
                      {loading
                        ? 'SIHİR YAPILIYOR...'
                        : !selectedProduct
                          ? '1. ADIM: LÜTFEN BİR ÜRÜN SEÇİNİZ'
                          : 'SENARYO ÜRET'}
                    </span>
                    {loading && <Loader2 className="w-5 h-5 text-white animate-spin" />}
                  </button>
                </div>
              </div>

              {/* Right: Workspace */}
              <div className="flex-1 bg-gray-50/50 relative overflow-y-auto">
                <AnimatePresence mode="wait">
                  {!script ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="h-full flex flex-col items-center justify-center p-12 text-center"
                    >
                      <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center mb-8 transform -rotate-6">
                        <Sparkles className="w-12 h-12 text-indigo-500" />
                      </div>
                      <h2 className="text-3xl font-black text-gray-900 mb-4 font-display">
                        Video Prodüksiyonu AI'a Emanet!
                      </h2>
                      <p className="text-gray-500 max-w-lg font-medium leading-relaxed">
                        Ürününüzü seçin ve modunuzu belirleyin. Saniyeler içinde viral senaryolar
                        hazırlayalım, sahneleri kurgulayalım ve videoyu renderlayalım.
                      </p>

                      <button
                        onClick={() => setShowMobileConfig(true)}
                        className="mt-8 flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all lg:hidden"
                      >
                        <Plus className="w-5 h-5" />
                        Ürün Seç ve Başla
                      </button>

                      <div className="mt-12 flex items-center gap-8 text-indigo-400">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full border-2 border-dashed border-indigo-200 flex items-center justify-center text-xs font-bold">
                            1
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Senaryo
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full border-2 border-dashed border-indigo-200 flex items-center justify-center text-xs font-bold">
                            2
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Kurgu
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full border-2 border-dashed border-indigo-200 flex items-center justify-center text-xs font-bold">
                            3
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Render
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-8 max-w-4xl mx-auto space-y-8"
                    >
                      {/* Preview & Script */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Mobile Preview Device */}
                        <div className="flex justify-center">
                          <div className="w-[280px] h-[580px] bg-gray-900 rounded-[40px] border-[8px] border-gray-800 shadow-2xl relative overflow-hidden group">
                            {renderStatus === 'idle' ? (
                              <div className="absolute inset-0 bg-indigo-900 flex flex-col items-center justify-center p-8 text-center bg-[url('https://images.unsplash.com/photo-1614850523296-d8c1af93d400?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80')] bg-cover">
                                <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm"></div>
                                <div className="relative z-10">
                                  <div
                                    className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mb-6 border border-white/30 cursor-pointer hover:scale-110 transition-all active:scale-95"
                                    onClick={handleRenderVideo}
                                  >
                                    <Play className="w-8 h-8 text-white fill-current" />
                                  </div>
                                  <h4 className="text-white font-black text-xl mb-2">
                                    {script.title}
                                  </h4>
                                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest">
                                    Preview Mode
                                  </p>
                                </div>
                              </div>
                            ) : renderStatus === 'rendering' ? (
                              <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center p-8">
                                <div className="relative mb-8">
                                  <div className="w-32 h-32 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                  <Sparkles className="w-12 h-12 text-indigo-500 absolute inset-0 m-auto animate-pulse" />
                                </div>
                                <h4 className="text-white font-bold mb-2">Video Oluşturuluyor</h4>
                                <p className="text-gray-400 text-[10px] font-medium text-center italic">
                                  AI sahneleri birleştiriyor, seslendirme ekleniyor...
                                </p>
                                <div className="w-full h-1 bg-gray-800 mt-8 rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full bg-indigo-500"
                                    animate={{ width: ['0%', '100%'] }}
                                    transition={{ duration: 5 }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <video
                                src={videoUrl || ''}
                                className="h-full w-full object-cover"
                                autoPlay
                                loop
                                muted
                              />
                            )}

                            {/* UI Overlay */}
                            <div className="absolute bottom-12 left-6 right-6 z-10 space-y-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                <p className="text-white text-[10px] line-clamp-2">
                                  @{selectedProduct?.name} #Viral #BeekodAI
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Script Details */}
                        <div className="space-y-6">
                          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-bold text-gray-900">Senaryo Detayları</h3>
                              <div className="flex gap-2">
                                <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-lg">
                                  AI VALIDATED
                                </span>
                                <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {script.estimatedDuration}sn
                                </span>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                  Kanca (Hook)
                                </p>
                                <p className="text-sm font-bold text-gray-900">"{script.hook}"</p>
                              </div>
                              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                  Açıklama & Tagler
                                </p>
                                <p className="text-xs text-gray-600 mb-2">{script.description}</p>
                                <div className="flex flex-wrap gap-1">
                                  {script.hashtags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-[10px] font-bold text-indigo-500"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                            <Sparkles className="w-24 h-24 text-white/10 absolute -top-8 -right-8 group-hover:rotate-12 transition-transform" />
                            <h3 className="text-lg font-bold mb-2">Hazır mısınız?</h3>
                            <p className="text-indigo-100 text-xs mb-6 font-medium leading-relaxed">
                              Senaryoyu beğendiyseniz yapay zekanın görsel üretme ve kurgu motorunu
                              çalıştırın.
                            </p>
                            <button
                              disabled={renderStatus === 'rendering'}
                              onClick={handleRenderVideo}
                              className="w-full py-4 bg-white text-indigo-600 font-black rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.95] transition-all flex items-center justify-center gap-2"
                            >
                              {renderStatus === 'rendering'
                                ? 'RENDERLANIYOR...'
                                : 'VİDEOYU RENDERLA'}
                              {renderStatus === 'rendering' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Zap className="w-4 h-4 fill-current" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Scenes Timeline */}
                      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Layers className="w-5 h-5 text-indigo-500" />
                            <h3 className="font-bold text-gray-900">Sahne Akışı (Storyline)</h3>
                          </div>
                          <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                            TÜMÜNÜ DÜZENLE
                          </button>
                        </div>
                        <div className="p-6 space-y-3">
                          {script.scenes.map((scene, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className="group flex gap-6 p-5 rounded-2xl border border-gray-50 hover:border-indigo-100 hover:bg-gray-50/50 transition-all"
                            >
                              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0 font-black text-gray-300 group-hover:text-indigo-200 group-hover:border-indigo-100 transition-colors">
                                {scene.sceneNumber}
                              </div>
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <ImageIcon className="w-3 h-3 text-indigo-400" />
                                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Görsel Tarif
                                      </span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-700 leading-relaxed italic">
                                      "{scene.visualParams}"
                                    </p>
                                  </div>
                                  <div className="w-1 bg-gray-100 h-10 self-center rounded-full"></div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Type className="w-3 h-3 text-indigo-400" />
                                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Seslendirme / Metin
                                      </span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-900 leading-relaxed uppercase tracking-tight">
                                      {scene.audioScript}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-center justify-center px-4 bg-gray-100/50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                                <span className="text-[10px] font-black text-gray-400 group-hover:text-indigo-400">
                                  {scene.duration}sn
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
