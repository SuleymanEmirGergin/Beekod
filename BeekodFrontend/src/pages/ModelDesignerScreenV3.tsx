import {
  Bell,
  HelpCircle,
  Download,
  RotateCcw,
  Sparkles,
  Shirt,
  User,
  Upload,
  Wand2,
  X,
  ChevronRight,
  Check,
  Video,
  Frame,
  Paintbrush,
  Briefcase,
  Heart,
  Smile,
  Zap,
  Gem,
  Dumbbell,
  Minimize2,
  Camera
} from 'lucide-react';
import { aiModelService } from '../services/aiModelService';
import { useState } from 'react';
import { SidebarV2 } from '../layouts/SidebarV2';
import { SearchBar } from '../components/shared/';

import { ToastV2 } from '../components/shared/';
import { HelpModal } from '../components/HelpModal';
import { NotificationPanel } from '../components/NotificationPanel';

// Default model images
import femaleModelImage from '../assets/models/latin_female.png';
import maleModelImage from '../assets/models/latin_male.png';

interface ModelDesignerScreenV3Props {
  onNavigate: (screen: string) => void;
}

export function ModelDesignerScreenV3({ onNavigate }: ModelDesignerScreenV3Props) {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', message: '' });
  const [selectedModel, setSelectedModel] = useState<'female' | 'male'>('female');
  const [selectedGarment, setSelectedGarment] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(150);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('model');
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<'upper_body' | 'lower_body' | 'dresses'>('upper_body');

  // New customization states
  const [selectedEthnicity, setSelectedEthnicity] = useState<string>('caucasian');
  const [selectedBodyType, setSelectedBodyType] = useState<string>('orta');
  const [selectedHairColor, setSelectedHairColor] = useState<string>('siyah');
  const [selectedHairLength, setSelectedHairLength] = useState<string>('orta');
  const [selectedEyeColor, setSelectedEyeColor] = useState<string>('kahverengi');
  const [selectedHeight, setSelectedHeight] = useState<string>('orta');
  const [selectedPose, setSelectedPose] = useState<string>('front');
  const [showVideoSettings, setShowVideoSettings] = useState(false);
  const [videoVibe, setVideoVibe] = useState('Energetic');
  const [videoCustomPrompt, setVideoCustomPrompt] = useState('');
  const [isVideoManualMode, setIsVideoManualMode] = useState(false);

  const GENERATION_COST = 10;

  // Attribute options
  const ethnicities = [
    { id: 'caucasian', label: 'Kafkas', flag: '🇪🇺' },
    { id: 'asian', label: 'Asyalı', flag: '🇯🇵' },
    { id: 'african', label: 'Afrikalı', flag: '🇿🇦' },
    { id: 'latin', label: 'Latin', flag: '🇧🇷' },
    { id: 'middle-eastern', label: 'Orta Doğulu', flag: '🇹🇷' },
    { id: 'mixed', label: 'Karışık', flag: '🌍' },
  ];

  const bodyTypes = [
    { id: 'ince', label: 'İnce', icon: '🧍' },
    { id: 'orta', label: 'Orta', icon: '🧍‍♂️' },
    { id: 'dolgun', label: 'Dolgun', icon: '🧍‍♀️' },
  ];

  const hairColors = [
    { id: 'siyah', label: 'Siyah', color: '#000000' },
    { id: 'kahverengi', label: 'Kahverengi', color: '#4A2511' },
    { id: 'sari', label: 'Sarı', color: '#F5D547' },
    { id: 'kizil', label: 'Kızıl', color: '#8B0000' },
    { id: 'gri', label: 'Gri', color: '#808080' },
    { id: 'beyaz', label: 'Beyaz', color: '#FFFFFF' },
  ];

  const hairLengths = [
    { id: 'kisa', label: 'Kısa' },
    { id: 'orta', label: 'Orta' },
    { id: 'uzun', label: 'Uzun' },
  ];

  const eyeColors = [
    { id: 'kahverengi', label: 'Kahverengi', color: '#654321' },
    { id: 'mavi', label: 'Mavi', color: '#1E90FF' },
    { id: 'yesil', label: 'Yeşil', color: '#228B22' },
    { id: 'ela', label: 'Ela', color: '#B8860B' },
    { id: 'gri', label: 'Gri', color: '#808080' },
    { id: 'siyah', label: 'Siyah', color: '#000000' },
  ];

  const heights = [
    { id: 'kisa', label: 'Kısa', range: '150-165 cm' },
    { id: 'orta', label: 'Orta', range: '165-175 cm' },
    { id: 'uzun', label: 'Uzun', range: '175-190 cm' },
  ];

  const poses = [
    { id: 'front', label: 'Önden', icon: '🧍' },
    { id: 'side', label: 'Yandan', icon: '🚶' },
    { id: 'walking', label: 'Yürüyen', icon: '🚶‍♀️' },
  ];

  const garments = [
    {
      id: 't-shirt',
      name: 'T-Shirt',
      category: 'Üst Giyim',
      thumbnail:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop',
    },
    {
      id: 'dress',
      name: 'Yazlık Elbise',
      category: 'Elbiseler',
      thumbnail:
        'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=200&h=200&fit=crop',
    },
    {
      id: 'jacket',
      name: 'Kot Ceket',
      category: 'Dış Giyim',
      thumbnail: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&h=200&fit=crop',
    },
    {
      id: 'jeans',
      name: 'Kot Pantolon',
      category: 'Alt Giyim',
      thumbnail: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=200&h=200&fit=crop',
    },
    {
      id: 'sweater',
      name: 'Kazak',
      category: 'Üst Giyim',
      thumbnail:
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200&h=200&fit=crop',
    },
    {
      id: 'skirt',
      name: 'Pileli Etek',
      category: 'Alt Giyim',
      thumbnail:
        'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=200&h=200&fit=crop',
    },
  ];

  /* Updated handleGenerate */
  const handleGenerate = async () => {
    if (!selectedGarment) {
      setToastMessage({
        title: 'Lütfen Ürün Seçin',
        message: 'Manken üzerinde görmek istediğiniz kıyafeti seçin veya yükleyin.',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    if (tokenBalance < GENERATION_COST) {
      setToastMessage({
        title: 'Yetersiz Token',
        message: 'Bu işlem için yeterli bakiyeniz bulunmuyor.',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setIsGenerating(true);
    setToastMessage({
      title: 'Tasarım Oluşturuluyor...',
      message: 'Yapay zeka modelinizi oluşturuyor. Bu işlem 10-20 saniye sürebilir.',
    });
    setShowToast(true);

    try {
      // Helper to convert image URL to base64 data URI
      const urlToBase64 = async (url: string): Promise<string> => {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      // Convert Vite-served asset to base64 that backend can use directly
      const modelImageUrl = selectedModel === 'female' ? femaleModelImage : maleModelImage;
      const humanImg = await urlToBase64(modelImageUrl);

      let clothesImg: File | string = "";
      if (selectedGarment === 'uploaded' && uploadedFile) {
        clothesImg = uploadedFile;
      } else if (selectedGarment === 'uploaded' && uploadedImage) {
        clothesImg = uploadedImage;
      } else {
        const g = garments.find(i => i.id === selectedGarment);
        clothesImg = g?.thumbnail || "";
      }

      const attributes = {
        gender: selectedModel,
        ethnicity: selectedEthnicity,
        bodyType: selectedBodyType,
        hairColor: selectedHairColor,
        hairLength: selectedHairLength,
        eyeColor: selectedEyeColor,
        height: selectedHeight,
        pose: selectedPose,
        category: selectedGarment === 'uploaded' ? selectedCategory : (garments.find(i => i.id === selectedGarment)?.category === 'Üst Giyim' ? 'upper_body' : garments.find(i => i.id === selectedGarment)?.category === 'Alt Giyim' ? 'lower_body' : 'dresses')
      };

      const response = await aiModelService.generate(humanImg, clothesImg, attributes);
      const { socketaccesstoken } = response;

      let ws: WebSocket | null = null;
      let socketResult: string | null = null;

      try {
        ws = aiModelService.connectSocket(socketaccesstoken, (msg) => {
          if (msg.type === 'task_postprocess_end' || msg.type === 'task_output_full') {
            if (msg.message && Array.isArray(msg.message) && msg.message.length > 0) {
              const possibleUrl = msg.message[0];
              if (typeof possibleUrl === 'string' && possibleUrl.startsWith('http')) {
                socketResult = possibleUrl;
              }
            }
            if (msg.outputs && Array.isArray(msg.outputs) && msg.outputs.length > 0) {
              const possibleUrl = msg.outputs[0];
              if (typeof possibleUrl === 'string' && possibleUrl.startsWith('http')) {
                socketResult = possibleUrl;
              }
            }
          }
          if (msg.type) {
            // simplified checks for brevity
          }
        });
      } catch (e) { console.warn(e); }

      let resultUrl: string | null = null;
      const maxWaitTime = 300000;
      const checkInterval = 3000;
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitTime) {
        if (socketResult) {
          resultUrl = socketResult;
          break;
        }
        try {
          const polledResult = await aiModelService.pollUntilComplete(socketaccesstoken, checkInterval, checkInterval + 5000);
          if (polledResult && polledResult.startsWith('http')) {
            resultUrl = polledResult;
            break;
          }
        } catch (pollError) { }
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }

      if (ws) (ws as WebSocket).close();

      if (!resultUrl) throw new Error("İşlem zaman aşımına uğradı.");

      setGeneratedImage(resultUrl);
      setTokenBalance(prev => prev - GENERATION_COST);
      setToastMessage({
        title: 'Tasarım Hazır!',
        message: 'Yapay zeka destekli modeliniz oluşturuldu.',
      });

    } catch (error: any) {
      setToastMessage({
        title: 'Hata',
        message: error.message || 'Bir sorun oluştu.',
      });
    } finally {
      setIsGenerating(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
  };

  const handleAnimateClick = () => {
    if (!generatedImage) return;

    if (tokenBalance < 20) {
      setToastMessage({
        title: 'Yetersiz Token',
        message: 'Video oluşturma bedeli 20 tokendir.',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    setShowVideoSettings(true);
  };

  const handleStartAnimation = async () => {
    if (!generatedImage) return;

    setShowVideoSettings(false);

    // Construct prompt based on settings
    let finalPrompt = videoCustomPrompt;

    if (!isVideoManualMode) {
      // Map vibe to a simple effective prompt for Wiro
      const vibePrompts: Record<string, string> = {
        'Energetic': "Dynamic camera movement, energetic model pose, high energy fashion video, neon lighting, fast pace, 4k",
        'Professional': "Professional studio lighting, steady camera, elegant model movement, clean white background focus, high quality",
        'Emotional': "Slow motion, cinematic lighting, emotional mood, soft focus, dramatic shadows, 4k",
        'Funny': "Playful movement, colorful background, dynamic angles, upbeat energy, commercial style",
        'Luxury': "Luxurious atmosphere, gold lighting accents, slow elegant movement, high fashion editorial style, 8k",
        'Sports': "Action camera, dynamic movement, athletic pose, high contrast, outdoor lighting style",
        'Minimalist': "Clean minimal aesthetic, subtle movement, soft natural lighting, high key, studio quality",
        'Retro': "Vintage film grain, warm color grading, nostalgia mood, 80s fashion style camera work"
      };

      finalPrompt = vibePrompts[videoVibe] || "Natural movement, high quality fashion model walk";
    }

    setIsVideoGenerating(true);
    setToastMessage({
      title: 'Video Hazırlanıyor...',
      message: 'Mankeniniz canlandırılıyor. Bu işlem biraz zaman alabilir.',
    });
    setShowToast(true);

    try {
      const response = await aiModelService.animate(generatedImage, finalPrompt);
      const { socketaccesstoken } = response;

      // ... existing polling logic ...
      const videoResultUrl = await aiModelService.pollUntilComplete(socketaccesstoken, 2000, 300000);
      setVideoUrl(videoResultUrl);
      setTokenBalance(prev => prev - 20);
      setToastMessage({
        title: 'Video Hazır!',
        message: 'Canlandırma işlemi başarıyla tamamlandı.',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

    } catch (error: any) {
      console.error(error);
      setToastMessage({
        title: 'Hata',
        message: error.message || 'Video oluşturulamadı.',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsVideoGenerating(false);
    }
  };

  const handleReset = () => {
    setSelectedGarment(null);
    setUploadedImage(null);
    setGeneratedImage(null);
    setToastMessage({ title: 'Tasarım Sıfırlandı', message: 'Canvas temizlendi.' });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDownload = () => {
    setToastMessage({ title: 'İndiriliyor...', message: 'Tasarımınız kaydediliyor.' });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleImageUpload = (file: File) => {
    // 10MB size limit check
    if (file.size > 10 * 1024 * 1024) {
      setToastMessage({
        title: 'Dosya Çok Büyük',
        message: 'Lütfen 10MB\'dan küçük bir görsel yükleyin.',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setUploadedImage(objectUrl);
    setUploadedFile(file);
    setSelectedGarment('uploaded');
    setShowUploadModal(false);
    setToastMessage({
      title: 'Görsel Yüklendi!',
      message: 'Ürün görseliniz başarıyla yüklendi.',
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const activeModelLabel = selectedModel === 'female' ? 'Kadın Manken' : 'Erkek Manken';

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarV2
        activeItem="model-designer"
        onNavigate={onNavigate}
        userName="Ahmet Yılmaz"
        userEmail="Beekod Admin"
        tokenBalance={tokenBalance}
        onTokenClick={() => setShowTokenModal(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl text-gray-900">Manken Tasarımcısı</h1>
              <p className="text-xs text-gray-500 mt-1">
                Yapay zeka ile ürünlerinizi manken üzerinde görün
              </p>
            </div>
            <div className="flex items-center gap-4">
              <SearchBar />
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </button>
              <button
                onClick={() => setShowHelpModal(true)}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {/* Configuration Cards Grid */}
            <div className="grid grid-cols-12 gap-6 mb-6">
              {/* Left: Configuration Panel */}
              <div className="col-span-8 space-y-4">

                {/* 1. Model Selection (Gender Only) */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleSection('model')}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm text-gray-900">Model Seçimi</h3>
                        <p className="text-xs text-gray-500">
                          Seçili: {activeModelLabel}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'model' ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {expandedSection === 'model' && (
                    <div className="px-6 pb-6 pt-2 space-y-5 border-t border-gray-100">
                      <div>
                        <label className="text-xs text-gray-700 mb-2 block">Cinsiyet</label>
                        <div className="grid grid-cols-2 gap-3">
                          {/* Female Button */}
                          <button
                            onClick={() => {
                              setSelectedModel('female');
                              setGeneratedImage(null);
                            }}
                            className={`relative rounded-lg overflow-hidden border-2 transition-all h-32 group ${selectedModel === 'female'
                              ? 'border-[#F5B800] ring-2 ring-[#F5B800]/20 bg-[#F5B800]/5'
                              : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <div className="flex flex-col items-center justify-center h-full">
                              <div className="p-3 bg-white rounded-full shadow-sm mb-2">
                                <User className="w-6 h-6 text-pink-500" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">Kadın Manken</span>
                            </div>

                            {selectedModel === 'female' && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-[#F5B800] rounded-full flex items-center justify-center shadow-lg">
                                <Check className="w-4 h-4 text-gray-900" />
                              </div>
                            )}
                          </button>

                          {/* Male Button */}
                          <button
                            onClick={() => {
                              setSelectedModel('male');
                              setGeneratedImage(null);
                            }}
                            className={`relative rounded-lg overflow-hidden border-2 transition-all h-32 group ${selectedModel === 'male'
                              ? 'border-[#F5B800] ring-2 ring-[#F5B800]/20 bg-[#F5B800]/5'
                              : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <div className="flex flex-col items-center justify-center h-full">
                              <div className="p-3 bg-white rounded-full shadow-sm mb-2">
                                <User className="w-6 h-6 text-blue-500" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">Erkek Manken</span>
                            </div>

                            {selectedModel === 'male' && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-[#F5B800] rounded-full flex items-center justify-center shadow-lg">
                                <Check className="w-4 h-4 text-gray-900" />
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Appearance Customization */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleSection('appearance')}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm text-gray-900">Görünüm Özellikleri</h3>
                        <p className="text-xs text-gray-500">
                          Köken, vücut, saç, göz rengi
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'appearance' ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {expandedSection === 'appearance' && (
                    <div className="px-6 pb-6 pt-2 space-y-5 border-t border-gray-100 max-h-[400px] overflow-y-auto">
                      {/* Ethnicity */}
                      <div>
                        <label className="text-xs text-gray-700 mb-2 block">Köken</label>
                        <div className="grid grid-cols-3 gap-2">
                          {ethnicities.map((eth) => (
                            <button
                              key={eth.id}
                              onClick={() => setSelectedEthnicity(eth.id)}
                              className={`p-2 rounded-lg border-2 transition-all text-center ${selectedEthnicity === eth.id
                                ? 'border-[#F5B800] bg-[#F5B800]/10'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <span className="text-lg">{eth.flag}</span>
                              <p className="text-xs text-gray-700 mt-1">{eth.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Body Type */}
                      <div>
                        <label className="text-xs text-gray-700 mb-2 block">Vücut Tipi</label>
                        <div className="grid grid-cols-3 gap-2">
                          {bodyTypes.map((bt) => (
                            <button
                              key={bt.id}
                              onClick={() => setSelectedBodyType(bt.id)}
                              className={`p-2 rounded-lg border-2 transition-all text-center ${selectedBodyType === bt.id
                                ? 'border-[#F5B800] bg-[#F5B800]/10'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <span className="text-lg">{bt.icon}</span>
                              <p className="text-xs text-gray-700 mt-1">{bt.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Height */}
                      <div>
                        <label className="text-xs text-gray-700 mb-2 block">Boy</label>
                        <div className="grid grid-cols-3 gap-2">
                          {heights.map((h) => (
                            <button
                              key={h.id}
                              onClick={() => setSelectedHeight(h.id)}
                              className={`p-2 rounded-lg border-2 transition-all text-center ${selectedHeight === h.id
                                ? 'border-[#F5B800] bg-[#F5B800]/10'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <p className="text-xs text-gray-700 font-medium">{h.label}</p>
                              <p className="text-[10px] text-gray-500">{h.range}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Hair Color */}
                      <div>
                        <label className="text-xs text-gray-700 mb-2 block">Saç Rengi</label>
                        <div className="grid grid-cols-6 gap-2">
                          {hairColors.map((hc) => (
                            <button
                              key={hc.id}
                              onClick={() => setSelectedHairColor(hc.id)}
                              className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center ${selectedHairColor === hc.id
                                ? 'border-[#F5B800] bg-[#F5B800]/10'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <div
                                className="w-6 h-6 rounded-full border border-gray-300"
                                style={{ backgroundColor: hc.color }}
                              />
                              <p className="text-[10px] text-gray-700 mt-1">{hc.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Hair Length */}
                      <div>
                        <label className="text-xs text-gray-700 mb-2 block">Saç Uzunluğu</label>
                        <div className="grid grid-cols-3 gap-2">
                          {hairLengths.map((hl) => (
                            <button
                              key={hl.id}
                              onClick={() => setSelectedHairLength(hl.id)}
                              className={`p-2 rounded-lg border-2 transition-all text-center ${selectedHairLength === hl.id
                                ? 'border-[#F5B800] bg-[#F5B800]/10'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <p className="text-xs text-gray-700">{hl.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Eye Color */}
                      <div>
                        <label className="text-xs text-gray-700 mb-2 block">Göz Rengi</label>
                        <div className="grid grid-cols-6 gap-2">
                          {eyeColors.map((ec) => (
                            <button
                              key={ec.id}
                              onClick={() => setSelectedEyeColor(ec.id)}
                              className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center ${selectedEyeColor === ec.id
                                ? 'border-[#F5B800] bg-[#F5B800]/10'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <div
                                className="w-6 h-6 rounded-full border border-gray-300"
                                style={{ backgroundColor: ec.color }}
                              />
                              <p className="text-[10px] text-gray-700 mt-1">{ec.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Pose */}
                      <div>
                        <label className="text-xs text-gray-700 mb-2 block">Poz</label>
                        <div className="grid grid-cols-3 gap-2">
                          {poses.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setSelectedPose(p.id)}
                              className={`p-3 rounded-lg border-2 transition-all text-center ${selectedPose === p.id
                                ? 'border-[#F5B800] bg-[#F5B800]/10'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <span className="text-2xl">{p.icon}</span>
                              <p className="text-xs text-gray-700 mt-1">{p.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Product Selection */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleSection('product')}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <Shirt className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm text-gray-900">Ürün Seçimi</h3>
                        <p className="text-xs text-gray-500">
                          {selectedGarment === 'uploaded'
                            ? 'Yüklenen Görsel'
                            : selectedGarment
                              ? garments.find((g) => g.id === selectedGarment)?.name
                              : 'Ürün seçilmedi'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'product' ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {expandedSection === 'product' && (
                    <div className="px-6 pb-6 pt-2 space-y-4 border-t border-gray-100">
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="w-full px-4 py-3 bg-gradient-to-r from-[#F5B800] to-[#E5A800] hover:from-[#E5A800] hover:to-[#D59700] text-gray-900 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        Ürün Görseli Yükle
                      </button>

                      {uploadedImage && (
                        <div className="space-y-3">
                          <div
                            onClick={() => {
                              setSelectedGarment('uploaded');
                              setGeneratedImage(null);
                            }}
                            className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${selectedGarment === 'uploaded'
                              ? 'border-[#F5B800] ring-2 ring-[#F5B800]/20'
                              : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <img
                              src={uploadedImage}
                              alt="Uploaded Product"
                              className="w-full h-28 object-cover"
                            />
                            <div className="p-2 bg-white">
                              <p className="text-xs text-gray-900">Yüklenen Ürün</p>
                            </div>
                            {selectedGarment === 'uploaded' && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-[#F5B800] rounded-full flex items-center justify-center shadow-lg">
                                <Check className="w-4 h-4 text-gray-900" />
                              </div>
                            )}
                          </div>

                          {selectedGarment === 'uploaded' && (
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                              <label className="text-xs font-medium text-gray-700 block mb-2">Kıyafet Türü</label>
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  onClick={() => setSelectedCategory('upper_body')}
                                  className={`px-2 py-1.5 text-[10px] rounded-lg border transition-colors ${selectedCategory === 'upper_body'
                                    ? 'bg-[#F5B800] border-[#F5B800] text-gray-900 font-bold'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                  Üst Giyim
                                </button>
                                <button
                                  onClick={() => setSelectedCategory('lower_body')}
                                  className={`px-2 py-1.5 text-[10px] rounded-lg border transition-colors ${selectedCategory === 'lower_body'
                                    ? 'bg-[#F5B800] border-[#F5B800] text-gray-900 font-bold'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                  Alt Giyim
                                </button>
                                <button
                                  onClick={() => setSelectedCategory('dresses')}
                                  className={`px-2 py-1.5 text-[10px] rounded-lg border transition-colors ${selectedCategory === 'dresses'
                                    ? 'bg-[#F5B800] border-[#F5B800] text-gray-900 font-bold'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                  Elbise
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-gray-500 mb-2">Veya örneklerden seçin:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {garments.map((garment) => (
                            <button
                              key={garment.id}
                              onClick={() => {
                                setSelectedGarment(garment.id);
                                setGeneratedImage(null);
                              }}
                              className={`relative rounded-lg overflow-hidden border-2 transition-all ${selectedGarment === garment.id
                                ? 'border-[#F5B800] ring-2 ring-[#F5B800]/20'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <img
                                src={garment.thumbnail}
                                alt={garment.name}
                                className="w-full h-20 object-cover"
                              />
                              <div className="p-1.5 bg-white">
                                <p className="text-xs text-gray-900 truncate">{garment.name}</p>
                              </div>
                              {selectedGarment === garment.id && (
                                <div className="absolute top-1 right-1 w-5 h-5 bg-[#F5B800] rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-gray-900" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Preview & Actions */}
              <div className="col-span-4 space-y-4">
                {/* Preview Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm text-gray-900">Canlı Önizleme</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleReset}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Sıfırla"
                      >
                        <RotateCcw className="w-4 h-4 text-gray-600" />
                      </button>
                      {generatedImage && (
                        <button
                          onClick={handleDownload}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="İndir"
                        >
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 aspect-[3/4] flex items-center justify-center mb-4 overflow-hidden relative">
                    {isVideoGenerating ? (
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 relative">
                          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-[#F5B800] rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-xs text-gray-900">Video Oluşturuluyor...</p>
                        <p className="text-[10px] text-gray-500 mt-1">Bu işlem ~2 dk sürebilir</p>
                      </div>
                    ) : videoUrl ? (
                      <div className="w-full h-full relative group">
                        <video
                          src={videoUrl}
                          controls
                          autoPlay
                          loop
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setVideoUrl(null)}
                          className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Videoyu Kapat"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : isGenerating ? (
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 relative">
                          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-[#F5B800] rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-xs text-gray-900">Oluşturuluyor...</p>
                      </div>
                    ) : generatedImage ? (
                      <img
                        src={generatedImage}
                        alt="Generated"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-center px-4">
                        <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500">Ayarlayın ve oluşturun</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || isVideoGenerating || !selectedGarment || tokenBalance < GENERATION_COST}
                      className={`w-full px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${isGenerating || isVideoGenerating || !selectedGarment || tokenBalance < GENERATION_COST
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#F5B800] to-[#E5A800] hover:from-[#E5A800] hover:to-[#D59700] text-gray-900 shadow-lg hover:shadow-xl'
                        }`}
                    >
                      <Wand2 className="w-5 h-5" />
                      {isGenerating
                        ? 'Oluşturuluyor...'
                        : !selectedGarment
                          ? 'Ürün Seçin'
                          : `Oluştur (${GENERATION_COST} token)`}
                    </button>

                    {generatedImage && !videoUrl && (
                      <button
                        onClick={handleAnimateClick}
                        disabled={isVideoGenerating || tokenBalance < 20}
                        className={`w-full px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all border-2 ${isVideoGenerating || tokenBalance < 20
                          ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-[#F5B800] text-[#F5B800] hover:bg-[#F5B800]/5'
                          }`}
                      >
                        <Video className="w-5 h-5" />
                        {isVideoGenerating ? 'Video Hazırlanıyor...' : 'Video Olarak Canlandır (20 token)'}
                      </button>
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gradient-to-br from-[#F5B800] to-[#E5A800] rounded-full flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs text-gray-900">
                          <strong>{tokenBalance}</strong> token
                        </span>
                      </div>
                      <button
                        onClick={() => setShowTokenModal(true)}
                        className="px-2 py-1 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded text-xs transition-colors"
                      >
                        Satın Al
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>


      <ToastV2
        title={toastMessage.title}
        message={toastMessage.message}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {showHelpModal && <HelpModal page="model-designer" onClose={() => setShowHelpModal(false)} />}
      <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-gray-900">Ürün Görseli Yükle</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-700 mb-2">Görseli buraya sürükleyin veya seçin</p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file);
                  }
                }}
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block mt-2 px-5 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm cursor-pointer transition-colors"
              >
                Dosya Seç
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Token Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl text-gray-900">AI Kredisi Satın Al</h3>
                <p className="text-sm text-gray-500 mt-1">İhtiyacınıza uygun paketi seçin</p>
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Simplified Package Display for Turkish */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900">Başlangıç</h4>
                <p className="text-2xl text-gray-900 mt-2">$5</p>
                <p className="text-sm text-gray-500">50 Kredi</p>
                <button onClick={() => { setSelectedPackage({ name: 'Başlangıç', tokens: 50, price: 5 }); setShowTokenModal(false); setShowPaymentModal(true); }} className="w-full mt-4 py-2 bg-[#F5B800] text-gray-900 rounded-lg text-sm">Satın Al</button>
              </div>
              <div className="bg-amber-50 rounded-2xl p-4 border border-[#F5B800]">
                <h4 className="font-medium text-gray-900">Profesyonel</h4>
                <p className="text-2xl text-gray-900 mt-2">$12</p>
                <p className="text-sm text-gray-500">150 Kredi</p>
                <button onClick={() => { setSelectedPackage({ name: 'Profesyonel', tokens: 150, price: 12 }); setShowTokenModal(false); setShowPaymentModal(true); }} className="w-full mt-4 py-2 bg-[#F5B800] text-gray-900 rounded-lg text-sm">Satın Al</button>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900">İşletme</h4>
                <p className="text-2xl text-gray-900 mt-2">$25</p>
                <p className="text-sm text-gray-500">350 Kredi</p>
                <button onClick={() => { setSelectedPackage({ name: 'İşletme', tokens: 350, price: 25 }); setShowTokenModal(false); setShowPaymentModal(true); }} className="w-full mt-4 py-2 bg-[#F5B800] text-gray-900 rounded-lg text-sm">Satın Al</button>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900">Kurumsal</h4>
                <p className="text-2xl text-gray-900 mt-2">$60</p>
                <p className="text-sm text-gray-500">1000 Kredi</p>
                <button onClick={() => { setSelectedPackage({ name: 'Kurumsal', tokens: 1000, price: 60 }); setShowTokenModal(false); setShowPaymentModal(true); }} className="w-full mt-4 py-2 bg-[#F5B800] text-gray-900 rounded-lg text-sm">Satın Al</button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h4 className="text-sm text-gray-900 mb-3">Tüm planlar şunları içerir:</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-700">Yapay zeka model üretimi</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-700">Yüksek çözünürlüklü çıktılar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-700">Sınırsız özelleştirme</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-700">Ticari kullanım hakları</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-700">Öncelikli işlem</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-700">Süre sınırı yok</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl text-gray-900">Ödemeyi Tamamla</h3>
                <p className="text-sm text-gray-500 mt-1">Stripe ile güvenli ödeme</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm text-gray-900 mb-4">Sipariş Özeti</h4>
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-5 border-2 border-[#F5B800]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#F5B800] to-[#E5A800] rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h5 className="text-base text-gray-900">{selectedPackage.name}</h5>
                      <p className="text-xs text-gray-600">{selectedPackage.tokens} AI Üretim Kredisi</p>
                    </div>
                  </div>
                  <div className="space-y-2 py-3 border-t border-amber-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ara Toplam</span>
                      <span className="text-gray-900">${selectedPackage.price}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-amber-200">
                      <span className="text-gray-900">Toplam</span>
                      <span className="text-xl text-gray-900">${selectedPackage.price}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm text-gray-900 mb-4">Ödeme Bilgileri</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-700 mb-1 block">Kart Sahibi</label>
                    <input type="text" placeholder="Ad Soyad" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-700 mb-1 block">Kart Numarası</label>
                    <input type="text" placeholder="0000 0000 0000 0000" maxLength={19} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800] focus:border-transparent" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-700 mb-1 block">Son Kullanma</label>
                      <input type="text" placeholder="AA/YY" maxLength={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800] focus:border-transparent" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-700 mb-1 block">CVV</label>
                      <input type="text" placeholder="123" maxLength={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800] focus:border-transparent" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm transition-colors">İptal</button>
              <button onClick={() => {
                setTokenBalance(tokenBalance + selectedPackage.tokens);
                setShowPaymentModal(false);
                setToastMessage({ title: 'Ödeme Başarılı! 🎉', message: `${selectedPackage.tokens} kredi hesabınıza eklendi.` });
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
              }} className="flex-1 px-4 py-3 bg-gradient-to-r from-[#F5B800] to-[#E5A800] hover:from-[#E5A800] hover:to-[#D59700] text-gray-900 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl">
                <Check className="w-5 h-5" />
                Öde ${selectedPackage.price}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Settings Modal */}
      {showVideoSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Video Ayarları</h3>
                  <p className="text-xs text-gray-500">Mankeninizi nasıl canlandıralım?</p>
                </div>
              </div>
              <button
                onClick={() => setShowVideoSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Mode Selection */}
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setIsVideoManualMode(false)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isVideoManualMode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Hazır Modlar
                </button>
                <button
                  onClick={() => setIsVideoManualMode(true)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isVideoManualMode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Manuel İstek
                </button>
              </div>

              {!isVideoManualMode ? (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'Energetic', label: 'Enerjik', icon: <Zap className="w-4 h-4" /> },
                    { id: 'Professional', label: 'Profesyonel', icon: <Briefcase className="w-4 h-4" /> },
                    { id: 'Emotional', label: 'Duygusal', icon: <Heart className="w-4 h-4" /> },
                    { id: 'Funny', label: 'Eğlenceli', icon: <Smile className="w-4 h-4" /> },
                    { id: 'Luxury', label: 'Lüks', icon: <Gem className="w-4 h-4" /> },
                    { id: 'Sports', label: 'Spor', icon: <Dumbbell className="w-4 h-4" /> },
                    { id: 'Minimalist', label: 'Minimalist', icon: <Minimize2 className="w-4 h-4" /> },
                    { id: 'Retro', label: 'Retro', icon: <Camera className="w-4 h-4" /> },
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVideoVibe(v.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${videoVibe === v.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-100 hover:border-gray-200 text-gray-600'
                        }`}
                    >
                      {v.icon}
                      <span className="text-sm font-medium">{v.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nasıl bir video istiyorsunuz?</label>
                  <textarea
                    value={videoCustomPrompt}
                    onChange={(e) => setVideoCustomPrompt(e.target.value)}
                    placeholder="Örn: Manken yavaşça dönsün, saçları rüzgarda uçuşsun, sinematik ışıklandırma olsun..."
                    className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm resize-none"
                  />
                  <p className="text-xs text-gray-500">
                    💡 İpucu: Kamera açıları, ışıklandırma ve hareket detayları vererek daha iyi sonuç alabilirsiniz.
                  </p>
                </div>
              )}

              <button
                onClick={handleStartAnimation}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Video className="w-5 h-5" />
                Canlandırmayı Başlat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
