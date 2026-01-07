import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  TrendingUp,
  Loader2,
  Star,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { analyzeProductReviews, generateReviewReply } from '../services/ai';
import { toast } from 'sonner';

interface ReviewAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    barcode: string;
    name: string;
    image: string;
  };
}

export function ReviewAnalysisModal({ isOpen, onClose, product }: ReviewAnalysisModalProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [generatedReply, setGeneratedReply] = useState<string | null>(null);
  const [showReplyArea, setShowReplyArea] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAnalysis();
    }
  }, [isOpen]);

  const loadAnalysis = async () => {
    setIsLoading(true);
    try {
      const data = await analyzeProductReviews(product.barcode);
      setAnalysis(data);
    } catch (error) {
      toast.error('Yorum analizi yapılamadı.');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReply = async () => {
    setIsGeneratingReply(true);
    setShowReplyArea(true);
    try {
      // In a real scenario, we'd pick a specific review, but for demo we use summary context
      const reply = await generateReviewReply(product.barcode, analysis.summary);
      setGeneratedReply(reply);
      toast.success('Yanıt taslağı oluşturuldu!');
    } catch (error) {
      toast.error('Yanıt oluşturulamadı.');
    } finally {
      setIsGeneratingReply(false);
    }
  };

  if (!isOpen) return null;

  const getSentimentColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 font-display">
                Müşteri Yorum Analizi
              </h3>
              <p className="text-sm text-gray-500">
                AI tüm yorumları taradı ve sizin için özetledi.
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

        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <Star className="w-4 h-4 text-blue-600 absolute inset-0 m-auto animate-pulse" />
              </div>
              <p className="text-gray-500 font-medium animate-pulse">Yorumlar analiz ediliyor...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Sentiment & Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center text-center ${getSentimentColor(analysis.sentiment)}`}
                >
                  <span className="text-sm font-bold uppercase tracking-wider mb-2">
                    Genel Duygu
                  </span>
                  <span className="text-4xl font-black mb-1">{analysis.sentiment}%</span>
                  <span className="text-sm font-semibold">{analysis.sentimentLabel}</span>
                </div>
                <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Özet
                  </h4>
                  <p className="text-gray-700 leading-relaxed font-medium">{analysis.summary}</p>
                </div>
              </div>

              {/* Pros & Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50/30 p-6 rounded-2xl border border-green-100">
                  <h4 className="flex items-center gap-2 text-green-700 font-bold mb-4">
                    <ThumbsUp className="w-5 h-5" /> Öne Çıkan Artılar
                  </h4>
                  <ul className="space-y-3">
                    {analysis.pros.map((pro: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50/30 p-6 rounded-2xl border border-red-100">
                  <h4 className="flex items-center gap-2 text-red-700 font-bold mb-4">
                    <ThumbsDown className="w-5 h-5" /> Eleştiri Alanlar
                  </h4>
                  <ul className="space-y-3">
                    {analysis.cons.map((con: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-red-800">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100 shadow-sm shadow-yellow-100/50">
                <h4 className="flex items-center gap-2 text-yellow-700 font-bold mb-4">
                  <Lightbulb className="w-5 h-5" /> AI Önerileri & Aksiyon Planı
                </h4>
                <div className="space-y-3">
                  {analysis.actionableInsights.map((insight: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-yellow-200/50"
                    >
                      <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                      <p className="text-sm text-gray-800 font-medium">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Generator Section */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-blue-50/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-blue-500" />
                    <h4 className="font-bold text-gray-900">Müşteriye Yanıt Ver</h4>
                  </div>
                  <button
                    onClick={handleGenerateReply}
                    disabled={isGeneratingReply}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white text-xs font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-100"
                  >
                    {isGeneratingReply ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    AI Yanıtı Oluştur
                  </button>
                </div>

                {showReplyArea && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="relative min-h-[120px] bg-blue-50/50 rounded-2xl border border-blue-100 p-5">
                      {isGeneratingReply ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <Loader2 className="w-6 h-6 text-blue-500 animate-spin mb-2" />
                          <p className="text-xs text-blue-600 font-bold animate-pulse">
                            Yanıt yazılıyor...
                          </p>
                        </div>
                      ) : (
                        <textarea
                          className="w-full bg-transparent border-none focus:ring-0 text-sm text-gray-700 font-medium resize-none leading-relaxed"
                          rows={4}
                          value={generatedReply || ''}
                          onChange={(e) => setGeneratedReply(e.target.value)}
                          placeholder="Yanıt buraya gelecek..."
                        />
                      )}
                    </div>
                    <div className="flex justify-end mt-4 gap-3">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedReply || '');
                          toast.success('Yanıt kopyalandı!');
                        }}
                        className="text-xs font-bold text-gray-500 hover:text-gray-700 px-4"
                      >
                        Kopyala
                      </button>
                      <button className="bg-gray-900 hover:bg-black text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all shadow-md">
                        Yanıtı Yayınla
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
          >
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
}
