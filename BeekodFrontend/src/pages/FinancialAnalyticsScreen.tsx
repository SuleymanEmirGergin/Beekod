import { useState, useEffect } from 'react';
import { SidebarV2 } from '../layouts/SidebarV2';
import {
  TrendingUp,
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
import {
  getFinancialInsights,
  getStockForecasting,
  getProfitSummary,
  getSalesTrends,
  FinancialInsight,
  StockForecast,
  ProfitSummary,
  SalesTrend,
} from '../services/analytics';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface FinancialAnalyticsScreenProps {
  onNavigate: (screen: string) => void;
}

export function FinancialAnalyticsScreen({ onNavigate }: FinancialAnalyticsScreenProps) {
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<ProfitSummary>({
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    profitMargin: 0,
  });

  const [salesHistory, setSalesHistory] = useState<SalesTrend[]>([]);
  const [aiInsights, setAIInsights] = useState<FinancialInsight[]>([]);
  const [forecast, setForecast] = useState<StockForecast | null>(null);

  const [expenseCategories, setExpenseCategories] = useState([
    { name: 'Ürün Tedariği', amount: 0, percentage: 0, color: 'bg-blue-500' },
    { name: 'Lojistik', amount: 0, percentage: 0, color: 'bg-purple-500' },
    { name: 'Pazarlama', amount: 0, percentage: 0, color: 'bg-pink-500' },
    { name: 'Ofis/Diğer', amount: 0, percentage: 0, color: 'bg-gray-400' },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [insights, forecastData, profitData, trendsData] = await Promise.all([
        getFinancialInsights(),
        getStockForecasting(),
        getProfitSummary(30),
        getSalesTrends(30),
      ]);

      setAIInsights(insights);
      setForecast(forecastData);
      setFinancialData(profitData);
      setSalesHistory(trendsData);

      if (forecastData.expenseDistribution && forecastData.expenseDistribution.length > 0) {
        setExpenseCategories(forecastData.expenseDistribution);
      } else {
         // Fallback calculation from profitData if API doesn't provide breakdown
         const revenue = profitData.totalRevenue || 1; 
         const cost = profitData.totalCost;
         setExpenseCategories([
             { name: 'Ürün Maliyeti', amount: cost * 0.7, percentage: 70, color: 'bg-blue-500' },
             { name: 'Operasyonel', amount: cost * 0.2, percentage: 20, color: 'bg-purple-500' },
             { name: 'Pazarlama', amount: cost * 0.1, percentage: 10, color: 'bg-pink-500' },
         ]);
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
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 font-display">
              Finansal Zeka (AI)
            </h1>
            <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-100">
              <Brain className="w-4 h-4 text-[#F5B800]" />
              <span className="text-xs font-medium text-yellow-800">
                Yapay Zeka Analizi Aktif
              </span>
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
              <p className="text-sm text-gray-500 mb-1">Toplam Ciro (30 Gün)</p>
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
                ₺{financialData.totalProfit.toLocaleString()}
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
              <p className="text-sm text-gray-500 mb-1">Kar Marjı</p>
              <h3 className="text-2xl font-bold text-gray-900 font-display">
                %{financialData.profitMargin.toFixed(1)}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area: Graph & Report */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Revenue Trend Graph */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Gelir Trendi</h3>
                    <p className="text-sm text-gray-500">Son 30 günlük satış performansı</p>
                  </div>
                  <div className="flex gap-2">
                     <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div> Gelir
                     </span>
                     <span className="flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div> Sipariş
                     </span>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  {loading ? (
                    <div className="h-full flex items-center justify-center text-gray-400 animate-pulse">
                      Grafik yükleniyor...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesHistory.length > 0 ? salesHistory : [{date: 'No Data', revenue: 0}]}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false}
                            tickLine={false}
                            tick={{fontSize: 12, fill: '#6B7280'}}
                            dy={10}
                            tickFormatter={(value) => {
                                // Format logic dependent on API date format (assuming DD.MM or similar)
                                return value.split('T')[0].split('-').slice(1).join('/');
                            }}
                        />
                        <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{fontSize: 12, fill: '#6B7280'}}
                            tickFormatter={(value) => `₺${value/1000}k`}
                        />
                        <Tooltip 
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)'}}
                            formatter={(value: number) => [`₺${value.toLocaleString()}`, "Gelir"]}
                            labelStyle={{color: '#374151', marginBottom: '4px', fontWeight: 600}}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorRevenue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* AI Insights (Moved below graph) */}
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
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              {/* Expense Category Chart */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                  <LayoutGrid className="w-6 h-6 text-purple-600" />
                  <h3 className="font-bold text-gray-900">Gider Kategorileri</h3>
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
                  <div className="grid grid-cols-2 gap-4">
                    {expenseCategories.map((cat, i) => (
                      <div
                        key={i}
                        className="p-3 bg-gray-50 rounded-2xl border border-gray-100"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${cat.color}`}></div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                            {cat.name}
                          </p>
                        </div>
                        <p className="text-xs font-bold text-gray-900">
                           {cat.amount ? `₺${cat.amount.toLocaleString()}` : '%'+cat.percentage}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
