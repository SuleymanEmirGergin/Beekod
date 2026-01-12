import {
  Bell,
  Check,
  Clock,
  Filter,
  Package,
  AlertTriangle,
  Info,
  CheckCircle,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { SidebarV2 } from '../layouts/SidebarV2';
import { Card } from '../components/shared/';

interface NotificationsScreenProps {
  onNavigate: (screen: string) => void;
}

// Mock Data
const initialNotifications = [
  {
    id: 1,
    title: 'Yeni Sipariş Alındı',
    message: 'TR-882194 nolu sipariş Ahmet Yılmaz tarafından oluşturuldu.',
    type: 'order',
    status: 'unread',
    time: '5 dakika önce',
    icon: Package,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: 2,
    title: 'Düşük Stok Uyarısı',
    message: '"Premium Deri Ceket" stok seviyesi kritik (3 adet kaldı).',
    type: 'alert',
    status: 'unread',
    time: '1 saat önce',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    id: 3,
    title: 'Sistem Güncellemesi',
    message: 'Beekod v2.4 güncellemesi başarıyla tamamlandı.',
    type: 'system',
    status: 'read',
    time: 'Dün, 14:30',
    icon: Info,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    id: 4,
    title: 'Ödeme Başarılı',
    message: 'TR-882190 siparişi için ödeme onaylandı.',
    type: 'success',
    status: 'read',
    time: 'Dün, 10:15',
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    id: 5,
    title: 'Müşteri Sorusu',
    message: 'Zeynep Çelik bir ürün hakkında soru sordu.',
    type: 'info',
    status: 'unread',
    time: '2 gün önce',
    icon: MessageCircle,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
];

function MessageCircle({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}

export function NotificationsScreen({ onNavigate }: NotificationsScreenProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'system'>('all');
  const [notifications, setNotifications] = useState(initialNotifications);

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return n.status === 'unread';
    if (activeTab === 'system') return n.type === 'system' || n.type === 'alert';
    return true;
  });

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, status: 'read' as const } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, status: 'read' as const })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarV2
        activeItem="notifications"
        onNavigate={onNavigate}
        userName="Ahmet Yılmaz"
        userEmail="Beekod Admin"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bildirim Merkezi</h1>
                <p className="text-xs text-gray-500 font-medium">Tüm güncellemeler ve uyarılar</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Check className="w-4 h-4" />
                Tümünü Okundu İşaretle
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
          {/* Tabs */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                activeTab === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                activeTab === 'unread' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Okunmamış
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                activeTab === 'system' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Sistem
            </button>
          </div>

          <div className="space-y-4">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <div 
                    key={notification.id} 
                    className={`bg-white p-5 rounded-2xl border transition-all hover:shadow-md group ${
                      notification.status === 'unread' 
                        ? 'border-l-4 border-l-indigo-500 border-y-gray-100 border-r-gray-100 shadow-sm' 
                        : 'border-gray-100 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${notification.bg} ${notification.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-bold text-gray-900 ${notification.status === 'unread' ? 'text-base' : 'text-sm'}`}>
                            {notification.title}
                          </h3>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {notification.time}
                          </span>
                        </div>
                        <p className={`text-gray-600 leading-relaxed ${notification.status === 'unread' ? 'text-sm font-medium' : 'text-sm'}`}>
                          {notification.message}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {notification.status === 'unread' && (
                          <button 
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Okundu İşaretle"
                          >
                            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                          </button>
                        )}
                        <button 
                           onClick={() => deleteNotification(notification.id)}
                           className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                           title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Bildirim Yok</h3>
                <p className="text-gray-500">Şu anda görüntülenecek bildirim bulunmuyor.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
