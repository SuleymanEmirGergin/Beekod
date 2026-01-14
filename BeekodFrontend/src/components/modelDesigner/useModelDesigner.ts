/**
 * useModelDesigner Hook
 * Manages all state for the model designer screen
 */

import { useState } from 'react';
import { GENERATION_COST, type ActiveTab } from './constants';

interface ToastMessage {
  title: string;
  message: string;
}

export function useModelDesigner() {
  // UI State
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<ToastMessage>({ title: '', message: '' });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('model');
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState(150);
  
  // Model Attributes
  const [selectedModel, setSelectedModel] = useState<'female' | 'male'>('female');
  const [selectedEthnicity, setSelectedEthnicity] = useState<string>('caucasian');
  const [selectedBodyType, setSelectedBodyType] = useState<string>('orta-kilolu');
  const [selectedHairColor, setSelectedHairColor] = useState<string>('siyah');
  const [selectedEyeColor, setSelectedEyeColor] = useState<string>('kahverengi');
  const [selectedHeight, setSelectedHeight] = useState<string>('orta');
  const [selectedPose, setSelectedPose] = useState<string>('front');
  
  // Product State
  const [selectedGarment, setSelectedGarment] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Style State
  const [selectedStyle, setSelectedStyle] = useState<string>('realistic');
  const [selectedScene, setSelectedScene] = useState<string>('minimalist_studio');
  const [is3DView, setIs3DView] = useState(false);

  // Helper to show toast
  const showNotification = (title: string, message: string, duration = 3000) => {
    setToastMessage({ title, message });
    setShowToast(true);
    setTimeout(() => setShowToast(false), duration);
  };

  // Clear generated image when selections change
  const handleSelectionChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    setter(value);
    setGeneratedImage(null);
  };

  // Handlers
  const handleGenerate = () => {
    if (!selectedGarment) {
      showNotification('Please Select a Garment', 'You need to select a clothing item before generating.');
      return;
    }

    if (tokenBalance < GENERATION_COST) {
      showNotification('Insufficient Tokens', 'You do not have enough tokens to generate a design.');
      return;
    }

    setIsGenerating(true);
    showNotification('Generating Design...', 'AI is creating your model visualization using NanoBanana technology.');

    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedImage('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=800&fit=crop');
      setTokenBalance(prev => prev - GENERATION_COST);
      showNotification('Design Generated!', 'Your AI-powered model visualization is ready.');
    }, 3000);
  };

  const handleReset = () => {
    setSelectedGarment(null);
    setUploadedImage(null);
    setGeneratedImage(null);
    showNotification('Design Reset', 'Canvas cleared. Start a new design.');
  };

  const handleDownload = () => {
    showNotification('Downloading Image...', 'Your design is being saved to your device.');
  };

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl);
    setSelectedGarment('uploaded');
    setShowUploadModal(false);
    showNotification('Image Uploaded!', 'Your product image has been uploaded successfully.');
  };

  return {
    // UI State
    showHelpModal, setShowHelpModal,
    showToast, toastMessage,
    showUploadModal, setShowUploadModal,
    showTokenModal, setShowTokenModal,
    showNotifications, setShowNotifications,
    activeTab, setActiveTab,
    
    // Generation State
    isGenerating,
    generatedImage,
    tokenBalance,
    
    // Model Attributes
    selectedModel,
    setSelectedModel: (v: 'female' | 'male') => handleSelectionChange(setSelectedModel, v),
    selectedEthnicity,
    setSelectedEthnicity: (v: string) => handleSelectionChange(setSelectedEthnicity, v),
    selectedBodyType,
    setSelectedBodyType: (v: string) => handleSelectionChange(setSelectedBodyType, v),
    selectedHairColor,
    setSelectedHairColor: (v: string) => handleSelectionChange(setSelectedHairColor, v),
    selectedEyeColor,
    setSelectedEyeColor: (v: string) => handleSelectionChange(setSelectedEyeColor, v),
    selectedHeight,
    setSelectedHeight: (v: string) => handleSelectionChange(setSelectedHeight, v),
    selectedPose,
    setSelectedPose: (v: string) => handleSelectionChange(setSelectedPose, v),
    
    // Product State
    selectedGarment,
    setSelectedGarment: (v: string | null) => handleSelectionChange(setSelectedGarment, v),
    uploadedImage,
    
    // Style State
    selectedStyle,
    setSelectedStyle: (v: string) => handleSelectionChange(setSelectedStyle, v),
    selectedScene,
    setSelectedScene: (v: string) => handleSelectionChange(setSelectedScene, v),
    is3DView, setIs3DView,
    
    // Handlers
    handleGenerate,
    handleReset,
    handleDownload,
    handleImageUpload,
  };
}
