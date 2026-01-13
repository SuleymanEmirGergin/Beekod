import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNewDashboardData } from '../services/dashboard';
import { getDashboardSummary, getActionItems, ActionItem } from '../services/intelligence';
import { SidebarV2 } from '../layouts/SidebarV2';
import { SearchBar } from '../components/shared/';
import { MetricCard } from '../components/shared/';
import { ActivityItem } from '../components/ActivityItem';

import { ToastV2 } from '../components/shared/';
import {
  TodaysOrdersModal,
  LowStockAlertsModal,
  PriceChangesModal,
  SyncStatusModal,
} from '../components/DashboardModals';
import { ActivityDetailModal } from '../components/ActivityDetailModal';
import { HelpModal } from '../components/HelpModal';
import { ActionCenter } from '../components/ActionCenter';
import {
  RevenueChart,
  ProfitMarginCard,
  InventoryHealthWidget,
  MarketplacePerformanceChart,
  DailyInsightWidget,
} from '../components/dashboard';
import { MarketplaceHealthWidget } from '../components/dashboard/MarketplaceHealthWidget';
import {
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Plus,
  Filter,
  Sparkles,
  Brain,
  AlertTriangle,
  Tag,
  RefreshCw,
  X,
  QrCode,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Upload } from 'lucide-react';
import trendyolLogo from 'figma:asset/1230e43a58a5ec2cbca646dd9964cda0a5eb57b2.png';
import hepsiburadaLogo from 'figma:asset/563328772dcd4f9d76dd21b5abc99b99a49e8f70.png';

interface DashboardScreenV2Props {
  onNavigate: (screen: string) => void;
}

export function DashboardScreenV2({ onNavigate }: DashboardScreenV2Props) {
  // UI State
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showPriceChangesModal, setShowPriceChangesModal] = useState(false);
  const [showSyncStatusModal, setShowSyncStatusModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showQuickStockModal, setShowQuickStockModal] = useState(false);
  const [showAIDetailModal, setShowAIDetailModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [activeItem, setActiveItem] = useState('dashboard'); // Added for Sidebar compatibility if needed
  const [toastMessage, setToastMessage] = useState<{ title: string; message: string } | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Handlers
  const handleSyncChannels = () => {
    setShowSyncStatusModal(false);
    setShowSyncModal(true);
    setIsSyncing(true);
    setSyncProgress(0);

    // Simulate sync
    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  // Fetch Dashboard Data
  const {
    data: dashboardData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getNewDashboardData,
  });

  const { data: aiSummary } = useQuery({
    queryKey: ['aiSummary'],
    queryFn: getDashboardSummary,
  });

  const { data: aiActions } = useQuery({
    queryKey: ['aiActions'],
    queryFn: getActionItems,
  });

  const stats = dashboardData?.stats;
  const recentActivities = dashboardData?.marketplaceOrders || [];

  // Map marketplace orders to activity format for display
  const mappedActivities = recentActivities.map((order) => ({
    id: order.id,
    type: 'order',
    title: `Sipariş #${order.orderNumber}`,
    description: `${order.productName} - ${order.marketplace.name}`,
    time: order.date,
    details: order,
  }));

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Dashboard Yükleniyor...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Premium Background with Mesh Gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-amber-200/20 via-orange-200/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-200/20 via-indigo-200/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-purple-200/10 to-pink-200/10 rounded-full blur-3xl" />
      </div>

      <SidebarV2
        activeItem={activeItem}
        onNavigate={onNavigate}
        userName="Emir"
        userEmail="emir@beekod.com"
        ordersBadge={3}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Premium Header */}
        <header className="relative px-8 py-5 flex items-center justify-between border-b border-white/20 bg-white/40 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl blur opacity-30" />
              <div className="relative w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Komuta Merkezi</h1>
              <p className="text-sm text-gray-500">İşletmenizin anlık durumu</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ActionCenter onNavigate={onNavigate} />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {/* Metric Cards */}
          {/* AI Smart Alerts Section */}
          <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-6 text-white shadow-xl mb-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Brain className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {aiSummary?.title || 'Akıllı İşletme Özeti'}
                  </h3>
                  <p className="text-blue-200 text-xs">
                    {aiSummary?.subtitle || 'Verileriniz analiz ediliyor...'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {aiSummary?.metrics.map((metric, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl"
                  >
                    <div className="text-blue-200 text-xs mb-1">{metric.label}</div>
                    <div className="flex items-end gap-2">
                      <div className="text-xl font-bold">{metric.value}</div>
                      {metric.trend && (
                        <div
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${metric.trendType === 'up' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}
                        >
                          {metric.trend}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl">
                <p className="text-sm text-blue-50 leading-relaxed">
                  {aiSummary?.narrative ||
                    'Geçmiş verileriniz incelenerek işletmeniz için en uygun büyüme stratejileri hazırlanıyor. Tamamlandığında burada görünecek.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <DailyInsightWidget />
          </div>

          {/* Analytics Dashboard Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Finansal Analitik</h2>
                <p className="text-xs text-gray-500">Son 30 günlük performans verileri</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg overflow-hidden">
                <RevenueChart days={30} />
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg overflow-hidden">
                <MarketplacePerformanceChart />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg overflow-hidden">
                <ProfitMarginCard />
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg overflow-hidden">
                <InventoryHealthWidget />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6 mb-8">
            <MetricCard
              icon={ShoppingBag}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-50"
              label="Toplam Sipariş"
              value={stats?.orders.toString() || '0'}
              trend="↗ 12%" // Static for now as API doesn't return trend yet
              trendColor="text-green-600"
              onClick={() => setShowOrdersModal(true)}
              borderColor="border-blue-200"
            />
            <MetricCard
              icon={AlertTriangle}
              iconColor="text-yellow-600"
              iconBgColor="bg-yellow-50"
              label="İadeler"
              value={stats?.returns?.toString() || '0'}
              statusLabel={stats?.returns && stats.returns > 0 ? 'Aksiyon Gerekli' : 'Sağlıklı'}
              variant={stats?.returns && stats.returns > 0 ? 'warning' : 'default'}
              onClick={() => setShowLowStockModal(true)}
              borderColor="border-yellow-200"
            />
            <MetricCard
              icon={Tag}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-50"
              label="Toplam Gelir"
              value={`₺${stats?.revenue.toLocaleString('tr-TR')}` || '₺0'}
              statusLabel="Son 30 Gün"
              onClick={() => setShowPriceChangesModal(true)}
              borderColor="border-purple-200"
            />
            <MetricCard
              icon={RefreshCw}
              iconColor="text-green-600"
              iconBgColor="bg-green-50"
              label="Tahmini Kâr"
              value={`₺${stats?.profit.toLocaleString('tr-TR')}` || '₺0'}
              statusLabel="+25% Margin"
              onClick={() => setShowSyncStatusModal(true)}
              borderColor="border-green-200"
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left column - 2/3 width */}
            <div className="col-span-2 space-y-6">
              {/* Recent Activity */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Son Aktiviteler</h2>
                  </div>
                  <button
                    onClick={() => onNavigate('orders')}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 transition-colors"
                  >
                    Tümünü Gör
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {mappedActivities.map((activity: any) => (
                    <div
                      key={activity.id}
                      onClick={() => setSelectedActivity(activity)}
                      className="flex items-center gap-4 p-4 bg-white/50 hover:bg-white/80 rounded-xl border border-white/60 cursor-pointer transition-all hover:shadow-md group"
                    >
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <ShoppingBag className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                        <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                      </div>
                      <span className="text-xs text-gray-400">{activity.time}</span>
                    </div>
                  ))}
                  {mappedActivities.length === 0 && (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Henüz aktivite yok</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column - 1/3 width */}
            <div className="space-y-6">
              {/* Marketplaces */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Pazar Yerleri</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-white/60 hover:bg-white/80 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center overflow-hidden border border-orange-100 group-hover:scale-105 transition-transform">
                        <img
                          src={trendyolLogo}
                          alt="Trendyol"
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Trendyol</div>
                        <div className="text-xs text-gray-500">Aktif</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-green-600 font-medium">Bağlı</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-white/60 hover:bg-white/80 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center overflow-hidden border border-orange-100 group-hover:scale-105 transition-transform">
                        <img
                          src={hepsiburadaLogo}
                          alt="Hepsiburada"
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Hepsiburada</div>
                        <div className="text-xs text-gray-500">Aktif</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-green-600 font-medium">Bağlı</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('integrations')}
                  className="w-full mt-5 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Bağlantıları Yönet
                </button>
              </div>

              {/* AI Assistant Tips */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border-2 border-yellow-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">✨</span>
                  </div>
                  <h3 className="text-sm text-gray-900 font-medium">AI Asistan Önerileri</h3>
                </div>

                <div className="space-y-3">
                  {aiActions?.map((action: ActionItem) => (
                    <div
                      key={action.id}
                      className="bg-white rounded-lg p-3 border border-yellow-100"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div
                          className={`w-5 h-5 ${action.priority === 'critical' ? 'bg-red-50' : 'bg-purple-50'} rounded flex items-center justify-center flex-shrink-0 mt-0.5`}
                        >
                          {action.type === 'stock' ? (
                            <AlertTriangle
                              className={`w-3 h-3 ${action.priority === 'critical' ? 'text-red-600' : 'text-yellow-600'}`}
                            />
                          ) : action.type === 'price' ? (
                            <Tag className="w-3 h-3 text-purple-600" />
                          ) : (
                            <ShoppingBag className="w-3 h-3 text-blue-600" />
                          )}
                        </div>
                        <p className="text-xs text-gray-700 flex-1">
                          <span className="font-medium text-gray-900">{action.title}</span> -{' '}
                          {action.description}
                        </p>
                      </div>
                      <button
                        onClick={() => onNavigate(action.actionTarget)}
                        className="w-full px-3 py-1.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        {action.actionLabel}
                      </button>
                    </div>
                  ))}

                  {(!aiActions || aiActions.length === 0) && (
                    <p className="text-xs text-center text-gray-500 py-4">
                      Şu an için bekleyen bir aksiyon yok. Harikasın! 🚀
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right column - 1/3 width */}
            <div className="space-y-6">
              <MarketplaceHealthWidget />

              {/* Other panels can go here */}
            </div>
          </div>
        </main>
      </div>



      {/* Activity Detail Modal */}
      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      )}

      {/* Dashboard Modals */}
      {showOrdersModal && (
        <TodaysOrdersModal
          onClose={() => setShowOrdersModal(false)}
          onNavigate={onNavigate}
          setToastMessage={setToastMessage}
        />
      )}

      {showLowStockModal && (
        <LowStockAlertsModal
          onClose={() => setShowLowStockModal(false)}
          onNavigate={onNavigate}
          setToastMessage={setToastMessage}
        />
      )}

      {showPriceChangesModal && (
        <PriceChangesModal
          onClose={() => setShowPriceChangesModal(false)}
          onNavigate={onNavigate}
          setToastMessage={setToastMessage}
        />
      )}

      {showSyncStatusModal && (
        <SyncStatusModal
          onClose={() => setShowSyncStatusModal(false)}
          onNavigate={onNavigate}
          setToastMessage={setToastMessage}
          handleSyncChannels={handleSyncChannels}
        />
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl text-gray-900">Barkod Tara</h3>
              <button onClick={() => setShowBarcodeModal(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Upload File Area */}
            <div className="mb-4">
              <label
                htmlFor="barcode-upload"
                className="block w-full bg-gradient-to-br from-[#F5B800] to-[#E5A800] hover:from-[#E5A800] hover:to-[#D59900] rounded-lg p-6 cursor-pointer transition-all group border-2 border-transparent hover:border-[#D59900]"
              >
                <div className="flex flex-col items-center justify-center">
                  <Upload className="w-12 h-12 text-gray-900 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-sm text-gray-900 mb-1">QR/Barkod Görseli Yükle</p>
                  <p className="text-xs text-gray-700">Dosya seçmek veya sürükleyip bırakmak için tıklayın</p>
                </div>
                <input
                  id="barcode-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setToastMessage({
                        title: 'Görsel Yüklendi',
                        message: `${file.name} işleniyor...`,
                      });
                      setUploadedFile(file);
                      setTimeout(() => {
                        setShowBarcodeModal(false);
                        setToastMessage({
                          title: 'Ürün Bulundu',
                          message: 'SKU: BK-IP15PM-256 - iPhone 15 Pro Max',
                        });
                        setTimeout(() => setToastMessage(null), 3000);
                      }, 1500);
                    }
                  }}
                />
              </label>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-500">VEYA</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <div className="bg-gray-50 rounded-lg p-12 mb-6 flex flex-col items-center justify-center">
              <QrCode className="w-24 h-24 text-gray-300 mb-4" />
              <p className="text-sm text-gray-500 text-center">Barkodu çerçeve içine konumlandırın</p>
            </div>
            <input
              type="text"
              placeholder="Veya barkodu manuel girin..."
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm mb-4"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
            />

            {/* Validation Message */}
            {!barcodeInput.trim() && !uploadedFile && (
              <p className="text-xs text-orange-600 mb-4 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                Devam etmek için lütfen bir görsel yükleyin veya barkod girin
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBarcodeModal(false);
                  setBarcodeInput('');
                  setUploadedFile(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  if (barcodeInput.trim() || uploadedFile) {
                    setShowBarcodeModal(false);
                    setToastMessage({
                      title: 'Product Found',
                      message: 'SKU: BK-IP15PM-256 - iPhone 15 Pro Max',
                    });
                    setTimeout(() => setToastMessage(null), 3000);
                    setBarcodeInput('');
                    setUploadedFile(null);
                  }
                }}
                disabled={!barcodeInput.trim() && !uploadedFile}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm transition-colors ${barcodeInput.trim() || uploadedFile
                  ? 'bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                Ara
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stock In Modal */}
      {showQuickStockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl text-gray-900">Hızlı Stok Girişi</h3>
              <button onClick={() => setShowQuickStockModal(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Ürün SKU</label>
                <input
                  type="text"
                  placeholder="SKU kodunu girin..."
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Miktar</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Konum</label>
                <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm">
                  <option>Depo A</option>
                  <option>Depo B</option>
                  <option>Mağaza</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQuickStockModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  setShowQuickStockModal(false);
                  setToastMessage({
                    title: 'Stok Eklendi',
                    message: 'Envanter başarıyla güncellendi',
                  });
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="flex-1 px-4 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
              >
                Stok Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Detail Modal */}
      {showAIDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl text-gray-900">AI Stok Analizi</h3>
              </div>
              <button onClick={() => setShowAIDetailModal(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-100 rounded-lg p-5 mb-6">
              <h4 className="text-sm text-gray-900 mb-2">Acil Yeniden Sipariş Önerisi</h4>
              <p className="text-sm text-gray-700">
                <span className="font-medium">iPhone 15 Pro Max</span> günde 18 adet satılıyor.
                Mevcut stok (54 adet) yaklaşık 3 gün yetecek.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900 mb-1">Satış Hızı Artıyor</p>
                  <p className="text-xs text-gray-500">Geçen haftaya göre +%23</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900 mb-1">Tahmini Stok Bitişi</p>
                  <p className="text-xs text-gray-500">29 Aralık 2025 (3 gün)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900 mb-1">Önerilen Yeniden Sipariş</p>
                  <p className="text-xs text-gray-500">2 haftalık stok için 250 adet</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAIDetailModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm transition-colors"
              >
                Kapat
              </button>
              <button
                onClick={() => {
                  setShowAIDetailModal(false);
                  setToastMessage({
                    title: 'Sipariş Oluşturuldu',
                    message: '250 adet için satın alma siparişi başlatıldı',
                  });
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="flex-1 px-4 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
              >
                Yeniden Sipariş Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Channels Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl text-gray-900">Kanallar Senkronize Ediliyor</h3>
              {!isSyncing && (
                <button onClick={() => setShowSyncModal(false)}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-50 rounded flex items-center justify-center overflow-hidden border border-orange-100">
                    <img
                      src={trendyolLogo}
                      alt="Trendyol"
                      className="w-full h-full object-contain p-0.5"
                    />
                  </div>
                  <span className="text-sm text-gray-900">Trendyol</span>
                </div>
                {syncProgress >= 50 ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                )}
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-50 rounded flex items-center justify-center overflow-hidden border border-orange-100">
                    <img
                      src={hepsiburadaLogo}
                      alt="Hepsiburada"
                      className="w-full h-full object-contain p-0.5"
                    />
                  </div>
                  <span className="text-sm text-gray-900">Hepsiburada</span>
                </div>
                {syncProgress >= 100 ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : syncProgress >= 50 ? (
                  <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-200"></div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>İlerleme</span>
                <span>{syncProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-[#F5B800] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${syncProgress}%` }}
                ></div>
              </div>
            </div>

            {!isSyncing && (
              <button
                onClick={() => {
                  setShowSyncModal(false);
                  setToastMessage({
                    title: 'Senkronizasyon Tamamlandı',
                    message: 'Tüm pazaryerleri başarıyla senkronize edildi',
                  });
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="w-full px-4 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
              >
                Tamam
              </button>
            )}

            {isSyncing && (
              <p className="text-sm text-gray-500 text-center">Envanter verileri senkronize ediliyor...</p>
            )}
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toastMessage && (
        <ToastV2
          title={toastMessage.title}
          message={toastMessage.message}
          isVisible={!!toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Help Modal */}
      {showHelpModal && <HelpModal page="dashboard" onClose={() => setShowHelpModal(false)} />}
    </div>
  );
}
