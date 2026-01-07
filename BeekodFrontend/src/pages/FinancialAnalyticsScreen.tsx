import { useState, useEffect } from 'react';
import { SidebarV2 } from '../layouts/SidebarV2';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  AlertCircle,
  Package,
  ArrowRight,
  Info,
  LayoutGrid,
} from 'lucide-react';
import { getInventory } from '../services/inventory';
import { getInvoices } from '../services/invoice';
import {
  getFinancialInsights,
  getStockForecasting,
  FinancialInsight,
  StockForecast,
} from '../services/analytics';

interface FinancialAnalyticsScreenProps {
  onNavigate: (screen: string) => void;
}

export function FinancialAnalyticsScreen({ onNavigate }: FinancialAnalyticsScreenProps) {
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState({
    totalRevenue: 245600,
    totalCost: 168400,
    netProfit: 77200,
    margin: 31.4,
    profitTrend: 12.5,
    marginTrend: -2.3,
  });

  const [aiInsights, setAIInsights] = useState<FinancialInsight[]>([]);
  const [forecast, setForecast] = useState<StockForecast | null>(null);

  const [expenseCategories, setExpenseCategories] = useState([
    { name: 'Ürün Tedariği', amount: 98400, percentage: 58, color: 'bg-blue-500' },
    { name: 'Lojistik', amount: 32500, percentage: 19, color: 'bg-purple-500' },
    { name: 'Pazarlama', amount: 21200, percentage: 13, color: 'bg-pink-500' },
    { name: 'Ofis/Diğer', amount: 16300, percentage: 10, color: 'bg-gray-400' },
  ]);

  const [topProducts, setTopProducts] = useState([
    { name: 'Kablosuz Kulaklık V5', margin: 42, profit: 12400, status: 'healthy' },
    { name: 'Akıllı Saat Pro', margin: 28, profit: 8200, status: 'warning' },
    { name: 'USB-C Hızlı Şarj', margin: 15, profit: 2100, status: 'critical' },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [insights, forecastData] = await Promise.all([
        getFinancialInsights(),
        getStockForecasting(),
      ]);
      setAIInsights(insights);
      setForecast(forecastData);
      if (forecastData.expenseDistribution && forecastData.expenseDistribution.length > 0) {
        setExpenseCategories(forecastData.expenseDistribution);
      }
    } catch (error) {
      console.error('Failed to load financial analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarV2
        activeItem="analytics"
        onNavigate={onNavigate}
        userName="Emir"
        userEmail="emir@beekod.com"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 font-display">Finansal Zeka (AI)</h1>
            <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-100">
              <Brain className="w-4 h-4 text-[#F5B800]" />
              <span className="text-xs font-medium text-yellow-800">Yapay Zeka Analizi Aktif</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8">
          {/* Main Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 font-display">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <ArrowUpRight className="w-3 h-3" />
                  <span className="text-[10px] font-bold">12%</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Toplam Ciro</p>
              <h3 className="text-2xl font-bold text-gray-900 font-display">
                ₺{financialData.totalRevenue.toLocaleString()}
              </h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 font-display">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  <ArrowUpRight className="w-3 h-3" />
                  <span className="text-[10px] font-bold">8%</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Toplam Maliyet</p>
              <h3 className="text-2xl font-bold text-gray-900 font-display">
                ₺{financialData.totalCost.toLocaleString()}
              </h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 font-display">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <ArrowUpRight className="w-3 h-3" />
                  <span className="text-[10px] font-bold">15%</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Net Kar</p>
              <h3 className="text-2xl font-bold text-green-600 font-display">
                ₺{financialData.netProfit.toLocaleString()}
              </h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 font-display">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  <ArrowDownRight className="w-3 h-3" />
                  <span className="text-[10px] font-bold">2.3%</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Ortalama Marj</p>
              <h3 className="text-2xl font-bold text-gray-900 font-display">
                %{financialData.margin}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* AI Recommendations */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl shadow-xl shadow-yellow-900/5 border border-yellow-100/50 overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-yellow-50 to-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-200">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      AI Fiyatlandırma & Karlılık Önerileri
                    </h3>
                    <p className="text-xs text-gray-500">
                      Verileriniz AI tarafından 2 dakikada bir analiz edilir.
                    </p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {loading && (
                    <div className="flex flex-col items-center py-12">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-yellow-100 border-t-yellow-500 rounded-full animate-spin"></div>
                        <Brain className="w-8 h-8 text-yellow-500 absolute inset-0 m-auto animate-pulse" />
                      </div>
                      <p className="mt-4 text-sm font-bold text-gray-900">
                        Verileriniz analiz ediliyor...
                      </p>
                    </div>
                  )}
                  {!loading &&
                    aiInsights.map((insight, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-4 p-5 rounded-2xl border transition-all hover:scale-[1.01] ${
                          insight.type === 'warning'
                            ? 'bg-red-50 border-red-100'
                            : insight.type === 'opportunity'
                              ? 'bg-green-50 border-green-100'
                              : 'bg-blue-50 border-blue-100'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            insight.type === 'warning'
                              ? 'bg-red-100 text-red-600'
                              : insight.type === 'opportunity'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {insight.type === 'warning' ? (
                            <AlertCircle className="w-6 h-6" />
                          ) : insight.type === 'opportunity' ? (
                            <TrendingUp className="w-6 h-6" />
                          ) : (
                            <Info className="w-6 h-6" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4
                            className={`text-sm font-bold mb-1 ${
                              insight.type === 'warning'
                                ? 'text-red-900'
                                : insight.type === 'opportunity'
                                  ? 'text-green-900'
                                  : 'text-blue-900'
                            }`}
                          >
                            {insight.title}
                          </h4>
                          <p
                            className={`text-xs leading-relaxed font-medium ${
                              insight.type === 'warning'
                                ? 'text-red-700'
                                : insight.type === 'opportunity'
                                  ? 'text-green-700'
                                  : 'text-blue-700'
                            }`}
                          >
                            {insight.description}
                          </p>
                          {insight.actionText && (
                            <button
                              className={`mt-3 text-xs font-bold flex items-center gap-1 hover:underline ${
                                insight.type === 'warning'
                                  ? 'text-red-600'
                                  : insight.type === 'opportunity'
                                    ? 'text-green-600'
                                    : 'text-blue-600'
                              }`}
                            >
                              {insight.actionText} <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Expense Category Chart */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                  <LayoutGrid className="w-6 h-6 text-purple-600" />
                  <h3 className="font-bold text-gray-900">Gider Kategorileri (AI Sınıflandırma)</h3>
                </div>
                <div className="p-8">
                  <div className="flex h-4 w-full bg-gray-100 rounded-full overflow-hidden mb-8">
                    {expenseCategories.map((cat, i) => (
                      <div
                        key={i}
                        className={`h-full ${cat.color} transition-all`}
                        style={{ width: `${cat.percentage}%` }}
                        title={`${cat.name}: %${cat.percentage}`}
                      ></div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {expenseCategories.map((cat, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${cat.color}`}></div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {cat.name}
                            </p>
                            <p className="text-sm font-bold text-gray-900">
                              ₺{cat.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-gray-400">%{cat.percentage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <Brain className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold">Gelecek Tahmini</h3>
                  </div>
                  <p className="text-blue-100 text-sm mb-6 leading-relaxed font-medium">
                    {forecast?.prediction ||
                      'AI verilerinizi analiz ederek önümüzdeki 30 günün projeksiyonunu çıkarıyor.'}
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-blue-200">Talep Artışı Tahmini</span>
                      <span className="font-black text-blue-300">%82</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 w-[82%]"
                        style={{ transition: 'width 2s ease-in-out' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  AI Analiz Notları
                </h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-1 bg-blue-500 rounded-full"></div>
                    <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                      Lojistik giderleriniz son 30 günde %12 azaldı. AI bu düşüşü kargo
                      optimizasyonuna bağlıyor.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-1 bg-yellow-500 rounded-full"></div>
                    <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                      Pazarlama harcamalarınızın dönüşüm oranı (ROAS) %15 artarak 4.2 seviyesine
                      geldi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
