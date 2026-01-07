import { useEffect, useMemo, useState, createContext, useContext, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';

// Eager load critical screens
import LoginScreen from './pages/LoginScreen';
import { DashboardScreenV2 } from './pages/DashboardScreenV2';

// Lazy load heavy screens for better performance
const AnalyticsScreen = lazy(() => import('./pages/AnalyticsScreen').then(m => ({ default: m.AnalyticsScreen })));
const IntegrationsScreenV2 = lazy(() => import('./pages/IntegrationsScreenV2').then(m => ({ default: m.IntegrationsScreenV2 })));
const AccessPendingScreen = lazy(() => import('./pages/AccessPendingScreen').then(m => ({ default: m.AccessPendingScreen })));
const InventoryManagementScreen = lazy(() => import('./pages/InventoryManagementScreen').then(m => ({ default: m.InventoryManagementScreen })));
const DashboardScreenNew = lazy(() => import('./pages/DashboardScreenNew').then(m => ({ default: m.DashboardScreenNew })));
const OrdersListScreen = lazy(() => import('./pages/OrdersListScreen').then(m => ({ default: m.OrdersListScreen })));
const ProductManagementScreen = lazy(() => import('./pages/ProductManagementScreen').then(m => ({ default: m.ProductManagementScreen })));
const ProductEditScreen = lazy(() => import('./components/products/ProductEditScreen').then(m => ({ default: m.ProductEditScreen })));
const AIAssistantScreen = lazy(() => import('./pages/AIAssistantScreen').then(m => ({ default: m.AIAssistantScreen })));
const TeamScreen = lazy(() => import('./pages/TeamScreen').then(m => ({ default: m.TeamScreen })));
const ConfigurationScreen = lazy(() => import('./pages/ConfigurationScreen').then(m => ({ default: m.ConfigurationScreen })));
const ModelDesignerScreenV3 = lazy(() => import('./pages/ModelDesignerScreenV3').then(m => ({ default: m.ModelDesignerScreenV3 })));
const ProfileScreen = lazy(() => import('./pages/ProfileScreen').then(m => ({ default: m.ProfileScreen })));
const ProductQuestionsScreen = lazy(() => import('./pages/ProductQuestionsScreen').then(m => ({ default: m.ProductQuestionsScreen })));
const InvoiceListScreen = lazy(() => import('./pages/InvoiceListScreen').then(m => ({ default: m.InvoiceListScreen })));
const MarketIntelligenceScreen = lazy(() => import('./pages/MarketIntelligenceScreen').then(m => ({ default: m.MarketIntelligenceScreen })));
const VideoDesignerScreen = lazy(() => import('./pages/VideoDesignerScreen').then(m => ({ default: m.VideoDesignerScreen })));
const MarketplaceSyncScreen = lazy(() => import('./pages/MarketplaceSyncScreen').then(m => ({ default: m.MarketplaceSyncScreen })));
const SocialSchedulerScreen = lazy(() => import('./pages/SocialSchedulerScreen').then(m => ({ default: m.SocialSchedulerScreen })));
const FinancialAnalyticsScreen = lazy(() => import('./pages/FinancialAnalyticsScreen').then(m => ({ default: m.FinancialAnalyticsScreen })));
const RevenueOptimizationScreen = lazy(() => import('./pages/RevenueOptimizationScreen').then(m => ({ default: m.RevenueOptimizationScreen })));
const DiscoveryLandingScreen = lazy(() => import('./pages/DiscoveryLandingScreen').then(m => ({ default: m.DiscoveryLandingScreen })));
const MarketplaceInventoryScreen = lazy(() => import('./pages/MarketplaceInventoryScreen').then(m => ({ default: m.MarketplaceInventoryScreen })));
const JobMonitoringScreen = lazy(() => import('./pages/JobMonitoringScreen').then(m => ({ default: m.JobMonitoringScreen })));
const AuditLogScreen = lazy(() => import('./pages/AuditLogScreen').then(m => ({ default: m.AuditLogScreen })));
import { AssistantWidget } from './components/AI/AssistantWidget';
import { CommandK } from './components/shared/CommandK';

import { toast, Toaster } from 'sonner';

/** Eğer bu tipe ihtiyaç duyarsan: */
type SelectedProduct = { id: string; name: string; image: string; category: string };

/** Model Designer’a ürün seçimini taşımak için mini context (router state de olur, bu daha stabil) */
const SelectedProductContext = createContext<{
  selectedProductForModel: SelectedProduct | null;
  setSelectedProductForModel: (p: SelectedProduct | null) => void;
} | null>(null);

function useSelectedProduct() {
  const ctx = useContext(SelectedProductContext);
  if (!ctx) throw new Error('SelectedProductContext missing');
  return ctx;
}

/** Senin eski onNavigate stringlerini path’e çeviriyoruz (geriye dönük uyumluluk) */
const screenToPath: Record<string, string> = {
  login: '/login',
  analytics: '/analytics',
  integrations: '/integrations',
  marketplace: '/integrations',
  discovery: '/discovery',
  'manage-connections': '/integrations',
  pending: '/pending',
  inventory: '/inventory',
  dashboard: '/dashboard',
  dashboardV2: '/dashboard',
  orders: '/orders',
  products: '/products',
  'ai-chatbot': '/ai-assistant',
  'ai-assistant': '/ai-assistant',
  'ai-assistant-2': '/ai-assistant',
  stock: '/stock',
  team: '/team',
  configuration: '/configuration',
  'model-designer': '/model-designer',
  profile: '/profile',
  invoices: '/invoices',
  'ai-finance': '/ai-finance',
  intelligence: '/intelligence',
  'video-designer': '/video-designer',
  'marketplace-sync': '/marketplace-sync',
  'social-scheduler': '/social-scheduler',
  questions: '/questions',
  'revenue-optimization': '/revenue-optimization',
  'audit-logs': '/audit-logs',
  'marketplace-inventory': '/marketplace-inventory',
  jobs: '/jobs',
};

function useOnNavigate() {
  const navigate = useNavigate();
  return (screen: string) => {
    navigate(screenToPath[screen] ?? '/dashboard');
  };
}

/** Route wrapper’ları: mevcut screen component’lerini hiç değiştirmiyoruz */

function AnalyticsRoute() {
  const onNavigate = useOnNavigate();
  return <AnalyticsScreen onNavigate={onNavigate} />;
}

function IntegrationsRoute() {
  const onNavigate = useOnNavigate();
  return <IntegrationsScreenV2 onNavigate={onNavigate} />;
}

function PendingRoute() {
  const navigate = useNavigate();
  return <AccessPendingScreen onReturn={() => navigate('/login')} />;
}

function InventoryRoute() {
  const onNavigate = useOnNavigate();
  return <InventoryManagementScreen onNavigate={onNavigate} />;
}

function DiscoveryRoute() {
  const onNavigate = useOnNavigate();
  return <DiscoveryLandingScreen onNavigate={onNavigate} />;
}

const MarketplaceInventoryRoute = () => {
  const onNavigate = useOnNavigate();
  return <MarketplaceInventoryScreen onNavigate={onNavigate} />;
};

const JobMonitoringRoute = () => {
  const onNavigate = useOnNavigate();
  return <JobMonitoringScreen onNavigate={onNavigate} />;
};

function DashboardRoute() {
  const onNavigate = useOnNavigate();
  return <DashboardScreenNew onNavigate={onNavigate} />;
}

function OrdersRoute() {
  const onNavigate = useOnNavigate();
  return <OrdersListScreen onNavigate={onNavigate} />;
}

function ProductsRoute() {
  const onNavigate = useOnNavigate();
  return <ProductManagementScreen onNavigate={onNavigate} />;
}

function AIAssistantRoute() {
  const onNavigate = useOnNavigate();
  const navigate = useNavigate();
  const { setSelectedProductForModel } = useSelectedProduct();

  return (
    <AIAssistantScreen
      onNavigate={onNavigate}
      onSelectProductForModel={(product) => {
        setSelectedProductForModel(product);
        navigate('/model-designer');
      }}
    />
  );
}

function StockRoute() {
  const onNavigate = useOnNavigate();
  return <InventoryManagementScreen onNavigate={onNavigate} />;
}

function TeamRoute() {
  const onNavigate = useOnNavigate();
  return <TeamScreen onNavigate={onNavigate} />;
}

function ConfigurationRoute({ onThemeChange }: { onThemeChange: (t: string) => void }) {
  const onNavigate = useOnNavigate();
  return <ConfigurationScreen onNavigate={onNavigate} onThemeChange={onThemeChange} />;
}

function ModelDesignerRoute() {
  const onNavigate = useOnNavigate();
  // İstersen seçilen ürünü burada kullanırsın:
  // const { selectedProductForModel } = useSelectedProduct();
  return <ModelDesignerScreenV3 onNavigate={onNavigate} />;
}

const MarketplaceSyncRoute = ({ onNavigate }: { onNavigate: (s: string) => void }) => {
  useEffect(() => {
    onNavigate('marketplace-sync');
  }, []);
  return <MarketplaceSyncScreen onNavigate={onNavigate} />;
};

const SocialSchedulerRoute = ({ onNavigate }: { onNavigate: (s: string) => void }) => {
  useEffect(() => {
    onNavigate('social-scheduler');
  }, []);
  return <SocialSchedulerScreen onNavigate={onNavigate} />;
};

function ProfileRoute() {
  const onNavigate = useOnNavigate();
  return <ProfileScreen onNavigate={onNavigate} />;
}

function IntelligenceRoute() {
  const onNavigate = useOnNavigate();
  return <MarketIntelligenceScreen onNavigate={onNavigate} />;
}

function VideoDesignerRoute() {
  const onNavigate = useOnNavigate();
  return <VideoDesignerScreen onNavigate={onNavigate} />;
}

function QuestionsRoute() {
  const onNavigate = useOnNavigate();
  return <ProductQuestionsScreen onNavigate={onNavigate} />;
}

function InvoiceRoute() {
  const onNavigate = useOnNavigate();
  return <InvoiceListScreen onNavigate={onNavigate} />;
}

function FinancialFinanceRoute() {
  const onNavigate = useOnNavigate();
  return <FinancialAnalyticsScreen onNavigate={onNavigate} />;
}

function RevenueOptimizationRoute() {
  const onNavigate = useOnNavigate();
  return <RevenueOptimizationScreen onNavigate={onNavigate} />;
}

function AuditLogRoute() {
  const onNavigate = useOnNavigate();
  return <AuditLogScreen onNavigate={onNavigate} />;
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('beekod-theme') || 'Light');
  const isDark = theme === 'Dark';

  const [selectedProductForModel, setSelectedProductForModel] = useState<SelectedProduct | null>(
    null,
  );

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('beekod-theme', newTheme);
  };

  const selectedProductCtxValue = useMemo(
    () => ({ selectedProductForModel, setSelectedProductForModel }),
    [selectedProductForModel],
  );

  // This is needed because the instruction's route addition uses `handleNavigate`
  // which is not defined. Assuming it should use `useOnNavigate` or a direct `navigate`.
  // For consistency with other routes, we'll define a simple wrapper.
  const handleNavigate = useOnNavigate();

  return (
    <SelectedProductContext.Provider value={selectedProductCtxValue}>
      <AuthProvider>
        <SocketProvider>
          <ErrorBoundary>
            <Routes>
              {/* Default: dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route path="/login" element={<LoginScreen />} />

              {/* Application Routes - All Protected */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardRoute /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><AnalyticsRoute /></ProtectedRoute>} />
              <Route path="/integrations" element={<ProtectedRoute><IntegrationsRoute /></ProtectedRoute>} />
              <Route path="/pending" element={<ProtectedRoute><PendingRoute /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute><InventoryRoute /></ProtectedRoute>} />
              <Route path="/discovery" element={<ProtectedRoute><DiscoveryRoute /></ProtectedRoute>} />
              <Route path="/marketplace-inventory" element={<ProtectedRoute><MarketplaceInventoryRoute /></ProtectedRoute>} />
              <Route path="/jobs" element={<ProtectedRoute><JobMonitoringRoute /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><OrdersRoute /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><OrdersRoute /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute><ProductsRoute /></ProtectedRoute>} />
              <Route path="/products/create" element={<ProtectedRoute><ProductEditScreen /></ProtectedRoute>} />
              <Route path="/products/:barcode/edit" element={<ProtectedRoute><ProductEditScreen /></ProtectedRoute>} />
              <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistantRoute /></ProtectedRoute>} />
              <Route path="/stock" element={<ProtectedRoute><StockRoute /></ProtectedRoute>} />
              <Route path="/team" element={<ProtectedRoute><TeamRoute /></ProtectedRoute>} />
              <Route
                path="/configuration"
                element={<ProtectedRoute><ConfigurationRoute onThemeChange={handleThemeChange} /></ProtectedRoute>}
              />
              <Route path="/model-designer" element={<ProtectedRoute><ModelDesignerRoute /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfileRoute /></ProtectedRoute>} />
              <Route path="/intelligence" element={<ProtectedRoute><IntelligenceRoute /></ProtectedRoute>} />
              <Route path="/video-designer" element={<ProtectedRoute><VideoDesignerRoute /></ProtectedRoute>} />
              <Route
                path="/marketplace-sync"
                element={<ProtectedRoute><MarketplaceSyncRoute onNavigate={handleNavigate} /></ProtectedRoute>}
              />
              <Route
                path="/social-scheduler"
                element={<ProtectedRoute><SocialSchedulerRoute onNavigate={handleNavigate} /></ProtectedRoute>}
              />
              <Route path="/questions" element={<ProtectedRoute><QuestionsRoute /></ProtectedRoute>} />
              <Route path="/invoices" element={<ProtectedRoute><InvoiceRoute /></ProtectedRoute>} />
              <Route path="/ai-finance" element={<ProtectedRoute><FinancialFinanceRoute /></ProtectedRoute>} />
              <Route path="/ai-finance" element={<ProtectedRoute><FinancialFinanceRoute /></ProtectedRoute>} />
              <Route path="/revenue-optimization" element={<ProtectedRoute><RevenueOptimizationRoute /></ProtectedRoute>} />
              <Route path="/audit-logs" element={<ProtectedRoute><AuditLogRoute /></ProtectedRoute>} />

              {/* 404 -> dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <AssistantWidget />
            <CommandK />
          </ErrorBoundary>
        </SocketProvider>
      </AuthProvider>
    </SelectedProductContext.Provider>
  );
}
