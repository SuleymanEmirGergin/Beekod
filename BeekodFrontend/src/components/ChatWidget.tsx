import { useState, useRef, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, User, Bot, Trash2, Mic, ThumbsUp, ThumbsDown, Settings, Volume2, VolumeX, Paperclip, Plus, Image as ImageIcon, RotateCcw } from 'lucide-react';
import chatbotIcon from 'figma:asset/9d96f3bbf44d3ec04b17cf47ee8392a065d2b41b.png';
import { sendMessage, saveToChatHistory, sendFeedback } from '../services/chatService';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Typewriter } from './shared/Typewriter';
import { ProductCard, StatsCard, AnalyticsChart, ProductList, ContentCard } from './chat/ChatCards';
import { ProductSearchCard, ProductImportModal } from './chat/ProductImportComponents';
import { importProduct } from '../services/productImportService';
import { safeReplace } from '../utils/safetyHelpers';

// --- Error Boundary ---
class ChatErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ChatWidget Error:", error, errorInfo);
    // Show alert in development for immediate visibility
    if (import.meta.env.DEV) {
      alert(`ChatWidget Error: ${error.message}`);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
            <X className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Bir şeyler ters gitti</h3>
          <p className="text-xs text-gray-500 mb-4 mt-1">Sohbet arayüzünde bir hata oluştu.</p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              localStorage.removeItem('beekod_ai_history');
              window.location.reload();
            }}
            className="text-xs bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Sohbeti Sıfırla
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Skeleton Loader ---
const MessageSkeleton = () => (
  <div className="flex justify-start animate-pulse">
    <div className="flex gap-2 max-w-[85%]">
      <div className="w-6 h-6 rounded-md bg-gray-200 flex-shrink-0 mt-1" />
      <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm w-48">
        <div className="h-2 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-2 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  </div>
);

export function ChatWidget() {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false); // Attachment menu toggle
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImportItem, setSelectedImportItem] = useState<any>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{
    role: 'user' | 'ai' | 'assistant',
    message: string,
    reply?: string,
    data?: any,
    isError?: boolean,
    // Store retry context
    retryContext?: {
      action?: string,
      opts?: any,
      image?: File
    }
  }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts: Array<
    | { text: string; action: "TOP_SELLERS" | "CRITICAL_STOCK" | "SALES_SUMMARY"; opts: any; prompt?: never }
    | { text: string; prompt: string; action?: never; opts?: never }
  > = [
      { text: "🔥 En Çok Satanlar", action: "TOP_SELLERS" as const, opts: { limit: 5, days: 30 } },
      { text: "🚨 Kritik Stoklar", action: "CRITICAL_STOCK" as const, opts: { threshold: 10 } },
      { text: "📈 Haftalık Özet", action: "SALES_SUMMARY" as const, opts: { days: 7 } },
      { text: "🤖 Fiyat Tavsiyesi", prompt: "Fiyatlarımı nasıl optimize edebilirim?" },
    ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Sync with AIAssistantScreen history - only load when opening chat
  useEffect(() => {
    if (!isChatOpen) return; // Only load when chat is opened

    // Only load from localStorage if current history is empty or just has welcome message
    if (chatHistory.length <= 1) {
      const saved = localStorage.getItem('beekod_ai_history');
      if (saved) {
        try {
          setChatHistory(JSON.parse(saved));
        } catch (e) {
          setChatHistory([{ role: 'ai', message: 'Merhaba! Ben Beekod AI. Size nasıl yardımcı olabilirim?' }]);
        }
      } else {
        setChatHistory([{ role: 'ai', message: 'Merhaba! Ben Beekod AI. Size nasıl yardımcı olabilirim?' }]);
      }
    }
  }, [isChatOpen]);

  useEffect(() => {
    scrollToBottom();
    // Save to shared history storage
    if (chatHistory.length > 0) {
      localStorage.setItem('beekod_ai_history', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  const speak = (text: string) => {
    // Disable in development to avoid thread blocking
    if (import.meta.env.DEV) return;

    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    // Simple locale detection could be added here if needed
    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const lastMsg = chatHistory[chatHistory.length - 1];
    if (lastMsg && (lastMsg.role === 'ai' || lastMsg.role === 'assistant') && !isMuted && !isLoading) {
      const rawText = lastMsg.message || '';
      if (!rawText) return;
      const cleanText = rawText.replace(/[*_#`]/g, '');
      // Don't speak if it's an error message unless critical
      speak(cleanText);
    }
  }, [chatHistory, isMuted, isLoading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setShowAttachments(false); // Close menu after select
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (customMsg?: string, action?: string, opts?: any) => {
    const textToSend = customMsg || chatMessage;

    // Action varsa mesaj optional
    if (!action && !textToSend.trim() && !selectedImage) return;
    if (isLoading) return;

    const userMsg = textToSend || (selectedImage ? "[Resim Gönderildi]" : `[${action}]`);
    const updatedHistory = [...chatHistory, { role: 'user' as const, message: userMsg }];

    setChatMessage('');
    setChatHistory(updatedHistory);
    setIsLoading(true);

    try {
      // Normalize history: convert 'assistant' to 'ai' for backend compatibility
      const normalizedHistory = updatedHistory.map(h => ({
        role: h.role === 'assistant' ? 'ai' : h.role,
        message: h.message
      }));

      const response = await sendMessage(
        textToSend,
        selectedImage || undefined,
        undefined,
        action as any,
        opts,
        normalizedHistory as any
      );
      console.log('ChatWidget: API response received:', response);

      // sendMessage now returns response.data directly: { success, reply, data }
      const { success, reply, data } = response || {};

      // Handle failure - still show the message but mark as error
      if (!success) {
        const errorMsg = reply || "Bir şeyler ters gitti. Tekrar dener misin? 🤔";
        saveToChatHistory(userMsg, errorMsg, false);
        setChatHistory((prev) => [
          ...prev,
          { role: "ai", message: errorMsg, data: data || { success: false }, isError: true },
        ]);
        setIsLoading(false);
        return;
      }

      // Success: add AI reply with data
      const finalReply = reply?.trim() || "⚠️ Boş cevap geldi";
      setChatHistory(prev => [...prev, { role: 'ai', message: finalReply, data }]);
      setIsLoading(false);
    } catch (error) {
      console.error('ChatWidget: Catch block error:', error);
      const errorMsg = "Maalesef şu an cevap veremiyorum. İnternet bağlantını kontrol eder misin? 📶";
      setChatHistory(prev => [...prev, { role: 'ai', message: errorMsg, isError: true }]);
      setIsLoading(false);
    } finally {
      // Clear image after sending (moved from finally to ensure it happens)
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImportConfirm = async (formData: any) => {
    try {
      const result = await importProduct(formData);
      if (result) {
        setChatHistory(prev => [...prev, {
          role: 'ai',
          message: `✅ **${formData.title}** başarıyla mağazana eklendi!`,
          data: result
        }]);
      }
    } catch (error) {
      console.error('Import confirmation failed:', error);
      alert('Ürün eklenirken bir hata oluştu.');
    }
  };

  const clearChat = () => {
    const initialMsg = { role: 'ai' as const, message: 'Merhaba! Sohbet geçmişi temizlendi.' };
    setChatHistory([initialMsg]);
    localStorage.setItem('beekod_ai_history', JSON.stringify([initialMsg]));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startListening = () => {
    // Browser compatibility check
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Tarayıcınız sesli komutu desteklemiyor. Lütfen Chrome veya Edge kullanın.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setChatMessage(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <>
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#F5B800] hover:bg-[#E5A800] rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50 overflow-hidden"
      >
        {isChatOpen ? (
          <X className="w-6 h-6 text-gray-900" />
        ) : (
          <>
            <img src={chatbotIcon} alt="AI Chatbot" className="w-full h-full object-cover" />
            <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </>
        )}
      </button>

      {isChatOpen && (
        <div className="fixed bottom-28 right-8 w-96 h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden font-sans">
          <div className="bg-gradient-to-r from-[#F5B800] to-[#E5A800] p-4 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-white/20">
                <img src={chatbotIcon} alt="AI Assistant" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-gray-900 leading-none mb-1">Beekod Kanka AI</div>
                <div className="text-[10px] text-gray-800 font-medium uppercase tracking-wider bg-white/30 px-1.5 py-0.5 rounded w-fit flex items-center gap-1">
                  <Sparkles className="w-2 h-2" /> Canlı Akıl Aktif
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('/configuration')}
                className="p-2 hover:bg-black/5 text-gray-900 rounded-lg transition-colors"
                title="Ayarlar"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  window.speechSynthesis.cancel();
                  setIsMuted(!isMuted);
                }}
                className="p-2 hover:bg-black/5 text-gray-900 rounded-lg transition-colors"
                title={isMuted ? "Sesi Aç" : "Sessize Al"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={clearChat}
                className="p-2 hover:bg-black/5 text-gray-900 rounded-lg transition-colors"
                title="Temizle"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-200">
            <ChatErrorBoundary>
              {chatHistory.length <= 1 && (
                <div className="text-center py-4 bg-white/50 rounded-xl border border-dashed border-gray-200 mb-4 px-2">
                  <p className="text-[11px] text-gray-500 mb-3 font-medium">Hızlı Öneriler</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestedPrompts.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => s.action
                          ? handleSendMessage(undefined, s.action, s.opts)
                          : handleSendMessage(s.prompt)
                        }
                        className="text-[10px] bg-white border border-gray-100 px-3 py-1.5 rounded-full hover:border-[#F5B800] hover:text-[#F5B800] transition-colors shadow-sm"
                      >
                        {s.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'user' ? 'bg-[#F5B800]' : 'bg-gray-100'}`}>
                      {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-gray-900" /> : <Bot className="w-3.5 h-3.5 text-gray-900" />}
                    </div>
                    <div className={`group rounded-xl px-3 py-2 ${msg.role === 'user' ? 'bg-[#F5B800] text-gray-900 shadow-sm' : msg.isError ? 'bg-red-50 border border-red-100 text-red-800' : 'bg-white border border-gray-100 text-gray-900 shadow-sm'}`}>
                      <div className="text-xs leading-relaxed">
                        {msg.role === 'ai' && idx === chatHistory.length - 1 ? (
                          <Typewriter text={msg.message} speed={10} />
                        ) : (
                          <div className="prose prose-xs max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.message?.trim() || "⚠️ Boş mesaj"}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>

                      {/* Retry Button for Errors */}
                      {msg.isError && (
                        <button
                          onClick={() => handleSendMessage(chatHistory[idx - 1]?.message)}
                          className="text-[10px] text-red-600 hover:text-red-700 font-medium flex items-center gap-1 mt-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Tekrar Dene
                        </button>
                      )}

                      {/* Feedback Buttons */}
                      {(msg.role === 'ai' || msg.role === 'assistant') && !msg.isError && (
                        <div className="flex justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded"
                            title="İyi cevap"
                            onClick={(e) => {
                              e.currentTarget.classList.add('text-green-500', 'bg-green-50');
                              sendFeedback(String(idx), 'positive');
                            }}
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                            title="Kötü cevap"
                            onClick={(e) => {
                              e.currentTarget.classList.add('text-red-500', 'bg-red-50');
                              sendFeedback(String(idx), 'negative');
                            }}
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {msg.data && (
                        <div className="mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          {/* Content Card (New) */}
                          {msg.data.contentType === 'content_card' && (
                            <div className="mt-2 w-full max-w-sm">
                              <ContentCard data={msg.data} />
                            </div>
                          )}

                          {/* Product Card */}
                          {msg.data.barcode && !Array.isArray(msg.data.items) && (
                            <ProductCard
                              product={msg.data}
                              onAction={(action, barcode) => {
                                if (action === 'VIEW_PRODUCT') handleSendMessage(`Ürüne git: ${barcode}`);
                                else if (action === 'UPDATE_PRODUCT') handleSendMessage(`Stok güncelle: ${barcode}`);
                              }}
                            />
                          )}

                          {/* Stats Cards Grid */}
                          {msg.data.stats && (
                            <div className="grid grid-cols-1 gap-2 my-2">
                              <StatsCard label="Toplam Ürün" value={msg.data.stats.totalProducts} icon="products" />
                              {msg.data.stats.lowStockCount > 0 && (
                                <StatsCard label="Kritik Stok" value={msg.data.stats.lowStockCount} icon="alert" />
                              )}
                            </div>
                          )}

                          {/* Sales Summary Stats */}
                          {msg.data.orders !== undefined && msg.data.revenue !== undefined && (
                            <div className="grid grid-cols-1 gap-2 my-2">
                              <StatsCard label="Toplam Ciro" value={`${msg.data.revenue.toLocaleString()} ${msg.data.currency || 'TL'}`} icon="profit" />
                              <div className="grid grid-cols-2 gap-2">
                                <StatsCard label="Sipariş" value={msg.data.orders} icon="sales" />
                                <StatsCard label="Ürün" value={msg.data.items} icon="products" />
                              </div>
                            </div>
                          )}

                          {/* Analytics Chart */}
                          {Array.isArray(msg.data.timeline) && (
                            <AnalyticsChart
                              data={msg.data.timeline.map((d: any) => ({ name: d.date || d.day, value: d.revenue || d.amount }))}
                              type="line"
                              title="Gelir Analizi"
                            />
                          )}

                          {/* Product List */}
                          {(Array.isArray(msg.data.items) || Array.isArray(msg.data.lowStockProducts) || Array.isArray(msg.data.topProducts) || Array.isArray(msg.data.profitData)) && (
                            <ProductList
                              items={(msg.data.items || msg.data.lowStockProducts || msg.data.topProducts || msg.data.profitData).slice(0, 5)}
                              title={msg.data.lowStockProducts ? "Kritik Stok Listesi" : (msg.data.profitData ? "En Kârlı Ürünler" : "Öne Çıkan Ürünler")}
                              onItemClick={(barcode) => handleSendMessage(`${barcode} bilgisi getir`)}
                            />
                          )}
                          {/* Marketplace List */}
                          {Array.isArray(msg.data.marketplaces) && (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden my-2">
                              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 italic text-xs font-medium text-gray-600">
                                Bağlı Pazaryerleri
                              </div>
                              <div className="divide-y divide-gray-50">
                                {msg.data.marketplaces.map((m: any, idx: number) => (
                                  <div key={idx} className="p-3 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center font-bold text-xs">
                                      ✓
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-xs font-bold text-gray-900">{m.name}</h5>
                                      <p className="text-[10px] text-gray-500">Durum: Aktif</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Web Search Results (Cards) */}
                          {msg.data.type === 'product_search_results' && Array.isArray(msg.data.results) && (
                            <ProductSearchCard
                              results={msg.data.results}
                              onImport={(item) => {
                                setSelectedImportItem(item);
                                setIsImportModalOpen(true);
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && <MessageSkeleton />}

              <div ref={messagesEndRef} />
            </ChatErrorBoundary>

            {/* Import Modal */}
            <ProductImportModal
              isOpen={isImportModalOpen}
              item={selectedImportItem}
              onClose={() => {
                setIsImportModalOpen(false);
                setSelectedImportItem(null);
              }}
              onConfirm={handleImportConfirm}
            />
          </div>

          <div className="p-4 border-t border-gray-100 bg-white">
            {imagePreview && (
              <div className="mb-2 relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={removeImage}
                  className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex gap-2 items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />

              {/* Expandable Attachment Menu */}
              <div className="relative">
                {showAttachments && (
                  <div className="absolute bottom-12 left-0 bg-white shadow-xl border border-gray-100 rounded-xl p-2 flex flex-col gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200 z-10 w-10">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-8 h-8 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors flex items-center justify-center"
                      title="Resim Yükle"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    {/* Future attachments can go here */}
                  </div>
                )}
                <button
                  onClick={() => setShowAttachments(!showAttachments)}
                  className={`p-2 rounded-xl transition-colors ${showAttachments ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-50'}`}
                  title="Ekle"
                >
                  <Plus className={`w-5 h-5 transition-transform duration-200 ${showAttachments ? 'rotate-45' : ''}`} />
                </button>
              </div>

              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Bir mesaj gönder..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#F5B800] focus:border-transparent disabled:opacity-50 bg-gray-50/50"
              />

              <button
                onClick={startListening}
                className={`p-2 rounded-xl transition-all ${isListening
                  ? 'bg-red-50 text-red-500 animate-pulse ring-2 ring-red-200'
                  : 'text-gray-400 hover:bg-gray-50'
                  }`}
                title="Sesli Konuş"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || (!chatMessage.trim() && !selectedImage)}
                className="w-10 h-10 bg-[#F5B800] hover:bg-[#E5A800] rounded-xl transition-colors flex items-center justify-center disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400"
              >
                <Send className="w-4 h-4 text-gray-900" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
