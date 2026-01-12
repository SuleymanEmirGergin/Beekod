import {
  Bell,
  HelpCircle,
  Download,
  RotateCcw,
  Sparkles,
  Shirt,
  Palette,
  User,
  Upload,
  Wand2,
  X,
  Link as LinkIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { SidebarV2 } from '../layouts/SidebarV2';
import { SearchBar } from '../components/shared/';

import { ToastV2 } from '../components/shared/';
import { HelpModal } from '../components/HelpModal';
import { NotificationPanel } from '../components/NotificationPanel';
import hairColorsImage from 'figma:asset/02f5b50387e462570178335f8c876e2f912235a6.png';
import eyeColorsImage from 'figma:asset/6d37b0c530cf33a8f55054e6c82ada5b31c1056e.png';
import sariHairImage from 'figma:asset/98dc71e13dc2d35d408fb6e3664ec78513edb19f.png';
import turuncuHairImage from 'figma:asset/dbe268abcfed23a245a6570fcf378fa05c9db1cc.png';
import siyahHairImage from 'figma:asset/bb008c0bb03c26e978fab5b13ab8cd2e1da0615e.png';
import griHairImage from 'figma:asset/fbe0e199ceb6b21d8b5a00808093d52051b5787e.png';
import kahverengiHairImage from 'figma:asset/92e0e858a0272e479083d7ccf22ab26b72269d48.png';
import kizilHairImage from 'figma:asset/268194b97aa6db62a4c4195aacff1fcb0f19f11b.png';
import zayifBodyImage from 'figma:asset/47763b5513f64acd986685a9d5e10bd4314defe9.png';
import ortaKiloluBodyImage from 'figma:asset/64dc6519a41c808e79b146fe45a387ef0feaa1e3.png';
import kiloluBodyImage from 'figma:asset/9b68cc0466e0009fad17ab706b6d2cbcaef51769.png';
import uzunBoyluImage from 'figma:asset/5fa5209c94af33a11d3aaaf2a174b2cb5272e14c.png';
import ortaBoyImage from 'figma:asset/d9e7858ce1064fa81f9436bd9a9555bab0a0b90e.png';
import kisaBoyImage from 'figma:asset/c0d82a7204c9fe75fd4e1885989d8780eea69d6e.png';

interface ModelDesignerScreenProps {
  onNavigate: (screen: string) => void;
}

export function ModelDesignerScreen({ onNavigate }: ModelDesignerScreenProps) {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', message: '' });
  const [selectedModel, setSelectedModel] = useState<'female' | 'male'>('female');
  const [selectedEthnicity, setSelectedEthnicity] = useState<string>('caucasian');
  const [selectedGarment, setSelectedGarment] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(150); // Initial token balance
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // New model attributes
  const [selectedBodyType, setSelectedBodyType] = useState<string>('orta-kilolu');
  const [selectedHairColor, setSelectedHairColor] = useState<string>('siyah');
  const [selectedEyeColor, setSelectedEyeColor] = useState<string>('kahverengi');
  const [selectedHeight, setSelectedHeight] = useState<string>('orta');
  const [selectedPose, setSelectedPose] = useState<string>('front');

  // Tab state for organized navigation
  const [activeTab, setActiveTab] = useState<
    'model' | 'appearance' | 'pose' | 'product' | 'style' | 'environment'
  >('model');
  const [selectedStyle, setSelectedStyle] = useState<string>('realistic');
  const [selectedScene, setSelectedScene] = useState<string>('minimalist_studio');
  const [is3DView, setIs3DView] = useState(false);

  const GENERATION_COST = 10; // Cost per generation in tokens

  const models = [
    {
      id: 'female',
      label: 'Female Model',
      image: 'https://images.unsplash.com/photo-1721003080966-423d4017d09d?w=400&h=600&fit=crop',
    },
    {
      id: 'male',
      label: 'Male Model',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
    },
  ];

  const ethnicities = [
    { id: 'caucasian', label: 'Caucasian', flag: '🇪🇺' },
    { id: 'asian', label: 'Asian', flag: '🇯🇵' },
    { id: 'african', label: 'African', flag: '🇿🇦' },
    { id: 'latin', label: 'Latin', flag: '🇧🇷' },
    { id: 'middle-eastern', label: 'Middle Eastern', flag: '🇦🇪' },
    { id: 'mixed', label: 'Mixed', flag: '🌍' },
  ];

  const bodyTypes = [
    { id: 'zayif', label: 'Slim', icon: '🧍', image: zayifBodyImage },
    { id: 'orta-kilolu', label: 'Medium', icon: '🧍‍♂️', image: ortaKiloluBodyImage },
    { id: 'kilolu', label: 'Plus Size', icon: '🧍‍♀️', image: kiloluBodyImage },
  ];

  const hairColors = [
    { id: 'siyah', label: 'Black', color: '#000000', icon: '🖤', image: siyahHairImage },
    { id: 'kahverengi', label: 'Brown', color: '#4A2511', icon: '🤎', image: kahverengiHairImage },
    { id: 'sari', label: 'Blonde', color: '#F5D547', icon: '💛', image: sariHairImage },
    { id: 'gri', label: 'Gray', color: '#808080', icon: '🩶', image: griHairImage },
    { id: 'kizil', label: 'Red', color: '#8B0000', icon: '❤️', image: kizilHairImage },
    { id: 'turuncu', label: 'Auburn', color: '#FF6347', icon: '🧡', image: turuncuHairImage },
  ];

  const eyeColors = [
    { id: 'kahverengi', label: 'Brown', color: '#654321', icon: '👁️', bgPosition: '50% 50%' }, // Merkez - kahverengi göz
    { id: 'mavi', label: 'Blue', color: '#1E90FF', icon: '👁️', bgPosition: '50% 0%' }, // Orta üst - mavi göz
    { id: 'yesil', label: 'Green', color: '#228B22', icon: '👁️', bgPosition: '100% 0%' }, // Sağ üst - yeşil göz
    { id: 'ela', label: 'Hazel', color: '#B8860B', icon: '👁️', bgPosition: '0% 50%' }, // Sol orta - ela göz
    { id: 'gri', label: 'Gray', color: '#808080', icon: '👁️', bgPosition: '0% 0%' }, // Sol üst - gri göz
    { id: 'siyah', label: 'Black', color: '#000000', icon: '👁️', bgPosition: '100% 100%' }, // Sağ alt - koyu göz
  ];

  const heights = [
    { id: 'kisa', label: 'Short', range: '150-165 cm', icon: '📏', image: kisaBoyImage },
    { id: 'orta', label: 'Medium', range: '165-175 cm', icon: '📐', image: ortaBoyImage },
    { id: 'uzun', label: 'Tall', range: '175-190 cm', icon: '📊', image: uzunBoyluImage },
  ];

  const poses = [
    {
      id: 'front',
      label: 'Front View',
      icon: '🧍',
      image: 'https://images.unsplash.com/photo-1640337516270-1c675eee65f2?w=400&h=600&fit=crop',
    },
    {
      id: 'side',
      label: 'Side View',
      icon: '🚶',
      image: 'https://images.unsplash.com/photo-1762395271662-2a5a077f9662?w=400&h=600&fit=crop',
    },
    {
      id: 'walking',
      label: 'Walking',
      icon: '🚶‍♀️',
      image: 'https://images.unsplash.com/photo-1630243838106-c48c85c5e880?w=400&h=600&fit=crop',
    },
  ];

  const garments = [
    {
      id: 't-shirt',
      name: 'T-Shirt',
      category: 'Tops',
      thumbnail:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop',
    },
    {
      id: 'dress',
      name: 'Summer Dress',
      category: 'Dresses',
      thumbnail:
        'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=200&h=200&fit=crop',
    },
    {
      id: 'jacket',
      name: 'Denim Jacket',
      category: 'Outerwear',
      thumbnail: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&h=200&fit=crop',
    },
    {
      id: 'jeans',
      name: 'Jeans',
      category: 'Bottoms',
      thumbnail: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=200&h=200&fit=crop',
    },
    {
      id: 'sweater',
      name: 'Knit Sweater',
      category: 'Tops',
      thumbnail:
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200&h=200&fit=crop',
    },
    {
      id: 'skirt',
      name: 'Pleated Skirt',
      category: 'Bottoms',
      thumbnail:
        'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=200&h=200&fit=crop',
    },
  ];

  const colors = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Red', hex: '#DC2626' },
    { name: 'Blue', hex: '#2563EB' },
    { name: 'Green', hex: '#16A34A' },
    { name: 'Yellow', hex: '#F5B800' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Purple', hex: '#9333EA' },
    { name: 'Gray', hex: '#6B7280' },
    { name: 'Navy', hex: '#1E3A8A' },
  ];

  const styles = [
    {
      id: 'realistic',
      label: 'Realistic',
      icon: '📸',
      description: 'Photorealistic high-end photography',
    },
    {
      id: 'cyberpunk',
      label: 'Cyberpunk',
      icon: '🌆',
      description: 'Neon lights and futuristic aesthetic',
    },
    { id: 'retro', label: '90s Retro', icon: '📼', description: 'Vintage film look and grain' },
    {
      id: 'sketch',
      label: 'Artistic Sketch',
      icon: '🎨',
      description: 'Hand-drawn fashion illustration style',
    },
    {
      id: 'watercolor',
      label: 'Watercolor',
      icon: '🖌️',
      description: 'Soft artistic watercolor paint effect',
    },
  ];

  const scenes = [
    { id: 'minimalist_studio', label: 'Minimalist Studio', icon: '🏠' },
    { id: 'nature_outdoor', label: 'Nature', icon: '🌿' },
    { id: 'paris_street', label: 'Paris', icon: '🗼' },
    { id: 'future_city', label: 'Future City', icon: '🏙️' },
    { id: 'tropical_beach', label: 'Beach', icon: '🏖️' },
  ];

  const handleGenerate = () => {
    if (!selectedGarment) {
      setToastMessage({
        title: 'Please Select a Garment',
        message: 'You need to select a clothing item before generating.',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    if (tokenBalance < GENERATION_COST) {
      setToastMessage({
        title: 'Insufficient Tokens',
        message: 'You do not have enough tokens to generate a design.',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setIsGenerating(true);
    setToastMessage({
      title: 'Generating Design...',
      message: 'AI is creating your model visualization using NanoBanana technology.',
    });
    setShowToast(true);

    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedImage(
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=800&fit=crop',
      );
      setTokenBalance(tokenBalance - GENERATION_COST);
      setToastMessage({
        title: 'Design Generated!',
        message: 'Your AI-powered model visualization is ready.',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 3000);
  };

  const handleReset = () => {
    setSelectedGarment(null);
    setUploadedImage(null);
    setGeneratedImage(null);
    setToastMessage({
      title: 'Design Reset',
      message: 'Canvas cleared. Start a new design.',
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDownload = () => {
    setToastMessage({
      title: 'Downloading Image...',
      message: 'Your design is being saved to your device.',
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl);
    setSelectedGarment('uploaded');
    setShowUploadModal(false);
    setToastMessage({
      title: 'Image Uploaded!',
      message: 'Your product image has been uploaded successfully.',
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

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
            <h1 className="text-xl text-gray-900">AI Model Designer</h1>
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
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl text-gray-900 mb-2">AI-Powered Virtual Model Designer</h2>
                <p className="text-sm text-gray-700 mb-4">
                  Create stunning product visualizations by applying your clothing items to
                  AI-generated models. Powered by NanoBanana technology for photorealistic results.
                </p>
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-purple-200">
                    <Wand2 className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-700">AI-Generated</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-purple-200">
                    <Shirt className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-700">Virtual Try-On</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-purple-200">
                    <Palette className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-700">Style Transfer</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 mb-6 w-fit">
            {[
              { id: 'model', label: 'Model', icon: User },
              { id: 'appearance', label: 'Appearance', icon: Palette },
              { id: 'pose', label: 'Pose', icon: RotateCcw },
              { id: 'product', label: 'Product', icon: Shirt },
              { id: 'style', label: 'AI Style', icon: Sparkles },
              { id: 'environment', label: 'Environment', icon: LinkIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-100 text-purple-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left Panel - Configuration */}
            <div className="space-y-6">
              {activeTab === 'model' && (
                <>
                  {/* Model Selection */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-gray-700" />
                      <h3 className="text-base text-gray-900">Select Model</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {models.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id as 'female' | 'male');
                            setGeneratedImage(null);
                          }}
                          className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                            selectedModel === model.id
                              ? 'border-[#F5B800] shadow-lg'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={model.image}
                            alt={model.label}
                            className="w-full h-40 object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                            <p className="text-xs text-white">{model.label}</p>
                          </div>
                          {selectedModel === model.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-[#F5B800] rounded-full flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-gray-900" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ethnicity Selection */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-gray-700" />
                      <h3 className="text-base text-gray-900">Select Ethnicity</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {ethnicities.map((ethnicity: any) => (
                        <button
                          key={ethnicity.id}
                          onClick={() => {
                            setSelectedEthnicity(ethnicity.id);
                            setGeneratedImage(null);
                          }}
                          className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                            selectedEthnicity === ethnicity.id
                              ? 'border-[#F5B800] shadow-lg'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="w-full h-24 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                            <p className="text-4xl mb-2">{ethnicity.flag}</p>
                            <p className="text-xs text-gray-700">{ethnicity.label}</p>
                          </div>
                          {selectedEthnicity === ethnicity.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-[#F5B800] rounded-full flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-gray-900" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'appearance' && (
                <>
                  {/* Body Type Selection */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-gray-700" />
                      <h3 className="text-base text-gray-900">Select Body Type</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {bodyTypes.map((bodyType) => (
                        <button
                          key={bodyType.id}
                          onClick={() => {
                            setSelectedBodyType(bodyType.id);
                            setGeneratedImage(null);
                          }}
                          className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                            selectedBodyType === bodyType.id
                              ? 'border-[#F5B800] shadow-lg'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={bodyType.image}
                            alt={bodyType.label}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-xs text-white text-center">{bodyType.label}</p>
                          </div>
                          {selectedBodyType === bodyType.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-[#F5B800] rounded-full flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-gray-900" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hair Color Selection */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-gray-700" />
                      <h3 className="text-base text-gray-900">Select Hair Color</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {hairColors.map((hairColor: any) => (
                        <button
                          key={hairColor.id}
                          onClick={() => {
                            setSelectedHairColor(hairColor.id);
                            setGeneratedImage(null);
                          }}
                          className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                            selectedHairColor === hairColor.id
                              ? 'border-[#F5B800] shadow-lg'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {hairColor.image ? (
                            <img
                              src={hairColor.image}
                              alt={hairColor.label}
                              className="w-full h-24 object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-24"
                              style={{
                                backgroundImage: `url(${hairColorsImage})`,
                                backgroundSize: '300% 300%',
                                backgroundPosition: hairColor.bgPosition,
                              }}
                            />
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-xs text-white text-center">{hairColor.label}</p>
                          </div>
                          {selectedHairColor === hairColor.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-[#F5B800] rounded-full flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-gray-900" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Eye Color Selection */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-gray-700" />
                      <h3 className="text-base text-gray-900">Select Eye Color</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {eyeColors.map((eyeColor) => (
                        <button
                          key={eyeColor.id}
                          onClick={() => {
                            setSelectedEyeColor(eyeColor.id);
                            setGeneratedImage(null);
                          }}
                          className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                            selectedEyeColor === eyeColor.id
                              ? 'border-[#F5B800] shadow-lg'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="w-full h-24"
                            style={{
                              backgroundImage: `url(${eyeColorsImage})`,
                              backgroundSize: '300% 300%',
                              backgroundPosition: eyeColor.bgPosition,
                            }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-xs text-white text-center">{eyeColor.label}</p>
                          </div>
                          {selectedEyeColor === eyeColor.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-[#F5B800] rounded-full flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-gray-900" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Height Selection */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-gray-700" />
                      <h3 className="text-base text-gray-900">Select Height</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {heights.map((height) => (
                        <button
                          key={height.id}
                          onClick={() => {
                            setSelectedHeight(height.id);
                            setGeneratedImage(null);
                          }}
                          className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                            selectedHeight === height.id
                              ? 'border-[#F5B800] shadow-lg'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={height.image}
                            alt={height.label}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-xs text-white text-center">{height.label}</p>
                          </div>
                          {selectedHeight === height.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-[#F5B800] rounded-full flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-gray-900" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'pose' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-gray-700" />
                    <h3 className="text-base text-gray-900">Select Pose</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {poses.map((pose) => (
                      <button
                        key={pose.id}
                        onClick={() => {
                          setSelectedPose(pose.id);
                          setGeneratedImage(null);
                        }}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                          selectedPose === pose.id
                            ? 'border-[#F5B800] shadow-lg'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={pose.image}
                          alt={pose.label}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-xs text-white text-center">{pose.label}</p>
                        </div>
                        {selectedPose === pose.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-[#F5B800] rounded-full flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-gray-900" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'product' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Shirt className="w-5 h-5 text-gray-700" />
                      <h3 className="text-base text-gray-900">Select Product</h3>
                    </div>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="px-3 py-1.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </button>
                  </div>

                  {/* Uploaded Image */}
                  {uploadedImage && (
                    <div className="mb-3">
                      <div
                        onClick={() => {
                          setSelectedGarment('uploaded');
                          setGeneratedImage(null);
                        }}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          selectedGarment === 'uploaded'
                            ? 'border-[#F5B800] shadow-lg'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={uploadedImage}
                          alt="Uploaded Product"
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-2 bg-white">
                          <p className="text-xs text-gray-900">Your Product</p>
                          <p className="text-xs text-gray-500">Uploaded Image</p>
                        </div>
                        {selectedGarment === 'uploaded' && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-[#F5B800] rounded-full flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-gray-900" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Template Garments */}
                  <p className="text-xs text-gray-500 mb-3">Or choose from templates:</p>
                  <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                    {garments.map((garment) => (
                      <button
                        key={garment.id}
                        onClick={() => {
                          setSelectedGarment(garment.id);
                          setGeneratedImage(null);
                        }}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                          selectedGarment === garment.id
                            ? 'border-[#F5B800] shadow-lg'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={garment.thumbnail}
                          alt={garment.name}
                          className="w-full h-28 object-cover"
                        />
                        <div className="p-2 bg-white">
                          <p className="text-xs text-gray-900 truncate">{garment.name}</p>
                          <p className="text-xs text-gray-500">{garment.category}</p>
                        </div>
                        {selectedGarment === garment.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-[#F5B800] rounded-full flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-gray-900" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'style' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-gray-700" />
                    <h3 className="text-base text-gray-900">AI Style Transfer</h3>
                  </div>
                  <div className="space-y-3">
                    {styles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => {
                          setSelectedStyle(style.id);
                          setGeneratedImage(null);
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                          selectedStyle === style.id
                            ? 'bg-purple-50 border-purple-200 shadow-sm'
                            : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-2xl border border-gray-100">
                          {style.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-bold text-gray-900">{style.label}</p>
                          <p className="text-[10px] text-gray-500 leading-tight">
                            {style.description}
                          </p>
                        </div>
                        {selectedStyle === style.id && (
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'environment' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <LinkIcon className="w-5 h-5 text-gray-700" />
                    <h3 className="text-base text-gray-900">Background Scene</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {scenes.map((scene) => (
                      <button
                        key={scene.id}
                        onClick={() => {
                          setSelectedScene(scene.id);
                          setGeneratedImage(null);
                        }}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                          selectedScene === scene.id
                            ? 'border-purple-500 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="w-full h-24 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                          <p className="text-3xl mb-1">{scene.icon}</p>
                          <p className="text-[11px] font-bold text-gray-700">{scene.label}</p>
                        </div>
                        {selectedScene === scene.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">3D Preview Mode</span>
                      </div>
                      <button
                        onClick={() => setIs3DView(!is3DView)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${is3DView ? 'bg-purple-600' : 'bg-gray-200'}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${is3DView ? 'right-1' : 'left-1'}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Center Panel - Preview */}
            <div className="col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base text-gray-900">Preview</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                    {generatedImage && (
                      <button
                        onClick={handleDownload}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    )}
                  </div>
                </div>

                {/* Preview Area */}
                <div
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center"
                  style={{ height: '600px' }}
                >
                  {isGenerating ? (
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 relative">
                        <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-[#F5B800] rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <p className="text-sm text-gray-900 mb-1">Generating Your Design...</p>
                      <p className="text-xs text-gray-500">AI is processing with NanoBanana</p>
                    </div>
                  ) : generatedImage ? (
                    <div className="relative w-full h-full">
                      <img
                        src={generatedImage}
                        alt="Generated Design"
                        className={`w-full h-full object-contain rounded-lg transition-transform duration-500 ${is3DView ? 'hover:scale-105 hover:rotate-1' : ''}`}
                        style={is3DView ? { transform: 'perspective(1000px) rotateY(2deg)' } : {}}
                      />
                      <div className="absolute top-4 right-4 px-3 py-1.5 bg-[#F5B800] rounded-lg shadow-lg">
                        <p className="text-xs text-gray-900 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          AI Generated
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full p-6 overflow-y-auto">
                      <div className="text-center mb-6">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-900 mb-2">Your Model Configuration</p>
                        <p className="text-xs text-gray-500">
                          Review your selections below and click Generate when ready
                        </p>
                      </div>

                      {/* Configuration Summary */}
                      <div className="max-w-md mx-auto space-y-3">
                        {/* Model Type */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="text-xs text-gray-600">Model Type:</span>
                          </div>
                          <span className="text-xs text-gray-900">
                            {models.find((m) => m.id === selectedModel)?.label}
                          </span>
                        </div>

                        {/* Ethnicity */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">Ethnicity:</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">
                              {ethnicities.find((e) => e.id === selectedEthnicity)?.flag}
                            </span>
                            <span className="text-xs text-gray-900">
                              {ethnicities.find((e) => e.id === selectedEthnicity)?.label}
                            </span>
                          </div>
                        </div>

                        {/* Body Type */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">Body Type:</span>
                          </div>
                          <span className="text-xs text-gray-900">
                            {bodyTypes.find((b) => b.id === selectedBodyType)?.label}
                          </span>
                        </div>

                        {/* Hair Color */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">Hair Color:</span>
                          </div>
                          <span className="text-xs text-gray-900">
                            {hairColors.find((h) => h.id === selectedHairColor)?.label}
                          </span>
                        </div>

                        {/* Eye Color */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">Eye Color:</span>
                          </div>
                          <span className="text-xs text-gray-900">
                            {eyeColors.find((e) => e.id === selectedEyeColor)?.label}
                          </span>
                        </div>

                        {/* Height */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">Height:</span>
                          </div>
                          <span className="text-xs text-gray-900">
                            {heights.find((h) => h.id === selectedHeight)?.label}
                          </span>
                        </div>

                        {/* Pose */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">Pose:</span>
                          </div>
                          <span className="text-xs text-gray-900">
                            {poses.find((p) => p.id === selectedPose)?.label}
                          </span>
                        </div>

                        {/* Garment */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <Shirt className="w-4 h-4 text-gray-600" />
                            <span className="text-xs text-gray-600">Product:</span>
                          </div>
                          {selectedGarment ? (
                            <span className="text-xs text-gray-900">
                              {selectedGarment === 'uploaded'
                                ? 'Uploaded Image'
                                : garments.find((g) => g.id === selectedGarment)?.name}
                            </span>
                          ) : (
                            <span className="text-xs text-red-600">Not Selected ❌</span>
                          )}
                        </div>
                      </div>

                      {/* Warning if garment not selected */}
                      {!selectedGarment && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg max-w-md mx-auto">
                          <p className="text-xs text-amber-900 text-center">
                            ⚠️ Please select a product to generate your design
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedGarment || tokenBalance < GENERATION_COST}
                  className={`w-full mt-4 px-6 py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-all ${
                    isGenerating || !selectedGarment || tokenBalance < GENERATION_COST
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <Wand2 className="w-5 h-5" />
                  {isGenerating
                    ? 'Generating...'
                    : !selectedGarment
                      ? 'Select a Product First'
                      : tokenBalance < GENERATION_COST
                        ? 'Insufficient Tokens'
                        : `Generate Design with AI (${GENERATION_COST} tokens)`}
                </button>

                {/* Token Cost Info */}
                <div className="mt-4 p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-[#F5B800] to-[#E5A800] rounded-full flex items-center justify-center shadow-sm">
                        <svg
                          className="w-3.5 h-3.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-900">
                        Token Balance: <strong>{tokenBalance.toLocaleString()}</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => setShowTokenModal(true)}
                      className="px-3 py-1.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-xs transition-colors"
                    >
                      Buy More
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">
                    Each generation costs <strong>{GENERATION_COST} tokens</strong>. You can
                    generate {Math.floor(tokenBalance / GENERATION_COST)} more designs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Chat Button */}
      

      {/* Toast Notification */}
      <ToastV2
        title={toastMessage.title}
        message={toastMessage.message}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Help Modal */}
      {showHelpModal && <HelpModal page="model-designer" onClose={() => setShowHelpModal(false)} />}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-gray-900">Upload Product Image</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Upload your product image (bag, shoes, accessories, etc.) to visualize it on the AI
              model.
            </p>

            {/* Upload Options */}
            <div className="space-y-4">
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#F5B800] transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-700 mb-1">Click to upload</p>
                <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          handleImageUpload(event.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>

              {/* URL Input */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <LinkIcon className="w-4 h-4 text-gray-600" />
                  <label className="text-sm text-gray-700">Or paste image URL</label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#F5B800]"
                    id="image-url-input"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('image-url-input') as HTMLInputElement;
                      if (input && input.value) {
                        handleImageUpload(input.value);
                      }
                    }}
                    className="px-4 py-2 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Quick Examples */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Quick examples:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() =>
                      handleImageUpload(
                        'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400&h=400&fit=crop',
                      )
                    }
                    className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#F5B800] transition-colors"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400&h=400&fit=crop"
                      alt="Bag example"
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <button
                    onClick={() =>
                      handleImageUpload(
                        'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=400&fit=crop',
                      )
                    }
                    className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#F5B800] transition-colors"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=400&fit=crop"
                      alt="Shoes example"
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <button
                    onClick={() =>
                      handleImageUpload(
                        'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop',
                      )
                    }
                    className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#F5B800] transition-colors"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop"
                      alt="Watch example"
                      className="w-full h-full object-cover"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Token Purchase Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#F5B800] to-[#E5A800] rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg text-gray-900">Buy AI Credits</h3>
                  <p className="text-sm text-gray-500">
                    Current Balance: <strong>{tokenBalance} tokens</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {/* Starter Package */}
              <button
                onClick={() => {
                  setTokenBalance(tokenBalance + 50);
                  setShowTokenModal(false);
                  setToastMessage({
                    title: 'Tokens Purchased!',
                    message: '50 tokens added to your account.',
                  });
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 3000);
                }}
                className="w-full bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl p-4 border-2 border-gray-200 hover:border-[#F5B800] transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base text-gray-900">Starter Pack</span>
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                        Popular
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">50 tokens - 5 generations</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl text-gray-900">$5</p>
                    <p className="text-xs text-gray-500">$0.10 per token</p>
                  </div>
                </div>
              </button>

              {/* Pro Package */}
              <button
                onClick={() => {
                  setTokenBalance(tokenBalance + 150);
                  setShowTokenModal(false);
                  setToastMessage({
                    title: 'Tokens Purchased!',
                    message: '150 tokens added to your account.',
                  });
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 3000);
                }}
                className="w-full bg-gradient-to-br from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 rounded-xl p-4 border-2 border-[#F5B800] hover:border-[#E5A800] transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base text-gray-900">Pro Pack</span>
                      <span className="px-2 py-0.5 bg-[#F5B800] text-gray-900 rounded text-xs">
                        Best Value
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">150 tokens - 15 generations</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl text-gray-900">$12</p>
                    <p className="text-xs text-gray-600">
                      $0.08 per token <span className="text-green-600">↓ 20% off</span>
                    </p>
                  </div>
                </div>
              </button>

              {/* Enterprise Package */}
              <button
                onClick={() => {
                  setTokenBalance(tokenBalance + 500);
                  setShowTokenModal(false);
                  setToastMessage({
                    title: 'Tokens Purchased!',
                    message: '500 tokens added to your account.',
                  });
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 3000);
                }}
                className="w-full bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl p-4 border-2 border-purple-200 hover:border-purple-300 transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base text-gray-900">Enterprise Pack</span>
                      <span className="px-2 py-0.5 bg-purple-500 text-white rounded text-xs">
                        Premium
                      </span>
                    </div>
                    <p className="text-sm text-purple-700">500 tokens - 50 generations</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl text-gray-900">$30</p>
                    <p className="text-xs text-purple-600">
                      $0.06 per token <span className="text-green-600">↓ 40% off</span>
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-xs text-blue-900">
                <strong>💡 Note:</strong> Tokens never expire and can be used for any AI generation
                in Beekod. Each model generation costs {GENERATION_COST} tokens.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notification Panel */}
      <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </div>
  );
}
