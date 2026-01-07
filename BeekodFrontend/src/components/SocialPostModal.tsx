import React, { useState } from 'react';
import {
  X,
  Share2,
  Instagram,
  Twitter,
  Linkedin,
  MessageCircle,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Send,
} from 'lucide-react';
import { generateSocialPost } from '../services/ai';
import { toast } from 'sonner';

interface SocialPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    barcode: string;
    name: string;
    image: string;
  };
}

type Platform = 'instagram' | 'tiktok' | 'linkedin' | 'twitter';

export function SocialPostModal({ isOpen, onClose, product }: SocialPostModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('instagram');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const platforms = [
    {
      id: 'instagram',
      label: 'Instagram',
      icon: Instagram,
      color: 'text-pink-600',
      bg: 'bg-pink-50',
    },
    { id: 'tiktok', label: 'TikTok', icon: MessageCircle, color: 'text-black', bg: 'bg-gray-100' },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50' },
    {
      id: 'twitter',
      label: 'Twitter (X)',
      icon: Twitter,
      color: 'text-gray-900',
      bg: 'bg-gray-50',
    },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedContent(null);
    try {
      const content = await generateSocialPost(product.barcode, selectedPlatform);
      setGeneratedContent(content);
      toast.success('İçerik başarıyla oluşturuldu!');
    } catch (error) {
      toast.error('İçerik oluşturulurken bir hata oluştu.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    toast.success('Panoya kopyalandı!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-100">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 font-display">
                AI Sosyal Medya Asistanı
              </h3>
              <p className="text-sm text-gray-500">
                Ürününüz için etkileyici reklam metinleri üretin.
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

        <div className="p-8 space-y-8">
          {/* Platform Selection */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-4">Platform Seçin</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {platforms.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlatform(p.id as Platform)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      selectedPlatform === p.id
                        ? 'border-purple-500 bg-purple-50 ring-4 ring-purple-100'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${p.bg}`}>
                      <Icon className={`w-6 h-6 ${p.color}`} />
                    </div>
                    <span className="text-xs font-bold text-gray-700">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Result Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-900">Üretilen İçerik</h4>
              {generatedContent && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Kopyalandı' : 'Kopyala'}
                </button>
              )}
            </div>

            <div className="relative min-h-[200px] bg-gray-50 rounded-2xl border border-gray-200 p-6">
              {isGenerating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                  <p className="text-sm text-gray-500 font-medium animate-pulse">
                    AI içerik üretiyor...
                  </p>
                </div>
              ) : generatedContent ? (
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {generatedContent}
                </p>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                  <Sparkles className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">Platform seçin ve içeriği üretmeye başlayın.</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-purple-100 transition-all active:scale-[0.98] group"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                Post İçeriği Üret
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
