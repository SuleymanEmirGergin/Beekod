import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Zap,
  Sparkles,
  X,
  Settings2,
  Trash2,
} from 'lucide-react';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  generateAIRecommendations,
  Notification,
} from '../services/notifications';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      const [notifs, count] = await Promise.all([getNotifications(10, true), getUnreadCount()]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string | number) => {
    const success = await markAsRead(id);
    if (success) loadData();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    loadData();
  };

  const handleGenerateAI = async () => {
    setLoading(true);
    try {
      await generateAIRecommendations();
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string, priority: string) => {
    const colorClass =
      priority === 'critical'
        ? 'text-red-500'
        : priority === 'high'
          ? 'text-orange-500'
          : 'text-blue-500';

    switch (type) {
      case 'stock_alert':
        return <AlertTriangle className={`w-4 h-4 ${colorClass}`} />;
      case 'order_update':
        return <CheckCircle2 className={`w-4 h-4 ${colorClass}`} />;
      case 'ai_recommendation':
        return <Sparkles className={`w-4 h-4 text-purple-500`} />;
      case 'message':
        return <MessageSquare className={`w-4 h-4 ${colorClass}`} />;
      default:
        return <Bell className={`w-4 h-4 ${colorClass}`} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all ${isOpen ? 'bg-amber-100 text-[#F5B800]' : 'text-gray-500 hover:bg-gray-100'}`}
      >
        <Bell className="w-6 h-6" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Bildirim Merkezi</h3>
                <p className="text-[10px] text-gray-500 font-medium">
                  {unreadCount} okunmamış mesajınız var
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleMarkAllRead}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-all tooltip"
                  title="Tümünü oku"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleGenerateAI}
                  disabled={loading}
                  className={`p-1.5 ${loading ? 'text-purple-300' : 'text-purple-500 hover:text-purple-700'} rounded-lg hover:bg-white transition-all`}
                  title="AI Önerisi Al"
                >
                  <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`p-4 flex gap-3 transition-colors ${notif.isRead ? 'opacity-60' : 'bg-blue-50/30'}`}
                      onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                    >
                      <div className="mt-1 shrink-0">{getIcon(notif.type, notif.priority)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                        {notif.actionLabel && (
                          <a
                            href={notif.actionUrl}
                            className="mt-2 text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest inline-flex items-center gap-1"
                          >
                            {notif.actionLabel} <Zap className="w-3 h-3 fill-current" />
                          </a>
                        )}
                      </div>
                      {!notif.isRead && (
                        <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-1">Yeni Bildirim Yok</p>
                  <p className="text-xs text-gray-400">Her şey yolunda görünüyor!</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-50 text-center bg-gray-50/30">
              <button className="text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">
                TÜM BİLDİRİMLERİ GÖR
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
