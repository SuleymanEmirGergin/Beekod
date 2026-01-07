import {
  Bell,
  HelpCircle,
  Bot,
  Zap,
  MessageSquare,
  TrendingUp,
  Package,
  AlertTriangle,
  Settings as SettingsIcon,
  Save,
  X,
  Send,
  Sparkles,
  ChevronRight,
  CreditCard,
  Check,
  ImagePlus,
  User,
  Trash2,
  Mic,
  Loader2,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { SidebarV2 } from '../layouts/SidebarV2';
import { SearchBar } from '../components/shared/';
import { ChatWidget } from '../components/ChatWidget';
import { ToastV2 } from '../components/shared/';
import { HelpModal } from '../components/HelpModal';
import { sendMessage } from '../services/chatService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Typewriter } from '../components/shared/Typewriter';
import { ProductSearchCard, ProductImportModal } from '../components/chat/ProductImportComponents';
import { importProduct } from '../services/productImportService';

interface AIAssistantScreenProps {
  onNavigate: (screen: string) => void;
  onSelectProductForModel?: (product: {
    id: string;
    name: string;
    image: string;
    category: string;
  }) => void;
}

export function AIAssistantScreen({ onNavigate, onSelectProductForModel }: AIAssistantScreenProps) {
  // Restore State missing during refactor
  const [autoSuggestions, setAutoSuggestions] = useState(true);
  const [priceOptimization, setPriceOptimization] = useState(true);
  const [inventoryAlerts, setInventoryAlerts] = useState(true);
  const [marketAnalysis, setMarketAnalysis] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [showInsightDetail, setShowInsightDetail] = useState<string | null>(null);
  const [showCapabilityDetail, setShowCapabilityDetail] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', message: '' });
  const [isListening, setIsListening] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
    image: string;
    category: string;
  } | null>(null);
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: 'user' | 'ai'; message: string; data?: any; image?: string }>
  >([]);
  const [selectedImportItem, setSelectedImportItem] = useState<any>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompts
  const suggestedPrompts = [
    {
      text: '📦 Stok analizimi yap',
      prompt: 'Stok seviyelerimi analiz et ve kritik olanları listele.',
    },
    {
      text: '💰 Fiyat önerisi ver',
      prompt: 'En çok satan ürünlerim için fiyat optimizasyon önerileri ver.',
    },
    { text: '📈 Aylık satış raporu', prompt: 'Bu ayki satış performansımı geçen ayla kıyasla.' },
    {
      text: '🔍 Trendleri göster',
      prompt: 'Pazaryerlerindeki güncel trendlere göre ne satmalıyım?',
    },
  ];

  // Load history from localStorage on mounting
  useEffect(() => {
    const savedHistory = localStorage.getItem('beekod_ai_history');
    if (savedHistory) {
      try {
        setChatMessages(JSON.parse(savedHistory));
      } catch (e) {
        setChatMessages([
          {
            role: 'ai',
            message:
              'Merhaba! Ben sizin YZ asistanınızım. Bugün işinizi büyütmek için ne yapabiliriz?',
          },
        ]);
      }
    } else {
      setChatMessages([
        {
          role: 'ai',
          message:
            'Merhaba! Ben sizin YZ asistanınızım. Bugün işinizi büyütmek için ne yapabiliriz?',
        },
      ]);
    }
  }, []);

  // Save history on change
  useEffect(() => {
    if (chatMessages.length > 0) {
      localStorage.setItem('beekod_ai_history', JSON.stringify(chatMessages));
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const clearChat = () => {
    const initialMsg: { role: 'ai'; message: string } = {
      role: 'ai',
      message: 'Merhaba! Sohbet geçmişi temizlendi. Size nasıl yardımcı olabilirim?',
    };
    setChatMessages([initialMsg]);
    localStorage.setItem('beekod_ai_history', JSON.stringify([initialMsg]));
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setChatInput(prompt);
  };

  const handleImportConfirm = async (formData: any) => {
    try {
      const result = await importProduct(formData);
      if (result) {
        setChatMessages(prev => [...prev, {
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

  useEffect(() => {
    const searchProducts = async () => {
      if (!productSearchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const response = await fetch(
          `/products/search?query=${encodeURIComponent(productSearchQuery)}&limit=5`,
        );
        const data = await response.json();
        setSearchResults(data.items || []);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchProducts, 300);
    return () => clearTimeout(timer);
  }, [productSearchQuery]);

  // Voice to Text logic
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('speechRecognition' in window)) {
      setToastMessage({
        title: 'Desteklenmiyor',
        message: 'Tarayıcınız ses tanımayı desteklemiyor.',
      });
      setShowToast(true);
      return;
    }

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput((prev) => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarV2
        activeItem="ai-chatbot"
        onNavigate={onNavigate}
        userName="Emir"
        userEmail="emir@beekod.com"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl text-gray-900">Yapay Zeka Asistan Ayarları</h1>
            <div className="flex items-center gap-4">
              <SearchBar />
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute top-16 right-8 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm text-gray-900">YZ Bildirimleri</h3>
                    <button onClick={() => setShowNotifications(false)}>
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                      <div className="flex gap-3">
                        <Sparkles className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 mb-1">Yeni YZ Analizi Mevcut</p>
                          <p className="text-xs text-gray-500 mb-2">
                            Envanter analiziniz 3 yeni öneri ile hazır
                          </p>
                          <p className="text-xs text-gray-400">Az önce</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                      <div className="flex gap-3">
                        <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 mb-1">Fiyat Optimizasyonu Tamamlandı</p>
                          <p className="text-xs text-gray-500 mb-2">
                            Pazar trendlerine göre 12 ürün için fiyatlar güncellendi
                          </p>
                          <p className="text-xs text-gray-400">1 saat önce</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 hover:bg-gray-50 cursor-pointer">
                      <div className="flex gap-3">
                        <Package className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 mb-1">Akıllı Stok Önerisi</p>
                          <p className="text-xs text-gray-500 mb-2">
                            Satış hızına bağlı olarak 5 ürünün stoğunun yenilenmesi gerekiyor
                          </p>
                          <p className="text-xs text-gray-400">3 saat önce</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-t border-gray-100">
                    <button className="w-full text-sm text-[#F5B800] hover:text-[#E5A800] py-2">
                      Tüm bildirimleri gör
                    </button>
                  </div>
                </div>
              )}

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
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-100 p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-[#F5B800] rounded-xl flex items-center justify-center">
                <Bot className="w-8 h-8 text-gray-900" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl text-gray-900 mb-2">YZ Destekli İş Zekası</h2>
                <p className="text-sm text-gray-700 mb-4">
                  Yapay zeka asistanımızın tüm pazaryeri kanallarınızda envanter, fiyatlandırma ve
                  satışlarınızı optimize etmesine izin verin.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowChatModal(true)}
                    className="px-4 py-2 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
                  >
                    Sohbeti Başlat
                  </button>
                  <button
                    onClick={() => setShowInsightsModal(true)}
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 rounded-lg text-sm border border-gray-200 transition-colors"
                  >
                    İçgörüleri Gör
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left column - AI Features */}
            <div className="col-span-2 space-y-6">
              {/* AI Capabilities */}
              <div>
                <h3 className="text-base text-gray-900 mb-4">AI Yetenekleri</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => {
                      setShowChatModal(true);
                      setChatMessages([
                        {
                          role: 'ai',
                          message:
                            "Merhaba! Ben sizin YZ asistanınızım. Bugün işinizi büyütmek için ne yapabiliriz?",
                        },
                        {
                          role: 'ai',
                          message:
                            '📊 **Satış Tahmini Modu Aktif**\n\nTalep modellerini tahmin etmenize ve stok seviyelerini optimize etmenize yardımcı olabilirim. Geçmiş verilerinize dayanarak:\n\n• Organik Bal Kavanozları: Gelecek hafta 234 birim satılması bekleniyor (geçen haftaya göre +%15)\n• Premium Çay Seti: Yüksek talep dönemi yaklaşıyor, stok yenileme önerilir\n• SonicBlast Kulaklıklar: Satış hızı haftalık 45 birim seviyesinde sabit\n\nNeyi analiz etmek istersiniz?',
                        },
                      ]);
                    }}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#F5B800] hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="text-sm text-gray-900 mb-2">Satış Tahmini</h4>
                    <p className="text-xs text-gray-600">
                      Geçmiş veriler ve pazar trendlerine dayalı talep tahminleri ve stok optimizasyonu.
                    </p>
                  </div>
                  <div
                    onClick={() => {
                      setShowChatModal(true);
                      setChatMessages([
                        {
                          role: 'ai',
                          message:
                            "Merhaba! Ben sizin YZ asistanınızım. Bugün işinizi büyütmek için ne yapabiliriz?",
                        },
                        {
                          role: 'ai',
                          message:
                            '📦 **Akıllı Stok Yenileme Modu Aktif**\n\nSatış hızı ve tedarik sürelerine dayanarak önerilerim şunlar:\n\n🔴 **Acil (3 gün içinde stok yenile):**\n• Organik Bal Kavanozları - Mevcut: 45, Önerilen: 200\n\n🟡 **Orta Öncelik (7 gün içinde stok yenile):**\n• Premium Çay Seti - Mevcut: 89, Önerilen: 150\n\n🟢 **Stok Durumu İyi:**\n• SonicBlast Kulaklıklar - Mevcut: 234\n\nOtomatik sipariş emri oluşturmamı ister misiniz?',
                        },
                      ]);
                    }}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#F5B800] hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                      <Package className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="text-sm text-gray-900 mb-2">Akıllı Stok Yenileme</h4>
                    <p className="text-xs text-gray-600">
                      Satış hızına göre otomatik yeniden sipariş önerileri.
                    </p>
                  </div>
                  <div
                    onClick={() => {
                      setShowChatModal(true);
                      setChatMessages([
                        {
                          role: 'ai',
                          message:
                            "Merhaba! Ben sizin YZ asistanınızım. Bugün işinizi büyütmek için ne yapabiliriz?",
                        },
                        {
                          role: 'ai',
                          message:
                            "💰 **Fiyat Optimizasyon Modu Aktif**\n\nRakip fiyatlarını ve pazar talebini analiz ettim. Önerilerim şunlar:\n\n📈 **Fiyat Artırma Fırsatları:**\n• Premium Çay Seti: Şu an ₺245.00 → Önerilen ₺265.00 (+%8)\n  Rakip ortalaması: ₺278.00 - Artış potansiyeli var\n\n📉 **Rekabetçi Fiyatlandırma:**\n• Organik Bal Kavanozları: Şu an ₺89.90 - İdeal fiyat ✓\n• SonicBlast Kulaklıklar: Şu an ₺1,299.00 - Pazar aralığında ✓\n\nBu değişiklikleri uygulamamı ister misiniz?",
                        },
                      ]);
                    }}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#F5B800] hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center mb-4">
                      <Zap className="w-6 h-6 text-yellow-600" />
                    </div>
                    <h4 className="text-sm text-gray-900 mb-2">Fiyat Optimizasyonu</h4>
                    <p className="text-xs text-gray-600">
                      Rekabetçi kalırken kar marjını maksimize eden dinamik fiyat önerileri.
                    </p>
                  </div>
                  <div
                    onClick={() => {
                      setShowChatModal(true);
                      setChatMessages([
                        {
                          role: 'ai',
                          message:
                            "Merhaba! Ben sizin YZ asistanınızım. Bugün işinizi büyütmek için ne yapabiliriz?",
                        },
                        {
                          role: 'ai',
                          message:
                            '💬 **Doğal Dil Sorgu Modu**\n\nİşletmenizle ilgili her şeyi bana sorabilirsiniz! Şunları deneyin:\n\n• "Bu ay en çok satan ürünlerim neler?"\n• "Hangi ürünlerin stoğu azaldı?"\n• "Son 30 günün satış trendlerini göster"\n• "Bu haftaki toplam cirom ne kadar?"\n• "Hangi ürünler en yüksek kar marjına sahip?"\n\nHadi, istediğini sor!',
                        },
                      ]);
                    }}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#F5B800] hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                      <MessageSquare className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="text-sm text-gray-900 mb-2">Doğal Dil Sorguları</h4>
                    <p className="text-xs text-gray-600">
                      İşinizle ilgili soruları doğal dilde sorun ve anında içgörüler alın.
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Product Recommendations for Model Designer */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base text-gray-900">AI Ürün Önerileri</h3>
                  <p className="text-xs text-gray-500">Model Tasarımcısı için Mükemmel</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-[#F5B800] transition-all group">
                    <img
                      src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop"
                      alt="T-Shirt"
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-sm text-gray-900 mb-1">Classic T-Shirt</p>
                      <p className="text-xs text-gray-500 mb-3">Tops • Cotton</p>
                      <button
                        onClick={() => {
                          if (onSelectProductForModel) {
                            onSelectProductForModel({
                              id: 't-shirt-ai',
                              name: 'Classic T-Shirt',
                              image:
                                'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
                              category: 'Tops',
                            });
                          }
                        }}
                        className="w-full px-3 py-1.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        Model Tasarımcısında Kullan
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-[#F5B800] transition-all group">
                    <img
                      src="https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=400&fit=crop"
                      alt="Summer Dress"
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-sm text-gray-900 mb-1">Summer Dress</p>
                      <p className="text-xs text-gray-500 mb-3">Dresses • Floral</p>
                      <button
                        onClick={() => {
                          if (onSelectProductForModel) {
                            onSelectProductForModel({
                              id: 'dress-ai',
                              name: 'Summer Dress',
                              image:
                                'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=400&fit=crop',
                              category: 'Dresses',
                            });
                          }
                        }}
                        className="w-full px-3 py-1.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        Model Tasarımcısında Kullan
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-[#F5B800] transition-all group">
                    <img
                      src="https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop"
                      alt="Denim Jacket"
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-sm text-gray-900 mb-1">Denim Jacket</p>
                      <p className="text-xs text-gray-500 mb-3">Outerwear • Blue</p>
                      <button
                        onClick={() => {
                          if (onSelectProductForModel) {
                            onSelectProductForModel({
                              id: 'jacket-ai',
                              name: 'Denim Jacket',
                              image:
                                'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop',
                              category: 'Outerwear',
                            });
                          }
                        }}
                        className="w-full px-3 py-1.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        Model Tasarımcısında Kullan
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent AI Insights */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base text-gray-900">Son AI İçgörüleri</h3>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowInsightsModal(true);
                    }}
                    className="text-sm text-[#F5B800] hover:text-[#E5A800]"
                  >
                    Tümünü gör
                  </a>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
                  <div
                    onClick={() => {
                      setShowInsightDetail('restock');
                      setShowToast(true);
                      setToastMessage({
                        title: 'Restocking Insight',
                        message: 'Viewing detailed restock recommendations...',
                      });
                      setTimeout(() => setShowToast(false), 3000);
                    }}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900 mb-1">Organik Bal Stok Yenileme</div>
                        <div className="text-xs text-gray-600 mb-2">
                          Satış hızına bağlı olarak, stok tükenmesini önlemek için 3 gün içinde stok yenilemelisiniz.
                        </div>
                        <div className="text-xs text-gray-400">2 saat önce</div>
                      </div>
                    </div>
                  </div>
                  <div
                    onClick={() => {
                      setShowInsightDetail('pricing');
                      setShowToast(true);
                      setToastMessage({
                        title: 'Pricing Opportunity',
                        message: 'Analyzing competitor pricing data...',
                      });
                      setTimeout(() => setShowToast(false), 3000);
                    }}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900 mb-1">
                          Fiyat Optimizasyonu Fırsatı
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          Premium Çay Seti, rakip analizine göre %8 daha yüksek fiyatlandırılabilir.
                        </div>
                        <div className="text-xs text-gray-400">5 saat önce</div>
                      </div>
                    </div>
                  </div>
                  <div
                    onClick={() => {
                      setShowInsightDetail('stock');
                      setShowToast(true);
                      setToastMessage({
                        title: 'Stock Alert',
                        message: 'Opening inventory details...',
                      });
                      setTimeout(() => setShowToast(false), 3000);
                    }}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900 mb-1">Düşük Stok Uyarısı</div>
                        <div className="text-xs text-gray-600 mb-2">
                          SonicBlast Kulaklık stoğu azalıyor. Yakında stok yenilemeyi düşünün.
                        </div>
                        <div className="text-xs text-gray-400">1 gün önce</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Settings */}
            <div className="space-y-6">
              {/* AI Settings */}
              <div>
                <h3 className="text-base text-gray-900 mb-4">AI Ayarları</h3>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-900">Otomatik Öneriler</div>
                        <div className="text-xs text-gray-500">Otomatik içgörüler al</div>
                      </div>
                      <button
                        onClick={() => {
                          setAutoSuggestions(!autoSuggestions);
                          setShowToast(true);
                          setToastMessage({
                            title: !autoSuggestions
                              ? 'Auto Suggestions Enabled'
                              : 'Auto Suggestions Disabled',
                            message: !autoSuggestions
                              ? 'You will now receive automated AI insights.'
                              : 'Automated insights have been disabled.',
                          });
                          setTimeout(() => setShowToast(false), 3000);
                        }}
                        className={`w-11 h-6 rounded-full transition-colors ${autoSuggestions ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${autoSuggestions ? 'translate-x-5' : 'translate-x-0.5'}`}
                        ></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-900">Price Optimization</div>
                        <div className="text-xs text-gray-500">Dynamic pricing tips</div>
                      </div>
                      <button
                        onClick={() => {
                          setPriceOptimization(!priceOptimization);
                          setShowToast(true);
                          setToastMessage({
                            title: !priceOptimization
                              ? 'Price Optimization Enabled'
                              : 'Price Optimization Disabled',
                            message: !priceOptimization
                              ? 'Dynamic pricing recommendations are now active.'
                              : 'Price optimization has been turned off.',
                          });
                          setTimeout(() => setShowToast(false), 3000);
                        }}
                        className={`w-11 h-6 rounded-full transition-colors ${priceOptimization ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${priceOptimization ? 'translate-x-5' : 'translate-x-0.5'}`}
                        ></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-900">Inventory Alerts</div>
                        <div className="text-xs text-gray-500">Low stock notifications</div>
                      </div>
                      <button
                        onClick={() => {
                          setInventoryAlerts(!inventoryAlerts);
                          setShowToast(true);
                          setToastMessage({
                            title: !inventoryAlerts
                              ? 'Inventory Alerts Enabled'
                              : 'Inventory Alerts Disabled',
                            message: !inventoryAlerts
                              ? 'You will receive low stock notifications.'
                              : 'Stock alerts have been disabled.',
                          });
                          setTimeout(() => setShowToast(false), 3000);
                        }}
                        className={`w-11 h-6 rounded-full transition-colors ${inventoryAlerts ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${inventoryAlerts ? 'translate-x-5' : 'translate-x-0.5'}`}
                        ></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-900">Market Analysis</div>
                        <div className="text-xs text-gray-500">Competitor insights</div>
                      </div>
                      <button
                        onClick={() => {
                          setMarketAnalysis(!marketAnalysis);
                          setShowToast(true);
                          setToastMessage({
                            title: !marketAnalysis
                              ? 'Market Analysis Enabled'
                              : 'Market Analysis Disabled',
                            message: !marketAnalysis
                              ? 'Competitor insights are now active.'
                              : 'Market analysis has been turned off.',
                          });
                          setTimeout(() => setShowToast(false), 3000);
                        }}
                        className={`w-11 h-6 rounded-full transition-colors ${marketAnalysis ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${marketAnalysis ? 'translate-x-5' : 'translate-x-0.5'}`}
                        ></div>
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setToastMessage({
                        title: 'Ayarlar Kaydedildi',
                        message: 'AI asistan tercihleriniz başarıyla güncellendi',
                      });
                      setShowToast(true);
                    }}
                    className="w-full mt-5 px-4 py-2 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Ayarları Kaydet
                  </button>
                </div>
              </div>

              {/* Usage Stats */}
              <div>
                <h3 className="text-base text-gray-900 mb-4">AI Kullanımı</h3>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600">Bu Ayki Sorgular</span>
                        <span className="text-xs text-gray-900">248 / 500</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#F5B800] rounded-full"
                          style={{ width: '49.6%' }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600">Insights Generated</span>
                        <span className="text-xs text-gray-900">89</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600">Actions Taken</span>
                        <span className="text-xs text-gray-900">34</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="w-full mt-5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Upgrade Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Chat Button */}
      <ChatWidget />

      {/* Toast Notification */}
      <ToastV2
        title={toastMessage.title}
        message={toastMessage.message}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Help Modal */}
      {showHelpModal && <HelpModal page="ai-chatbot" onClose={() => setShowHelpModal(false)} />}

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl text-gray-900">Upgrade Your AI Plan</h3>
              <button onClick={() => setShowUpgradeModal(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Basic Plan */}
              <div className="border-2 border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-900">Basic</h4>
                    <p className="text-xs text-gray-500">Current Plan</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="w-4 h-4 text-green-600" />
                    500 queries / month
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="w-4 h-4 text-green-600" />
                    Basic insights
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="w-4 h-4 text-green-600" />
                    Email support
                  </div>
                </div>
                <p className="text-2xl text-gray-900 mb-3">
                  $29<span className="text-sm text-gray-500">/month</span>
                </p>
                <button
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm cursor-not-allowed"
                >
                  Current Plan
                </button>
              </div>

              {/* Plus Plan */}
              <div className="border-2 border-blue-500 bg-blue-50 rounded-xl p-6 relative">
                <div className="absolute -top-3 right-4 px-3 py-1 bg-blue-500 text-white text-xs rounded-full">
                  Popular
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-900">Plus</h4>
                    <p className="text-xs text-gray-500">For Growing Teams</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-900">
                    <Check className="w-4 h-4 text-green-600" />
                    2,000 queries / month
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-900">
                    <Check className="w-4 h-4 text-green-600" />
                    Advanced insights
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-900">
                    <Check className="w-4 h-4 text-green-600" />
                    Priority support
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-900">
                    <Check className="w-4 h-4 text-green-600" />
                    Market analysis
                  </div>
                </div>
                <p className="text-2xl text-gray-900 mb-3">
                  $50<span className="text-sm text-gray-500">/month</span>
                </p>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setToastMessage({
                      title: 'Upgrade to Plus Initiated',
                      message: 'You will be redirected to payment shortly...',
                    });
                    setShowToast(true);
                  }}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
                >
                  Upgrade to Plus
                </button>
              </div>

              {/* Pro Plan */}
              <div className="border-2 border-[#F5B800] bg-yellow-50 rounded-xl p-6 relative">
                <div className="absolute -top-3 right-4 px-3 py-1 bg-[#F5B800] text-gray-900 text-xs rounded-full">
                  Best Value
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-[#F5B800] rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-gray-900" />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-900">Pro</h4>
                    <p className="text-xs text-gray-500">Unlimited AI Power</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-900">
                    <Check className="w-4 h-4 text-green-600" />
                    Unlimited queries
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-900">
                    <Check className="w-4 h-4 text-green-600" />
                    AI-powered analytics
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-900">
                    <Check className="w-4 h-4 text-green-600" />
                    24/7 Priority support
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-900">
                    <Check className="w-4 h-4 text-green-600" />
                    Custom integrations
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-900">
                    <Check className="w-4 h-4 text-green-600" />
                    Dedicated account manager
                  </div>
                </div>
                <p className="text-2xl text-gray-900 mb-3">
                  $99<span className="text-sm text-gray-500">/month</span>
                </p>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setToastMessage({
                      title: 'Upgrade to Pro Initiated',
                      message: 'You will be redirected to payment shortly...',
                    });
                    setShowToast(true);
                  }}
                  className="w-full px-4 py-2 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-2xl w-full max-w-2xl mx-4 flex flex-col"
            style={{ height: '600px' }}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F5B800] rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-gray-900" />
                </div>
                <div>
                  <h3 className="text-sm text-gray-900 font-medium">Beekod AI Brain</h3>
                  <p className="text-[10px] text-green-500 font-semibold uppercase tracking-wider">
                    Aktif • GPT-4V
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 relative">
                {selectedProduct && (
                  <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-lg border border-yellow-100 mr-2 animate-in fade-in slide-in-from-right-2">
                    <img src={selectedProduct.image} className="w-5 h-5 rounded object-cover" />
                    <span className="text-[10px] font-medium text-yellow-800 truncate max-w-[80px]">
                      {selectedProduct.name}
                    </span>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="relative">
                  <button
                    onClick={() => setShowProductSearch(!showProductSearch)}
                    className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    title="Ürün Hakkında Konuş"
                  >
                    <Package className="w-3.5 h-3.5" />
                    Ürün Seç
                  </button>

                  {/* Inline Product Search Dropdown */}
                  {showProductSearch && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-[70] p-3 animate-in fade-in zoom-in-95">
                      <div className="relative mb-3">
                        <SearchBar
                        // Simple version or just an input
                        />
                        <input
                          autoFocus
                          placeholder="Ürün adı veya barkod..."
                          className="w-full pl-3 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#F5B800]"
                          onChange={(e) => setProductSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {isSearching ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="w-4 h-4 animate-spin text-[#F5B800]" />
                          </div>
                        ) : searchResults.length > 0 ? (
                          searchResults.map((p) => (
                            <button
                              key={p.barcode}
                              onClick={() => {
                                setSelectedProduct({
                                  id: p.barcode,
                                  name: p.name,
                                  image:
                                    (p.images && p.images[0]) || 'https://via.placeholder.com/100',
                                  category: p.category,
                                });
                                setShowProductSearch(false);
                                setProductSearchQuery('');
                              }}
                              className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left border border-transparent hover:border-gray-100"
                            >
                              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                                <img
                                  src={
                                    (p.images && p.images[0]) || 'https://via.placeholder.com/100'
                                  }
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-900 truncate font-medium">
                                  {p.name}
                                </p>
                                <p className="text-[10px] text-gray-400">{p.barcode}</p>
                              </div>
                            </button>
                          ))
                        ) : productSearchQuery ? (
                          <p className="text-[10px] text-gray-400 text-center py-2">
                            Ürün bulunamadı.
                          </p>
                        ) : (
                          <p className="text-[10px] text-gray-400 text-center py-2">
                            Aramaya başlayın...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={clearChat}
                  className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                  title="Sohbeti Temizle"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length <= 1 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-[#F5B800]" />
                  </div>
                  <h4 className="text-gray-900 font-medium mb-2 font-display text-lg">
                    Hızlı Başlangıç Önerileri
                  </h4>
                  <p className="text-gray-500 text-sm mb-6 max-w-xs">
                    İşinizi optimize etmek için hazır şablonlardan birini seçebilirsiniz.
                  </p>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {suggestedPrompts.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestedPrompt(s.prompt)}
                        className="p-3 bg-white border border-gray-100 rounded-xl text-left hover:border-[#F5B800] hover:shadow-sm transition-all group"
                      >
                        <p className="text-sm text-gray-700 group-hover:text-gray-900">{s.text}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-[#F5B800]' : 'bg-gray-100'}`}
                    >
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4 text-gray-900" />
                      ) : (
                        <Bot className="w-4 h-4 text-gray-900" />
                      )}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${msg.role === 'user' ? 'bg-[#F5B800] text-gray-900' : 'bg-gray-100 text-gray-900'}`}
                    >
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="Uploaded"
                          className="mb-2 rounded-xl max-w-full h-auto max-h-48 object-cover shadow-sm"
                        />
                      )}
                      <div className="text-sm leading-relaxed">
                        {msg.role === 'ai' && idx === chatMessages.length - 1 ? (
                          <Typewriter text={msg.message} />
                        ) : (
                          <div className="markdown-container">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ node, ...props }) => (
                                  <p className="mb-2 last:mb-0" {...props} />
                                ),
                                ul: ({ node, ...props }) => (
                                  <ul className="list-disc ml-4 mb-2" {...props} />
                                ),
                                ol: ({ node, ...props }) => (
                                  <ol className="list-decimal ml-4 mb-2" {...props} />
                                ),
                                table: ({ node, ...props }) => (
                                  <div className="overflow-x-auto my-2 border border-gray-200 rounded-lg">
                                    <table
                                      className="min-w-full divide-y divide-gray-200"
                                      {...props}
                                    />
                                  </div>
                                ),
                                th: ({ node, ...props }) => (
                                  <th
                                    className="px-3 py-2 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                    {...props}
                                  />
                                ),
                                td: ({ node, ...props }) => (
                                  <td
                                    className="px-3 py-2 text-xs border-t border-gray-100"
                                    {...props}
                                  />
                                ),
                              }}
                            >
                              {msg.message?.trim() || "⚠️ Boş mesaj"}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>

                      {msg.data && (
                        <div className="mt-3">
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
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3 items-center text-gray-400 ml-11">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                    <span className="text-xs">Yapay Zeka düşünüyor...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200">
              {/* Quick Actions */}
              <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar text-[10px]">
                <button
                  onClick={() => setChatInput('En çok satan 5 ürünü listeler misin?')}
                  className="px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-[#F5B800] hover:text-gray-900 rounded-full border border-gray-100 transition-all font-medium whitespace-nowrap"
                >
                  🚀 En Çok Satanlar
                </button>
                <button
                  onClick={() => setChatInput('Kritik stok seviyesindeki ürünler hangileri?')}
                  className="px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-[#F5B800] hover:text-gray-900 rounded-full border border-gray-100 transition-all font-medium whitespace-nowrap"
                >
                  ⚠️ Kritik Stok
                </button>
                <button
                  onClick={() => setChatInput('Fiyatlarımı nasıl optimize edebilirim?')}
                  className="px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-[#F5B800] hover:text-gray-900 rounded-full border border-gray-100 transition-all font-medium whitespace-nowrap"
                >
                  💰 Fiyat Analizi
                </button>
                <button
                  onClick={() => setChatInput('Pazaryeri satış performansımı özetle.')}
                  className="px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-[#F5B800] hover:text-gray-900 rounded-full border border-gray-100 transition-all font-medium whitespace-nowrap"
                >
                  📊 Satış Özeti
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  // Cast the form element to access elements properly or safer querySelector
                  const form = e.currentTarget;
                  const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;

                  if (chatInput.trim() || (fileInput?.files?.length ?? 0) > 0) {
                    const file = fileInput?.files?.[0];
                    const userMsg = chatInput;

                    // Display user message immediately
                    const userMsgObj = {
                      role: 'user' as const,
                      message: userMsg,
                      image: file ? URL.createObjectURL(file) : undefined,
                    };
                    const updatedMessages = [...chatMessages, userMsgObj];

                    setChatMessages(updatedMessages);
                    setChatInput('');
                    if (fileInput) fileInput.value = ''; // Reset file input

                    // Add temporary loading state
                    setIsTyping(true);

                    try {
                      const response = await sendMessage(
                        userMsg,
                        file,
                        selectedProduct?.id,
                        undefined, // action
                        undefined, // opts
                        updatedMessages // Passing updated history
                      );
                      console.log('AIAssistantScreen: API response:', response);

                      // sendMessage now returns response.data directly: { success, reply, data }
                      const { success, reply, data } = response || {};

                      setIsTyping(false);

                      // Handle failure - still show the message
                      if (!success) {
                        const errorMsg = reply || "Bir şeyler ters gitti. Tekrar dener misin? 🤔";
                        setChatMessages((prev) => [
                          ...prev,
                          { role: 'ai', message: errorMsg },
                        ]);
                        return;
                      }

                      // Success: add AI reply with data
                      const finalReply = reply?.trim() || "⚠️ Boş cevap geldi";
                      setChatMessages((prev) => [...prev, { role: 'ai', message: finalReply, data }]);
                    } catch (err) {
                      setIsTyping(false);
                      setChatMessages((prev) => [
                        ...prev,
                        {
                          role: 'ai',
                          message:
                            'Maalesef şu an cevap veremiyorum. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.',
                        },
                      ]);
                    }
                  }
                }}
                className="flex gap-2"
              >
                <label className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-center">
                  <ImagePlus className="w-5 h-5 text-gray-600" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setToastMessage({
                          title: 'Resim Seçildi',
                          message: 'Yüklemek ve analiz etmek için gönder tuşuna basın.',
                        });
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 2000);
                      }
                    }}
                  />
                </label>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="İşletmeniz hakkında bana her şeyi sorabilirsiniz..."
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F5B800]"
                />
                <button
                  type="button"
                  onClick={startListening}
                  className={`p-2.5 border border-gray-200 rounded-lg transition-colors flex items-center justify-center ${isListening ? 'bg-red-50 text-red-500 border-red-200 animate-pulse' : 'hover:bg-gray-50 text-gray-600'}`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
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
      )}

      {/* Insights Modal */}
      {showInsightsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl text-gray-900">Tüm AI İçgörüleri</h3>
              <button onClick={() => setShowInsightsModal(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Sales Insights */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-900">Satış Tahmini</h4>
                    <p className="text-xs text-gray-600">Gelecek 30 gün</p>
                  </div>
                </div>
                <p className="text-2xl text-gray-900 mb-2">+23.5%</p>
                <p className="text-xs text-gray-600">
                  Mevcut trendlere ve mevsimsel kalıplara dayalı beklenen büyüme
                </p>
              </div>

              {/* Inventory Insights */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-900">Stok Yenileme Uyarısı</h4>
                    <p className="text-xs text-gray-600">Acil ürünler</p>
                  </div>
                </div>
                <p className="text-2xl text-gray-900 mb-2">8 Ürün</p>
                <p className="text-xs text-gray-600">
                  Stok bitmesini önlemek için 7 gün içinde yenilenmesi gerekiyor
                </p>
              </div>

              {/* Pricing Insights */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#F5B800] rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-gray-900" />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-900">Fiyat Optimizasyonu</h4>
                    <p className="text-xs text-gray-600">Gelir fırsatı</p>
                  </div>
                </div>
                <p className="text-2xl text-gray-900 mb-2">+₺12,450</p>
                <p className="text-xs text-gray-600">
                  Optimize edilmiş fiyatlandırma ile potansiyel aylık gelir artışı
                </p>
              </div>

              {/* Market Insights */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-900">Pazar Trendleri</h4>
                    <p className="text-xs text-gray-600">Rakip analizi</p>
                  </div>
                </div>
                <p className="text-2xl text-gray-900 mb-2">15 Fırsat</p>
                <p className="text-xs text-gray-600">
                  Rekabet avantajı kazanabileceğiniz ürünler
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm text-gray-900 mb-3">Önerilen Aksiyonlar</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <ChevronRight className="w-4 h-4 text-[#F5B800]" />
                  Premium Çay Seti fiyatını %8 artırın
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <ChevronRight className="w-4 h-4 text-[#F5B800]" />
                  200 adet Organik Bal Kavanozu sipariş edin
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <ChevronRight className="w-4 h-4 text-[#F5B800]" />
                  SonicBlast Kulaklıklarda kampanya başlatın
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowInsightsModal(false);
                  setShowChatModal(true);
                }}
                className="px-6 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                AI ile Tartış
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
