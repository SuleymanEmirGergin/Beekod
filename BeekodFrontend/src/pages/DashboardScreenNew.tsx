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
  });

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <SidebarV2 activeItem={activeItem} onNavigate={onNavigate} />
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 animate-pulse"></div>
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-[#F5B800] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium animate-pulse">Verileriniz hazırlanıyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !dashboardData) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarV2 activeItem={activeItem} onNavigate={onNavigate} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500 bg-red-50 px-6 py-4 rounded-xl border border-red-100 shadow-sm text-center">
            <p className="font-bold mb-1">Veri yüklenemedi 😔</p>
            <p className="text-sm opacity-80">Lütfen internet bağlantınızı kontrol edip tekrar deneyin.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FDFDFD] font-sans overflow-hidden">
      <SidebarV2 activeItem={activeItem} onNavigate={onNavigate} />

      <main className="flex-1 overflow-y-auto relative">
        {/* Subtle Background Mesh */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/40 via-purple-50/20 to-transparent pointer-events-none z-0" />

        <div className="relative z-10 px-8 py-8 space-y-8 max-w-7xl mx-auto">

          {/* Header Section */}
          <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Hoş geldin, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5B800] to-orange-500">Girişimci</span> 👋
              </h1>
              <p className="text-gray-500 mt-1">
                Bugün işlerin harika görünüyor! İşte günün özeti.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">
                ● Sistem Aktif
              </span>
              <span className="text-xs text-gray-400 font-medium">
                {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
              </span>
            </div>
          </div>

          {/* Daily Insight - Stagger 1 */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <DailyInsightWidget />
          </div>

          {/* Stats Grid - Stagger 2 */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <StatsGrid />
          </div>

          {/* Content Row: Top Products & Orders */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Top Products (Takes 2 cols) */}
            <div className="xl:col-span-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
                <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                  <h3 className="font-bold text-gray-800">Çok Satan Ürünler</h3>
                  <button className="text-xs text-[#F5B800] font-bold hover:underline">Tümünü Gör →</button>
                </div>
                <div className="p-4">
                  <TopProductsList products={dashboardData.topProducts} />
                </div>
              </div>
            </div>

            {/* Marketplace Orders (Takes 1 col) */}
            <div className="xl:col-span-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
                <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                  <h3 className="font-bold text-gray-800">Son Siparişler</h3>
                </div>
                <div className="p-0">
                  <MarketplaceOrdersTable orders={dashboardData.marketplaceOrders} simpleView />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
