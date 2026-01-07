import { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Package,
  RefreshCw,
  X,
  Sparkles,
} from 'lucide-react';
import {
  Notification,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  generateAIRecommendations,
} from '../services/notifications';
import { toast } from 'sonner';

interface ActionCenterProps {
  onNavigate: (screen: string) => void;
}

export function ActionCenter({ onNavigate }: ActionCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await getNotifications(10, false);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId: string | number) => {
    const success = await markNotificationAsRead(notificationId);
    if (success) {
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllNotificationsAsRead();
    if (success) {
      setNotifications([]);
      toast.success(`Tüm bildirimler okundu olarak işaretlendi`);
    }
  };

  const handleGenerateRecommendations = async () => {
    setIsGenerating(true);
    try {
      const recommendations = await generateAIRecommendations();
      if (recommendations.length > 0) {
        await loadNotifications();
        toast.success(`${recommendations.length} AI önerisi oluşturuldu`);
      } else {
        toast.info('Şu an için yeni öneri yok');
      }
    } catch (error) {
      toast.error('AI önerileri oluşturulamadı');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAction = (notification: Notification) => {
    if (notification.actionUrl) {
      const screen = notification.actionUrl.replace('/', '');
      onNavigate(screen);
      handleMarkAsRead(notification._id);
      setIsOpen(false);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'stock_alert':
        return <Package className="w-4 h-4" />;
      case 'order_update':
        return <RefreshCw className="w-4 h-4" />;
      case 'price_change':
        return <TrendingUp className="w-4 h-4" />;
      case 'ai_recommendation':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'medium':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'low':
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-700" />
              <h3 className="font-bold text-gray-900">Aksiyon Merkezi</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-spin" />
                <p className="text-sm text-gray-500">Yükleniyor...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">Tümü Tamamlandı!</p>
                <p className="text-xs text-gray-500">Şu an için bekleyen aksiyon yok</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${getPriorityColor(notification.priority)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${getPriorityColor(notification.priority)}`}
                      >
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-bold text-gray-900 leading-tight">
                            {notification.title}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification._id);
                            }}
                            className="flex-shrink-0 p-0.5 hover:bg-white rounded"
                          >
                            <X className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                          {notification.message}
                        </p>
                        {notification.actionUrl && (
                          <button
                            onClick={() => handleAction(notification)}
                            className="px-3 py-1 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 text-xs font-semibold rounded-lg transition-colors"
                          >
                            {notification.actionLabel || 'Aksiyona Geç'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 flex gap-2">
            <button
              onClick={handleGenerateRecommendations}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              AI Önerileri
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex-1 px-3 py-2 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Tümünü Okundu İşaretle
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
