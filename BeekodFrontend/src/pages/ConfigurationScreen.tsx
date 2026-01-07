import {
  Bell,
  Globe,
  Lock,
  Palette,
  Database,
  Zap,
  Check,
  Save,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getConfig, updateConfig, Configuration } from '../services/config';
import { SidebarV2 } from '../layouts/SidebarV2';
import { ChatWidget } from '../components/ChatWidget';
import { Card } from '../components/shared/';
import { AppLogo } from '../components/shared/';

interface ConfigurationScreenProps {
  onNavigate: (screen: string) => void;
  userName?: string;
  onThemeChange?: (theme: string) => void;
}

export function ConfigurationScreen({
  onNavigate,
  userName = 'BK',
  onThemeChange,
}: ConfigurationScreenProps) {
  // General Settings
  const [companyName, setCompanyName] = useState('Beekod Wholesale');
  const [timezone, setTimezone] = useState('Europe/Istanbul');
  const [currency, setCurrency] = useState('TRY');
  const [language, setLanguage] = useState('Turkish');

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [stockAlerts, setStockAlerts] = useState(true);
  const [marketplaceUpdates, setMarketplaceUpdates] = useState(false);

  // Security Settings
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [ipWhitelist, setIpWhitelist] = useState(false);

  // Appearance Settings
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('beekod-theme') || 'Light';
  });
  const [compactMode, setCompactMode] = useState(false);
  const [showAnimations, setShowAnimations] = useState(true);

  // Data Settings
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('Daily');
  const [dataRetention, setDataRetention] = useState('12');

  // Synchronization Settings
  const [syncProducts, setSyncProducts] = useState(true);
  const [syncOrders, setSyncOrders] = useState(true);
  const [autoSyncFrequency, setAutoSyncFrequency] = useState('Every 15 Minutes');

  // AI Assistant Settings
  const [aiTone, setAiTone] = useState('friendly');
  const [aiDetail, setAiDetail] = useState('summary');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'general' | 'notifications' | 'security' | 'appearance' | 'data' | 'sync' | 'ai'
  >('general');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await getConfig();
      if (config) {
        setCompanyName(config.company?.name ?? 'Beekod Wholesale');
        setTimezone(config.company?.timezone ?? 'Europe/Istanbul');
        setCurrency(config.company?.currency ?? 'TRY');
        setLanguage(config.company?.language ?? 'Turkish');

        setEmailNotifications(config.notifications?.email ?? true);
        setOrderNotifications(config.notifications?.order ?? true);
        setStockAlerts(config.notifications?.stock ?? true);
        setMarketplaceUpdates(config.notifications?.marketplace ?? false);

        setTwoFactorAuth(config.security?.twoFactorAuth ?? false);
        setSessionTimeout(config.security?.sessionTimeout ?? '30');
        setIpWhitelist(config.security?.ipWhitelist ?? false);

        setCompactMode(config.appearance?.compactMode ?? false);
        setShowAnimations(config.appearance?.showAnimations ?? true);

        if (config.appearance?.theme) {
          setTheme(config.appearance.theme);
          if (onThemeChange) onThemeChange(config.appearance.theme);
        }

        setAutoBackup(config.data?.autoBackup ?? true);
        setBackupFrequency(config.data?.backupFrequency ?? 'Daily');
        setDataRetention(config.data?.dataRetention ?? '12');

        setSyncProducts(config.sync?.products ?? true);
        setSyncOrders(config.sync?.orders ?? true);
        setAutoSyncFrequency(config.sync?.autoSyncFrequency ?? 'Every 15 Minutes');
      }
    } catch (error) {
      console.error('Failed to load config', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('beekod-theme', newTheme);
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const newConfig: Partial<Configuration> = {
        company: { name: companyName, timezone, currency, language },
        notifications: {
          email: emailNotifications,
          order: orderNotifications,
          stock: stockAlerts,
          marketplace: marketplaceUpdates,
        },
        security: { twoFactorAuth, sessionTimeout, ipWhitelist },
        appearance: { theme, compactMode, showAnimations },
        data: { autoBackup, backupFrequency, dataRetention },
        sync: { products: syncProducts, orders: syncOrders, autoSyncFrequency },
      };
      await updateConfig(newConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save config', error);
      alert('Failed to save settings');
    }
  };

  const tabs = [
    { id: 'general', label: 'Genel', icon: Globe },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
    { id: 'security', label: 'Güvenlik', icon: Lock },
    { id: 'appearance', label: 'Görünüm', icon: Palette },
    { id: 'data', label: 'Veri & Yedekleme', icon: Database },
    { id: 'sync', label: 'Senkronizasyon', icon: Zap },
    { id: 'ai', label: 'AI Asistanı', icon: Sparkles },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <SidebarV2
        activeItem="configuration"
        onNavigate={onNavigate}
        userName="Ahmet Yılmaz"
        userEmail="Beekod Admin"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <button
                onClick={() => onNavigate('dashboard')}
                className="text-[#B8934D] hover:text-[#A07D3D] hover:underline"
              >
                Ana Sayfa
              </button>
              <span>/</span>
              <span className="text-gray-900 dark:text-white">Ayarlar</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSaveSettings}
                className="flex items-center gap-2 px-4 py-2 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Kaydedildi!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Değişiklikleri Kaydet
                  </>
                )}
              </button>
              <div className="w-9 h-9 rounded-full bg-[#F5B800] flex items-center justify-center text-sm">
                BK
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-8 py-8">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl text-gray-900 dark:text-white mb-2">Ayarlar</h1>
            <p className="text-[#B8934D]">
              Hesap ayarlarınızı, tercihlerinizi ve sistem yapılandırmanızı yönetin.
            </p>
          </div>

          {/* Success Message */}
          {saveSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-green-900">Ayarlar Başarıyla Kaydedildi!</div>
                <div className="text-xs text-green-600">Yapılandırmanız güncellendi.</div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${activeTab === tab.id
                    ? 'border-[#F5B800] text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <Card padding="lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base text-gray-900">Şirket Bilgileri</h2>
                    <p className="text-xs text-gray-500">İşletmeniz hakkında temel detaylar</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Şirket Adı</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#F5B800]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Saat Dilimi</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#F5B800]"
                    >
                      <option value="Europe/Istanbul">Europe/Istanbul (GMT+3)</option>
                      <option value="Europe/London">Europe/London (GMT+0)</option>
                      <option value="America/New_York">America/New York (GMT-5)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Para Birimi</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#F5B800]"
                    >
                      <option value="TRY">Türk Lirası (₺)</option>
                      <option value="USD">ABD Doları ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">İngiliz Sterlini (£)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Dil</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#F5B800]"
                    >
                      <option value="Turkish">Türkçe</option>
                      <option value="English">English</option>
                      <option value="German">Deutsch</option>
                      <option value="French">Français</option>
                    </select>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-base text-gray-900">Bildirim Tercihleri</h2>
                  <p className="text-xs text-gray-500">Nasıl haberdar olmak istediğinizi seçin</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <div className="text-sm text-gray-900 mb-0.5">E-posta Bildirimleri</div>
                    <div className="text-xs text-gray-500">Güncellemeleri ve uyarıları e-posta ile al</div>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className="relative"
                  >
                    <div
                      className={`w-11 h-6 rounded-full transition-colors duration-200 ${emailNotifications ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${emailNotifications ? 'translate-x-5' : ''}`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <div className="text-sm text-gray-900 mb-0.5">Sipariş Bildirimleri</div>
                    <div className="text-xs text-gray-500">Yeni siparişlerden haberdar ol</div>
                  </div>
                  <button
                    onClick={() => setOrderNotifications(!orderNotifications)}
                    className="relative"
                  >
                    <div
                      className={`w-11 h-6 rounded-full transition-colors duration-200 ${orderNotifications ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${orderNotifications ? 'translate-x-5' : ''}`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <div className="text-sm text-gray-900 mb-0.5">Stok Uyarıları</div>
                    <div className="text-xs text-gray-500">Stok azaldığında uyarı ver</div>
                  </div>
                  <button onClick={() => setStockAlerts(!stockAlerts)} className="relative">
                    <div
                      className={`w-11 h-6 rounded-full transition-colors duration-200 ${stockAlerts ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${stockAlerts ? 'translate-x-5' : ''}`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm text-gray-900 mb-0.5">Pazar Yeri Güncellemeleri</div>
                    <div className="text-xs text-gray-500">Bağlı pazar yerlerinden güncellemeler</div>
                  </div>
                  <button
                    onClick={() => setMarketplaceUpdates(!marketplaceUpdates)}
                    className="relative"
                  >
                    <div
                      className={`w-11 h-6 rounded-full transition-colors duration-200 ${marketplaceUpdates ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${marketplaceUpdates ? 'translate-x-5' : ''}`}
                    ></div>
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-base text-gray-900">Güvenlik Ayarları</h2>
                  <p className="text-xs text-gray-500">Hesabınızı güvende tutun</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <div className="text-sm text-gray-900 mb-0.5">İki Faktörlü Doğrulama</div>
                    <div className="text-xs text-gray-500">Ekstra güvenlik katmanı ekleyin</div>
                  </div>
                  <button onClick={() => setTwoFactorAuth(!twoFactorAuth)} className="relative">
                    <div
                      className={`w-11 h-6 rounded-full transition-colors duration-200 ${twoFactorAuth ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${twoFactorAuth ? 'translate-x-5' : ''}`}
                    ></div>
                  </button>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Oturum Zaman Aşımı (dakika)
                  </label>
                  <select
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#F5B800]"
                  >
                    <option value="15">15 dakika</option>
                    <option value="30">30 dakika</option>
                    <option value="60">1 saat</option>
                    <option value="120">2 saat</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm text-gray-900 mb-0.5">IP Beyaz Listesi</div>
                    <div className="text-xs text-gray-500">Sadece belirli IP adreslerine izin ver</div>
                  </div>
                  <button onClick={() => setIpWhitelist(!ipWhitelist)} className="relative">
                    <div
                      className={`w-11 h-6 rounded-full transition-colors duration-200 ${ipWhitelist ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${ipWhitelist ? 'translate-x-5' : ''}`}
                    ></div>
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h2 className="text-base text-gray-900">Görünüm Ayarları</h2>
                  <p className="text-xs text-gray-500">Beekod'un nasıl görüneceğini özelleştirin</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Tema</label>
                  <select
                    value={theme}
                    onChange={(e) => handleThemeChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#F5B800]"
                  >
                    <option value="Light">Açık</option>
                    <option value="Dark">Koyu</option>
                    <option value="Auto">Otomatik (Sistem)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <div className="text-sm text-gray-900 mb-0.5">Kompakt Mod</div>
                    <div className="text-xs text-gray-500">Daha fazla içerik için boşlukları azalt</div>
                  </div>
                  <button onClick={() => setCompactMode(!compactMode)} className="relative">
                    <div
                      className={`w-11 h-6 rounded-full transition-colors duration-200 ${compactMode ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${compactMode ? 'translate-x-5' : ''}`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm text-gray-900 mb-0.5">Animasyonları Göster</div>
                    <div className="text-xs text-gray-500">Akıcı geçişleri etkinleştir</div>
                  </div>
                  <button onClick={() => setShowAnimations(!showAnimations)} className="relative">
                    <div
                      className={`w-11 h-6 rounded-full transition-colors duration-200 ${showAnimations ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${showAnimations ? 'translate-x-5' : ''}`}
                    ></div>
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Data & Backup Settings */}
          {activeTab === 'data' && (
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <Database className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-base text-gray-900">Veri & Yedekleme</h2>
                  <p className="text-xs text-gray-500">Veri ve yedekleme ayarlarınızı yönetin</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <div className="text-sm text-gray-900 mb-0.5">Otomatik Yedekleme</div>
                    <div className="text-xs text-gray-500">Verilerinizi düzenli olarak yedekleyin</div>
                  </div>
                  <button onClick={() => setAutoBackup(!autoBackup)} className="relative">
                    <div
                      className={`w-11 h-6 rounded-full transition-colors duration-200 ${autoBackup ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${autoBackup ? 'translate-x-5' : ''}`}
                    ></div>
                  </button>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Yedekleme Sıklığı</label>
                  <select
                    value={backupFrequency}
                    onChange={(e) => setBackupFrequency(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#F5B800]"
                  >
                    <option value="Hourly">Saatlik</option>
                    <option value="Daily">Günlük</option>
                    <option value="Weekly">Haftalık</option>
                    <option value="Monthly">Aylık</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Veri Saklama Süresi (ay)
                  </label>
                  <select
                    value={dataRetention}
                    onChange={(e) => setDataRetention(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#F5B800]"
                  >
                    <option value="3">3 ay</option>
                    <option value="6">6 ay</option>
                    <option value="12">12 ay</option>
                    <option value="24">24 ay</option>
                    <option value="unlimited">Sınırsız (Unlimited)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    Şimdi Yedek Oluştur
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* AI Assistant Settings */}
          {activeTab === 'ai' && (
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-base text-gray-900">AI Asistan Tercihleri</h2>
                  <p className="text-xs text-gray-500">Beekod AI'nın sizinle nasıl konuşacağını özelleştirin</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Konuşma Tonu</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => setAiTone('professional')}
                      className={`px-4 py-3 rounded-lg border text-left transition-all ${aiTone === 'professional'
                        ? 'border-[#F5B800] bg-yellow-50 ring-1 ring-[#F5B800]'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="text-sm font-medium text-gray-900 mb-1">Profesyonel</div>
                      <div className="text-xs text-gray-500">Resmi ve kurumsal stil</div>
                    </button>
                    <button
                      onClick={() => setAiTone('friendly')}
                      className={`px-4 py-3 rounded-lg border text-left transition-all ${aiTone === 'friendly'
                        ? 'border-[#F5B800] bg-yellow-50 ring-1 ring-[#F5B800]'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="text-sm font-medium text-gray-900 mb-1">Arkadaş Canlısı ⚡</div>
                      <div className="text-xs text-gray-500">Samimi ve yardımsever</div>
                    </button>
                    <button
                      onClick={() => setAiTone('pirate')}
                      className={`px-4 py-3 rounded-lg border text-left transition-all ${aiTone === 'pirate'
                        ? 'border-[#F5B800] bg-yellow-50 ring-1 ring-[#F5B800]'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="text-sm font-medium text-gray-900 mb-1">Korsan 🏴‍☠️</div>
                      <div className="text-xs text-gray-500">Arrgh! Eğlence için!</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Detay Seviyesi</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => setAiDetail('summary')}
                      className={`px-4 py-3 rounded-lg border text-left transition-all ${aiDetail === 'summary'
                        ? 'border-[#F5B800] bg-yellow-50 ring-1 ring-[#F5B800]'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="text-sm font-medium text-gray-900 mb-1">Özet</div>
                      <div className="text-xs text-gray-500">Kısa ve öz cevaplar</div>
                    </button>
                    <button
                      onClick={() => setAiDetail('detailed')}
                      className={`px-4 py-3 rounded-lg border text-left transition-all ${aiDetail === 'detailed'
                        ? 'border-[#F5B800] bg-yellow-50 ring-1 ring-[#F5B800]'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="text-sm font-medium text-gray-900 mb-1">Detaylı</div>
                      <div className="text-xs text-gray-500">Kapsamlı açıklamalar</div>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-[#F5B800]" />
                    <span className="text-sm font-medium text-gray-900">İpucu</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Bot ile konuşarak da bu ayarları değiştirebilirsiniz! Şunu söylemeyi deneyin:
                    <span className="font-mono bg-gray-100 px-1 py-0.5 rounded mx-1">
                      /myprefs tone:pirate
                    </span>
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Synchronization Settings */}
          {activeTab === 'sync' && (
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-base text-gray-900">Senkronizasyon</h2>
                  <p className="text-xs text-gray-500">Veri senkronizasyon ayarlarınızı yönetin</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <div className="text-sm text-gray-900 mb-0.5">Ürünleri Senkronize Et</div>
                    <div className="text-xs text-gray-500">Ürün verilerini otomatik olarak senkronize et</div>
                  </div>
                  <button onClick={() => setSyncProducts(!syncProducts)} className="relative">
                    <div
                      className={`w-11 h-6 rounded-full transition-colors duration-200 ${syncProducts ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${syncProducts ? 'translate-x-5' : ''}`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <div className="text-sm text-gray-900 mb-0.5">Siparişleri Senkronize Et</div>
                    <div className="text-xs text-gray-500">Sipariş verilerini otomatik olarak senkronize et</div>
                  </div>
                  <button onClick={() => setSyncOrders(!syncOrders)} className="relative">
                    <div
                      className={`w-11 h-6 rounded-full transition-colors duration-200 ${syncOrders ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${syncOrders ? 'translate-x-5' : ''}`}
                    ></div>
                  </button>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Otomatik Senkronizasyon Sıklığı</label>
                  <select
                    value={autoSyncFrequency}
                    onChange={(e) => setAutoSyncFrequency(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#F5B800]"
                  >
                    <option value="Every 15 Minutes">Her 15 Dakikada Bir</option>
                    <option value="Every 30 Minutes">Her 30 Dakikada Bir</option>
                    <option value="Hourly">Saatlik</option>
                    <option value="Daily">Günlük</option>
                  </select>
                </div>
              </div>
            </Card>
          )}
        </main>
      </div>

      {/* Floating Chat Button */}
      <ChatWidget />
    </div>
  );
}
