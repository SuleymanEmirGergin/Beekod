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
  Wand2,
  LayoutTemplate,
  Palette,
  Settings,
  ChevronDown,
  Gem,
  Dumbbell,
  Minimize2,
  History,
  Camera,
  Sun,
  Move,
  Frame,
  Paintbrush,
  ArrowRight
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
  const [isManualMode, setIsManualMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Advanced settings state
  const [cameraAngle, setCameraAngle] = useState('dynamic');
  const [lighting, setLighting] = useState('studio');
  const [motionSpeed, setMotionSpeed] = useState('normal');
  const [background, setBackground] = useState('white_studio');
  const [colorTone, setColorTone] = useState('cool');

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
      // Build prompt from settings
      let finalPrompt: string | undefined;

      if (isManualMode && customPrompt) {
        finalPrompt = customPrompt;
      } else {
        // Build prompt from advanced settings
        const cameraLabel = cameraOptions.find(o => o.id === cameraAngle)?.label || cameraAngle;
        const lightingLabel = lightingOptions.find(o => o.id === lighting)?.label || lighting;
        const motionLabel = motionOptions.find(o => o.id === motionSpeed)?.label || motionSpeed;
        const bgLabel = backgroundOptions.find(o => o.id === background)?.label || background;
        const colorLabel = colorOptions.find(o => o.id === colorTone)?.label || colorTone;

        finalPrompt = `Camera: ${cameraLabel}. Lighting: ${lightingLabel}. Motion: ${motionLabel}. Background: ${bgLabel}. Color tone: ${colorLabel}. Style: ${vibe}, commercial quality.`;
      }

      // 1. Start AI Video Generation task
      const { token } = await generateAIVideo(
        selectedProduct.barcode,
        vibe,
        finalPrompt
      );

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

  // Preset configurations
  const presetConfigs: Record<string, { camera: string; lighting: string; motion: string; background: string; color: string }> = {
    'Energetic': { camera: 'dynamic', lighting: 'neon', motion: 'fast', background: 'urban', color: 'high_contrast' },
    'Professional': { camera: 'full_body', lighting: 'studio', motion: 'normal', background: 'white_studio', color: 'cool' },
    'Emotional': { camera: 'close_up', lighting: 'natural', motion: 'slow_motion', background: 'nature', color: 'warm' },
    'Funny': { camera: 'product_focus', lighting: 'colorful', motion: 'dynamic', background: 'minimalist', color: 'vintage' },
    'Luxury': { camera: 'close_up', lighting: 'dramatic', motion: 'slow_motion', background: 'dark_studio', color: 'warm' },
    'Sports': { camera: 'dynamic', lighting: 'natural', motion: 'fast', background: 'outdoor', color: 'high_contrast' },
    'Minimalist': { camera: 'full_body', lighting: 'studio', motion: 'normal', background: 'white_studio', color: 'cool' },
    'Retro': { camera: 'product_focus', lighting: 'warm', motion: 'normal', background: 'vintage_set', color: 'vintage' },
  };

  const vibes = [
    { id: 'Energetic', label: 'Enerjik', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { id: 'Professional', label: 'Profesyonel', icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { id: 'Emotional', label: 'Duygusal', icon: Sparkles, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    { id: 'Funny', label: 'Eğlenceli', icon: Play, color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    { id: 'Luxury', label: 'Lüks', icon: Gem, color: 'text-yellow-600', bg: 'bg-yellow-600/10', border: 'border-yellow-600/20' },
    { id: 'Sports', label: 'Spor', icon: Dumbbell, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { id: 'Minimalist', label: 'Minimalist', icon: Minimize2, color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
    { id: 'Retro', label: 'Retro', icon: History, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { id: 'Manual', label: 'Manuel', icon: Type, color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  ];

  const cameraOptions = [
    { id: 'dynamic', label: 'Dinamik / 360°' },
    { id: 'full_body', label: 'Tam Boy' },
    { id: 'close_up', label: 'Yakın Çekim' },
    { id: 'product_focus', label: 'Ürün Odaklı' },
  ];

  const lightingOptions = [
    { id: 'studio', label: 'Stüdyo' },
    { id: 'natural', label: 'Doğal' },
    { id: 'dramatic', label: 'Dramatik' },
    { id: 'neon', label: 'Neon' },
    { id: 'colorful', label: 'Renkli' },
    { id: 'warm', label: 'Sıcak' },
  ];

  const motionOptions = [
    { id: 'slow_motion', label: 'Slow Motion' },
    { id: 'normal', label: 'Normal' },
    { id: 'fast', label: 'Hızlı' },
    { id: 'dynamic', label: 'Dinamik' },
  ];

  const backgroundOptions = [
    { id: 'white_studio', label: 'Beyaz Stüdyo' },
    { id: 'dark_studio', label: 'Koyu Stüdyo' },
    { id: 'urban', label: 'Şehir / Sokak' },
    { id: 'nature', label: 'Doğa' },
    { id: 'minimalist', label: 'Minimalist' },
    { id: 'outdoor', label: 'Outdoor' },
    { id: 'vintage_set', label: 'Vintage Set' },
  ];

  const colorOptions = [
    { id: 'warm', label: 'Sıcak' },
    { id: 'cool', label: 'Soğuk' },
    { id: 'vintage', label: 'Vintage' },
    { id: 'high_contrast', label: 'Yüksek Kontrast' },
  ];

  const applyPreset = (presetId: string) => {
    const config = presetConfigs[presetId];
    if (config) {
      setCameraAngle(config.camera);
      setLighting(config.lighting);
      setMotionSpeed(config.motion);
      setBackground(config.background);
      setColorTone(config.color);
    }
  };

  const platforms = [
    { id: 'instagram', label: 'Reels', icon: Instagram, color: 'from-purple-500 to-pink-500' },
    { id: 'tiktok', label: 'TikTok', icon: Smartphone, color: 'from-black to-slate-800' },
    { id: 'youtube_shorts', label: 'Shorts', icon: Youtube, color: 'from-red-600 to-red-500' },
  ];

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm),
  );

  return (
    <div className="flex h-screen bg-[#F8F9FC] dark:bg-[#0A0A0B] font-sans selection:bg-indigo-500/30">
      <div className="hidden lg:block">
        <SidebarV2
          activeItem="video-designer"
          onNavigate={onNavigate}
          userName="Emir"
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Ambient Background Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="absolute top-[20%] -left-[10%] w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <header className="px-8 py-5 flex items-center justify-between sticky top-0 z-30 bg-white/80 dark:bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-50 dark:ring-white/5">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">AI Video Stüdyosu</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Viral içerikleriniz saniyeler içinde hazır.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100/50 dark:bg-white/5 p-1.5 rounded-2xl border border-gray-200/50 dark:border-white/5">
              <button
                onClick={() => setActiveTab('designer')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'designer'
                  ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4" /> Stüdyo
                </div>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'analytics'
                  ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Analizler
                </div>
              </button>
            </div>

            {script && (
              <button
                onClick={() => {
                  setScript(null);
                  setRenderStatus('idle');
                }}
                className="px-5 py-3 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
              >
                Yeni Taslak
              </button>
            )}

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
                      productId: selectedProduct.id || selectedProduct.barcode,
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
              className="flex items-center gap-2 px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl text-sm font-bold shadow-xl shadow-gray-200 dark:shadow-none hover:shadow-2xl hover:-translate-y-0.5 transition-all"
            >
              <Share2 className="w-4 h-4" /> Yayınla
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex relative z-10">
          {activeTab === 'analytics' ? (
            <div className="flex-1 overflow-y-auto p-8">
              <VideoAnalyticsTab videoId={selectedProduct?.barcode || 'all'} productBarcode={selectedProduct?.barcode} />
            </div>
          ) : (
            <>
              {/* Left Configuration Panel */}
              <div className={`
                ${showMobileConfig ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : 'hidden'} 
                lg:relative lg:block lg:w-[420px] border-r border-gray-200/50 dark:border-white/5 bg-white/50 dark:bg-[#0A0A0B]/50 backdrop-blur-xl overflow-y-auto pb-24
              `}>
                <div className="p-8 space-y-10">
                  <button onClick={() => setShowMobileConfig(false)} className="lg:hidden absolute top-4 right-4 p-2">
                    <Plus className="w-6 h-6 rotate-45 text-gray-400" />
                  </button>

                  {/* 1. Ürün Seçimi */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest pl-1">
                      <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] text-gray-500 dark:text-gray-300">1</div>
                      Ürün Seçimi
                    </div>

                    <div className="relative group">
                      <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        id="product-search-input"
                        type="text"
                        placeholder="Ürün veya barkod ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-4 bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-2xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                      />
                    </div>

                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.barcode}
                          onClick={() => setSelectedProduct(product)}
                          className={`w-full group flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 border ${selectedProduct?.barcode === product.barcode
                            ? 'bg-indigo-50/80 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/30 ring-1 ring-indigo-200 dark:ring-indigo-500/30'
                            : 'bg-white dark:bg-white/5 border-transparent hover:bg-gray-50 dark:hover:bg-white/10'
                            }`}
                        >
                          <div className="w-14 h-14 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-gray-100 dark:border-white/5">
                            {product.image ? (
                              <img src={product.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                            )}
                          </div>
                          <div className="text-left overflow-hidden flex-1">
                            <p className={`text-sm font-bold truncate transition-colors ${selectedProduct?.barcode === product.barcode ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`}>
                              {product.name}
                            </p>
                            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">{product.price}</p>
                          </div>
                          {selectedProduct?.barcode === product.barcode && (
                            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* 2. Video Modu */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest pl-1">
                      <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] text-gray-500 dark:text-gray-300">2</div>
                      Video Modu (Vibe)
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {vibes.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setVibe(v.id);
                            setIsManualMode(v.id === 'Manual');
                            if (v.id !== 'Manual') {
                              applyPreset(v.id);
                            }
                          }}
                          className={`relative p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all duration-300 group overflow-hidden ${vibe === v.id
                            ? 'bg-white dark:bg-white/5 border-indigo-600 dark:border-indigo-500 shadow-xl shadow-indigo-500/10 scale-[1.02]'
                            : 'bg-white dark:bg-white/5 border-transparent hover:border-gray-200 dark:hover:border-white/10 hover:-translate-y-0.5'
                            }`}
                        >
                          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-tr from-white/0 to-white/50 dark:from-white/0 dark:to-white/5`} />
                          <div className={`w-10 h-10 ${v.bg} border ${v.border} rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                            <v.icon className={`w-5 h-5 ${v.color}`} />
                          </div>
                          <span className={`text-[11px] font-bold ${vibe === v.id ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                            {v.label}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Manuel Prompt Alanı */}
                    {isManualMode && (
                      <div className="mt-4 space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">
                          Özel Video Promptu
                        </label>
                        <textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="Örn: Cinematic slow zoom, model walking confidently, studio lighting"
                          className="w-full p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                          rows={3}
                        />
                        <p className="text-[10px] text-gray-400">
                          İpucu: Kamera hareketleri (zoom, pan), model hareketi ve ışık stilini yazın.
                        </p>
                      </div>
                    )}

                    {/* Gelişmiş Ayarlar Toggle */}
                    {!isManualMode && (
                      <button
                        onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                        className="mt-4 w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-gray-500" />
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Gelişmiş Ayarlar</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`} />
                      </button>
                    )}

                    {/* Gelişmiş Ayarlar Panel */}
                    {showAdvancedSettings && !isManualMode && (
                      <div className="mt-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-4">
                        {/* Kamera Açısı */}
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                            <Camera className="w-3 h-3" /> Kamera Açısı
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {cameraOptions.map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => setCameraAngle(opt.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${cameraAngle === opt.id
                                  ? 'bg-indigo-500 text-white'
                                  : 'bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10'
                                  }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Işık Stili */}
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                            <Sun className="w-3 h-3" /> Işık Stili
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {lightingOptions.map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => setLighting(opt.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${lighting === opt.id
                                  ? 'bg-indigo-500 text-white'
                                  : 'bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10'
                                  }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Hareket Hızı */}
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                            <Move className="w-3 h-3" /> Hareket Hızı
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {motionOptions.map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => setMotionSpeed(opt.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${motionSpeed === opt.id
                                  ? 'bg-indigo-500 text-white'
                                  : 'bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10'
                                  }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Arka Plan */}
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                            <Frame className="w-3 h-3" /> Arka Plan
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {backgroundOptions.map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => setBackground(opt.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${background === opt.id
                                  ? 'bg-indigo-500 text-white'
                                  : 'bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10'
                                  }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Renk Tonu */}
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                            <Paintbrush className="w-3 h-3" /> Renk Tonu
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {colorOptions.map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => setColorTone(opt.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${colorTone === opt.id
                                  ? 'bg-indigo-500 text-white'
                                  : 'bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10'
                                  }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* 3. Platform */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest pl-1">
                      <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] text-gray-500 dark:text-gray-300">3</div>
                      Hedef Platform
                    </div>
                    <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                      {platforms.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setPlatform(p.id)}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${platform === p.id
                            ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                        >
                          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center shadow-sm`}>
                            <p.icon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="hidden sm:inline">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Generate Button */}
                  <button
                    disabled={loading || !selectedProduct}
                    onClick={handleGenerateScript}
                    className="w-full relative overflow-hidden group py-5 rounded-3xl font-black shadow-xl shadow-indigo-500/20 transition-all border border-transparent disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-[shimmer_2s_infinite] group-disabled:animate-none" />
                    <div className="relative flex items-center justify-center gap-3 text-white">
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-sm tracking-wide uppercase">Sihir Yapılıyor...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className={`w-5 h-5 ${!selectedProduct ? 'opacity-50' : 'group-hover:rotate-12 transition-transform'}`} />
                          <span className="text-sm tracking-wide uppercase">
                            {!selectedProduct ? 'Önce Ürün Seçin' : 'Senaryo Üret'}
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Right Workspace (Canvas) */}
              <div className="flex-1 bg-[#F8F9FC] dark:bg-[#0A0A0B] relative overflow-y-auto">
                {/* Dot Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15] pointer-events-none" style={{
                  backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}></div>

                <AnimatePresence mode="wait">
                  {!script ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="h-full flex flex-col items-center justify-center p-12 text-center relative z-10"
                    >
                      <div className="relative mb-12">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
                        <div className="relative w-32 h-32 bg-white dark:bg-white/5 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center transform -rotate-6 transition-transform hover:rotate-0 duration-500">
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-[2.5rem]" />
                          <Sparkles className="w-16 h-16 text-indigo-500 dark:text-indigo-400" />
                        </div>
                      </div>

                      <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-6 tracking-tight max-w-xl mx-auto leading-tight">
                        Video Prodüksiyonu<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Yapay Zekaya Emanet!</span>
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-lg font-medium leading-relaxed mb-12">
                        Ürününüzü seçin, modunuzu belirleyin ve arkanıza yaslanın.
                        AI sizin için senaryoyu yazar, görselleştirir ve kurgular.
                      </p>

                      <button
                        onClick={() => {
                          setShowMobileConfig(true);
                          setTimeout(() => document.getElementById('product-search-input')?.focus(), 100);
                        }}
                        className="mb-12 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 group"
                      >
                        <span className="text-lg">Video Oluşturmaya Başla</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <div className="flex items-center gap-6">
                        <StepIndicator number={1} label="Senaryo" />
                        <div className="w-12 h-0.5 bg-gray-200 dark:bg-white/10 rounded-full" />
                        <StepIndicator number={2} label="Kurgu" />
                        <div className="w-12 h-0.5 bg-gray-200 dark:bg-white/10 rounded-full" />
                        <StepIndicator number={3} label="Render" />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-8 max-w-[1200px] mx-auto grid grid-cols-12 gap-8 relative z-10"
                    >
                      {/* Left Column (Preview) */}
                      <div className="col-span-12 lg:col-span-4 lg:sticky lg:top-8 h-fit">
                        <div className="flex justify-center perspective-1000">
                          <div className="w-[300px] aspect-[9/16] bg-gray-900 rounded-[3rem] border-[8px] border-gray-800 shadow-2xl relative overflow-hidden group transform hover:rotate-y-2 transition-transform duration-500 ring-1 ring-white/10">
                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20" />

                            {renderStatus === 'idle' ? (
                              <div className="absolute inset-0 bg-indigo-950 flex flex-col items-center justify-center p-8 text-center bg-[url('https://images.unsplash.com/photo-1614850523296-d8c1af93d400?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80')] bg-cover">
                                <div className="absolute inset-0 bg-indigo-950/60 backdrop-blur-sm"></div>
                                <div className="relative z-10">
                                  <button
                                    className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-8 border border-white/20 hover:scale-110 hover:bg-white/20 transition-all active:scale-95 group/play"
                                    onClick={handleRenderVideo}
                                  >
                                    <Play className="w-8 h-8 text-white fill-white ml-1 group-hover/play:scale-110 transition-transform" />
                                  </button>
                                  <div className="space-y-2">
                                    <span className="px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-widest text-white/80 border border-white/10">Önizleme</span>
                                    <h4 className="text-white font-bold text-xl leading-tight">
                                      {script.title}
                                    </h4>
                                  </div>
                                </div>
                              </div>
                            ) : renderStatus === 'rendering' ? (
                              <div className="absolute inset-0 bg-gray-950 flex flex-col items-center justify-center p-8">
                                <div className="relative mb-8">
                                  <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
                                  <div className="relative w-24 h-24 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
                                  <Sparkles className="w-8 h-8 text-indigo-400 absolute inset-0 m-auto animate-bounce" />
                                </div>
                                <h4 className="text-white font-bold text-lg mb-2">Oluşturuluyor...</h4>
                                <p className="text-gray-400 text-xs text-center leading-relaxed max-w-[200px]">
                                  Yapay zeka sahneleri birleştiriyor, seslendiriyor ve efekt ekliyor.
                                </p>
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

                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                            {/* Social Overlay */}
                            <div className="absolute bottom-8 left-6 right-6 z-10">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500 border border-white/20" />
                                <div className="flex-1 min-w-0">
                                  <div className="h-2 w-20 bg-white/50 rounded-full mb-1.5" />
                                  <div className="h-1.5 w-12 bg-white/30 rounded-full" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column (Script & Timeline) */}
                      <div className="col-span-12 lg:col-span-8 space-y-8">
                        {/* Script Card */}
                        <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-white/20">
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Type className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Senaryo Detayları</h3>
                                <span className="text-xs text-green-500 font-bold flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> AI GENERATED
                                </span>
                              </div>
                            </div>
                            <div className="px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              <Clock className="w-4 h-4" /> {script.estimatedDuration} Saniye
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-white/5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Hook (Kanca)</label>
                              <p className="text-lg font-bold text-gray-900 dark:text-white leading-relaxed">
                                "{script.hook}"
                              </p>
                            </div>
                            <div className="col-span-2 p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-white/5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Video Açıklaması</label>
                              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                {script.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {script.hashtags.map(tag => (
                                  <span key={tag} className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Call to Action */}
                        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white shadow-2xl shadow-indigo-500/30">
                          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                          <div className="relative z-10 flex items-center justify-between gap-8">
                            <div>
                              <h3 className="text-2xl font-bold mb-2">Her Şey Hazır! 🚀</h3>
                              <p className="text-indigo-100 font-medium max-w-md">
                                Senaryoyu beğendiyseniz, yapay zeka motorunu çalıştırın ve videonuzu oluşturun.
                              </p>
                            </div>
                            <button
                              onClick={handleRenderVideo}
                              disabled={renderStatus === 'rendering'}
                              className="px-8 py-4 bg-white text-indigo-600 font-black rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center gap-3 whitespace-nowrap"
                            >
                              {renderStatus === 'rendering' ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  <span>RENDERLANIYOR...</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-5 h-5 fill-indigo-600" />
                                  <span>VİDEOYU OLUŞTUR</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/20 overflow-hidden">
                          <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                                <Palette className="w-5 h-5" />
                              </div>
                              <h3 className="font-bold text-gray-900 dark:text-white">Sahne Akışı</h3>
                            </div>
                          </div>
                          <div className="p-8 space-y-4">
                            {script.scenes.map((scene, i) => (
                              <div key={i} className="group relative pl-8 pb-8 last:pb-0 border-l-2 border-gray-100 dark:border-white/10 last:border-0">
                                <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white dark:bg-[#0A0A0B] border-2 border-indigo-500 ring-4 ring-white dark:ring-[#0A0A0B]" />

                                <div className="bg-gray-50/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 p-6 rounded-3xl border border-gray-100 dark:border-white/5 transition-all hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/50 group-hover:scale-[1.01]">
                                  <div className="flex items-start gap-6">
                                    <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center text-xl font-black text-gray-200 dark:text-white/20 border border-gray-100 dark:border-white/5 shadow-sm">
                                      {scene.sceneNumber}
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 gap-8">
                                      <div>
                                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                          <ImageIcon className="w-3 h-3" /> Görsel
                                        </label>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 italic">
                                          "{scene.visualParams}"
                                        </p>
                                      </div>
                                      <div>
                                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                          <Type className="w-3 h-3" /> Metin / Ses
                                        </label>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                          "{scene.audioScript}"
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
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

function StepIndicator({ number, label }: { number: number, label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 group cursor-default">
      <div className="w-14 h-14 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-lg shadow-gray-200/50 dark:shadow-none group-hover:-translate-y-1 transition-transform duration-300">
        <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{number}</span>
      </div>
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}
