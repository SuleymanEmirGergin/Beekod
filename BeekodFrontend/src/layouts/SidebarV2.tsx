import { AppLogo } from '../components/shared/';
import { ThemeToggle } from '../components/shared/ThemeToggle';
import {
  Activity,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Grid3x3,
  Bot,
  Users,
  Settings as SettingsIcon,
  Shirt,
  FileText,
  TrendingUp,
  Globe,
  Video,
  Store,
  MessageSquare,
  Zap,
  Calendar,
  PieChart,
  Truck,
  Megaphone,
} from 'lucide-react';
import { NotificationCenter } from '../components/NotificationCenter';

interface SidebarV2Props {
  activeItem: string;
  onNavigate: (screen: string) => void;
  userName?: string;
  userEmail?: string;
  tokenBalance?: number;
  onTokenClick?: () => void;
  ordersBadge?: number;
}

export function SidebarV2({
  activeItem,
  onNavigate,
  userName,
  userEmail,
  tokenBalance,
  onTokenClick,
  ordersBadge,
}: SidebarV2Props) {
  const mainMenuItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'inventory', label: 'Envanter', icon: Package },
    { id: 'orders', label: 'Siparişler', icon: ShoppingCart, badge: ordersBadge },
    { id: 'shipping', label: 'Kargo Yönetimi', icon: Truck },
    { id: 'discovery', label: 'Ürün Keşfi', icon: Zap, color: 'text-amber-500' },
    { id: 'marketplace-inventory', label: 'Pazaryeri Envanteri', icon: Package, color: 'text-blue-500' },
    { id: 'jobs', label: 'İşlem İzleme', icon: Activity, color: 'text-indigo-500' },
    { id: 'marketplace', label: 'Pazaryeri', icon: Grid3x3 },
    { id: 'marketplace-sync', label: 'Pazaryeri Senk.', icon: Store },
    { id: 'questions', label: 'Müşteri Soruları', icon: MessageSquare },
    { id: 'ai-chatbot', label: 'AI Chatbot', icon: Bot },
    { id: 'model-designer', label: 'Model Tasarımcısı', icon: Shirt },
    { id: 'invoices', label: 'Fatura İşlemleri', icon: FileText },
    { id: 'intelligence', label: 'Pazar İstihbaratı', icon: Globe },
    { id: 'revenue-optimization', label: 'Gelir Optimizasyonu', icon: TrendingUp },
    { id: 'video-designer', label: 'Video Tasarımcısı', icon: Video },
    { id: 'social-scheduler', label: 'Sosyal Planlayıcı', icon: Calendar },
    { id: 'campaigns', label: 'Kampanya Yönetimi', icon: Megaphone },
  ];

  const settingsItems = [
    { id: 'team', label: 'Ekip', icon: Users },
    { id: 'configuration', label: 'Yapılandırma', icon: SettingsIcon },
  ];

  return (
    <div className="w-52 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col transition-colors duration-300">
      {/* Logo section */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AppLogo size={32} />
          <span className="text-lg text-gray-900 font-bold dark:text-white">Beekod</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationCenter />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeItem;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative ${isActive
                  ? 'bg-[#FFFBF0] text-gray-900 border border-[#F5B800] shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? 'text-[#F5B800]' : ''}`}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span className={`flex-1 text-left ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
                {item.badge && (
                  <span className="px-2 py-0.5 bg-[#F5B800] text-gray-900 text-[10px] font-black rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Settings Section */}
        <div className="mt-8">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              AYARLAR
            </span>
          </div>
          <div className="space-y-1">
            {settingsItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeItem;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                    ? 'bg-[#FFFBF0] text-gray-900 border border-[#F5B800]'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? 'text-[#F5B800]' : ''}`}
                    strokeWidth={1.5}
                  />
                  <span className={`flex-1 text-left ${isActive ? 'font-bold' : ''}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User profile */}
      {userName && (
        <div className="p-4 border-t border-gray-100 space-y-3">
          {/* Token Balance */}
          {tokenBalance !== undefined && (
            <button
              onClick={onTokenClick}
              className="w-full bg-gradient-to-br from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 rounded-xl p-3 border border-amber-200 hover:border-amber-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-600">AI Kredileri</span>
                <div className="w-5 h-5 bg-gradient-to-br from-[#F5B800] to-[#E5A800] rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl text-gray-900">{tokenBalance.toLocaleString()}</span>
                <span className="text-xs text-gray-500">kredi</span>
              </div>
              <div className="mt-2 text-xs text-amber-700 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Kredi Satın Al
              </div>
            </button>
          )}

          {/* User Profile */}
          <button
            onClick={() => onNavigate('profile')}
            className="w-full flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center ring-2 ring-transparent group-hover:ring-[#F5B800] transition-all">
              <img
                src="https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMG1hbiUyMHN1aXR8ZW58MXx8fHwxNzY2NzYwMTYyfDA&ixlib=rb-4.1.0&q=80&w=400"
                alt={userName}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm text-gray-900">{userName}</div>
              <div className="text-xs text-gray-500 truncate">{userEmail}</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
