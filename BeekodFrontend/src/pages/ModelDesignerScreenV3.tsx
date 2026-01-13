<<<<<<< HEAD
=======
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
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
import { useState } from 'react';
import { 
  User, Shirt, Video, Sparkles, Upload, Check, 
  ArrowRight, ArrowLeft, Download, Monitor, 
  Activity, Smile, Zap, Layers, Camera 
} from 'lucide-react';

// Services & Layouts
import { visualIntelligenceApi } from '../services/visualIntelligence';
import { SidebarV2 } from '../layouts/SidebarV2';
<<<<<<< HEAD
import { ToastV2 } from '../components/shared';
=======
import { SearchBar } from '../components/shared/';

import { ToastV2 } from '../components/shared/';
import { HelpModal } from '../components/HelpModal';
import { NotificationPanel } from '../components/NotificationPanel';

// Default model images
import femaleModelImage from '../assets/models/latin_female.png';
import maleModelImage from '../assets/models/latin_male.png';
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e

// Shadcn UI Components
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";

// Constants & Types
type Category = 'tops' | 'bottoms' | 'one-pieces';

export function ModelDesignerScreenV3({ onNavigate }: { onNavigate: (screen: string) => void }) {
  // Stepper State
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', message: '' });
<<<<<<< HEAD
  const [isProcessing, setIsProcessing] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(150);

  // Data States
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [vtonImage, setVtonImage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
=======
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
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e

  // --- STEP 1: MODEL CONFIG ---
  const [selectedGender, setSelectedGender] = useState<'female' | 'male'>('female');
  const [selectedAge, setSelectedAge] = useState<string>('young_adult');
  const [selectedEthnicity, setSelectedEthnicity] = useState<string>('caucasian');
  const [selectedBodyType, setSelectedBodyType] = useState<string>('middle');
  const [selectedHairColor, setSelectedHairColor] = useState<string>('black');
  const [selectedEyeColor, setSelectedEyeColor] = useState<string>('brown');
  const [selectedPose, setSelectedPose] = useState<string>('standing_straight');

<<<<<<< HEAD
  // --- STEP 2: GARMENT CONFIG ---
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>('tops');

  // --- STEP 3: VIDEO CONFIG ---
  const [selectedVideoMode, setSelectedVideoMode] = useState<string>('neutral_presentation');

  /* --- DATA CONSTANTS --- */
  const ages = [
      { id: 'baby', label: 'Bebek (0-2)' },
      { id: 'child', label: 'Çocuk (3-12)' },
      { id: 'young_adult', label: 'Genç (18-25)' },
      { id: 'middle_aged', label: 'Orta Yaş (26-50)' },
      { id: 'elderly', label: 'Yaşlı (50+)' }
  ];

  const bodyTypes = [
      { id: 'thin', label: 'İnce' },
      { id: 'middle', label: 'Orta' },
      { id: 'overweight', label: 'Kilolu' }
  ];

  const ethnicities = [
      { id: 'caucasian', label: 'Kafkas', flag: '🇪🇺' },
      { id: 'asian', label: 'Asyalı', flag: '🇯🇵' },
      { id: 'south_asian', label: 'Güney Asyalı', flag: '🇮🇳' },
      { id: 'african', label: 'Afrikalı', flag: '🇿🇦' },
      { id: 'latin', label: 'Latin', flag: '🇧🇷' },
      { id: 'middle_eastern', label: 'Orta Doğulu', flag: '🇹🇷' },
      { id: 'pacific', label: 'Pasifik / Okyanusya', flag: '🏝️' },
  ];

  const hairColors = [
      { id: 'black', label: 'Siyah', hex: '#000000' },
      { id: 'brown', label: 'Kahve', hex: '#4A2511' },
      { id: 'blonde', label: 'Sarı', hex: '#F5D547' },
      { id: 'red', label: 'Kızıl', hex: '#8B0000' },
  ];

  const poseCategories = [
    {
        title: "Temel Duruşlar",
        poses: [
            { id: "standing_straight", label: "Ayakta Düz Duruş" },
            { id: "standing_relaxed", label: "Rahat Ayakta Duruş" },
            { id: "shoulders_back", label: "Omuzlar Geride Dik" },
            { id: "leaning_forward", label: "Hafif Öne Eğik" },
            { id: "weight_on_one_leg", label: "Ağırlık Tek Ayakta" },
            { id: "legs_crossed", label: "Ayaklar Çapraz" },
            { id: "three_quarter_turn", label: "Yan Dönük (3/4)" },
            { id: "profile_view", label: "Tam Profil" },
            { id: "back_view", label: "Arkası Dönük" }
        ]
    },
    {
        title: "Rahat / Günlük",
        poses: [
            { id: "hands_in_pockets", label: "Ceplerde Eller" },
            { id: "one_hand_pocket", label: "Tek El Cepte" },
            { id: "hands_on_hips", label: "Eller Belde" },
            { id: "arms_loose", label: "Kollar Serbest" },
            { id: "shoulder_slouch", label: "Omuz Hafif Düşük" },
            { id: "casual_slouch", label: "Rahat Kambur" },
            { id: "one_foot_forward", label: "Bir Ayak Önde" },
            { id: "leaning_wall", label: "Duvara Yaslanmış" },
            { id: "leaning_chair", label: "Sandalyeye Yaslanmış" }
        ]
    },
    {
        title: "Profesyonel",
        poses: [
            { id: "arms_crossed", label: "Kollar Bağlı" },
            { id: "hands_clasped_front", label: "Eller Önde Birleşik" },
            { id: "hands_clasped_back", label: "Eller Arkada Birleşik" },
            { id: "symmetrical_stance", label: "Dik ve Simetrik" },
            { id: "leader_pose", label: "Lider Duruşu" },
            { id: "presentation_pose", label: "Sunum Yapar Gibi" }
        ]
    },
    {
        title: "Moda / Fashion",
        poses: [
            { id: "hip_popped", label: "Kalça Kaydırmalı" },
            { id: "s_curve", label: "S-Curve Duruş" },
            { id: "knee_bent", label: "Bir Diz Kırık" },
            { id: "head_tilted", label: "Baş Hafif Yana Eğik" },
            { id: "high_fashion", label: "High-Fashion Abartılı" },
            { id: "editorial", label: "Editorial Duruş" },
            { id: "catwalk_wait", label: "Catwalk Bekleme" }
        ]
    },
    {
        title: "Hareketli",
        poses: [
            { id: "walking_mid_step", label: "Yürürken Yakalanmış" },
            { id: "taking_step", label: "Adım Atarken" },
            { id: "turning_walk", label: "Dönerek Yürüme" },
            { id: "running_light", label: "Hafif Koşar Gibi" },
            { id: "hair_flip", label: "Saç Savurma" },
            { id: "reaching_out", label: "Uzanırken" },
            { id: "looking_back", label: "Dönüp Bakarken" }
        ]
    },
    {
        title: "Oturma",
        poses: [
            { id: "sitting_straight", label: "Sandalyede Düz" },
            { id: "sitting_relaxed", label: "Sandalyede Yaslanmış" },
            { id: "legs_crossed_sitting", label: "Bacak Bacak Üstüne" },
            { id: "sitting_stool", label: "Taburede Oturuş" },
            { id: "sitting_floor", label: "Yere Oturmuş" },
            { id: "squatting", label: "Çömelmiş" }
        ]
    },
    {
        title: "Duygu Odaklı",
        poses: [
            { id: "confident", label: "Kendinden Emin" },
            { id: "shy", label: "Utangaç" },
            { id: "cool", label: "Cool / Rahat" },
            { id: "energetic", label: "Enerjik" },
            { id: "serious", label: "Ciddi" },
            { id: "happy", label: "Neşeli" },
            { id: "dominant", label: "Güçlü / Dominant" }
        ]
    },
    {
        title: "Spor / Aktif",
        poses: [
            { id: "athletic_stance", label: "Atletik Duruş" },
            { id: "stretching", label: "Stretching" },
            { id: "hands_on_knees", label: "Eller Dizlerde" },
            { id: "power_pose", label: "Güç Pozu" },
            { id: "balancing", label: "Denge Duruşu" }
        ]
    },
    {
        title: "E-Ticaret Özel",
        poses: [
            { id: "holding_product", label: "Ürünü Tutarken" },
            { id: "showing_product", label: "Ürünü Gösterirken" },
            { id: "looking_at_product", label: "Ürüne Bakarken" },
            { id: "looking_mirror", label: "Aynaya Bakarken" },
            { id: "natural_interaction", label: "Ürünle Doğal Etkileşim" }
        ]
    }
  ];

  const videoModes = [
      { id: "neutral_presentation", title: "Nötr Model Sunumu", desc: "Varsayılan / Güvenli Mod", icon: User },
      { id: "quiet_showcase", title: "Sessiz Vitrin Modu", desc: "Katalog & Ürün Sayfası", icon: Monitor },
      { id: "casual_carrier", title: "Rahat Duruşlu Taşıyıcı", desc: "Casual Giyim", icon: Smile },
      { id: "slow_turn", title: "Yavaş Dönüş Gösterimi", desc: "Kumaş & Kesim Gösterimi", icon: Activity },
      { id: "minimal_motion", title: "Minimal Hareketli Sunum", desc: "Video Kartları / Slider", icon: Zap },
      { id: "front_side_transition", title: "Önden-Yandan Geçiş", desc: "Teknik Giyim / Spor", icon: Layers },
      { id: "posture_focus", title: "Yürüyüşsüz Duruş", desc: "Ürün Boy & Kalıp Algısı", icon: User },
      { id: "weight_shift", title: "Doğal Ağırlık Kaydırma", desc: "Uzun İzlenebilirlik", icon: Activity },
      { id: "headless_mode", title: "Başsız / Yüz Nötr", desc: "Ürün Bazlı Satış", icon: Camera },
      { id: "silhouette", title: "Gölge & Silüet", desc: "Premium / Minimal", icon: User },
      { id: "static_micro", title: "Statik + Mikro Hareket", desc: "PDP Ana Video", icon: Monitor },
      { id: "model_background", title: "Model Arka Planlaştırma", desc: "Renkli Ürünlerde Efsane", icon: Layers },
  ];

  /* --- HELPERS --- */
  const showNotification = (title: string, message: string) => {
      setToastMessage({ title, message });
=======
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
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
  };

<<<<<<< HEAD
  const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });
  };
=======
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
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e

  /* --- HANDLERS --- */
  const handleGenerateModel = async () => {
    if (tokenBalance < 10) return showNotification("Yetersiz Bakiye", "Token yetersiz.");
    setIsProcessing(true);
    showNotification("Manken Oluşturuluyor...", "Yapay zeka çalışıyor, lütfen bekleyin.");
    try {
<<<<<<< HEAD
        const genderTerm = selectedGender === 'female' ? 'female' : 'male';
        const ageTerm = selectedAge.replace('_', ' ');
        const prompt = `Full body studio shot of a ${ageTerm} ${selectedEthnicity.replace('_', ' ')} ${genderTerm} model, ${selectedBodyType} body type, ${selectedHairColor} hair, ${selectedEyeColor} eyes, posing in ${selectedPose.replace(/_/g, ' ')}, high quality fashion photography, 8k, neutral background, photorealistic, commercial lighting`;
        const result = await visualIntelligenceApi.generateModel(prompt);
        setModelImage(result);
        setTokenBalance(prev => prev - 10);
        showNotification("Manken Hazır!", "Bir sonraki adıma geçebilirsiniz.");
    } catch (err: any) {
        showNotification("Hata", err.message || "Model oluşturulamadı.");
=======
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
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
    } finally {
        setIsProcessing(false);
    }
  };

<<<<<<< HEAD
  const handleVirtualTryOn = async () => {
      if (!modelImage) return showNotification("Eksik Veri", "Önce manken oluşturmalısınız.");
      if (!uploadedImage) return showNotification("Ürün Seçin", "Lütfen bir kıyafet yükleyin.");
      setIsProcessing(true);
      showNotification("Giydirme Yapılıyor...", "Bu işlem dokuları analiz ediyor.");
      try {
          const result = await visualIntelligenceApi.virtualTryOn(modelImage, uploadedImage, selectedCategory);
          setVtonImage(result);
          setTokenBalance(prev => prev - 10);
          showNotification("Giydirme Başarılı!", "Kıyafet mankene uyarlandı.");
      } catch (err: any) {
          showNotification("Hata", "Giydirme işlemi başarısız.");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleGenerateVideo = async () => {
      if (!vtonImage && !modelImage) return showNotification("Eksik Görsel", "Canlandırılacak görsel yok.");
      if (tokenBalance < 20) return showNotification("Yetersiz Bakiye", "20 Token gerekli.");
      setIsProcessing(true);
      showNotification("Video Oluşturuluyor...", "Kling AI sahneyi hazırlıyor (2-3 dk).");
      try {
      const videoModePrompts: Record<string, string> = {
            'neutral_presentation': "static camera, minimal movement, focus on product, neutral background",
            'quiet_showcase': "mannequin style, very subtle movement, flat lighting, clear details",
            'casual_carrier': "casual stance, shifting weight, relaxed breathing, natural light",
            'slow_turn': "slow 180 degree turn, showing all angles, steady camera",
            'minimal_motion': "mostly static, slight fabric movement, breathing, loopable",
            'front_side_transition': "technical view, turning from front to side, clear transition",
            'posture_focus': "strong posture, micro movements, no walking, confident stance",
            'weight_shift': "shifting weight left to right, rhythmic movement, full body",
            'headless_mode': "focus on torso and clothes, face shadowed or cropped, product details",
            'silhouette': "high contrast, artistic lighting, silhouette emphasis, premium feel",
            'static_micro': "frozen moment with micro physics, hair movement, fabric flow",
            'model_background': "model desaturated, product vibrant, soft focus on face",
        };

        const promptSuffix = videoModePrompts[selectedVideoMode] || "fashion walk, cinematic";

          const finalPrompt = `high quality fashion video, ${promptSuffix}, 4k`;
          const source = vtonImage || modelImage || "";
          const result = await visualIntelligenceApi.generateVideo(source, finalPrompt);
          setVideoUrl(result.videoUrl);
          setTokenBalance(prev => prev - 20);
          showNotification("Video Hazır!", "Sonuç mükemmel görünüyor.");
      } catch (err: any) {
          showNotification("Hata", err.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleFileUpload = async (file: File) => {
      if (file.size > 10 * 1024 * 1024) return showNotification("Boyut Hatası", "Dosya çok büyük (Max 10MB).");
      try {
          const base64 = await fileToBase64(file);
          setUploadedImage(base64);
          showNotification("Yüklendi", "Ürün görseli işleme hazır.");
      } catch (e) {
          showNotification("Hata", "Dosya okunamadı.");
      }
=======
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
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
  };

  const activeModelLabel = selectedModel === 'female' ? 'Kadın Manken' : 'Erkek Manken';

  return (
    <div className="flex h-screen bg-gray-50 font-display">
      <SidebarV2 activeItem="model-designer" onNavigate={onNavigate} userName="Admin" userEmail="admin@beekod.com" tokenBalance={tokenBalance} onTokenClick={() => {}} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
            <div>
<<<<<<< HEAD
               <h1 className="text-xl font-bold text-gray-900">AI Kreatif Stüdyo</h1>
               <p className="text-xs text-gray-500">Adım adım profesyonel moda içeriği üretimi</p>
=======
              <h1 className="text-xl text-gray-900">Manken Tasarımcısı</h1>
              <p className="text-xs text-gray-500 mt-1">
                Yapay zeka ile ürünlerinizi manken üzerinde görün
              </p>
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
            </div>
            <div className="flex items-center gap-4">
                <Badge variant="secondary" className="px-3 py-1.5 gap-2 text-sm font-bold bg-yellow-50 text-yellow-700 border-yellow-100 hover:bg-yellow-100">
                    <Sparkles className="w-4 h-4" />
                    {tokenBalance} Token
                </Badge>
            </div>
        </header>

<<<<<<< HEAD
        {/* Stepper (Custom Visuals using Card) */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
            <div className="max-w-4xl mx-auto relative px-4"> 
                {/* Progress Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full px-12 z-0">
                    <Progress value={activeStep === 1 ? 0 : activeStep === 2 ? 50 : 100} className="h-1 bg-gray-100" />
                </div>
                
                <div className="flex justify-between relative z-10 mx-6">
                    {[
                        { id: 1, title: 'Casting', icon: User },
                        { id: 2, title: 'Styling', icon: Shirt },
                        { id: 3, title: 'Action', icon: Video }
                    ].map((step) => {
                        const isActive = activeStep === step.id;
                        const isCompleted = activeStep > step.id;
                        return (
                            <div key={step.id} className="flex flex-col items-center bg-white px-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                    isActive || isCompleted ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background text-muted-foreground'
                                }`}>
                                    {isCompleted ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                                </div>
                                <span className={`text-xs mt-2 font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{step.title}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>

        {/* Main Workspace */}
        <main className="flex-1 overflow-auto bg-gray-50/50 p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8 h-full">
                
                {/* LEFT: Controls (Shadcn Card) */}
                <Card className="col-span-5 h-fit max-h-full overflow-hidden flex flex-col">
                    <CardHeader>
                        <CardTitle>
                            {activeStep === 1 && "Manken Tasarım"}
                            {activeStep === 2 && "Stil ve Giydirme"}
                            {activeStep === 3 && "Prodüksiyon"}
                        </CardTitle>
                        <CardDescription>
                            {activeStep === 1 && "Dijital oyuncunuzu yaratın"}
                            {activeStep === 2 && "Ürününüzü mankene entegre edin"}
                            {activeStep === 3 && "Profesyonel video modları"}
                        </CardDescription>
                    </CardHeader>
                    
                    <Separator />
                    
                    <ScrollArea className="flex-1 h-[500px]">
                        <CardContent className="space-y-6 pt-6">
                             {/* STEP 1 */}
                            {activeStep === 1 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Cinsiyet</Label>
                                            <div className="flex bg-muted rounded-md p-1">
                                                <Button variant={selectedGender === 'female' ? 'default' : 'ghost'} size="sm" onClick={() => setSelectedGender('female')} className="flex-1">Kadın</Button>
                                                <Button variant={selectedGender === 'male' ? 'default' : 'ghost'} size="sm" onClick={() => setSelectedGender('male')} className="flex-1">Erkek</Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Yaş Grubu</Label>
                                            <Select value={selectedAge} onValueChange={setSelectedAge}>
                                                <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                                <SelectContent>
                                                    {ages.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Köken</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {ethnicities.map(e => (
                                                <Button 
                                                    key={e.id} 
                                                    variant={selectedEthnicity === e.id ? 'default' : 'outline'} 
                                                    className={`h-auto flex-col py-2 gap-1 ${selectedEthnicity !== e.id && 'hover:bg-accent'}`}
                                                    onClick={() => setSelectedEthnicity(e.id)}
                                                >
                                                    <span className="text-lg">{e.flag}</span>
                                                    <span className="text-[10px] truncate w-full">{e.label}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Vücut Tipi</Label>
                                            <Select value={selectedBodyType} onValueChange={setSelectedBodyType}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {bodyTypes.map(b => <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Saç Rengi</Label>
                                             <div className="grid grid-cols-4 gap-2">
                                                 {hairColors.map(h => (
                                                      <div 
                                                        key={h.id} 
                                                        onClick={() => setSelectedHairColor(h.id)}
                                                        className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all ${selectedHairColor === h.id ? 'border-primary scale-110' : 'border-transparent'}`} 
                                                        style={{backgroundColor: h.hex}} 
                                                        title={h.label} 
                                                      />
                                                 ))}
                                             </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex justify-between">
                                            Poz ve Duruş
                                            <span className="text-[10px] text-primary font-normal">Kritik Seçim</span>
                                        </Label>
                                        <Select value={selectedPose} onValueChange={setSelectedPose}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent className="h-64">
                                                {poseCategories.map(group => (
                                                    <div key={group.title}>
                                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">{group.title}</div>
                                                        {group.poses.map(pose => (
                                                            <SelectItem key={pose.id} value={pose.id}>{pose.label}</SelectItem>
                                                        ))}
                                                    </div>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                             {/* STEP 2 */}
                             {activeStep === 2 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                                    <div 
                                        className={`border-2 border-dashed rounded-xl p-8 text-center relative hover:bg-muted/50 transition-colors ${uploadedImage ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
                                    >
                                        <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10 h-full" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} />
                                        {!uploadedImage ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="p-3 bg-muted rounded-full"><Upload className="w-6 h-6 text-muted-foreground" /></div>
                                                <h3 className="font-semibold text-sm">Ürün Görseli Yükle</h3>
                                                <p className="text-xs text-muted-foreground">PNG, JPG (Max 10MB)</p>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <img src={uploadedImage} alt="Preview" className="h-40 mx-auto object-contain rounded-md" />
                                                <Badge className="absolute top-0 right-0">Yüklendi</Badge>
                                            </div>
                                        )}
                                    </div>

                                    {uploadedImage && (
                                        <div className="space-y-2">
                                            <Label>Kategori Seçimi</Label>
                                            <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as Category)} className="w-full">
                                                <TabsList className="w-full">
                                                    <TabsTrigger value="tops" className="flex-1">Üst</TabsTrigger>
                                                    <TabsTrigger value="bottoms" className="flex-1">Alt</TabsTrigger>
                                                    <TabsTrigger value="one-pieces" className="flex-1">Elbise</TabsTrigger>
                                                </TabsList>
                                            </Tabs>
                                        </div>
                                    )}
=======
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
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
                                </div>
                             )}

                             {/* STEP 3 */}
                             {activeStep === 3 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                                    <Label>Senaryo Modu</Label>
                                    <div className="space-y-2">
                                        {videoModes.map(mode => (
                                            <div 
                                                key={mode.id}
                                                onClick={() => setSelectedVideoMode(mode.id)} 
                                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent/50 ${selectedVideoMode === mode.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                                            >
                                                <div className={`p-2 rounded-md ${selectedVideoMode === mode.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                    <mode.icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{mode.title}</p>
                                                    <p className="text-xs text-muted-foreground">{mode.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             )}
                        </CardContent>
                    </ScrollArea>
                    
                    <CardFooter className="pt-4 border-t">
                        {activeStep === 1 && (
                            <Button className="w-full" size="lg" onClick={handleGenerateModel} disabled={isProcessing}>
                                {isProcessing && <Sparkles className="w-4 h-4 mr-2 animate-spin" />}
                                {isProcessing ? 'Oluşturuluyor...' : 'Manken Oluştur (10 Token)'}
                            </Button>
                        )}
                        {activeStep === 2 && (
                            <Button className="w-full" size="lg" onClick={handleVirtualTryOn} disabled={isProcessing || !uploadedImage}>
                                {isProcessing && <Sparkles className="w-4 h-4 mr-2 animate-spin" />}
                                {isProcessing ? 'Entegre Ediliyor...' : 'Mankene Giydir (10 Token)'}
                            </Button>
                        )}
                        {activeStep === 3 && (
                            <Button className="w-full" size="lg" onClick={handleGenerateVideo} disabled={isProcessing}>
                                {isProcessing && <Video className="w-4 h-4 mr-2 animate-pulse" />}
                                {isProcessing ? 'Prodüksiyon Başladı...' : 'Video Oluştur (20 Token)'}
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                {/* RIGHT: Preview (Visual Check) */}
                <div className="col-span-7 h-full">
                    <Card className="h-full flex flex-col overflow-hidden bg-[url('https://beecod.com/grid-pattern.png')] bg-repeat">
                        <div className="flex-1 relative flex items-center justify-center p-6">
                            
                            {/* Empty State */}
                            {!modelImage && !vtonImage && !videoUrl && (
                                <div className="text-center space-y-4">
                                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto animate-pulse">
                                        <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-muted-foreground">Stüdyo Hazır</h3>
                                        <p className="text-sm text-muted-foreground/80">Sol paneli kullanarak tasarımınıza başlayın.</p>
                                    </div>
                                </div>
                            )}

                             {/* Step 1 Result */}
                             {activeStep === 1 && modelImage && (
                                <img src={modelImage} className="max-h-full max-w-full rounded-lg shadow-2xl animate-in zoom-in duration-300" />
                            )}

                            {/* Step 2 Result */}
                            {activeStep === 2 && (
                                <div className="relative h-full w-full flex items-center justify-center">
                                    {modelImage && (
                                        <img src={modelImage} className={`max-h-full max-w-full rounded-lg shadow-lg transition-all duration-500 ${vtonImage ? 'opacity-0 hidden' : 'opacity-50 grayscale'}`} />
                                    )}
                                    {vtonImage && (
                                        <img src={vtonImage} className="max-h-full max-w-full rounded-lg shadow-2xl animate-in zoom-in duration-500" />
                                    )}
                                </div>
                            )}

                             {/* Step 3 Result */}
                             {activeStep === 3 && (
                                <div className="relative h-full w-full flex items-center justify-center">
                                    {videoUrl ? (
                                        <video src={videoUrl} controls autoPlay loop className="max-h-full max-w-full rounded-lg shadow-2xl" />
                                    ) : (
                                        <img src={vtonImage || modelImage || ""} className="max-h-full max-w-full rounded-lg shadow-lg blur-sm" />
                                    )}
                                </div>
                            )}
                        </div>

                         {/* Navigation Bar */}
                         <div className="p-4 bg-background/80 backdrop-blur-sm border-t flex justify-between items-center">
                            <Button variant="ghost" onClick={() => setActiveStep(prev => Math.max(1, prev - 1) as 1 | 2 | 3)} disabled={activeStep === 1 || isProcessing}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> Geri
                            </Button>

                            {activeStep === 1 && modelImage && (
                                <Button onClick={() => setActiveStep(2)}>Devam Et <ArrowRight className="w-4 h-4 ml-2" /></Button>
                            )}
                            {activeStep === 2 && vtonImage && (
                                <Button onClick={() => setActiveStep(3)}>Devam Et <ArrowRight className="w-4 h-4 ml-2" /></Button>
                            )}
                            {activeStep === 3 && videoUrl && (
                                <Button variant="outline" onClick={() => window.open(videoUrl, '_blank')}>
                                    <Download className="w-4 h-4 mr-2" /> İndir
                                </Button>
                            )}
                         </div>
                    </Card>
                </div>

<<<<<<< HEAD
=======
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
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
            </div>
        </main>

        {showToast && (
             <ToastV2 title={toastMessage.title} message={toastMessage.message} isVisible={true} onClose={() => setShowToast(false)} type="success" />
        )}
      </div>
<<<<<<< HEAD
=======


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
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
    </div>
  );
}
