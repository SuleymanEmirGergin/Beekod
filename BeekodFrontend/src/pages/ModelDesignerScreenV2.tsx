import uzunBoyluImage from 'figma:asset/5fa5209c94af33a11d3aaaf2a174b2cb5272e14c.png';
import ortaBoyImage from 'figma:asset/d9e7858ce1064fa81f9436bd9a9555bab0a0b90e.png';
import kisaBoyImage from 'figma:asset/c0d82a7204c9fe75fd4e1885989d8780eea69d6e.png';
import frontPoseImage from 'figma:asset/faa1458c5295db0f7e44f05d2570257e3b9ea5cc.png';
import sidePoseImage from 'figma:asset/93b2295c6ddd5a8c10d08a31a7ba575178617577.png';
import walkingPoseImage from 'figma:asset/db66e26aa7224f7020be1ee7db35f0c2b3e94a26.png';

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
import { ChatWidget } from '../components/ChatWidget';
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

interface ModelDesignerScreenV2Props {
  onNavigate: (screen: string) => void;
}

export function ModelDesignerScreenV2({ onNavigate }: ModelDesignerScreenV2Props) {
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
  const [tokenBalance, setTokenBalance] = useState(150);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedBodyType, setSelectedBodyType] = useState<string>('orta-kilolu');
  const [selectedHairColor, setSelectedHairColor] = useState<string>('siyah');
  const [selectedEyeColor, setSelectedEyeColor] = useState<string>('kahverengi');
  const [selectedHeight, setSelectedHeight] = useState<string>('orta');
  const [selectedPose, setSelectedPose] = useState<string>('front');
  const [activeTab, setActiveTab] = useState<'model' | 'appearance' | 'pose' | 'product'>('model');

  const GENERATION_COST = 10;

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
    { id: 'kahverengi', label: 'Brown', color: '#654321', icon: '👁️', bgPosition: '50% 50%' },
    { id: 'mavi', label: 'Blue', color: '#1E90FF', icon: '👁️', bgPosition: '50% 0%' },
    { id: 'yesil', label: 'Green', color: '#228B22', icon: '👁️', bgPosition: '100% 0%' },
    { id: 'ela', label: 'Hazel', color: '#B8860B', icon: '👁️', bgPosition: '0% 50%' },
    { id: 'gri', label: 'Gray', color: '#808080', icon: '👁️', bgPosition: '0% 0%' },
    { id: 'siyah', label: 'Black', color: '#000000', icon: '👁️', bgPosition: '100% 100%' },
  ];

  const heights = [
    { id: 'kisa', label: 'Short', range: '150-165 cm', icon: '📏', image: kisaBoyImage },
    { id: 'orta', label: 'Medium', range: '165-175 cm', icon: '📐', image: ortaBoyImage },
    { id: 'uzun', label: 'Tall', range: '175-190 cm', icon: '📊', image: uzunBoyluImage },
  ];

  const poses = [
    { id: 'front', label: 'Front View', icon: '🧍', image: frontPoseImage },
    { id: 'side', label: 'Side View', icon: '🚶', image: sidePoseImage },
    { id: 'walking', label: 'Walking', icon: '🚶‍♀️', image: walkingPoseImage },
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
    setToastMessage({ title: 'Design Reset', message: 'Canvas cleared. Start a new design.' });
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
        <main className="flex-1 overflow-hidden px-8 py-6">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg text-gray-900 mb-1">AI-Powered Virtual Model Designer</h2>
                <p className="text-sm text-gray-700 mb-3">
                  Create stunning product visualizations by applying your clothing items to
                  AI-generated models.
                </p>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-purple-200">
                    <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-xs text-gray-700">AI-Generated</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-purple-200">
                    <Shirt className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-xs text-gray-700">Virtual Try-On</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-3 gap-6 h-[calc(100vh-280px)]">
            {/* Left Panel - Tab-based Configuration */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
              {/* Tab Navigation */}
              <div className="grid grid-cols-4 border-b border-gray-200 flex-shrink-0">
                <button
                  onClick={() => setActiveTab('model')}
                  className={`py-3 text-xs transition-all flex flex-col items-center justify-center gap-1 ${
                    activeTab === 'model'
                      ? 'bg-[#F5B800] text-gray-900'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Model</span>
                </button>
                <button
                  onClick={() => setActiveTab('appearance')}
                  className={`py-3 text-xs transition-all flex flex-col items-center justify-center gap-1 ${
                    activeTab === 'appearance'
                      ? 'bg-[#F5B800] text-gray-900'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  <span>Style</span>
                </button>
                <button
                  onClick={() => setActiveTab('pose')}
                  className={`py-3 text-xs transition-all flex flex-col items-center justify-center gap-1 ${
                    activeTab === 'pose'
                      ? 'bg-[#F5B800] text-gray-900'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Pose</span>
                </button>
                <button
                  onClick={() => setActiveTab('product')}
                  className={`py-3 text-xs transition-all flex flex-col items-center justify-center gap-1 ${
                    activeTab === 'product'
                      ? 'bg-[#F5B800] text-gray-900'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Shirt className="w-4 h-4" />
                  <span>Product</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Model Tab */}
                {activeTab === 'model' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm text-gray-900 mb-3">Gender</h4>
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
                              className="w-full h-32 object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                              <p className="text-xs text-white text-center">{model.label}</p>
                            </div>
                            {selectedModel === model.id && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-[#F5B800] rounded-full flex items-center justify-center">
                                <Sparkles className="w-3 h-3 text-gray-900" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm text-gray-900 mb-3">Ethnicity</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {ethnicities.map((ethnicity) => (
                          <button
                            key={ethnicity.id}
                            onClick={() => {
                              setSelectedEthnicity(ethnicity.id);
                              setGeneratedImage(null);
                            }}
                            className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                              selectedEthnicity === ethnicity.id
                                ? 'border-[#F5B800] shadow-lg'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="w-full h-16 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                              <p className="text-2xl mb-1">{ethnicity.flag}</p>
                              <p className="text-xs text-gray-700">{ethnicity.label}</p>
                            </div>
                            {selectedEthnicity === ethnicity.id && (
                              <div className="absolute top-1 right-1 w-4 h-4 bg-[#F5B800] rounded-full flex items-center justify-center">
                                <Sparkles className="w-2.5 h-2.5 text-gray-900" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm text-gray-900 mb-3">Body Type</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {bodyTypes.map((bodyType) => (
                          <button
                            key={bodyType.id}
                            onClick={() => {
                              setSelectedBodyType(bodyType.id);
                              setGeneratedImage(null);
                            }}
                            className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                              selectedBodyType === bodyType.id
                                ? 'border-[#F5B800] shadow-lg'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img
                              src={bodyType.image}
                              alt={bodyType.label}
                              className="w-full h-24 object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                              <p className="text-xs text-white text-center">{bodyType.label}</p>
                            </div>
                            {selectedBodyType === bodyType.id && (
                              <div className="absolute top-1 right-1 w-4 h-4 bg-[#F5B800] rounded-full flex items-center justify-center">
                                <Sparkles className="w-2.5 h-2.5 text-gray-900" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm text-gray-900 mb-3">Hair Color</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {hairColors.map((hairColor) => (
                          <button
                            key={hairColor.id}
                            onClick={() => {
                              setSelectedHairColor(hairColor.id);
                              setGeneratedImage(null);
                            }}
                            className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                              selectedHairColor === hairColor.id
                                ? 'border-[#F5B800] shadow-lg'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img
                              src={hairColor.image}
                              alt={hairColor.label}
                              className="w-full h-20 object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                              <p className="text-xs text-white text-center">{hairColor.label}</p>
                            </div>
                            {selectedHairColor === hairColor.id && (
                              <div className="absolute top-1 right-1 w-4 h-4 bg-[#F5B800] rounded-full flex items-center justify-center">
                                <Sparkles className="w-2.5 h-2.5 text-gray-900" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm text-gray-900 mb-3">Eye Color</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {eyeColors.map((eyeColor) => (
                          <button
                            key={eyeColor.id}
                            onClick={() => {
                              setSelectedEyeColor(eyeColor.id);
                              setGeneratedImage(null);
                            }}
                            className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                              selectedEyeColor === eyeColor.id
                                ? 'border-[#F5B800] shadow-lg'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div
                              className="w-full h-20"
                              style={{
                                backgroundImage: `url(${eyeColorsImage})`,
                                backgroundSize: '300% 300%',
                                backgroundPosition: eyeColor.bgPosition,
                              }}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                              <p className="text-xs text-white text-center">{eyeColor.label}</p>
                            </div>
                            {selectedEyeColor === eyeColor.id && (
                              <div className="absolute top-1 right-1 w-4 h-4 bg-[#F5B800] rounded-full flex items-center justify-center">
                                <Sparkles className="w-2.5 h-2.5 text-gray-900" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm text-gray-900 mb-3">Height</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {heights.map((height) => (
                          <button
                            key={height.id}
                            onClick={() => {
                              setSelectedHeight(height.id);
                              setGeneratedImage(null);
                            }}
                            className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                              selectedHeight === height.id
                                ? 'border-[#F5B800] shadow-lg'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img
                              src={height.image}
                              alt={height.label}
                              className="w-full h-24 object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                              <p className="text-xs text-white text-center">{height.label}</p>
                            </div>
                            {selectedHeight === height.id && (
                              <div className="absolute top-1 right-1 w-4 h-4 bg-[#F5B800] rounded-full flex items-center justify-center">
                                <Sparkles className="w-2.5 h-2.5 text-gray-900" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pose Tab */}
                {activeTab === 'pose' && (
                  <div className="space-y-4">
                    <h4 className="text-sm text-gray-900">Select Pose</h4>
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
                            className="w-full h-40 object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-xs text-white text-center">{pose.label}</p>
                          </div>
                          {selectedPose === pose.id && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-[#F5B800] rounded-full flex items-center justify-center">
                              <Sparkles className="w-3 h-3 text-gray-900" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Tab */}
                {activeTab === 'product' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm text-gray-900">Your Product</h4>
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-3 py-1.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload
                      </button>
                    </div>

                    {uploadedImage && (
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
                    )}

                    <div>
                      <p className="text-xs text-gray-500 mb-2">Or choose from templates:</p>
                      <div className="grid grid-cols-2 gap-2">
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
                              className="w-full h-24 object-cover"
                            />
                            <div className="p-2 bg-white">
                              <p className="text-xs text-gray-900 truncate">{garment.name}</p>
                              <p className="text-xs text-gray-500">{garment.category}</p>
                            </div>
                            {selectedGarment === garment.id && (
                              <div className="absolute top-1 right-1 w-4 h-4 bg-[#F5B800] rounded-full flex items-center justify-center">
                                <Sparkles className="w-2.5 h-2.5 text-gray-900" />
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

            {/* Right Panel - Preview & Generation */}
            <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
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

              <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center mb-4">
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
                      className="w-full h-full object-contain rounded-lg"
                    />
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-[#F5B800] rounded-lg shadow-lg">
                      <p className="text-xs text-gray-900 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI Generated
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center max-w-md px-4">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-900 mb-2">Ready to Generate</p>
                    <p className="text-xs text-gray-500">
                      Configure your model using the tabs on the left, select a product, and click
                      Generate
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedGarment || tokenBalance < GENERATION_COST}
                className={`w-full px-6 py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-all ${
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
                      : `Generate Design (${GENERATION_COST} tokens)`}
              </button>

              <div className="mt-4 p-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gradient-to-br from-[#F5B800] to-[#E5A800] rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </div>
                    <span className="text-gray-900">
                      Balance: <strong>{tokenBalance}</strong> tokens
                    </span>
                  </div>
                  <button
                    onClick={() => setShowTokenModal(true)}
                    className="px-3 py-1 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded text-xs transition-colors"
                  >
                    Buy More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ChatWidget />
      <ToastV2
        title={toastMessage.title}
        message={toastMessage.message}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {showHelpModal && <HelpModal page="model-designer" onClose={() => setShowHelpModal(false)} />}
      <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* Upload Modal - abbreviated for space */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-gray-900">Upload Product Image</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload your product image to visualize it on the AI model.
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-700 mb-1">Click to upload</p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) handleImageUpload(event.target.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm cursor-pointer"
              >
                Choose File
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Token Modal - abbreviated */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-gray-900">Buy AI Credits</h3>
              <button
                onClick={() => setShowTokenModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <button
              onClick={() => {
                setTokenBalance(tokenBalance + 150);
                setShowTokenModal(false);
                setToastMessage({ title: 'Tokens Purchased!', message: '150 tokens added.' });
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
              }}
              className="w-full bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border-2 border-[#F5B800] mb-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-base text-gray-900">Pro Pack</span>
                  <p className="text-sm text-gray-700">150 tokens</p>
                </div>
                <p className="text-2xl text-gray-900">$12</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
