import {
  RefreshCw,
  Settings as SettingsIcon,
  Bell,
  Eye,
  EyeOff,
  Link2,
  Info,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getIntegrations,
  getSyncLogs,
  connectIntegration,
  updateIntegrationConfig,
  triggerManualSync,
  Integration,
  SyncLog,
} from '../services/integrations';
import { SidebarV2 } from '../layouts/SidebarV2';
import { toast } from 'sonner';

import { Card } from '../components/shared/';
import { AppLogo } from '../components/shared/';
import trendyolLogo from 'figma:asset/1230e43a58a5ec2cbca646dd9964cda0a5eb57b2.png';
import hepsiburadaLogo from 'figma:asset/563328772dcd4f9d76dd21b5abc99b99a49e8f70.png';

interface IntegrationsScreenV2Props {
  onNavigate: (screen: string) => void;
  userName?: string;
}

export function IntegrationsScreenV2({ onNavigate, userName = 'BK' }: IntegrationsScreenV2Props) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [syncProducts, setSyncProducts] = useState(true);
  const [syncOrders, setSyncOrders] = useState(true);
  const [autoSyncFrequency, setAutoSyncFrequency] = useState('Every 15 Minutes');
  const [showLogSettings, setShowLogSettings] = useState(false);
  const [showConfigureModal, setShowConfigureModal] = useState(false);
  const [merchantId, setMerchantId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', message: '' });

  // Configure modal settings
  const [configSupplierId, setConfigSupplierId] = useState('TY-12345678');
  const [configApiSecret, setConfigApiSecret] = useState('••••••••••••••••••••');
  const [configWebhookUrl, setConfigWebhookUrl] = useState(
    'https://api.beekod.com/webhooks/trendyol',
  );
  const [configAutoPriceUpdates, setConfigAutoPriceUpdates] = useState(true);
  const [configStockNotifications, setConfigStockNotifications] = useState(true);
  const [configOrderAutoImport, setConfigOrderAutoImport] = useState(true);
  const [showConfigApiSecret, setShowConfigApiSecret] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New states for multi-marketplace connection
  const [showConnectModal, setShowConnectModal] = useState<string | null>(null);
  const [connectFields, setConnectFields] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  // React Query - Fetch Integrations
  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations'],
    queryFn: getIntegrations,
  });

  // React Query - Fetch Logs
  const { data: syncLogs = [] } = useQuery({
    queryKey: ['integration-logs'],
    queryFn: getSyncLogs,
  });

  // Helpers to get specific integration data
  const trendyol = integrations.find((i) => i.id === 'trendyol');
  const hepsiburada = integrations.find((i) => i.id === 'hepsiburada');
  const n11 = integrations.find((i) => i.id === 'n11');
  const pttavm = integrations.find((i) => i.id === 'pttavm');
  const pazarama = integrations.find((i) => i.id === 'pazarama');
  const ciceksepeti = integrations.find((i) => i.id === 'ciceksepeti');

  // Mutations
  const connectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => connectIntegration(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setConnectionSuccess(true);
      setTimeout(() => setConnectionSuccess(false), 2000);
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ id, config }: { id: string; config: any }) =>
      updateIntegrationConfig(id, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setSaveSuccess(true);
      setTimeout(() => {
        setShowConfigureModal(false);
        setSaveSuccess(false);
      }, 1500);
    },
  });

  const syncMutation = useMutation({
    mutationFn: (id?: string) => triggerManualSync(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-logs'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] }); // Update last sync time
      setShowToast(true);
      setToastMessage({
        title: 'Sync Complete',
        message: 'All data has been synchronized successfully.',
      });
      setTimeout(() => setShowToast(false), 3000);
    },
  });

  // Effect to load config into state when modal opens
  useEffect(() => {
    if (showConfigureModal && trendyol) {
      setConfigSupplierId(trendyol.config.supplierId || '');
      setConfigApiSecret(trendyol.config.apiSecret || '');
      setConfigWebhookUrl(trendyol.config.webhookUrl || '');
      setConfigAutoPriceUpdates(trendyol.config.autoPriceUpdates);
      setConfigStockNotifications(trendyol.config.stockNotifications);
      setConfigOrderAutoImport(trendyol.config.orderAutoImport);
    }
  }, [showConfigureModal, trendyol]);

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarV2
        activeItem="marketplace"
        onNavigate={onNavigate}
        userName="Ahmet Yılmaz"
        userEmail="Beekod Admin"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <button
                onClick={() => onNavigate('dashboard')}
                className="text-[#B8934D] hover:text-[#A07D3D] hover:underline"
              >
                Home
              </button>
              <span>/</span>
              <span className="text-gray-900">Integrations</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  syncMutation.mutate(undefined);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                {syncMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Sync Now
              </button>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-9 h-9 rounded-full bg-[#F5B800] flex items-center justify-center text-sm">
                {userName}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-8 py-8">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl text-gray-900 mb-2">Pazaryeri Entegrasyonları</h1>
            <p className="text-[#B8934D]">
              Toptan envanterinizi Trendyol, Hepsiburada ve diğer dış satış kanallarına bağlayın.
              API anahtarlarını yönetin, senkronizasyonları planlayın ve entegrasyon sağlığını izleyin.
            </p>
          </div>

          {/* Integration cards */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Trendyol - Connected */}
            <Card padding="lg">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-orange-100">
                  <img
                    src={trendyolLogo}
                    alt="Trendyol"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base text-gray-900">Trendyol</h3>
                    <div
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${trendyol?.connected ? 'bg-green-50' : 'bg-gray-50'}`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${trendyol?.connected ? 'bg-green-500' : 'bg-gray-400'}`}
                      ></div>
                      <span
                        className={`${trendyol?.connected ? 'text-green-700' : 'text-gray-600'}`}
                      >
                        {trendyol?.connected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Full inventory & order synchronization enabled.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-100">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Last Sync</div>
                  <div className="text-sm text-gray-900">{trendyol?.lastSync || 'Never'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Products Synced</div>
                  <div className="text-sm text-gray-900">{trendyol?.itemsSynced || 0}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowLogSettings(true)}
                  className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Log Settings
                </button>
                <button
                  onClick={() => setShowConfigureModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Configure
                </button>
              </div>
            </Card>

            {/* Hepsiburada - Disconnected */}
            <Card padding="lg">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-orange-100">
                  <img
                    src={hepsiburadaLogo}
                    alt="Hepsiburada"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base text-gray-900">Hepsiburada</h3>
                    <div
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${hepsiburada?.connected ? 'bg-green-50' : 'bg-gray-50'}`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${hepsiburada?.connected ? 'bg-green-500' : 'bg-gray-400'}`}
                      ></div>
                      <span
                        className={`${hepsiburada?.connected ? 'text-green-700' : 'text-gray-600'}`}
                      >
                        {hepsiburada?.connected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Connect your account to start syncing.</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Merchant ID</label>
                  <input
                    type="text"
                    placeholder="Örn: 123456"
                    value={merchantId}
                    onChange={(e) => setMerchantId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="••••••••••••••••"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 pr-10"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  connectMutation.mutate({
                    id: 'hepsiburada',
                    data: { merchantId, apiKey },
                  });
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
              >
                {connectMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                {connectionSuccess ? 'Connected' : 'Connect Account'}
              </button>
            </Card>

            {/* N11 */}
            <Card padding="lg">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-orange-100 italic font-black text-orange-600">
                  n11
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base text-gray-900">N11</h3>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${n11?.connected ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${n11?.connected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`${n11?.connected ? 'text-green-700' : 'text-gray-600'}`}>{n11?.connected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Asenkron ürün ve sipariş yönetimi.</p>
                </div>
              </div>
              <button
                onClick={() => setShowConnectModal('n11')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm transition-colors hover:bg-black"
              >
                {n11?.connected ? 'Ayarları Düzenle' : 'Bağla'}
              </button>
            </Card>

            {/* Pazarama */}
            <Card padding="lg">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-blue-100 italic font-black text-blue-600">
                  pzr
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base text-gray-900">Pazarama</h3>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${pazarama?.connected ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${pazarama?.connected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`${pazarama?.connected ? 'text-green-700' : 'text-gray-600'}`}>{pazarama?.connected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">İş Bankası iştiraki pazar yeri entegrasyonu.</p>
                </div>
              </div>
              <button
                onClick={() => setShowConnectModal('pazarama')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm transition-colors hover:bg-black"
              >
                {pazarama?.connected ? 'Ayarları Düzenle' : 'Bağla'}
              </button>
            </Card>

            {/* PTTAVM */}
            <Card padding="lg">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0 border border-yellow-100 italic font-black text-yellow-600">
                  ptt
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base text-gray-900">PTTAVM</h3>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${pttavm?.connected ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${pttavm?.connected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`${pttavm?.connected ? 'text-green-700' : 'text-gray-600'}`}>{pttavm?.connected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Kamu güvencesi ile hızlı entegrasyon.</p>
                </div>
              </div>
              <button
                onClick={() => setShowConnectModal('pttavm')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm transition-colors hover:bg-black"
              >
                {pttavm?.connected ? 'Ayarları Düzenle' : 'Bağla'}
              </button>
            </Card>

            {/* Çiçeksepeti */}
            <Card padding="lg">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0 border border-pink-100 italic font-black text-pink-600">
                  çs
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base text-gray-900">Çiçeksepeti</h3>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${ciceksepeti?.connected ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${ciceksepeti?.connected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`${ciceksepeti?.connected ? 'text-green-700' : 'text-gray-600'}`}>{ciceksepeti?.connected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Milyonlarca hediye gönderimine aracılık edin.</p>
                </div>
              </div>
              <button
                onClick={() => setShowConnectModal('ciceksepeti')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm transition-colors hover:bg-black"
              >
                {ciceksepeti?.connected ? 'Ayarları Düzenle' : 'Bağla'}
              </button>
            </Card>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mt-12 mb-6">E-Ticaret Entegrasyonları</h2>
          <div className="grid grid-cols-3 gap-6 mb-12">
            {/* Shopify */}
            <Card padding="lg">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 border border-green-100 italic font-black text-green-600">
                  sh
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base text-gray-900">Shopify</h3>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-gray-50">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                      <span className="text-gray-600">Disconnected</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Kendi web sitenizi Beekod ile güçlendirin.</p>
                </div>
              </div>
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm transition-colors hover:bg-black"
              >
                Bağla
              </button>
            </Card>

            {/* WooCommerce */}
            <Card padding="lg">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 border border-purple-100 italic font-black text-purple-600">
                  wc
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base text-gray-900">WooCommerce</h3>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-gray-50">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                      <span className="text-gray-600">Disconnected</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Wordpress sitemizle tam senkronizasyon.</p>
                </div>
              </div>
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm transition-colors hover:bg-black"
              >
                Bağla
              </button>
            </Card>
          </div>

          {/* Synchronization Preferences */}
          <Card padding="lg" className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <AppLogo size={40} />
                <h2 className="text-base text-gray-900">Synchronization Preferences</h2>
              </div>
              <span className="text-xs text-[#B8934D] uppercase tracking-wider">
                Global Settings
              </span>
            </div>

            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm text-gray-900 mb-0.5">Sync Products</div>
                    <div className="text-xs text-gray-500">Stock levels & prices</div>
                  </div>
                  <button
                    onClick={() => {
                      setSyncProducts(!syncProducts);
                      setShowToast(true);
                      setToastMessage({
                        title: !syncProducts ? 'Product Sync Enabled' : 'Product Sync Disabled',
                        message: !syncProducts
                          ? 'Products will now sync automatically.'
                          : 'Product syncing has been disabled.',
                      });
                      setTimeout(() => setShowToast(false), 3000);
                    }}
                    className="relative"
                  >
                    <div
                      className={`w-11 h-6 rounded-full transition-colors duration-200 ${syncProducts ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${syncProducts ? 'translate-x-5' : ''}`}
                    ></div>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm text-gray-900 mb-0.5">Sync Orders</div>
                    <div className="text-xs text-gray-500">Import new orders</div>
                  </div>
                  <button
                    onClick={() => {
                      setSyncOrders(!syncOrders);
                      setShowToast(true);
                      setToastMessage({
                        title: !syncOrders ? 'Order Sync Enabled' : 'Order Sync Disabled',
                        message: !syncOrders
                          ? 'Orders will now sync automatically.'
                          : 'Order syncing has been disabled.',
                      });
                      setTimeout(() => setShowToast(false), 3000);
                    }}
                    className="relative"
                  >
                    <div
                      className={`w-11 h-6 rounded-full transition-colors duration-200 ${syncOrders ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${syncOrders ? 'translate-x-5' : ''}`}
                    ></div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-900 mb-2">Auto-Sync Frequency</label>
                <select
                  value={autoSyncFrequency}
                  onChange={(e) => {
                    setAutoSyncFrequency(e.target.value);
                    setShowToast(true);
                    setToastMessage({
                      title: 'Sync Frequency Updated',
                      message: `Auto-sync set to ${e.target.value.toLowerCase()}.`,
                    });
                    setTimeout(() => setShowToast(false), 3000);
                  }}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-300"
                >
                  <option>Every 15 Minutes</option>
                  <option>Every 30 Minutes</option>
                  <option>Every Hour</option>
                  <option>Manual Only</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Sync Logs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base text-gray-900">Sync Logs</h2>
              <a href="#" className="text-sm text-[#B8934D] hover:text-[#A07D3D]">
                View All History
              </a>
            </div>

            <Card padding="sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs text-[#B8934D] px-4 py-3 uppercase tracking-wider">
                      Marketplace
                    </th>
                    <th className="text-left text-xs text-[#B8934D] px-4 py-3 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="text-left text-xs text-[#B8934D] px-4 py-3 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left text-xs text-[#B8934D] px-4 py-3 uppercase tracking-wider">
                      Records
                    </th>
                    <th className="text-left text-xs text-[#B8934D] px-4 py-3 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="text-left text-xs text-[#B8934D] px-4 py-3 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {syncLogs.map((log, index) => (
                    <tr key={index} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-orange-50 flex items-center justify-center overflow-hidden border border-orange-100">
                            <img
                              src={trendyolLogo}
                              alt={log.marketplace}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="text-sm text-gray-900">{log.marketplace}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">{log.action}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-2 h-2 rounded-full ${log.status === 'Success' ? 'bg-green-500' : log.status === 'Warning' ? 'bg-orange-500' : 'bg-red-500'}`}
                          ></div>
                          <span
                            className={`text-sm ${log.status === 'Success' ? 'text-green-700' : log.status === 'Warning' ? 'text-orange-700' : 'text-red-700'}`}
                          >
                            {log.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#B8934D]">{log.records}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">{log.time}</td>
                      <td className="px-4 py-4">
                        <button className="p-1.5 hover:bg-gray-50 rounded transition-colors">
                          <Info className="w-4 h-4 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </main>
      </div>

      {/* Floating Chat Button */}
      

      {/* Dynamic Connect Modal for SaaS Auth */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200 dark:border-neutral-800">
            <div className="px-8 py-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white uppercase tracking-tight">{showConnectModal} BAĞLANTISI</h2>
                <p className="text-xs text-neutral-500">SaaS Kimlik Bilgileri (AES-256 Şifreli)</p>
              </div>
              <button onClick={() => setShowConnectModal(null)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {showConnectModal === 'n11' && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 mb-2 uppercase tracking-widest">App Key</label>
                    <input type="text" onChange={(e) => setConnectFields({ ...connectFields, appKey: e.target.value })} className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl focus:ring-2 ring-amber-500" placeholder="Ex: e617-..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 mb-2 uppercase tracking-widest">App Secret</label>
                    <input type="password" onChange={(e) => setConnectFields({ ...connectFields, appSecret: e.target.value })} className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl focus:ring-2 ring-amber-500" placeholder="••••••••" />
                  </div>
                </>
              )}

              {showConnectModal === 'pttavm' && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 mb-2 uppercase tracking-widest">Kullanıcı Adı</label>
                    <input type="text" onChange={(e) => setConnectFields({ ...connectFields, username: e.target.value })} className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl focus:ring-2 ring-amber-500" placeholder="Ex: info@store.com" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 mb-2 uppercase tracking-widest">Şifre</label>
                    <input type="password" onChange={(e) => setConnectFields({ ...connectFields, password: e.target.value })} className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl focus:ring-2 ring-amber-500" placeholder="••••••••" />
                  </div>
                </>
              )}

              {showConnectModal === 'pazarama' && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 mb-2 uppercase tracking-widest">Client ID</label>
                    <input type="text" onChange={(e) => setConnectFields({ ...connectFields, clientId: e.target.value })} className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl focus:ring-2 ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 mb-2 uppercase tracking-widest">Client Secret</label>
                    <input type="password" onChange={(e) => setConnectFields({ ...connectFields, clientSecret: e.target.value })} className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl focus:ring-2 ring-amber-500" />
                  </div>
                </>
              )}

              {showConnectModal === 'ciceksepeti' && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 mb-2 uppercase tracking-widest">API Key</label>
                    <input type="text" onChange={(e) => setConnectFields({ ...connectFields, apiKey: e.target.value })} className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl focus:ring-2 ring-amber-500" />
                  </div>
                </>
              )}

              <button
                disabled={connectMutation.isPending}
                onClick={() => {
                  connectMutation.mutate({ id: showConnectModal, data: { ...connectFields } }, {
                    onSuccess: () => {
                      setShowConnectModal(null);
                      setConnectFields({});
                      toast.success(`${showConnectModal} başarıyla bağlandı!`);
                    }
                  });
                }}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {connectMutation.isPending ? <Loader2 className="animate-spin" /> : <Link2 size={20} />}
                GÜVENLİ ŞEKİLDE BAĞLA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Settings Modal */}
      {showLogSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center overflow-hidden border border-orange-100">
                  <img
                    src={trendyolLogo}
                    alt="Trendyol"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div>
                  <h2 className="text-lg text-gray-900">Trendyol Sync Logs</h2>
                  <p className="text-xs text-gray-500">Recent synchronization activity</p>
                </div>
              </div>
              <button
                onClick={() => setShowLogSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="space-y-4">
                {syncLogs.slice(0, 20).map((log: SyncLog) => (
                  <div
                    key={log.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-[#B8934D] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {log.status === 'Success' ? (
                          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm text-gray-900">{log.action}</h3>
                          <p className="text-xs text-gray-500">{log.details}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {log.time}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600 mt-3 pt-3 border-t border-gray-100">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                        {log.records}
                      </span>
                      <span className="text-gray-500">
                        {log.duration ? `Duration: ${log.duration}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configure Modal */}
      {showConfigureModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center overflow-hidden border border-orange-100">
                  <img
                    src={trendyolLogo}
                    alt="Trendyol"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div>
                  <h2 className="text-lg text-gray-900">Trendyol Yapılandırması</h2>
                  <p className="text-xs text-gray-500">Entegrasyon ayarlarını yönetin</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigureModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {/* Success Message */}
              {saveSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-green-900">Ayarlar Başarıyla Kaydedildi!</div>
                    <div className="text-xs text-green-600">
                      Trendyol yapılandırmanız güncellendi.
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* API Settings */}
                <div>
                  <h3 className="text-sm text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center">
                      <SettingsIcon className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    API Ayarları
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Supplier ID</label>
                      <input
                        type="text"
                        value={configSupplierId}
                        onChange={(e) => setConfigSupplierId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#B8934D]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">API Secret</label>
                      <div className="relative">
                        <input
                          type={showConfigApiSecret ? 'text' : 'password'}
                          value={configApiSecret}
                          onChange={(e) => setConfigApiSecret(e.target.value)}
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#B8934D] pr-10"
                        />
                        <button
                          onClick={() => setShowConfigApiSecret(!showConfigApiSecret)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfigApiSecret ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Webhook URL</label>
                      <input
                        type="text"
                        value={configWebhookUrl}
                        onChange={(e) => setConfigWebhookUrl(e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#B8934D]"
                      />
                    </div>
                  </div>
                </div>

                {/* Sync Preferences */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-sm text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-50 rounded flex items-center justify-center">
                      <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    Senkronizasyon Tercihleri
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-900">Auto Price Updates</div>
                        <div className="text-xs text-gray-500">
                          Automatically sync price changes
                        </div>
                      </div>
                      <button
                        onClick={() => setConfigAutoPriceUpdates(!configAutoPriceUpdates)}
                        className="relative"
                      >
                        <div
                          className={`w-11 h-6 rounded-full transition-colors duration-200 ${configAutoPriceUpdates ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                        ></div>
                        <div
                          className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${configAutoPriceUpdates ? 'translate-x-5' : ''}`}
                        ></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-900">Stock Notifications</div>
                        <div className="text-xs text-gray-500">Alert on low stock items</div>
                      </div>
                      <button
                        onClick={() => setConfigStockNotifications(!configStockNotifications)}
                        className="relative"
                      >
                        <div
                          className={`w-11 h-6 rounded-full transition-colors duration-200 ${configStockNotifications ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                        ></div>
                        <div
                          className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${configStockNotifications ? 'translate-x-5' : ''}`}
                        ></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-900">Order Auto-Import</div>
                        <div className="text-xs text-gray-500">Import orders automatically</div>
                      </div>
                      <button
                        onClick={() => setConfigOrderAutoImport(!configOrderAutoImport)}
                        className="relative"
                      >
                        <div
                          className={`w-11 h-6 rounded-full transition-colors duration-200 ${configOrderAutoImport ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                        ></div>
                        <div
                          className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${configOrderAutoImport ? 'translate-x-5' : ''}`}
                        ></div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowConfigureModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={() => {
                      updateConfigMutation.mutate({
                        id: 'trendyol',
                        config: {
                          supplierId: configSupplierId,
                          apiSecret: configApiSecret,
                          webhookUrl: configWebhookUrl,
                          autoPriceUpdates: configAutoPriceUpdates,
                          stockNotifications: configStockNotifications,
                          orderAutoImport: configOrderAutoImport,
                        },
                      });
                    }}
                    className="flex-1 px-4 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {saveSuccess ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Kaydedildi!
                      </>
                    ) : (
                      'Ayarları Kaydet'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center overflow-hidden border border-orange-100">
                  <img
                    src={trendyolLogo}
                    alt="Trendyol"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div>
                  <h2 className="text-lg text-gray-900">Notifications</h2>
                  <p className="text-xs text-gray-500">Manage notification settings</p>
                </div>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-xl p-4 hover:border-[#B8934D] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-900">Product Update Success</h3>
                        <p className="text-xs text-gray-500">Updated pricing and stock levels</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      10:00 AM
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600 mt-3 pt-3 border-t border-gray-100">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">452 records</span>
                    <span className="text-gray-500">Duration: 2.3s</span>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 hover:border-[#B8934D] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-900">Order Import Success</h3>
                        <p className="text-xs text-gray-500">Imported new orders successfully</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      09:45 AM
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600 mt-3 pt-3 border-t border-gray-100">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">12 records</span>
                    <span className="text-gray-500">Duration: 1.1s</span>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 hover:border-[#B8934D] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-900">Product Update Success</h3>
                        <p className="text-xs text-gray-500">Bulk inventory sync completed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      09:30 AM
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600 mt-3 pt-3 border-t border-gray-100">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">328 records</span>
                    <span className="text-gray-500">Duration: 1.8s</span>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 hover:border-[#B8934D] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-900">Order Import Warning</h3>
                        <p className="text-xs text-gray-500">2 orders with missing address info</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      09:15 AM
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600 mt-3 pt-3 border-t border-gray-100">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">5 records</span>
                    <span className="text-gray-500">Duration: 0.9s</span>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 hover:border-[#B8934D] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-900">Product Update Success</h3>
                        <p className="text-xs text-gray-500">Category updates synced</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      09:00 AM
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600 mt-3 pt-3 border-t border-gray-100">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">156 records</span>
                    <span className="text-gray-500">Duration: 1.2s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 px-4 py-2 shadow-lg z-50">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-sm text-green-900">{toastMessage.title}</div>
            <div className="text-xs text-green-600">{toastMessage.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
