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
  ChevronRight,
  Check,
  Video,
} from 'lucide-react';
import { aiModelService } from '../services/aiModelService';
import { useState } from 'react';
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
import shortHairLengthImage from 'figma:asset/cb72f6dce201c666472dc8d32b9eedb482e1510e.png';
import mediumHairLengthImage from 'figma:asset/ff07eef6fed6afc5fbcd46f649305375382805c9.png';
import longHairLengthImage from 'figma:asset/c30be34ff20097037fd4d5c68805466971f7cb08.png';
import zayifBodyImage from 'figma:asset/47763b5513f64acd986685a9d5e10bd4314defe9.png';
import ortaKiloluBodyImage from 'figma:asset/64dc6519a41c808e79b146fe45a387ef0feaa1e3.png';
import kiloluBodyImage from 'figma:asset/9b68cc0466e0009fad17ab706b6d2cbcaef51769.png';
import uzunBoyluImage from 'figma:asset/5fa5209c94af33a11d3aaaf2a174b2cb5272e14c.png';
import ortaBoyImage from 'figma:asset/d9e7858ce1064fa81f9436bd9a9555bab0a0b90e.png';
import kisaBoyImage from 'figma:asset/c0d82a7204c9fe75fd4e1885989d8780eea69d6e.png';
import frontPoseImage from 'figma:asset/faa1458c5295db0f7e44f05d2570257e3b9ea5cc.png';
import sidePoseImage from 'figma:asset/93b2295c6ddd5a8c10d08a31a7ba575178617577.png';
import walkingPoseImage from 'figma:asset/db66e26aa7224f7020be1ee7db35f0c2b3e94a26.png';

interface ModelDesignerScreenV3Props {
  onNavigate: (screen: string) => void;
}

export function ModelDesignerScreenV3({ onNavigate }: ModelDesignerScreenV3Props) {
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
  const [selectedHairLength, setSelectedHairLength] = useState<string>('medium');
  const [selectedEyeColor, setSelectedEyeColor] = useState<string>('kahverengi');
  const [selectedHeight, setSelectedHeight] = useState<string>('orta');
  const [selectedPose, setSelectedPose] = useState<string>('front');
  const [expandedSection, setExpandedSection] = useState<string | null>('model');
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{
    name: string;
    tokens: number;
    price: number;
    savings?: number;
  } | null>(null);

  const GENERATION_COST = 10;

  const models = [
    {
      id: 'female',
      label: 'Female',
      image: 'https://images.unsplash.com/photo-1721003080966-423d4017d09d?w=400&h=600&fit=crop',
    },
    {
      id: 'male',
      label: 'Male',
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
    { id: 'zayif', label: 'Slim', image: zayifBodyImage },
    { id: 'orta-kilolu', label: 'Medium', image: ortaKiloluBodyImage },
    { id: 'kilolu', label: 'Plus Size', image: kiloluBodyImage },
  ];

  const hairColors = [
    { id: 'siyah', label: 'Black', image: siyahHairImage },
    { id: 'kahverengi', label: 'Brown', image: kahverengiHairImage },
    { id: 'sari', label: 'Blonde', image: sariHairImage },
    { id: 'gri', label: 'Gray', image: griHairImage },
    { id: 'kizil', label: 'Red', image: kizilHairImage },
    { id: 'turuncu', label: 'Auburn', image: turuncuHairImage },
  ];

  const hairLengths = [
    { id: 'short', label: 'Short', image: shortHairLengthImage },
    { id: 'medium', label: 'Medium', image: mediumHairLengthImage },
    { id: 'long', label: 'Long', image: longHairLengthImage },
  ];

  const eyeColors = [
    { id: 'kahverengi', label: 'Brown', bgPosition: '50% 50%' },
    { id: 'mavi', label: 'Blue', bgPosition: '50% 0%' },
    { id: 'yesil', label: 'Green', bgPosition: '100% 0%' },
    { id: 'ela', label: 'Hazel', bgPosition: '0% 50%' },
    { id: 'gri', label: 'Gray', bgPosition: '0% 0%' },
    { id: 'siyah', label: 'Black', bgPosition: '100% 100%' },
  ];

  const heights = [
    { id: 'kisa', label: 'Short', image: kisaBoyImage },
    { id: 'orta', label: 'Medium', image: ortaBoyImage },
    { id: 'uzun', label: 'Tall', image: uzunBoyluImage },
  ];

  const poses = [
    { id: 'front', label: 'Front View', image: frontPoseImage },
    { id: 'side', label: 'Side View', image: sidePoseImage },
    { id: 'walking', label: 'Walking', image: walkingPoseImage },
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



  /* Updated handleGenerate */
  const handleGenerate = async () => {
    if (!selectedGarment) {
      setToastMessage({
        title: 'Please Select a Product',
        message: 'You need to select a clothing item before generating.',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    // Check local balance (optional, could be server side enforced too)
    if (tokenBalance < GENERATION_COST) {
      setToastMessage({
        title: 'Insufficient Tokens',
        message: 'You do not have enough tokens.',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setIsGenerating(true);
    setToastMessage({
      title: 'Generating Design...',
      message: 'AI is creating your model visualization. This takes about 10-20 seconds.',
    });
    setShowToast(true);

    try {
      // 1. Determine Human Image
      // For now, if using presets, we need a real ID or mapped URL that backend can download.
      // Or we send the preset URL directly. Backend checks for http.
      const modelObj = models.find(m => m.id === selectedModel);
      const humanImg = modelObj?.image || "";

      // 2. Determine Clothes Image
      let clothesImg = "";
      if (selectedGarment === 'uploaded' && uploadedImage) {
        // Need to convert Base64/Blob URL to File if strictly required, 
        // OR if backend handles base64, good.
        // Our wiroService expects file path or URL.
        // If uploadedImage is a blob:url, backend can't read it from client browser memory.
        // WE NEED TO UPLOAD THE FILE. 
        // Assumption: uploadedImage is base64 string or we have the File object stored?
        // "uploadedImage" in state seems to be string.
        // If it's a data url, we might need to convert.
        clothesImg = uploadedImage;
      } else {
        const g = garments.find(i => i.id === selectedGarment);
        clothesImg = g?.thumbnail || "";
      }

      // Note: Sending data URI (base64) to backend requires backend to handle it or frontend to convert to Blob -> FormData file.
      // Current implementation: aiModelService accepts string or File. 
      // Backend Message: "File not found" if simple string path is sent that doesn't exist on server. 
      // If ModelDesigner uses remote URLs for presets, it works.
      // If user uploads from local, selectedGarment='uploaded', visual is Blob/Base64.

      // Let's assume for this step we pass whatever is in state, and ensure backend/service handles it.
      // Ideally we should pass the FILE object for uploads. 
      // But ModelDesignerScreenV3 state only stores string `uploadedImage`.

      if (!humanImg || !clothesImg) throw new Error("Missing images");

      setToastMessage({
        title: 'Generating Design...',
        message: 'Preprocessing inputs...',
      });
      setShowToast(true);

      console.log("Calling generate with:", { humanImg, clothesImg });
      const response = await aiModelService.generate(humanImg, clothesImg);
      console.log("Generate response:", response);
      const { socketaccesstoken, taskid } = response;
      console.log("Extracted tokens:", { socketaccesstoken, taskid });

      // 3. Connect Socket for UX updates (Non-critical)
      let ws: WebSocket | null = null;
      try {
        ws = aiModelService.connectSocket(socketaccesstoken, (msg) => {
          console.log("Socket Update:", msg);
          if (msg.type) {
            let statusText = "";
            switch (msg.type) {
              case 'task_queue': statusText = "Waiting in queue..."; break;
              case 'task_start': statusText = "Generation started..."; break;
              case 'task_output': statusText = "Generating..."; break;
            }
            if (statusText) setToastMessage(prev => ({ ...prev, message: statusText }));
          }
        });
      } catch (e) {
        console.warn("Socket connection failed, relying on polling:", e);
      }

      // 4. Reliable Polling (Primary)
      // Poll every 2s, timeout 2 mins
      // IMPORTANT: Wiro API expects 'tasktoken' (socketaccesstoken) for status check, NOT taskid
      const resultUrl = await aiModelService.pollUntilComplete(socketaccesstoken, 2000, 120000);

      if (ws) {
        (ws as WebSocket).close();
      }

      setGeneratedImage(resultUrl);
      setTokenBalance(prev => prev - GENERATION_COST);
      setToastMessage({
        title: 'Design Generated!',
        message: 'Your AI-powered model visualization is ready.',
      });

    } catch (error: any) {
      setToastMessage({
        title: 'Generation Failed',
        message: error.message || 'Something went wrong.',
      });
      console.error("Gen Error:", error);
    } finally {
      setIsGenerating(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
  };

  const handleAnimate = async () => {
    if (!generatedImage) return;

    // Check balance
    if (tokenBalance < 20) {
      setToastMessage({
        title: 'Insufficient Tokens',
        message: 'Video generation costs 20 tokens.',
      });
      setShowToast(true);
      return;
    }

    setIsVideoGenerating(true);
    setToastMessage({
      title: 'Generating Video...',
      message: 'Converting your design into a video. This takes significantly longer (2-3 mins).',
    });
    setShowToast(true);

    try {
      const { socketaccesstoken, taskid } = await aiModelService.animate(generatedImage);

      // Connect Socket (Optional for UX)
      let ws: WebSocket | null = null;
      try {
        ws = aiModelService.connectSocket(socketaccesstoken, (msg) => {
          console.log("Video Socket Update:", msg);
          if (msg.type) {
            let statusText = "";
            switch (msg.type) {
              case 'task_queue': statusText = "Video queued..."; break;
              case 'task_start': statusText = "Generation started..."; break;
            }
            if (statusText) setToastMessage(prev => ({ ...prev, message: statusText }));
          }
        });
      } catch (e) {
        console.warn("Socket failed:", e);
      }

      // Reliable Polling (Primary) - 5 mins timeout
      // IMPORTANT: Wiro API expects 'tasktoken' (socketaccesstoken) for status check, NOT taskid
      const videoResultUrl = await aiModelService.pollUntilComplete(socketaccesstoken, 3000, 300000);

      if (ws) (ws as WebSocket).close();

      setVideoUrl(videoResultUrl);
      setTokenBalance(prev => prev - 20);
      setToastMessage({
        title: 'Video Ready!',
        message: 'Your AI video has been generated.',
      });

    } catch (error: any) {
      setToastMessage({
        title: 'Video Failed',
        message: error.message || 'Could not generate video.',
      });
      console.error("Video Error:", error);
    } finally {
      setIsVideoGenerating(false);
      setShowToast(true);
    }
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
    setToastMessage({ title: 'Downloading Image...', message: 'Your design is being saved.' });
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

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
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
            <div>
              <h1 className="text-xl text-gray-900">AI Model Designer</h1>
              <p className="text-xs text-gray-500 mt-1">
                Create stunning product visualizations with AI
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
                {/* Model & Basic Info */}
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
                        <h3 className="text-sm text-gray-900">Model Configuration</h3>
                        <p className="text-xs text-gray-500">
                          {models.find((m) => m.id === selectedModel)?.label} •{' '}
                          {ethnicities.find((e) => e.id === selectedEthnicity)?.label} •{' '}
                          {bodyTypes.find((b) => b.id === selectedBodyType)?.label}
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
                        <label className="text-xs text-gray-700 mb-2 block">Gender</label>
                        <div className="grid grid-cols-2 gap-3">
                          {models.map((model) => (
                            <button
                              key={model.id}
                              onClick={() => {
                                setSelectedModel(model.id as 'female' | 'male');
                                setGeneratedImage(null);
                              }}
                              className={`relative rounded-lg overflow-hidden border-2 transition-all group ${selectedModel === model.id
                                ? 'border-[#F5B800] ring-2 ring-[#F5B800]/20'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <img
                                src={model.image}
                                alt={model.label}
                                className="w-full h-28 object-cover"
                              />
                              <div
                                className={`absolute inset-0 flex items-center justify-center transition-opacity ${selectedModel === model.id
                                  ? 'bg-[#F5B800]/20'
                                  : 'bg-black/0 group-hover:bg-black/10'
                                  }`}
                              >
                                {selectedModel === model.id && (
                                  <div className="w-8 h-8 bg-[#F5B800] rounded-full flex items-center justify-center shadow-lg">
                                    <Check className="w-5 h-5 text-gray-900" />
                                  </div>
                                )}
                              </div>
                              <div className="p-2 bg-white">
                                <p className="text-xs text-gray-900 text-center">{model.label}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-700 mb-2 block">Ethnicity</label>
                        <div className="grid grid-cols-6 gap-2">
                          {ethnicities.map((ethnicity) => (
                            <button
                              key={ethnicity.id}
                              onClick={() => {
                                setSelectedEthnicity(ethnicity.id);
                                setGeneratedImage(null);
                              }}
                              className={`relative rounded-lg border-2 p-3 transition-all ${selectedEthnicity === ethnicity.id
                                ? 'border-[#F5B800] bg-[#F5B800]/5'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <p className="text-2xl text-center mb-1">{ethnicity.flag}</p>
                              <p className="text-xs text-gray-700 text-center truncate">
                                {ethnicity.label}
                              </p>
                              {selectedEthnicity === ethnicity.id && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#F5B800] rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-gray-900" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-700 mb-2 block">Body Type</label>
                        <div className="grid grid-cols-3 gap-3">
                          {bodyTypes.map((bodyType) => (
                            <button
                              key={bodyType.id}
                              onClick={() => {
                                setSelectedBodyType(bodyType.id);
                                setGeneratedImage(null);
                              }}
                              className={`relative rounded-lg overflow-hidden border-2 transition-all ${selectedBodyType === bodyType.id
                                ? 'border-[#F5B800] ring-2 ring-[#F5B800]/20'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <img
                                src={bodyType.image}
                                alt={bodyType.label}
                                className="w-full h-24 object-cover"
                              />
                              <div className="p-2 bg-white">
                                <p className="text-xs text-gray-900 text-center">
                                  {bodyType.label}
                                </p>
                              </div>
                              {selectedBodyType === bodyType.id && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-[#F5B800] rounded-full flex items-center justify-center shadow-lg">
                                  <Check className="w-4 h-4 text-gray-900" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Appearance */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleSection('appearance')}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <Palette className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm text-gray-900">Appearance Details</h3>
                        <p className="text-xs text-gray-500">
                          {hairColors.find((h) => h.id === selectedHairColor)?.label} •{' '}
                          {hairLengths.find((h) => h.id === selectedHairLength)?.label} Hair •{' '}
                          {eyeColors.find((e) => e.id === selectedEyeColor)?.label} Eyes •{' '}
                          {heights.find((h) => h.id === selectedHeight)?.label}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'appearance' ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {expandedSection === 'appearance' && (
                    <div className="px-6 pb-6 pt-2 space-y-5 border-t border-gray-100">
                      <div>
                        <label className="text-xs text-gray-700 mb-2 block">Hair Color</label>
                        <div className="grid grid-cols-6 gap-2">
                          {hairColors.map((hair) => (
                            <button
                              key={hair.id}
                              onClick={() => {
                                setSelectedHairColor(hair.id);
                                setGeneratedImage(null);
                              }}
                              className={`relative rounded-lg overflow-hidden border-2 transition-all ${selectedHairColor === hair.id
                                ? 'border-[#F5B800] ring-2 ring-[#F5B800]/20'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <img
                                src={hair.image}
                                alt={hair.label}
                                className="w-full h-16 object-cover"
                              />
                              <div className="p-1.5 bg-white">
                                <p className="text-xs text-gray-900 text-center truncate">
                                  {hair.label}
                                </p>
                              </div>
                              {selectedHairColor === hair.id && (
                                <div className="absolute top-1 right-1 w-5 h-5 bg-[#F5B800] rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-gray-900" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-700 mb-2 block">Hair Length</label>
                        <div className="grid grid-cols-3 gap-3">
                          {hairLengths.map((hairLength) => (
                            <button
                              key={hairLength.id}
                              onClick={() => {
                                setSelectedHairLength(hairLength.id);
                                setGeneratedImage(null);
                              }}
                              className={`relative rounded-lg overflow-hidden border-2 transition-all ${selectedHairLength === hairLength.id
                                ? 'border-[#F5B800] ring-2 ring-[#F5B800]/20'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <img
                                src={hairLength.image}
                                alt={hairLength.label}
                                className="w-full h-32 object-cover"
                              />
                              <div className="p-2 bg-white">
                                <p className="text-xs text-gray-900 text-center">
                                  {hairLength.label}
                                </p>
                              </div>
                              {selectedHairLength === hairLength.id && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-[#F5B800] rounded-full flex items-center justify-center shadow-lg">
                                  <Check className="w-4 h-4 text-gray-900" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-700 mb-2 block">Eye Color</label>
                        <div className="grid grid-cols-6 gap-2">
                          {eyeColors.map((eye) => (
                            <button
                              key={eye.id}
                              onClick={() => {
                                setSelectedEyeColor(eye.id);
                                setGeneratedImage(null);
                              }}
                              className={`relative rounded-lg overflow-hidden border-2 transition-all ${selectedEyeColor === eye.id
                                ? 'border-[#F5B800] ring-2 ring-[#F5B800]/20'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <div
                                className="w-full h-16"
                                style={{
                                  backgroundImage: `url(${eyeColorsImage})`,
                                  backgroundSize: '300% 300%',
                                  backgroundPosition: eye.bgPosition,
                                }}
                              />
                              <div className="p-1.5 bg-white">
                                <p className="text-xs text-gray-900 text-center truncate">
                                  {eye.label}
                                </p>
                              </div>
                              {selectedEyeColor === eye.id && (
                                <div className="absolute top-1 right-1 w-5 h-5 bg-[#F5B800] rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-gray-900" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-700 mb-2 block">Height</label>
                        <div className="grid grid-cols-3 gap-3">
                          {heights.map((height) => (
                            <button
                              key={height.id}
                              onClick={() => {
                                setSelectedHeight(height.id);
                                setGeneratedImage(null);
                              }}
                              className={`relative rounded-lg overflow-hidden border-2 transition-all ${selectedHeight === height.id
                                ? 'border-[#F5B800] ring-2 ring-[#F5B800]/20'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <img
                                src={height.image}
                                alt={height.label}
                                className="w-full h-24 object-cover"
                              />
                              <div className="p-2 bg-white">
                                <p className="text-xs text-gray-900 text-center">{height.label}</p>
                              </div>
                              {selectedHeight === height.id && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-[#F5B800] rounded-full flex items-center justify-center shadow-lg">
                                  <Check className="w-4 h-4 text-gray-900" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pose */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleSection('pose')}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm text-gray-900">Pose Selection</h3>
                        <p className="text-xs text-gray-500">
                          {poses.find((p) => p.id === selectedPose)?.label}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'pose' ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {expandedSection === 'pose' && (
                    <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                      <div className="grid grid-cols-3 gap-3">
                        {poses.map((pose) => (
                          <button
                            key={pose.id}
                            onClick={() => {
                              setSelectedPose(pose.id);
                              setGeneratedImage(null);
                            }}
                            className={`relative rounded-xl overflow-hidden border-2 transition-all ${selectedPose === pose.id
                              ? 'border-[#F5B800] ring-2 ring-[#F5B800]/20'
                              : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <img
                              src={pose.image}
                              alt={pose.label}
                              className="w-full h-32 object-cover"
                            />
                            <div className="p-2 bg-white">
                              <p className="text-xs text-gray-900 text-center">{pose.label}</p>
                            </div>
                            {selectedPose === pose.id && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-[#F5B800] rounded-full flex items-center justify-center shadow-lg">
                                <Check className="w-4 h-4 text-gray-900" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Product */}
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
                        <h3 className="text-sm text-gray-900">Product Selection</h3>
                        <p className="text-xs text-gray-500">
                          {selectedGarment === 'uploaded'
                            ? 'Uploaded Image'
                            : selectedGarment
                              ? garments.find((g) => g.id === selectedGarment)?.name
                              : 'No product selected'}
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
                        Upload Your Product
                      </button>

                      {uploadedImage && (
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
                            <p className="text-xs text-gray-900">Your Product</p>
                          </div>
                          {selectedGarment === 'uploaded' && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-[#F5B800] rounded-full flex items-center justify-center shadow-lg">
                              <Check className="w-4 h-4 text-gray-900" />
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-gray-500 mb-2">Or choose from templates:</p>
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
                    <h3 className="text-sm text-gray-900">Live Preview</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleReset}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Reset"
                      >
                        <RotateCcw className="w-4 h-4 text-gray-600" />
                      </button>
                      {generatedImage && (
                        <button
                          onClick={handleDownload}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Download"
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
                        <p className="text-xs text-gray-900">Creating Video Animation...</p>
                        <p className="text-[10px] text-gray-500 mt-1">This might take ~2 mins</p>
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
                          title="Close Video"
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
                        <p className="text-xs text-gray-900">Generating...</p>
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
                        <p className="text-xs text-gray-500">Configure and generate</p>
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
                        ? 'Generating...'
                        : !selectedGarment
                          ? 'Select Product'
                          : `Generate (${GENERATION_COST} tokens)`}
                    </button>

                    {generatedImage && !videoUrl && (
                      <button
                        onClick={handleAnimate}
                        disabled={isVideoGenerating || tokenBalance < 20}
                        className={`w-full px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all border-2 ${isVideoGenerating || tokenBalance < 20
                          ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-[#F5B800] text-[#F5B800] hover:bg-[#F5B800]/5'
                          }`}
                      >
                        <Video className="w-5 h-5" />
                        {isVideoGenerating ? 'Animating...' : 'Animate as Video (20 tokens)'}
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
                          <strong>{tokenBalance}</strong> tokens
                        </span>
                      </div>
                      <button
                        onClick={() => setShowTokenModal(true)}
                        className="px-2 py-1 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded text-xs transition-colors"
                      >
                        Buy
                      </button>
                    </div>
                  </div>
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-gray-900">Upload Product Image</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-700 mb-2">Click to upload product image</p>
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
                className="inline-block mt-2 px-5 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm cursor-pointer transition-colors"
              >
                Choose File
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
                <h3 className="text-xl text-gray-900">Buy AI Generation Credits</h3>
                <p className="text-sm text-gray-500 mt-1">Choose the perfect plan for your needs</p>
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Starter Pack */}
              <button
                onClick={() => {
                  setSelectedPackage({ name: 'Basic Pack', tokens: 50, price: 5 });
                  setShowTokenModal(false);
                  setShowPaymentModal(true);
                }}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg group"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center group-hover:bg-gray-300 transition-colors">
                      <Sparkles className="w-5 h-5 text-gray-600" />
                    </div>
                    <span className="px-2 py-1 bg-white rounded-lg text-xs text-gray-600 border border-gray-200">
                      Starter
                    </span>
                  </div>
                  <h4 className="text-base text-gray-900 mb-2">Basic Pack</h4>
                  <div className="mb-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl text-gray-900">$5</span>
                    </div>
                    <p className="text-xs text-gray-500">$0.10 per token</p>
                  </div>
                  <div className="mt-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#F5B800] to-[#E5A800] rounded-lg flex items-center justify-center">
                        <span className="text-sm text-gray-900">50</span>
                      </div>
                      <span className="text-xs text-gray-600">tokens</span>
                    </div>
                    <p className="text-xs text-gray-500">~5 AI generations</p>
                  </div>
                </div>
              </button>

              {/* Pro Pack - Most Popular */}
              <button
                onClick={() => {
                  setSelectedPackage({ name: 'Professional', tokens: 150, price: 12, savings: 20 });
                  setShowTokenModal(false);
                  setShowPaymentModal(true);
                }}
                className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border-2 border-[#F5B800] transition-all hover:shadow-xl hover:scale-105 relative group"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#F5B800] to-[#E5A800] rounded-full shadow-lg">
                  <span className="text-xs text-gray-900">Most Popular</span>
                </div>
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#F5B800] to-[#E5A800] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="px-2 py-1 bg-white rounded-lg text-xs text-gray-900 border border-[#F5B800]">
                      Pro
                    </span>
                  </div>
                  <h4 className="text-base text-gray-900 mb-2">Professional</h4>
                  <div className="mb-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl text-gray-900">$12</span>
                      <span className="text-xs text-gray-500 line-through">$15</span>
                    </div>
                    <p className="text-xs text-[#F5B800]">$0.08 per token • Save 20%</p>
                  </div>
                  <div className="mt-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#F5B800] to-[#E5A800] rounded-lg flex items-center justify-center">
                        <span className="text-sm text-gray-900">150</span>
                      </div>
                      <span className="text-xs text-gray-900">tokens</span>
                    </div>
                    <p className="text-xs text-gray-700">~15 AI generations</p>
                  </div>
                </div>
              </button>

              {/* Business Pack */}
              <button
                onClick={() => {
                  setSelectedPackage({
                    name: 'Business Pack',
                    tokens: 350,
                    price: 25,
                    savings: 30,
                  });
                  setShowTokenModal(false);
                  setShowPaymentModal(true);
                }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-200 hover:border-purple-300 transition-all hover:shadow-lg group"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="px-2 py-1 bg-white rounded-lg text-xs text-purple-700 border border-purple-200">
                      Business
                    </span>
                  </div>
                  <h4 className="text-base text-gray-900 mb-2">Business Pack</h4>
                  <div className="mb-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl text-gray-900">$25</span>
                      <span className="text-xs text-gray-500 line-through">$35</span>
                    </div>
                    <p className="text-xs text-purple-600">$0.07 per token • Save 30%</p>
                  </div>
                  <div className="mt-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <span className="text-sm text-white">350</span>
                      </div>
                      <span className="text-xs text-gray-600">tokens</span>
                    </div>
                    <p className="text-xs text-gray-500">~35 AI generations</p>
                  </div>
                </div>
              </button>

              {/* Enterprise Pack - Best Value */}
              <button
                onClick={() => {
                  setSelectedPackage({ name: 'Enterprise', tokens: 1000, price: 60, savings: 40 });
                  setShowTokenModal(false);
                  setShowPaymentModal(true);
                }}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border-2 border-blue-200 hover:border-blue-300 transition-all hover:shadow-lg relative group"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg">
                  <span className="text-xs text-white">Best Value</span>
                </div>
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="px-2 py-1 bg-white rounded-lg text-xs text-blue-700 border border-blue-200">
                      Enterprise
                    </span>
                  </div>
                  <h4 className="text-base text-gray-900 mb-2">Enterprise</h4>
                  <div className="mb-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl text-gray-900">$60</span>
                      <span className="text-xs text-gray-500 line-through">$100</span>
                    </div>
                    <p className="text-xs text-blue-600">$0.06 per token • Save 40%</p>
                  </div>
                  <div className="mt-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <span className="text-sm text-white">1K</span>
                      </div>
                      <span className="text-xs text-gray-600">tokens</span>
                    </div>
                    <p className="text-xs text-gray-500">~100 AI generations</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Features List */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h4 className="text-sm text-gray-900 mb-3">All plans include:</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-700">AI-powered model generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-700">High-resolution exports</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-700">Unlimited customization</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-700">Commercial usage rights</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-700">Priority processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-700">No expiration date</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="mt-4 flex items-center justify-between px-4 py-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-gray-700">Secure payment processing</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">💳 All major cards accepted</span>
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
                <h3 className="text-2xl text-gray-900">Complete Your Purchase</h3>
                <p className="text-sm text-gray-500 mt-1">Secure checkout powered by Stripe</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Order Summary */}
              <div>
                <h4 className="text-sm text-gray-900 mb-4">Order Summary</h4>
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-5 border-2 border-[#F5B800]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#F5B800] to-[#E5A800] rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h5 className="text-base text-gray-900">{selectedPackage.name}</h5>
                      <p className="text-xs text-gray-600">
                        {selectedPackage.tokens} AI Generation Credits
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 py-3 border-t border-amber-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">${selectedPackage.price}</span>
                    </div>
                    {selectedPackage.savings && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Savings ({selectedPackage.savings}%)</span>
                        <span className="text-green-600">
                          -$
                          {(
                            (selectedPackage.price * selectedPackage.savings) /
                            (100 - selectedPackage.savings)
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-amber-200">
                      <span className="text-gray-900">Total</span>
                      <span className="text-xl text-gray-900">${selectedPackage.price}</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-gray-700">Instant credit delivery</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-gray-700">No expiration date</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-gray-700">Commercial usage rights</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Payment Form */}
              <div>
                <h4 className="text-sm text-gray-900 mb-4">Payment Information</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-700 mb-1 block">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-700 mb-1 block">Card Number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800] focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-700 mb-1 block">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-700 mb-1 block">CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="text-xs text-gray-700 mb-1 block">Email Address</label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800] focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Receipt will be sent to this email</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="terms"
                      className="w-4 h-4 text-[#F5B800] border-gray-300 rounded focus:ring-[#F5B800]"
                    />
                    <label htmlFor="terms" className="text-xs text-gray-600">
                      I agree to the{' '}
                      <span className="text-[#F5B800] hover:underline cursor-pointer">
                        Terms of Service
                      </span>{' '}
                      and{' '}
                      <span className="text-[#F5B800] hover:underline cursor-pointer">
                        Privacy Policy
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Badge */}
            <div className="mt-6 flex items-center justify-center gap-4 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-gray-700">SSL Encrypted</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-700">🔒 PCI Compliant</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">💳 Visa • Mastercard • Amex</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setTokenBalance(tokenBalance + selectedPackage.tokens);
                  setShowPaymentModal(false);
                  setToastMessage({
                    title: 'Payment Successful! 🎉',
                    message: `${selectedPackage.tokens} tokens added to your account.`,
                  });
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 3000);
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#F5B800] to-[#E5A800] hover:from-[#E5A800] hover:to-[#D59700] text-gray-900 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <Check className="w-5 h-5" />
                Pay ${selectedPackage.price}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
