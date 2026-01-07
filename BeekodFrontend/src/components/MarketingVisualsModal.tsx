import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Image as ImageIcon,
  Check,
  Loader2,
  ArrowRight,
  Download,
  Wand2,
  Layout,
} from 'lucide-react';
import { getSceneTemplates, generateProductScene } from '../services/ai';
import { toast } from 'sonner';

interface MarketingVisualsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    barcode: string;
    name: string;
    image: string;
  };
  onSuccess?: (newImageUrl: string) => void;
}

export function MarketingVisualsModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: MarketingVisualsModalProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      const data = await getSceneTemplates();
      setTemplates(data);
      if (data.length > 0) setSelectedTemplate(data[0].id);
    } catch (error) {
      toast.error('Görünüm şablonları yüklenemedi.');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setIsGenerating(true);
    try {
      const result = await generateProductScene(product.barcode, selectedTemplate);
      setGeneratedImage(result.imageUrl);
      toast.success('Görsel başarıyla oluşturuldu!');
    } catch (error) {
      toast.error('Görsel oluşturulurken bir hata oluştu.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-yellow-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-100">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 font-display">AI İlan Tasarımcısı</h3>
              <p className="text-sm text-gray-500">
                Ürününüzü saniyeler içinde profesyonel bir stüdyo karesine dönüştürün.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Product & Preview */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 ring-1 ring-black/5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  Orijinal Ürün
                </h4>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <img
                      src={product.image}
                      className="w-full h-full object-cover"
                      alt={product.name}
                    />
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h5>
                    <p className="text-sm text-gray-500">{product.barcode}</p>
                  </div>
                </div>
              </div>

              <div className="relative aspect-square bg-gray-100 rounded-3xl overflow-hidden border-2 border-dashed border-gray-200 group">
                {isGenerating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                    <div className="relative">
                      <Loader2 className="w-16 h-16 text-yellow-500 animate-spin" />
                      <Wand2 className="w-6 h-6 text-yellow-600 absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <p className="mt-6 text-gray-900 font-bold animate-pulse">Lütfen Bekleyin...</p>
                    <p className="text-sm text-gray-500">AI sahneyi oluşturuyor...</p>
                  </div>
                ) : generatedImage ? (
                  <img
                    src={generatedImage}
                    className="w-full h-full object-cover animate-in fade-in duration-700"
                    alt="Generated"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-12 text-center">
                    <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-sm font-medium">
                      Sağ taraftan bir tema seçin ve <br /> tasarımı başlatın.
                    </p>
                  </div>
                )}
              </div>

              {generatedImage && (
                <div className="flex gap-4">
                  <button
                    onClick={() => onSuccess && onSuccess(generatedImage)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-100 transition-all active:scale-95"
                  >
                    <Check className="w-5 h-5" /> Vitrinde Kullan
                  </button>
                  <a
                    href={generatedImage}
                    download={`marketing-visual-${product.barcode}.jpg`}
                    className="px-6 bg-white border-2 border-gray-100 hover:border-gray-200 text-gray-700 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              )}
            </div>

            {/* Right: Theme Selection */}
            <div className="flex flex-col h-full">
              <h4 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Layout className="w-4 h-4 text-yellow-600" />
                Bir Görünüm Teması Seçin
              </h4>

              <div className="grid grid-cols-1 gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {isLoadingTemplates
                  ? Array(4)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="h-32 bg-gray-50 animate-pulse rounded-2xl"></div>
                      ))
                  : templates.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => setSelectedTemplate(tpl.id)}
                        className={`group relative flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                          selectedTemplate === tpl.id
                            ? 'border-yellow-400 bg-yellow-50/50 ring-4 ring-yellow-400/10'
                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-24 h-24 rounded-xl overflow-hidden shadow-inner flex-shrink-0">
                          <img
                            src={tpl.previewUrl}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            alt={tpl.name}
                          />
                        </div>
                        <div className="flex-1">
                          <h5
                            className={`font-bold transition-colors ${selectedTemplate === tpl.id ? 'text-yellow-700' : 'text-gray-900'}`}
                          >
                            {tpl.name}
                          </h5>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {tpl.description}
                          </p>
                        </div>
                        {selectedTemplate === tpl.id && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-yellow-400 rounded-full p-1 text-white">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100">
                <button
                  disabled={!selectedTemplate || isGenerating}
                  onClick={handleGenerate}
                  className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-200 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98] group"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-yellow-400 group-hover:scale-125 transition-transform" />
                      AI İle Tasarımı Başlat
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest">
                  Powered by Gemini Vision & Scene Engine
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
