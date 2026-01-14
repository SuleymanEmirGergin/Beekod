import { useState } from 'react';
import { 
  User, Shirt, Video, Sparkles, Upload, Check, 
  ArrowRight, ArrowLeft, Download, Monitor, 
  Activity, Smile, Zap, Layers, Camera 
} from 'lucide-react';

// Services & Layouts
import { visualIntelligenceApi } from '../services/visualIntelligence';
import { SidebarV2 } from '../layouts/SidebarV2';
import { ToastV2 } from '../components/shared';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(150);

  // Data States
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [vtonImage, setVtonImage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // --- STEP 1: MODEL CONFIG ---
  const [selectedGender, setSelectedGender] = useState<'female' | 'male'>('female');
  const [selectedAge, setSelectedAge] = useState<string>('young_adult');
  const [selectedEthnicity, setSelectedEthnicity] = useState<string>('caucasian');
  const [selectedBodyType, setSelectedBodyType] = useState<string>('middle');
  const [selectedHairColor, setSelectedHairColor] = useState<string>('black');
  const [selectedEyeColor, setSelectedEyeColor] = useState<string>('brown');
  const [selectedPose, setSelectedPose] = useState<string>('standing_straight');

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
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
  };

  const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });
  };

  /* --- HANDLERS --- */
  const handleGenerateModel = async () => {
    if (tokenBalance < 10) return showNotification("Yetersiz Bakiye", "Token yetersiz.");
    setIsProcessing(true);
    showNotification("Manken Oluşturuluyor...", "Yapay zeka çalışıyor, lütfen bekleyin.");
    try {
        const genderTerm = selectedGender === 'female' ? 'female' : 'male';
        const ageTerm = selectedAge.replace('_', ' ');
        const prompt = `Full body studio shot of a ${ageTerm} ${selectedEthnicity.replace('_', ' ')} ${genderTerm} model, ${selectedBodyType} body type, ${selectedHairColor} hair, ${selectedEyeColor} eyes, posing in ${selectedPose.replace(/_/g, ' ')}, high quality fashion photography, 8k, neutral background, photorealistic, commercial lighting`;
        const result = await visualIntelligenceApi.generateModel(prompt);
        setModelImage(result);
        setTokenBalance(prev => prev - 10);
        showNotification("Manken Hazır!", "Bir sonraki adıma geçebilirsiniz.");
    } catch (err: any) {
        showNotification("Hata", err.message || "Model oluşturulamadı.");
    } finally {
        setIsProcessing(false);
    }
  };

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
  };


  return (
    <div className="flex h-screen bg-gray-50 font-display">
      <SidebarV2 activeItem="model-designer" onNavigate={onNavigate} userName="Admin" userEmail="admin@beekod.com" tokenBalance={tokenBalance} onTokenClick={() => {}} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
            <div>
               <h1 className="text-xl font-bold text-gray-900">AI Kreatif Stüdyo</h1>
               <p className="text-xs text-gray-500">Adım adım profesyonel moda içeriği üretimi</p>
            </div>
            <div className="flex items-center gap-4">
                <Badge variant="secondary" className="px-3 py-1.5 gap-2 text-sm font-bold bg-yellow-50 text-yellow-700 border-yellow-100 hover:bg-yellow-100">
                    <Sparkles className="w-4 h-4" />
                    {tokenBalance} Token
                </Badge>
            </div>
        </header>

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

            </div>
        </main>

        {showToast && (
             <ToastV2 title={toastMessage.title} message={toastMessage.message} isVisible={true} onClose={() => setShowToast(false)} type="success" />
        )}
      </div>
    </div>
  );
}

