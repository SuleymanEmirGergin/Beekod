import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNewDashboardData } from '../services/dashboard';
import { SidebarV2 } from '../layouts/SidebarV2';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { TopProductsList } from '../components/dashboard/TopProductsList';
import { MarketplaceOrdersTable } from '../components/dashboard/MarketplaceOrdersTable';
import { DailyInsightWidget } from '../components/DailyInsightWidget';

interface DashboardScreenNewProps {
  onNavigate: (screen: string) => void;
}

export function DashboardScreenNew({ onNavigate }: DashboardScreenNewProps) {
  const [activeItem, setActiveItem] = useState('dashboard');

  const {
    data: dashboardData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['dashboard-new'],
    queryFn: getNewDashboardData,
    // Add fake data on error or if empty for demo purposes logic?
    // For now purely fetch.
  });

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarV2 activeItem={activeItem} onNavigate={onNavigate} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (isError || !dashboardData) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarV2 activeItem={activeItem} onNavigate={onNavigate} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500">Veri yüklenemedi. Lütfen tekrar deneyin.</div>
        </div>
      </div>
    );
  }

  // Define period filtering logic here or pass to components? Components handle "Tümü" UI but filtering logic usually backend.
  // For MVP UI, filtering buttons just toggle state there.

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarV2 activeItem={activeItem} onNavigate={onNavigate} />

      <main className="flex-1 overflow-y-auto px-8 py-8">
        {/* Daily Insight Widget */}
        <DailyInsightWidget />

        {/* Top Grid: Cariler & Ürünler */}
        <StatsGrid />

        {/* Top Products - Full Width */}
        <div className="w-full">
          <TopProductsList products={dashboardData.topProducts} />
        </div>

        {/* Bottom: Marketplace Orders */}
        <MarketplaceOrdersTable orders={dashboardData.marketplaceOrders} />
      </main>
    </div>
  );
}
