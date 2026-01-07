import { ArrowRight } from 'lucide-react';
import { MarketplaceOrder } from '../../services/dashboard';

interface MarketplaceOrdersTableProps {
  orders: MarketplaceOrder[];
  simpleView?: boolean;
}

export function MarketplaceOrdersTable({ orders, simpleView = false }: MarketplaceOrdersTableProps) {
  const normalizeCurrency = (currency: string) => {
    const c = (currency || '').toUpperCase();
    if (c === 'TL' || c === '₺' || c === 'TLR') return 'TRY';
    return c || 'TRY';
  };

  const getStatusStyle = (status: string) => {
    // styles for YENİ, HAZIRLANIYOR, etc.
    // Assuming string matches exactly or roughly
    const s = status.toUpperCase();
    if (s === 'NEW' || s === 'YENİ') return 'bg-green-50 text-green-700 border border-green-100';
    if (s === 'PROCESSING' || s === 'HAZIRLANIYOR')
      return 'bg-amber-50 text-amber-700 border border-amber-100';
    if (s === 'SHIPPED') return 'bg-blue-50 text-blue-700 border border-blue-100';
    return 'bg-gray-50 text-gray-700 border border-gray-100';
  };

  if (simpleView) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs bg-white">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-500">Sipariş</th>
              <th className="px-4 py-3 font-semibold text-gray-500">Tutar</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-right">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders && orders.length > 0 ? (
              orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 line-clamp-1" title={order.productName}>{order.productName}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {order.marketplace.icon && (<img src={order.marketplace.icon} className="w-3 h-3 object-contain opacity-70" />)}
                        <span className="text-[10px] text-gray-400 font-mono">{order.orderNumber}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-700 whitespace-nowrap">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: normalizeCurrency(order.currency),
                      maximumFractionDigits: 0
                    }).format(order.price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide rounded ${getStatusStyle(order.status)} border-0`}>
                      {order.status === 'NEW' ? 'YENİ' :
                        order.status === 'PROCESSING' ? 'HAZIR' :
                          order.status === 'SHIPPED' ? 'KARGO' :
                            order.status === 'Delivered' ? 'TESLİM' :
                              order.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 italic">Sipariş bulunamadı</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6 overflow-hidden">
      <div className="p-6 flex justify-between items-center border-b border-gray-100 bg-gray-50/20">
        <h3 className="text-gray-900 font-bold">Pazaryeri Siparişleri</h3>
        <a href="#" className="flex items-center text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-all font-medium">
          Tümünü Gör <ArrowRight className="w-3 h-3 ml-1" />
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
              <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">#Sipariş No</th>
              <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Mağaza</th>
              <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Ürün</th>
              <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Tarih</th>
              <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Tutar</th>
              <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders && orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{order.orderNumber}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {order.marketplace.icon && (<img src={order.marketplace.icon} alt="" className="w-5 h-5 object-contain" />)}
                      <span className="text-gray-900 font-medium">{order.marketplace.name}</span>
                    </div>
                  </td>
                  <td
                    className="px-6 py-4 text-gray-700 font-medium truncate max-w-xs"
                    title={order.productName}
                  >
                    {order.productName}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{order.date}</td>
                  <td className="px-6 py-4 text-gray-900 font-bold text-right tabular-nums">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: normalizeCurrency(order.currency),
                    }).format(order.price)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-1 text-[10px] uppercase font-bold tracking-wide rounded-md ${getStatusStyle(order.status)}`}>
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
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">📭</span>
                    <span>Henüz sipariş bulunmuyor.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
