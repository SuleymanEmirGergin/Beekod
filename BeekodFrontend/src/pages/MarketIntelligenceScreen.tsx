import React, { useState, useEffect } from 'react';
import { SidebarV2 } from '../layouts/SidebarV2';
import { Card } from '../components/shared';
import {
  TrendingUp,
  Flame,
  Lightbulb,
  Search,
  Filter,
  Loader2,
  Target,
  Globe,
  BarChart3,
  ArrowUpRight,
  BadgeAlert,
  Sparkles,
} from 'lucide-react';
import { getMarketTrends, MarketIntelligence } from '../services/intelligence';
import { toast } from 'sonner';

interface MarketIntelligenceScreenProps {
  onNavigate: (screen: string) => void;
}

export function MarketIntelligenceScreen({ onNavigate }: MarketIntelligenceScreenProps) {
  const [intelligence, setIntelligence] = useState<MarketIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async (category?: string) => {
    setIsLoading(true);
    try {
      const data = await getMarketTrends(category);
      setIntelligence(data);
    } catch (error) {
      toast.error('Pazar verileri yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadTrends(selectedCategory);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <SidebarV2
        activeItem="intelligence"
        onNavigate={onNavigate}
        userName="Emir"
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] -z-10 rounded-full mix-blend-multiply opacity-70 animate-blob" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-600/5 blur-[100px] -z-10 rounded-full mix-blend-multiply opacity-70 animate-blob animation-delay-2000" />
        {/* Header */}
        <header className="bg-white/60 backdrop-blur-xl border-b border-white/20 px-8 py-6 z-20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2 bg-blue-50 w-fit px-3 py-1 rounded-full border border-blue-100">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">
                  Küresel İstihbarat Katmanı Aktif
                </span>
              </div>
              <h1 className="text-3xl font-black text-gray-900 font-display flex items-center gap-3">
                <Globe className="w-9 h-9 text-blue-600" />
                Pazar İstihbaratı
              </h1>
              <p className="text-gray-500 mt-1 font-medium">
                AI destekli küresel pazar analizi ve trend takibi.
              </p>
            </div>

            <form onSubmit={handleCategorySearch} className="relative w-full lg:w-[450px] group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Pazar veya Kategori ara (örn: Akıllı Saatler, Kozmetik...)"
                className="w-full pl-12 pr-32 py-4 bg-gray-50 border border-gray-100 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-200 transition-all text-sm font-medium shadow-sm hover:border-blue-100"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bg-gray-900 text-white text-xs font-bold px-6 py-2.5 rounded-[14px] hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
              >
                Analiz Et
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                <Target className="absolute inset-0 m-auto w-6 h-6 text-blue-600 animate-pulse" />
              </div>
              <p className="text-gray-500 font-medium animate-pulse">
                Küresel veriler analiz ediliyor...
              </p>
            </div>
          ) : intelligence ? (
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Top Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card
                  padding="lg"
                  className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-xl shadow-blue-100"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-2xl">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg">Pazar Durumu</h3>
                  </div>
                  <p className="text-blue-50 text-sm leading-relaxed opacity-90">
                    Pazar şu an yükseliş eğiliminde. Özellikle kişiselleştirilmiş ürünlere olan
                    talep %40 arttı.
                  </p>
                </Card>

                <Card padding="lg" className="bg-white border-gray-100 shadow-sm rounded-3xl">
                  <div className="flex items-center gap-4 mb-4 text-orange-600">
                    <div className="p-3 bg-orange-50 rounded-2xl">
                      <Flame className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 font-display">
                      Sıcak Kelimeler
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {intelligence.hotKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-100 transition-all cursor-default flex items-center gap-1"
                      >
                        <div className="w-1 h-1 bg-orange-400 rounded-full" />
                        {kw}
                      </span>
                    ))}
                  </div>
                </Card>

                <Card padding="lg" className="bg-white border-gray-100 shadow-sm">
                  <div className="flex items-center gap-4 mb-4 text-purple-600">
                    <div className="p-3 bg-purple-50 rounded-2xl">
                      <Lightbulb className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900">AI Önerisi</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed font-medium">
                    {intelligence.recommendation}
                  </p>
                </Card>
              </div>

              {/* Main Trends Grid */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-gray-400" />
                  Kategorik Trend Analizi
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {intelligence.trends.map((trend, i) => (
                    <div
                      key={i}
                      className="group bg-white p-6 rounded-3xl border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`p-2 rounded-xl ${trend.impact === 'high'
                            ? 'bg-red-50 text-red-600'
                            : trend.impact === 'medium'
                              ? 'bg-orange-50 text-orange-600'
                              : 'bg-green-50 text-green-600'
                            }`}
                        >
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${trend.impact === 'high'
                            ? 'bg-red-100 text-red-700'
                            : trend.impact === 'medium'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                            }`}
                        >
                          Etki: {trend.impact === 'high' ? 'Yüksek' : trend.impact === 'medium' ? 'Orta' : 'Düşük'}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">
                        {trend.title}
                      </h4>
                      <p className="text-gray-500 text-sm leading-relaxed">{trend.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seasonal Forecast Mockup */}
              <div className="bg-white/60 backdrop-blur-md rounded-[32px] border border-white/20 shadow-xl overflow-hidden">
                <div className="flex flex-col md:flex-row h-full">
                  <div className="p-10 md:w-1/3 bg-slate-900 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-blue-600/10 blur-3xl"></div>
                    <div className="relative z-10">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-900/50">
                        <BadgeAlert className="w-7 h-7" />
                      </div>
                      <h3 className="text-2xl font-black font-display mb-4">Mevsimsel Öngörü</h3>
                      <p className="text-blue-200/80 text-sm leading-relaxed font-medium">
                        AI, geçmiş 3 yılı analiz ederek gelecek 45 gün içindeki talep patlamalarını
                        tahmin ediyor.
                      </p>
                    </div>
                    <div className="mt-8 relative z-10">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                        Tahmini Doğruluk
                      </span>
                      <div className="flex items-end gap-2 mt-1">
                        <span className="text-5xl font-black text-white tracking-tight">%94</span>
                        <span className="text-blue-300 text-xs font-bold mb-2">
                          Güven Seviyesi
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-10 flex-1 grid grid-cols-2 md:grid-cols-4 gap-8 items-end">
                    {[
                      { label: 'Oca', val: 45, color: 'bg-blue-100', text: 'text-blue-300' },
                      { label: 'Şub', val: 65, color: 'bg-blue-200', text: 'text-blue-400' },
                      { label: 'Mar', val: 85, color: 'bg-blue-600', text: 'text-blue-600' },
                      { label: 'Nis', val: 40, color: 'bg-blue-100', text: 'text-blue-300' },
                    ].map((m, i) => (
                      <div key={i} className="flex flex-col items-center gap-4 group cursor-pointer">
                        <div className="relative w-full h-48 bg-slate-50 rounded-2xl overflow-hidden flex items-end justify-center">
                          <div
                            className={`w-full mx-4 rounded-t-xl transition-all duration-500 group-hover:scale-110 ${m.color}`}
                            style={{ height: `${m.val}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
              <p>Veri bulunamadı. Lütfen bir kategori arayın.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
