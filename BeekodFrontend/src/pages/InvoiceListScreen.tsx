import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoices, Invoice, officialiseInvoice } from '../services/invoice';
import { SidebarV2 } from '../layouts/SidebarV2';
import {
  Plus,
  Search,
  FileText,
  MoreVertical,
  Loader2,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { InvoiceDetailModal } from '../components/invoice/InvoiceDetailModal.tsx';
import { InvoiceCreateModal } from '../components/invoice/InvoiceCreateModal';
import { InvoiceScannerModal } from '../components/invoice/InvoiceScannerModal';
import { Link } from 'react-router-dom';

interface InvoiceListScreenProps {
  onNavigate: (screen: string) => void;
}

export function InvoiceListScreen({ onNavigate }: InvoiceListScreenProps) {
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'done' | 'error'>('idle');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scannedInvoiceData, setScannedInvoiceData] = useState<any>(null);

  const {
    data: invoices,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['invoices'],
    queryFn: getInvoices,
  });

  const queryClient = useQueryClient();

  const officialiseInvoiceMutation = useMutation({
    mutationFn: (id: string) => officialiseInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // toast.success('Fatura resmileştirildi ve GIB\'e gönderildi.'); // Assuming toast exists or ignored
    },
    onError: (error) => {
      console.error('Officialise failed', error);
      // toast.error('Fatura resmileştirilemedi.');
    }
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
      SENT: 'bg-blue-50 text-blue-700 border-blue-200',
      PAID: 'bg-green-50 text-green-700 border-green-200',
      CANCELLED: 'bg-red-50 text-red-700 border-red-200',
      OVERDUE: 'bg-orange-50 text-orange-700 border-orange-200',
    };

    const labels: Record<string, string> = {
      DRAFT: 'Taslak',
      SENT: 'Gönderildi',
      PAID: 'Ödendi',
      CANCELLED: 'İptal',
      OVERDUE: 'Gecikmiş',
    };

    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles['DRAFT']}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const filteredInvoices = invoices?.filter(
    (inv: Invoice) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarV2
        activeItem={'invoices'}
        onNavigate={onNavigate}
        userName="Emir"
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Faturalar</h1>
            <p className="text-sm text-gray-500 mt-1">Faturalarınızı oluşturun ve takip edin</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsScannerModalOpen(true)}
              className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <FileText className="w-5 h-5 text-yellow-600" />
              Fatura Tara (AI)
            </button>
            <button
              onClick={() => {
                setScannedInvoiceData(null);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Yeni Fatura
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Fatura no veya müşteri ara..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            ) : isError ? (
              <div className="p-12 text-center text-red-500">
                Faturalar yüklenirken bir hata oluştu.
              </div>
            ) : filteredInvoices?.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Henüz fatura yok</h3>
                <p className="text-gray-500 mt-1">İlk faturanızı oluşturarak başlayın.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-500">Fatura No</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Müşteri</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Kategori</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Tarih</th>
                    <th className="px-6 py-3 font-medium text-gray-500 text-right">Tutar</th>
                    <th className="px-6 py-3 font-medium text-gray-500 text-center">Durum</th>
                    <th className="px-6 py-3 font-medium text-gray-500"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInvoices?.map((inv: any) => (
                    <tr
                      key={inv._id}
                      className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4 text-gray-700">{inv.customer.name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${inv.category === 'Lojistik'
                            ? 'bg-purple-50 text-purple-600 border-purple-100'
                            : inv.category === 'Ürün Tedariği'
                              ? 'bg-blue-50 text-blue-600 border-blue-100'
                              : inv.category === 'Pazarlama'
                                ? 'bg-pink-50 text-pink-600 border-pink-100'
                                : inv.category === 'Ofis Giderleri'
                                  ? 'bg-gray-50 text-gray-600 border-gray-100'
                                  : 'bg-gray-50 text-gray-400 border-gray-100'
                            }`}
                        >
                          {inv.category || 'Diğer'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {format(new Date(inv.date), 'dd MMM yyyy', { locale: tr })}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: inv.currency,
                        }).format(inv.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(inv.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status !== 'SENT' && inv.status !== 'PAID' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                officialiseInvoiceMutation.mutate(inv.id || inv._id);
                              }}
                              className="p-1 hover:bg-yellow-50 rounded text-yellow-600 hover:text-yellow-700"
                              title="Resmileştir (E-Fatura)"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              alert('PDF İndirme (Demo): Backend entegrasyonu tamamlandığında burada PDF açılacak.');
                            }}
                            className="p-1 hover:bg-blue-50 rounded text-blue-600 hover:text-blue-700"
                            title="PDF İndir"
                          >
                            <Download className="w-4 h-4" />
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
      </main>

      {/* Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}

      {isCreateModalOpen && (
        <InvoiceCreateModal
          onClose={() => {
            setIsCreateModalOpen(false);
            setScannedInvoiceData(null);
          }}
          initialData={scannedInvoiceData}
        />
      )}

      {isScannerModalOpen && (
        <InvoiceScannerModal
          onClose={() => setIsScannerModalOpen(false)}
          onSuccess={(data) => {
            setScannedInvoiceData(data);
            setIsScannerModalOpen(false);
            setIsCreateModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
