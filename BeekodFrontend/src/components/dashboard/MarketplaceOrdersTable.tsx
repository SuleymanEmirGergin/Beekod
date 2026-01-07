import { ArrowRight } from 'lucide-react';
import { MarketplaceOrder } from '../../services/dashboard';

interface MarketplaceOrdersTableProps {
  orders: MarketplaceOrder[];
}

export function MarketplaceOrdersTable({ orders }: MarketplaceOrdersTableProps) {
  const normalizeCurrency = (currency: string) => {
    const c = (currency || '').toUpperCase();
    if (c === 'TL' || c === '₺' || c === 'TLR') return 'TRY';
    return c || 'TRY';
  };

  const getStatusStyle = (status: string) => {
    // styles for YENŽø, HAZIRLANIYOR, etc.
    // Assuming string matches exactly or roughly
    const s = status.toUpperCase();
    if (s === 'NEW' || s === 'YENİ') return 'bg-green-50 text-green-600 border border-green-200';
    if (s === 'PROCESSING' || s === 'HAZIRLANIYOR')
      return 'bg-orange-50 text-orange-600 border border-orange-200';
    if (s === 'SHIPPED') return 'bg-blue-50 text-blue-600 border border-blue-200';
    return 'bg-gray-50 text-gray-600 border border-gray-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
      <div className="p-6 flex justify-between items-center border-b border-gray-100">
        <h3 className="text-gray-900 font-semibold">Pazaryeri Siparişleri</h3>
        <a
          href="#"
          className="flex items-center text-xs text-blue-500 hover:text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full transition-colors"
        >
          Siparişlere git <ArrowRight className="w-3 h-3 ml-1" />
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
              <th className="px-6 py-4 font-medium">#SİPARİŞ NUMARASI</th>
              <th className="px-6 py-4 font-medium">MAĞAZA ADI</th>
              <th className="px-6 py-4 font-medium">ÜRÜN ADI</th>
              <th className="px-6 py-4 font-medium">TARİH</th>
              <th className="px-6 py-4 font-medium text-right">FİYAT</th>
              <th className="px-6 py-4 font-medium text-right">DURUM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders && orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-blue-600 font-medium">{order.orderNumber}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {order.marketplace.icon && (
                        <img
                          src={order.marketplace.icon}
                          alt=""
                          className="w-5 h-5 object-contain"
                        />
                      )}
                      <span className="text-gray-900">{order.marketplace.name}</span>
                    </div>
                  </td>
                  <td
                    className="px-6 py-4 text-gray-600 truncate max-w-xs"
                    title={order.productName}
                  >
                    {order.productName}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{order.date}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium text-right">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: normalizeCurrency(order.currency),
                    }).format(order.price)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`inline-block px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md ${getStatusStyle(order.status)}`}
                    >
                      {order.status === 'NEW' ? 'YENİ' :
                        order.status === 'PROCESSING' ? 'HAZIRLANIYOR' :
                          order.status === 'SHIPPED' ? 'KARGOYA VERİLDİ' :
                            order.status === 'DELIVERED' ? 'TESLİM EDİLDİ' :
                              order.status === 'CANCELLED' ? 'İPTAL EDİLDİ' :
                                order.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Henüz sipariş yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
