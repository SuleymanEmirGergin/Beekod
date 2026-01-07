import { X, Printer, Download, Send } from 'lucide-react';
import { Invoice } from '../../services/invoice';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface InvoiceDetailModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export function InvoiceDetailModal({ invoice, onClose }: InvoiceDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex justify-between items-start bg-gray-50/50">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Fatura: {invoice.invoiceNumber}</h2>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold border 
                                ${
                                  invoice.status === 'PAID'
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : invoice.status === 'SENT'
                                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                                      : 'bg-gray-100 text-gray-700 border-gray-200'
                                }`}
              >
                {invoice.status}
              </span>
              {invoice.category && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-gray-50 text-gray-600 border-gray-200">
                  {invoice.category}
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Oluşturulma: {format(new Date(invoice.date), 'dd MMMM yyyy HH:mm', { locale: tr })}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors">
              <Printer className="w-4 h-4" /> Yazdır
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm font-medium transition-colors">
              <Download className="w-4 h-4" /> İndir (PDF)
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          {/* Customer & Company Info */}
          <div className="flex justify-between mb-12">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                SAYIN (MÜŞTERİ)
              </h3>
              <p className="font-bold text-gray-900 text-lg">{invoice.customer.name}</p>
              {invoice.customer.address && (
                <p className="text-gray-600 mt-1 max-w-xs">{invoice.customer.address}</p>
              )}
              {invoice.customer.taxId && (
                <p className="text-gray-500 text-sm mt-2">
                  VKN: {invoice.customer.taxId}{' '}
                  {invoice.customer.taxOffice ? `/ ${invoice.customer.taxOffice}` : ''}
                </p>
              )}
            </div>
            <div className="text-right">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                GÖNDEREN
              </h3>
              <p className="font-bold text-gray-900 text-lg">Beekod Inc.</p>
              <p className="text-gray-600 mt-1">Teknopark İstanbul, Pendik</p>
              <p className="text-gray-600">İstanbul, Türkiye</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-12">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Açıklama
                </th>
                <th className="text-center py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Miktar
                </th>
                <th className="text-right py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Birim Fiyat
                </th>
                <th className="text-right py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Toplam
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-4 text-gray-900 font-medium">{item.description}</td>
                  <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-4 text-right text-gray-600">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: invoice.currency,
                    }).format(item.unitPrice)}
                  </td>
                  <td className="py-4 text-right text-gray-900 font-bold">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: invoice.currency,
                    }).format(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Ara Toplam</span>
                <span>
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: invoice.currency,
                  }).format(invoice.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>KDV (Toplam)</span>
                <span>
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: invoice.currency,
                  }).format(invoice.taxAmount)}
                </span>
              </div>
              <div className="flex justify-between text-gray-900 font-bold text-lg pt-4 border-t border-gray-100 mt-2">
                <span>GENEL TOPLAM</span>
                <span>
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: invoice.currency,
                  }).format(invoice.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-12 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-bold text-gray-700 mb-1">Notlar</h4>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
