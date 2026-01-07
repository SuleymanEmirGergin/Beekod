import { AppLogo } from '../components/shared/';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Globe,
  Bot,
  Settings,
} from 'lucide-react';
import { Badge } from '../components/shared/';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeItem: string;
  onNavigate: (item: string) => void;
  userName?: string;
  userRole?: string;
  ordersBadge?: number;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  badge?: number | string;
}

export function Sidebar({ activeItem, onNavigate, userName, userRole, ordersBadge }: SidebarProps) {
  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, badge: ordersBadge },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'marketplace', label: 'Marketplace', icon: Globe },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, badge: 'NEW' },
  ];

  const integrationItems: MenuItem[] = [
    { id: 'products', label: 'Products', icon: Package },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'integrations', label: 'Integrations', icon: Globe },
    { id: 'ai-assistant-2', label: 'AI Assistant', icon: Bot },
  ];

  return (
    <div className="w-56 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo section */}
      <motion.div
        className="p-6 border-b border-gray-100"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <AppLogo size={40} />
          <div>
            <div className="text-gray-900">Beekod</div>
            <div className="text-xs text-gray-500">Wholesale Admin</div>
          </div>
        </div>
      </motion.div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {(activeItem === 'analytics' || activeItem === 'dashboard'
              ? menuItems
              : integrationItems
            ).map((item, index) => {
              const Icon = item.icon;
              const isActive = item.id === activeItem;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.05,
                    ease: 'easeOut',
                  }}
                  whileHover={{
                    x: 4,
                    transition: { duration: 0.2 },
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative ${
                    isActive ? 'bg-[#FFFBF0] text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 bg-[#FFFBF0] rounded-lg"
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                  <motion.div
                    className="relative z-10 flex items-center gap-3 w-full"
                    animate={{
                      scale: isActive ? 1 : 1,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 15,
                          delay: 0.3,
                        }}
                      >
                        <Badge variant="new">{item.badge}</Badge>
                      </motion.div>
                    )}
                  </motion.div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-gray-100">
        <motion.button
          onClick={() => onNavigate('settings')}
          whileHover={{
            x: 4,
            transition: { duration: 0.2 },
          }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </motion.button>
      </div>

      {/* User profile */}
      {userName && (
        <motion.div
          className="p-4 border-t border-gray-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F5B800] flex items-center justify-center text-sm text-white">
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-900 truncate">{userName}</div>
              <div className="text-xs text-gray-500 truncate">{userRole}</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
