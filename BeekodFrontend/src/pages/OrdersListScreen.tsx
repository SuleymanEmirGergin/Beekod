import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, updateOrderStatus, createOrder, syncOrders, generateShippingLabel, Order } from '../services/orders';
import { createBulkInvoices } from '../services/invoice';
import { SidebarV2 } from '../layouts/SidebarV2';
import { SearchBar } from '../components/shared/';

import { HelpModal } from '../components/HelpModal';
import {
  Bell,
  HelpCircle,
  Download,
  Plus,
  Eye,
  MoreVertical,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Package as PackageIcon,
  RefreshCw,
  Truck,
} from 'lucide-react';
import hepsiburadaLogo from 'figma:asset/563328772dcd4f9d76dd21b5abc99b99a49e8f70.png';
import trendyolLogo from 'figma:asset/1230e43a58a5ec2cbca646dd9964cda0a5eb57b2.png';

interface OrdersListScreenProps {
  onNavigate: (screen: string) => void;
}

export function OrdersListScreen({ onNavigate }: OrdersListScreenProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [newOrderEmail, setNewOrderEmail] = useState('');
  const [newOrderPhone, setNewOrderPhone] = useState('');
  const [newOrderAddress, setNewOrderAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', message: '' });
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const itemsPerPage = 5;

  const queryClient = useQueryClient();

  // React Query - Fetch Orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: getOrders,
  });

  // React Query - Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // Only show success toast here if we want generic success, but handleUpdateStatus logic had specific logic.
      // We will keep specific logic in onSuccess of mutation call or handle it here generally.
      // Let's keep it here for simplicity and consistency.
      setShowUpdateStatusModal(false);
      setShowOrderDetails(false);
    },
    onError: () => {
      setToastMessage({ title: 'Hata', message: 'Durum güncellenemedi' });
      setShowToast(true);
    },
  });

  // React Query - Create Order Mutation
  const createOrderMutation = useMutation({
    mutationFn: (newOrder: any) => createOrder(newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setToastMessage({
        title: '✅ Sipariş Oluşturuldu',
        message: 'Yeni sipariş başarıyla sisteme eklendi',
      });
      setShowToast(true);
      setShowCreateOrderModal(false);
      // Reset form
      setNewOrderCustomer('');
      setNewOrderEmail('');
      setNewOrderPhone('');
      setNewOrderAddress('');
      setTimeout(() => setShowToast(false), 3000);
    },
  });

  // React Query - Bulk Create Invoices Mutation
  const createBulkInvoicesMutation = useMutation({
    mutationFn: (orderIds: string[]) => createBulkInvoices(orderIds),
    onSuccess: (data) => {
      const successCount = data.success.length;
      const failCount = data.failed.length;
      setToastMessage({
        title: 'Toplu Fatura Oluşturma',
        message: `${successCount} fatura oluşturuldu. Başarısız: ${failCount}`,
      });
      setShowToast(true);
      setSelectedOrders([]);
      setTimeout(() => setShowToast(false), 5000);
    },
    onError: () => {
      setToastMessage({ title: 'Hata', message: 'Toplu fatura oluşturulamadı' });
      setShowToast(true);
    },
  });

  // React Query - Sync Orders Mutation
  const syncOrdersMutation = useMutation({
    mutationFn: syncOrders,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setToastMessage({
        title: '🔄 Pazaryeri Senkronizasyonu Tamamlandı',
        message: `${data.totalNewOrders} yeni sipariş aktarıldı.`,
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    },
    onError: () => {
      setToastMessage({ title: 'Hata', message: 'Siparişler pazaryerinden çekilemedi' });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    },
  });

  // React Query - Generate Shipping Label Mutation
  const generateShippingLabelMutation = useMutation({
    mutationFn: ({ id, provider }: { id: string; provider: string }) => generateShippingLabel(id, provider),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setToastMessage({
        title: '📦 Kargo Barkodu Oluşturuldu',
        message: `${data.shipping.provider} Takip No: ${data.shipping.trackingNumber}`,
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
      // Automatically "pencereyi aç" like experience, but for demo we just show toast.
      if (data.shipping.labelUrl) {
        window.open(data.shipping.labelUrl, '_blank');
      }
    },
    onError: () => {
      setToastMessage({ title: 'Hata', message: 'Kargo barkodu oluşturulamadı' });
      setShowToast(true);
    },
  });

  // Toggle all selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select all visible on current page or all filtered? usually selected all on current page is safer for now
      // Let's select all FILTERED orders to be more powerful
      setSelectedOrders(filteredOrders.map((o) => o.id));
      // Or just current page: filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(o => o.id)
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (id: string) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter((orderId) => orderId !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  const handleBulkCreate = () => {
    if (selectedOrders.length === 0) return;
    if (confirm(`${selectedOrders.length} sipariş için fatura oluşturulsun mu?`)) {
      createBulkInvoicesMutation.mutate(selectedOrders);
    }
  };

  // Filter orders based on active tab and search query
  const filteredOrders = orders.filter((order) => {
    // Filter by tab
    const matchesTab =
      activeTab === 'all' || order.status.label.toLowerCase() === activeTab.toLowerCase();

    // Filter by search query
    const matchesSearch =
      searchQuery === '' ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.total.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.status.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.products &&
        order.products.some((product) =>
          product.toLowerCase().includes(searchQuery.toLowerCase()),
        ));

    return matchesTab && matchesSearch;
  });

  // Export CSV function
  const handleExportCSV = () => {
    const csvContent = [
      ['Sipariş No', 'Kaynak', 'Müşteri', 'Tarih', 'Toplam', 'Durum'],
      ...filteredOrders.map((order) => [
        order.id,
        order.source.name,
        order.customer.name,
        order.date,
        order.total,
        order.status.label,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beekod-orders-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Print Order function
  const handlePrintOrder = () => {
    const printContent = `
      BEEKOD - Sipariş Faturası
      =====================
      
      Sipariş No: ${selectedOrder.id}
      Durum: ${selectedOrder.status.label}
      Tarih: ${selectedOrder.date}
      
      Müşteri: ${selectedOrder.customer.name}
      
      Ürünler:
      ${selectedOrder.items.map((item: any) => `- ${item.name} (${item.sku}) x${item.quantity} - ${item.price}`).join('\n')}
      
      Ara Toplam: ${selectedOrder.total}
      Kargo: ₺50.00
      Genel Toplam: ${selectedOrder.total}
      
      Siparişiniz için teşekkür ederiz!
    `;

    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow?.document.write(`<pre>${printContent}</pre>`);
    printWindow?.document.close();
    printWindow?.print();

    setToastMessage({
      title: '🖨️ Printing Order',
      message: `Printing invoice for ${selectedOrder.id}`,
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Update Status function
  // Update Status function
  const handleUpdateStatus = (status: string) => {
    if (!status || !selectedOrder) return;

    updateStatusMutation.mutate(
      { id: selectedOrder.id, status },
      {
        onSuccess: () => {
          setToastMessage({
            title: '✅ Durum Güncellendi',
            message: `${selectedOrder.id} numaralı sipariş ${status} olarak işaretlendi`,
          });
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        },
      },
    );
  };

  const handleCreateOrder = () => {
    if (!newOrderCustomer) return;

    createOrderMutation.mutate({
      customer: { name: newOrderCustomer },
      source: { name: 'Beekod Direct', color: 'bg-yellow-500', icon: 'B' },
      // Add other fields as needed
    });
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Premium Background with Mesh Gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-blue-200/20 via-cyan-200/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-200/20 via-purple-200/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-amber-200/10 to-orange-200/10 rounded-full blur-3xl" />
      </div>

      <SidebarV2
        activeItem="orders"
        onNavigate={onNavigate}
        userName="Emir"
        userEmail="emir@beekod.com"
        ordersBadge={12}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Premium Header */}
        <header className="relative px-8 py-5 flex items-center justify-between border-b border-white/20 bg-white/40 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-xl blur opacity-30" />
              <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <PackageIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sipariş Yönetimi</h1>
              <p className="text-sm text-gray-500">{filteredOrders.length} sipariş listeleniyor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SearchBar
              placeholder="Sipariş, müşteri veya ürün ara..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
            <button
              className="relative p-2.5 bg-white/60 hover:bg-white/80 rounded-xl border border-white/40 transition-all shadow-sm"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>
            <button
              className="p-2.5 bg-white/60 hover:bg-white/80 rounded-xl border border-white/40 transition-all shadow-sm"
              onClick={() => setShowHelpModal(true)}
            >
              <HelpCircle className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </header>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="absolute top-16 right-8 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-900">Bildirimler</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <div className="p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">Yeni sipariş alındı</p>
                    <p className="text-xs text-gray-500 mt-1">Trendyol'dan #BK-2094</p>
                    <p className="text-xs text-gray-400 mt-1">10 dk önce</p>
                  </div>
                </div>
              </div>
              <div className="p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">Sipariş kargolandı</p>
                    <p className="text-xs text-gray-500 mt-1">#BK-2089 başarıyla teslim edildi</p>
                    <p className="text-xs text-gray-400 mt-1">1 saat önce</p>
                  </div>
                </div>
              </div>
              <div className="p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">Düşük stok uyarısı</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Apple AirPods Pro 2. Nesil - Sadece 23 adet kaldı
                    </p>
                    <p className="text-xs text-gray-400 mt-1">2 saat önce</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-gray-100">
              <button className="text-sm text-[#F5B800] hover:text-[#E5A800] transition-colors w-full text-center">
                Tüm bildirimleri gör
              </button>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {/* Tabs and Actions */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-gray-100/50 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === 'all'
                    ? 'text-gray-900 bg-white border-b-2 border-[#F5B800]'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Tüm Siparişler
                </button>
                <button
                  onClick={() => setActiveTab('new')}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'new'
                    ? 'text-gray-900 bg-white border-b-2 border-[#F5B800]'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Yeni
                  <span className="px-1.5 py-0.5 bg-[#F5B800] text-gray-900 text-xs rounded">12</span>
                </button>
                <button
                  onClick={() => setActiveTab('processing')}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === 'processing'
                    ? 'text-gray-900 bg-white border-b-2 border-[#F5B800]'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  İşlemde
                </button>
                <button
                  onClick={() => setActiveTab('shipped')}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === 'shipped'
                    ? 'text-gray-900 bg-white border-b-2 border-[#F5B800]'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Kargoda
                </button>
                <button
                  onClick={() => setActiveTab('returned')}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === 'returned'
                    ? 'text-gray-900 bg-white border-b-2 border-[#F5B800]'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  İade Edildi
                </button>
                <button
                  onClick={() => setActiveTab('cancelled')}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === 'cancelled'
                    ? 'text-gray-900 bg-white border-b-2 border-[#F5B800]'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  İptal Edildi
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/60 hover:bg-white/80 border border-white/40 rounded-xl text-sm text-gray-700 transition-all shadow-sm"
                  onClick={handleExportCSV}
                >
                  <Download className="w-4 h-4" />
                  Dışa Aktar
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl text-sm font-medium transition-all shadow-md disabled:opacity-50"
                  onClick={() => syncOrdersMutation.mutate()}
                  disabled={syncOrdersMutation.isPending}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${syncOrdersMutation.isPending ? 'animate-spin' : ''}`}
                  />
                  {syncOrdersMutation.isPending ? 'Eşitleniyor...' : 'Siparişleri Eşitle'}
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl text-sm font-medium transition-all shadow-md"
                  onClick={() => setShowCreateOrderModal(true)}
                >
                  <Plus className="w-4 h-4" />
                  Manuel Sipariş
                </button>
                {selectedOrders.length > 0 && (
                  <button
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-sm font-medium transition-all shadow-md"
                    onClick={handleBulkCreate}
                  >
                    <PackageIcon className="w-4 h-4" />
                    Toplu Fatura ({selectedOrders.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-[#F5B800] focus:ring-[#F5B800]"
                      checked={
                        filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-left text-xs text-gray-600 px-6 py-3 uppercase tracking-wider">
                    SİPARİŞ NO
                  </th>
                  <th className="text-left text-xs text-gray-600 px-6 py-3 uppercase tracking-wider">
                    KAYNAK
                  </th>
                  <th className="text-left text-xs text-gray-600 px-6 py-3 uppercase tracking-wider">
                    MÜŞTERİ
                  </th>
                  <th className="text-left text-xs text-gray-600 px-6 py-3 uppercase tracking-wider">
                    TARİH
                  </th>
                  <th className="text-left text-xs text-gray-600 px-6 py-3 uppercase tracking-wider">
                    TOPLAM
                  </th>
                  <th className="text-left text-xs text-gray-600 px-6 py-3 uppercase tracking-wider">
                    DURUM
                  </th>
                  <th className="text-left text-xs text-gray-600 px-6 py-3 uppercase tracking-wider">
                    İŞLEM
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-[#F5B800] focus:ring-[#F5B800]"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{order.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {order.source.logo ? (
                            <img
                              src={order.source.logo}
                              alt={order.source.name}
                              className="h-5 w-auto object-contain"
                            />
                          ) : (
                            <div
                              className={`w-6 h-6 ${order.source.color} rounded flex items-center justify-center`}
                            >
                              <span className="text-xs text-white">{order.source.icon}</span>
                            </div>
                          )}
                          <span className="text-sm text-gray-900">{order.source.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 ${order.customer.color} rounded-full flex items-center justify-center`}
                          >
                            <span className="text-xs text-white">{order.customer.initials}</span>
                          </div>
                          <span className="text-sm text-gray-900">{order.customer.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{order.date}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{order.total}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 ${order.status.dot} rounded-full`}></div>
                          <span className={`text-sm ${order.status.color}`}>
                            {order.status.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="Detay"
                        >
                          <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                        <button
                          onClick={() => {
                            const provider = prompt('Kargo firmasını seçin (Yurtici, Aras, MNG):', 'Yurtici');
                            if (provider) {
                              generateShippingLabelMutation.mutate({ id: order.id, provider });
                            }
                          }}
                          className="p-1.5 hover:bg-blue-50 rounded transition-colors ml-1"
                          title="Kargo Barkodu"
                        >
                          <Truck className="w-4 h-4 text-blue-400 hover:text-blue-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                <span className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> - {' '}
                <span className="text-gray-900">
                  {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
                </span>{' '}
                arası gösteriliyor (Toplam <span className="text-gray-900">{filteredOrders.length}</span>)
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : currentPage)}
                  disabled={currentPage === 1}
                >
                  Geri
                </button>
                {Array.from(
                  { length: Math.ceil(filteredOrders.length / itemsPerPage) },
                  (_, index) => (
                    <button
                      key={index}
                      className={`px-3 py-1.5 ${currentPage === index + 1 ? 'bg-[#F5B800] text-gray-900' : 'border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors'}`}
                      onClick={() => setCurrentPage(index + 1)}
                    >
                      {index + 1}
                    </button>
                  ),
                )}
                <button
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    setCurrentPage(
                      currentPage < Math.ceil(filteredOrders.length / itemsPerPage)
                        ? currentPage + 1
                        : currentPage,
                    )
                  }
                  disabled={currentPage === Math.ceil(filteredOrders.length / itemsPerPage)}
                >
                  İleri
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Chat Button */}
      

      {/* Create Order Modal */}
      {showCreateOrderModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg w-96">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-gray-900">Manuel Sipariş Oluştur</h2>
              <button
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                onClick={() => setShowCreateOrderModal(false)}
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500">Müşteri Adı</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F5B800]"
                  value={newOrderCustomer}
                  onChange={(e) => setNewOrderCustomer(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">E-posta</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F5B800]"
                  value={newOrderEmail}
                  onChange={(e) => setNewOrderEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">Telefon</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F5B800]"
                  value={newOrderPhone}
                  onChange={(e) => setNewOrderPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">Adres</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F5B800]"
                  value={newOrderAddress}
                  onChange={(e) => setNewOrderAddress(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-end mt-6">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded-lg mr-2"
                onClick={() => setShowCreateOrderModal(false)}
              >
                Vazgeç
              </button>
              <button
                className="px-4 py-2 bg-[#F5B800] text-gray-900 rounded-lg"
                onClick={handleCreateOrder}
              >
                Sipariş Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && <HelpModal page="orders" onClose={() => setShowHelpModal(false)} />}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl text-gray-900 mb-1">Sipariş Detayı</h2>
                <p className="text-sm text-gray-500">{selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Order Info */}
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${selectedOrder.status.color}`}
                >
                  <div className={`w-2 h-2 ${selectedOrder.status.dot} rounded-full`}></div>
                  <span className="text-sm font-medium">{selectedOrder.status.label}</span>
                </div>
                <span className="text-sm text-gray-500">{selectedOrder.date}</span>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Müşteri Bilgileri</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 ${selectedOrder.customer.color} rounded-full flex items-center justify-center`}
                    >
                      <span className="text-sm text-white">{selectedOrder.customer.initials}</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">{selectedOrder.customer.name}</p>
                      <p className="text-xs text-gray-500">musteri@ornek.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-3 border-t border-gray-200">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-700">Teslimat Adresi</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Atatürk Mah. İstiklal Cad. No:123
                        <br />
                        Kadıköy, Istanbul 34000
                      </p>
                    </div>
                  </div>
                  {selectedOrder.shipping ? (
                    <div className="flex items-start gap-3 pt-3 border-t border-gray-200">
                      <Truck className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-700">Kargo Bilgileri</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedOrder.shipping.provider} - {selectedOrder.shipping.trackingNumber}
                        </p>
                        {selectedOrder.shipping.labelUrl && (
                          <a href={selectedOrder.shipping.labelUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline block mt-1">
                            Etiketi Yazdır (PDF)
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 pt-3 border-t border-gray-200">
                      <Truck className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 mb-2">Kargo Etiketi Oluştur</p>
                        <div className="flex gap-2">
                          {['Yurtici', 'Aras', 'MNG'].map(provider => (
                            <button
                              key={provider}
                              onClick={() => generateShippingLabelMutation.mutate({ id: selectedOrder.id, provider })}
                              className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded hover:bg-yellow-50 hover:border-yellow-200 hover:text-yellow-700 transition"
                            >
                              {provider}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Source Info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Sipariş Kaynağı</h3>
                <div className="flex items-center gap-3">
                  {selectedOrder.source.logo ? (
                    <img
                      src={selectedOrder.source.logo}
                      alt={selectedOrder.source.name}
                      className="h-8 w-auto object-contain"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 ${selectedOrder.source.color} rounded-lg flex items-center justify-center`}
                    >
                      <span className="text-sm text-white font-medium">
                        {selectedOrder.source.icon}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-gray-900">{selectedOrder.source.name}</span>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Sipariş İçeriği</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any) => (
                    <div key={item.sku} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 bg-gray-200 rounded-lg"
                          style={{ backgroundImage: `url(${item.image})`, backgroundSize: 'cover' }}
                        ></div>
                        <div>
                          <p className="text-sm text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">{item.price}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Ara Toplam</span>
                  <span className="text-sm text-gray-900">{selectedOrder.total}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Kargo</span>
                  <span className="text-sm text-gray-900">₺50.00</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-base font-medium text-gray-900">Genel Toplam</span>
                  <span className="text-base font-medium text-gray-900">{selectedOrder.total}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm transition-colors"
                  onClick={handlePrintOrder}
                >
                  Siparişi Yazdır
                </button>
                <button
                  className="flex-1 px-4 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
                  onClick={() => setShowUpdateStatusModal(true)}
                >
                  Durumu Güncelle
                </button>
              </div>
            </div>
          </div>
        </div >
      )
      }

      {/* Update Status Modal */}
      {
        showUpdateStatusModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl text-gray-900">Sipariş Durumunu Güncelle</h2>
                <button
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  onClick={() => setShowUpdateStatusModal(false)}
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">Yeni Durum Seçin</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F5B800]"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="">Bir durum seçin...</option>
                    <option value="New">Yeni</option>
                    <option value="Processing">Hazırlanıyor</option>
                    <option value="Shipped">Kargolandı</option>
                    <option value="Delivered">Teslim Edildi</option>
                    <option value="Cancelled">İptal Edildi</option>
                    <option value="Returned">İade Edildi</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => setShowUpdateStatusModal(false)}
                >
                  Vazgeç
                </button>
                <button
                  className="px-4 py-2 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg transition-colors"
                  onClick={() => handleUpdateStatus(newStatus)}
                >
                  Güncelle
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Toast */}
      {
        showToast && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg">
            <p className="font-bold">{toastMessage.title}</p>
            <p className="text-sm">{toastMessage.message}</p>
          </div>
        )
      }
    </div >
  );
}
