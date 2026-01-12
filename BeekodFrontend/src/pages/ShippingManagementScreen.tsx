import {
  Truck,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Printer,
  Download,
  Settings,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { SidebarV2 } from '../layouts/SidebarV2';
import { getShippingStats, getOrders, Order } from '../services/orders';
// import { Card } from '../components/shared/'; // Not used in the code below

interface ShippingManagementScreenProps {
  onNavigate: (screen: string) => void;
}

// Mock Carriers (Frontend static data as backend doesn't serve this list yet fully populated with status)
const carriers = [
  { name: 'Yurtiçi Kargo', status: 'Online', load: 'Düşük', successRate: '98%', logo: 'YK' },
  { name: 'MNG Kargo', status: 'Online', load: 'Orta', successRate: '96%', logo: 'MNG' },
  { name: 'UPS', status: 'Bakım', load: '-', successRate: '99%', logo: 'UPS' },
];

export function ShippingManagementScreen({ onNavigate }: ShippingManagementScreenProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'transit' | 'delivered'>('all');
  const [stats, setStats] = useState<any>(null);
  const [shipments, setShipments] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsData, ordersData] = await Promise.all([
                getShippingStats(),
                getOrders()
            ]);
            setStats(statsData?.stats || []);
            setShipments(ordersData);
        } catch (error) {
            console.error("Failed to fetch shipping data", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  const getFilteredShipments = () => {
      if (activeTab === 'all') return shipments;
      // Simple status mapping logic
      return shipments.filter(s => {
          const status = s.status?.label?.toLowerCase() || '';
          if (activeTab === 'pending') return status.includes('hazırlanıyor') || status.includes('pending');
          if (activeTab === 'transit') return status.includes('kargoda') || status.includes('transit');
          if (activeTab === 'delivered') return status.includes('teslim') || status.includes('delivered');
          return true;
      });
  };

  const filteredShipments = getFilteredShipments();

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarV2
        activeItem="shipping"
        onNavigate={onNavigate}
        userName="Ahmet Yılmaz"
        userEmail="Beekod Admin"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Kargo Yönetimi</h1>
                <p className="text-xs text-gray-500 font-medium">Lojistik ve sevkiyat operasyonları</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                <Settings className="w-4 h-4" />
                Entegrasyonlar
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
                <Plus className="w-4 h-4" />
                Yeni Gönderi Oluştur
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {(stats || []).map((stat: any, idx: number) => {
              // Map legacy icons
              let Icon = Package;
              if (stat.label.includes('Yolda')) Icon = Truck;
              if (stat.label.includes('Teslim')) Icon = CheckCircle;
              if (stat.label.includes('Sorun')) Icon = AlertTriangle;

              return (
                <div key={idx} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      stat.trend === 'up' ? 'bg-green-100 text-green-700' : 
                      stat.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content: Shipment List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    Son Gönderiler
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Takip No ile ara..." 
                        className="pl-9 pr-4 py-1.5 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 w-48"
                      />
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                      <Filter className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-5">
                  {(['all', 'pending', 'transit', 'delivered'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${
                        activeTab === tab 
                          ? 'border-indigo-600 text-indigo-600' 
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab === 'all' ? 'Tümü' : (tab === 'pending' ? 'Bekleyen' : tab === 'transit' ? 'Yolda' : 'Teslim')}
                    </button>
                  ))}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Yükleniyor...</div>
                    ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-5 py-3">Sipariş No</th>
                            <th className="px-5 py-3">Müşteri</th>
                            <th className="px-5 py-3">Kargo Firması</th>
                            <th className="px-5 py-3">Durum</th>
                            <th className="px-5 py-3">Tarih</th>
                            <th className="px-5 py-3"></th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                        {filteredShipments.map((shipment) => (
                            <tr key={shipment.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-5 py-4 font-medium text-indigo-600">#{shipment.id}</td>
                            <td className="px-5 py-4">
                                <div className="font-medium text-gray-900">{shipment.customer.name}</div>
                                <div className="text-xs text-gray-400">{shipment.items.length} ürün</div>
                            </td>
                            <td className="px-5 py-4 text-gray-600">{shipment.shipping?.provider || '-'}</td>
                            <td className="px-5 py-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold`} style={{ color: shipment.status.color, backgroundColor: shipment.status.color + '20' }}>
                                {shipment.status.label}
                                </span>
                            </td>
                            <td className="px-5 py-4 text-gray-600">{new Date(shipment.date).toLocaleDateString("tr-TR")}</td>
                            <td className="px-5 py-4 text-right">
                                <div className="opacity-0 group-hover:opacity-100 flex items-center justify-end gap-2">
                                <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Etiket Yazdır">
                                    <Printer className="w-4 h-4" />
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                                </div>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    )}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Carrier Status */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  Kargo Entegrasyonları
                </h3>
                <div className="space-y-3">
                  {carriers.map((carrier, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xs font-bold border border-gray-200">
                          {carrier.logo}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{carrier.name}</div>
                          <div className="text-[10px] text-gray-500">Başarı: {carrier.successRate}</div>
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded font-bold ${
                        carrier.status === 'Online' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {carrier.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-indigo-900 p-6 rounded-2xl text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="font-bold mb-2">Toplu İşlemler</h3>
                  <p className="text-xs text-indigo-200 mb-4">
                    Bekleyen siparişler için toplu etiket oluşturup kurye çağırabilirsiniz.
                  </p>
                  <button className="w-full py-2.5 bg-white text-indigo-900 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                    <Printer className="w-4 h-4" />
                    Toplu Yazdır
                  </button>
                </div>
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-800 rounded-full blur-3xl -mr-16 -mt-16"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
