import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SidebarV2 } from '../layouts/SidebarV2';
import { SearchBar, MetricCard, ToastV2 } from '../components/shared/';
import {
  TrendingUp,
  Crown,
  UserMinus,
  ShoppingCart,
  DollarSign,
  Zap,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Package,
  AlertCircle,
} from 'lucide-react';
import {
  getPriceRecommendations,
  getCustomerLTV,
  getBundleSuggestions,
  getRevenueInsights,
  PriceRecommendation,
  CustomerLTV,
  BundleSuggestion,
  RevenueInsight,
  applyPriceRecommendation,
} from '../services/revenue';

interface RevenueOptimizationScreenProps {
  onNavigate: (screen: string) => void;
}

export function RevenueOptimizationScreen({ onNavigate }: RevenueOptimizationScreenProps) {
  const [tokenBalance] = useState(1450);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', message: '' });

  // Queries
  const { data: recommendations, isLoading: loadingPricing } = useQuery({
    queryKey: ['priceRecommendations'],
    queryFn: getPriceRecommendations,
  });

  const { data: ltvData, isLoading: loadingLTV } = useQuery({
    queryKey: ['customerLTV'],
    queryFn: getCustomerLTV,
  });

  const { data: bundles, isLoading: loadingBundles } = useQuery({
    queryKey: ['bundles'],
    queryFn: getBundleSuggestions,
  });

  const { data: insights, isLoading: loadingInsights } = useQuery({
    queryKey: ['revenueInsights'],
    queryFn: () => getRevenueInsights('tr'),
  });

  const handleApplyPrice = async (rec: PriceRecommendation) => {
    try {
      await applyPriceRecommendation(rec.barcode, rec.suggestedPrice);
      setToastMessage({
        title: 'Fiyat Uygulandı',
        message: `${rec.name} için yeni fiyat ${rec.suggestedPrice} ${rec.currency} olarak güncellendi ve tüm pazaryerlerine senkronize edildi.`,
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      setToastMessage({
        title: 'Hata',
        message: 'Fiyat güncellenirken bir sorun oluştu.',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50/30">
      <SidebarV2
        activeItem="revenue-optimization"
        onNavigate={onNavigate}
        userName="Ahmet Yılmaz"
        userEmail="Beekod Admin"
        tokenBalance={tokenBalance}
        onTokenClick={() => { }}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gelir Optimizasyonu</h1>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  AI Destekli Gelir Paketi
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <SearchBar />
              <div className="h-8 w-px bg-gray-100 hidden sm:block"></div>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
                <Zap className="w-4 h-4" />
                Hızlı Analiz
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {/* Insights Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {insights?.map((insight, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div
                  className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 ${insight.impact === 'positive'
                      ? 'bg-emerald-50'
                      : insight.impact === 'negative'
                        ? 'bg-orange-50'
                        : 'bg-blue-50'
                    } rounded-full opacity-50 group-hover:scale-110 transition-transform`}
                ></div>

                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles
                      className={`w-4 h-4 ${insight.impact === 'positive'
                          ? 'text-emerald-500'
                          : insight.impact === 'negative'
                            ? 'text-orange-500'
                            : 'text-blue-500'
                        }`}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      AI İçgörüsü
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 truncate pr-6">{insight.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {insight.description}
                  </p>
                  {insight.actionLabel && (
                    <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group/btn">
                      {insight.actionLabel}
                      <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle: Pricing & Bundles */}
            <div className="lg:col-span-2 space-y-8">
              {/* Dynamic Pricing AI */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-white to-indigo-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h2 className="font-bold text-gray-900">Dinamik Fiyatlandırma Önerileri</h2>
                  </div>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-tighter animate-pulse">
                    Canlı Analiz
                  </span>
                </div>

                <div className="divide-y divide-gray-50">
                  {recommendations?.map((rec, idx) => (
                    <div key={idx} className="p-6 hover:bg-gray-50/50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900 truncate">{rec.name}</h4>
                            <span className="text-xs text-gray-400 font-mono">#{rec.barcode}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500">
                              Mevcut:{' '}
                              <span className="font-medium text-gray-900">
                                {rec.currentPrice} {rec.currency}
                              </span>
                            </span>
                            <div className="flex items-center gap-1 text-indigo-600 font-bold">
                              <Sparkles className="w-3 h-3" />
                              AI Önerisi: {rec.suggestedPrice} {rec.currency}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div
                            className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${rec.suggestedPrice > rec.currentPrice
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-orange-50 text-orange-600'
                              }`}
                          >
                            {rec.suggestedPrice > rec.currentPrice ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            %
                            {Math.abs(
                              Math.round(
                                ((rec.suggestedPrice - rec.currentPrice) / rec.currentPrice) * 100,
                              ),
                            )}
                          </div>
                          <button
                            onClick={() => handleApplyPrice(rec)}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors"
                          >
                            Uygula
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                        <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                          <strong className="text-indigo-900">Gerekçe:</strong> {rec.reason}
                        </p>
                      </div>
                      {/* Competitors small badges */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {rec.competitors.map((comp, cidx) => (
                          <div
                            key={cidx}
                            className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-md"
                          >
                            {comp.platform}: {comp.price} {comp.currency}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {loadingPricing && (
                    <div className="p-8 text-center text-sm text-gray-400">
                      Tahminlemeler yükleniyor...
                    </div>
                  )}
                </div>
              </section>

              {/* Bundles */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-purple-600" />
                    </div>
                    <h2 className="font-bold text-gray-900">Sık Birlikte Alınanlar (Bundles)</h2>
                  </div>
                  <span className="text-xs text-indigo-600 font-bold cursor-pointer hover:underline">
                    Tümünü İncele
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bundles?.map((bundle, idx) => (
                    <div
                      key={idx}
                      className="p-4 border border-purple-50 rounded-2xl bg-gradient-to-br from-white to-purple-50/30 group hover:border-purple-200 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex -space-x-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-xl bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold">
                            P1
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-gray-300 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold">
                            P2
                          </div>
                        </div>
                        <div>
                          <div className="flex flex-wrap gap-1">
                            {bundle.products.map((p, pidx) => (
                              <span key={pidx} className="text-xs font-bold text-gray-800">
                                {p}
                                {pidx < bundle.products.length - 1 ? ' +' : ''}
                              </span>
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-500 font-medium">
                            Birlikte alımda %{bundle.savingsPercent} tasarruf önerilir
                          </p>
                        </div>
                      </div>
                      <button className="w-full py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors opacity-0 group-hover:opacity-100">
                        Paket Oluştur
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right: Customer LTV Analysis */}
            <div className="lg:col-span-1 space-y-6">
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit">
                <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-white to-emerald-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h2 className="font-bold text-gray-900">Müşteri Değeri (LTV)</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {ltvData?.map((customer, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${customer.segment === 'VIP'
                              ? 'bg-amber-100 text-amber-700'
                              : customer.segment === 'Loyal'
                                ? 'bg-blue-100 text-blue-700'
                                : customer.segment === 'At Risk'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                          {customer.customerEmail.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">
                            {customer.customerEmail.split('@')[0]}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${customer.segment === 'VIP'
                                  ? 'bg-amber-100 text-amber-600'
                                  : customer.segment === 'Loyal'
                                    ? 'bg-blue-100 text-blue-600'
                                    : customer.segment === 'At Risk'
                                      ? 'bg-red-100 text-red-600'
                                      : 'bg-gray-200 text-gray-600'
                                }`}
                            >
                              {customer.segment === 'VIP'
                                ? 'VIP'
                                : customer.segment === 'Loyal'
                                  ? 'Sadık'
                                  : customer.segment === 'At Risk'
                                    ? 'Riskli'
                                    : customer.segment}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {customer.orderCount} Sipariş
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">
                          {customer.predictedLTV} TL
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium italic">
                          Tahmini LTV
                        </div>
                      </div>
                    </div>
                  ))}
                  {loadingLTV && (
                    <div className="text-center py-8 text-sm text-gray-400">
                      Müşteri analizi yapılıyor...
                    </div>
                  )}
                </div>
                <div className="p-4 bg-gray-50 text-center">
                  <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                    Tüm Müşteri Analizini Gör
                  </button>
                </div>
              </section>

              <div className="bg-indigo-900 rounded-2xl p-6 text-white relative overflow-hidden">
                <Sparkles className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 text-indigo-800 opacity-50" />
                <div className="relative">
                  <div className="w-10 h-10 bg-indigo-800 rounded-xl flex items-center justify-center mb-4">
                    <Brain className="w-6 h-6 text-indigo-300" />
                  </div>
                  <h3 className="font-bold mb-2">AI Kampanya Motoru</h3>
                  <p className="text-xs text-indigo-200 leading-relaxed mb-4">
                    Toplanan verilere göre VIP müşterileriniz için özel bir hafta sonu kampanyası
                    hazırlamamı ister misiniz?
                  </p>
                  <button className="w-full py-2.5 bg-white text-indigo-900 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors">
                    Kampanya Tasarla
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showToast && (
        <ToastV2
          title={toastMessage.title}
          message={toastMessage.message}
          isVisible={showToast}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}

// Additional icons for UI
function Brain({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z" />
    </svg>
  );
}
