import { useState, useEffect } from 'react';
import { SidebarV2 } from '../layouts/SidebarV2';
import { Card } from '../components/shared';
import {
  MessageCircle,
  Search,
  Filter,
  MessageSquare,
  CheckCircle,
  Clock,
  ChevronDown,
  Send,
  X,
  ShoppingBag,
} from 'lucide-react';

import {
  getQuestions,
  getQuestionStats,
  answerQuestion,
  suggestQuestionAnswer,
  ProductQuestion,
  QuestionStats,
} from '../services/questions';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProductQuestionsScreenProps {
  onNavigate: (screen: string) => void;
}

export function ProductQuestionsScreen({ onNavigate }: ProductQuestionsScreenProps) {
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'replied' | 'unreplied'>('unreplied');
  const [selectedQuestion, setSelectedQuestion] = useState<ProductQuestion | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [questionsData, statsData] = await Promise.all([
        getQuestions(filterStatus),
        getQuestionStats(),
      ]);
      setQuestions(questionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load questions data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!selectedQuestion || !answerText.trim()) return;

    setSubmitting(true);
    try {
      const updatedQuestion = await answerQuestion(selectedQuestion._id, answerText);

      // Update local state
      setQuestions((prev) =>
        prev.map((q) => (q._id === selectedQuestion._id ? updatedQuestion : q)),
      );

      // Update stats
      await loadData();

      setSelectedQuestion(null);
      setAnswerText('');
    } catch (error) {
      console.error('Failed to answer question:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAISuggestion = async () => {
    if (!selectedQuestion) return;
    setIsSuggesting(true);
    try {
      const suggestion = await suggestQuestionAnswer(selectedQuestion._id);
      setAnswerText(suggestion);
      toast.success('AI yanıt önerisi oluşturuldu!');
    } catch (error) {
      toast.error('AI yanıtı oluşturulamadı.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const getMarketplaceBadgeColor = (marketplace: string) => {
    switch (marketplace) {
      case 'Trendyol':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Hepsiburada':
        return 'bg-orange-50 text-[#FF6000] border-orange-200';
      case 'N11':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarV2
        activeItem="questions"
        onNavigate={onNavigate}
        userName="Emir"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <button
                onClick={() => onNavigate('dashboard')}
                className="text-[#B8934D] hover:underline"
              >
                Ana Sayfa
              </button>
              <span>/</span>
              <span className="text-gray-900">Ürün Soruları</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl text-gray-900 mb-2 font-display">Ürün Soruları</h1>
            <p className="text-[#B8934D]">
              Pazaryerlerinden gelen müşteri sorularını buradan yönetebilirsiniz.
            </p>
          </div>

          {/* Stats / Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <button onClick={() => setFilterStatus('all')} className="text-left">
              <Card
                padding="lg"
                className={`hover:shadow-md transition-all cursor-pointer border ${filterStatus === 'all' ? 'border-[#F5B800] ring-1 ring-[#F5B800]' : 'border-gray-200'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="text-sm text-gray-500">Toplam Soru</div>
                </div>
                <div className="text-2xl font-semibold text-gray-900">
                  {loading ? '...' : stats?.total || 0}
                </div>
              </Card>
            </button>

            <button onClick={() => setFilterStatus('unreplied')} className="text-left">
              <Card
                padding="lg"
                className={`hover:shadow-md transition-all cursor-pointer border ${filterStatus === 'unreplied' ? 'border-[#F5B800] ring-1 ring-[#F5B800]' : 'border-gray-200'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-sm text-gray-500">Cevaplanmamış</div>
                </div>
                <div className="text-2xl font-semibold text-gray-900">
                  {loading ? '...' : stats?.unreplied || 0}
                </div>
              </Card>
            </button>

            <button onClick={() => setFilterStatus('replied')} className="text-left">
              <Card
                padding="lg"
                className={`hover:shadow-md transition-all cursor-pointer border ${filterStatus === 'replied' ? 'border-[#F5B800] ring-1 ring-[#F5B800]' : 'border-gray-200'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="text-sm text-gray-500">Cevaplanmış</div>
                </div>
                <div className="text-2xl font-semibold text-gray-900">
                  {loading ? '...' : stats?.replied || 0}
                </div>
              </Card>
            </button>
          </div>

          {/* Question List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
                Hiç soru bulunamadı.
              </div>
            ) : (
              questions.map((q) => (
                <div
                  key={q._id}
                  className={`bg-white border rounded-xl p-6 transition-all hover:shadow-md ${q.status === 'unreplied' ? 'border-l-4 border-l-orange-500' : 'border-l-4 border-l-green-500'} border-gray-200`}
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Product Info */}
                    <div className="w-full md:w-64 flex-shrink-0">
                      <div className="flex items-start gap-4">
                        {q.imageUrl && (
                          <img
                            src={q.imageUrl}
                            alt="Product"
                            className="w-16 h-16 object-contain border border-gray-100 rounded-lg bg-white"
                          />
                        )}
                        <div>
                          <div
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border mb-2 ${getMarketplaceBadgeColor(q.marketplace)}`}
                          >
                            {q.marketplace}
                          </div>
                          <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                            {q.productName}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span className="font-medium text-gray-900">{q.customerName}</span>
                        <span>•</span>
                        <span>{new Date(q.createdAt).toLocaleString('tr-TR')}</span>
                      </div>

                      <p className="text-gray-800 font-medium mb-4">{q.text}</p>

                      {q.status === 'replied' && q.answer && (
                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                          <div className="text-xs font-semibold text-green-600 mb-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Mağaza Cevabı
                          </div>
                          <p className="text-sm text-gray-600">{q.answer}</p>
                        </div>
                      )}

                      {q.status === 'unreplied' && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => {
                              setSelectedQuestion(q);
                              setAnswerText('');
                            }}
                            className="px-4 py-2 bg-[#F5B800] hover:bg-[#E5A800] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Cevapla
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Reply Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-gray-100">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white">
              <h3 className="text-xl font-bold text-gray-900 font-display">
                Müşteri Sorusunu Yanıtla
              </h3>
              <button
                onClick={() => setSelectedQuestion(null)}
                className="p-2 hover:bg-gray-100 rounded-2xl text-gray-400 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              <div className="bg-gray-50/80 p-6 rounded-3xl border border-gray-100 mb-8 relative">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Müşteri Sorusu
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-gray-400 font-bold text-sm uppercase">
                    {selectedQuestion.customerName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedQuestion.customerName}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium">
                      Satın Alınan: {selectedQuestion.productName}
                    </p>
                  </div>
                </div>
                <p className="text-gray-900 text-sm font-medium leading-relaxed italic">
                  "{selectedQuestion.text}"
                </p>
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">
                    Cevabınız
                  </h4>
                  <button
                    onClick={handleAISuggestion}
                    disabled={isSuggesting}
                    className="h-10 px-5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-purple-100 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSuggesting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {isSuggesting ? 'AI Hazırlıyor...' : 'AI Yanıtı Oluştur'}
                  </button>
                </div>
                <div className="relative group">
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    className="w-full h-44 px-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[24px] focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-200 text-sm font-medium resize-none transition-all placeholder:text-gray-300"
                    placeholder="Müşteriye nazik ve etkileyici bir cevap yazın..."
                  ></textarea>
                  {isSuggesting && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] rounded-[24px] flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
                        <span className="text-xs font-bold text-purple-700">AI Yazıyor...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="px-8 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-all"
                >
                  Vazgeç
                </button>
                <button
                  onClick={() => handleAnswerSubmit()}
                  disabled={submitting || !answerText.trim()}
                  className="px-10 py-4 bg-gray-900 text-white font-bold rounded-[20px] shadow-xl hover:bg-black transition-all disabled:opacity-50 disabled:bg-gray-400 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Yanıtı Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
