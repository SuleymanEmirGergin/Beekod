import { X, Check, AlertCircle, Info, Gift } from 'lucide-react';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      type: 'success',
      icon: Check,
      title: 'Generation Completed',
      message: 'Your AI model design has been successfully generated.',
      time: '2 minutes ago',
      unread: true,
    },
    {
      id: 2,
      type: 'info',
      icon: Info,
      title: 'New Feature Available',
      message: 'Try our new height customization options in Model Designer!',
      time: '1 hour ago',
      unread: true,
    },
    {
      id: 3,
      type: 'promo',
      icon: Gift,
      title: 'Special Offer: 20% Off Tokens',
      message: 'Get 20% extra tokens on Pro Pack purchases. Limited time offer!',
      time: '3 hours ago',
      unread: true,
    },
    {
      id: 4,
      type: 'warning',
      icon: AlertCircle,
      title: 'Low Token Balance',
      message: 'You have 150 tokens remaining. Consider purchasing more credits.',
      time: '5 hours ago',
      unread: false,
    },
    {
      id: 5,
      type: 'info',
      icon: Info,
      title: 'System Update',
      message: 'Platform maintenance scheduled for Sunday 2 AM - 4 AM.',
      time: '1 day ago',
      unread: false,
    },
  ];

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-amber-600 bg-amber-50';
      case 'promo':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="absolute top-16 right-8 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-base text-gray-900">Notifications</h3>
          <p className="text-xs text-gray-500">
            You have {notifications.filter((n) => n.unread).length} unread notifications
          </p>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-[500px] overflow-y-auto">
        {notifications.map((notification) => {
          const Icon = notification.icon;
          return (
            <button
              key={notification.id}
              className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
                notification.unread ? 'bg-blue-50/30' : ''
              }`}
            >
              <div className="flex gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm text-gray-900">{notification.title}</h4>
                    {notification.unread && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2 mt-1.5"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{notification.message}</p>
                  <p className="text-xs text-gray-400">{notification.time}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <button className="w-full px-4 py-2 text-xs text-[#F5B800] hover:bg-[#F5B800] hover:text-gray-900 rounded-lg transition-colors">
          Mark All as Read
        </button>
      </div>
    </div>
  );
}
