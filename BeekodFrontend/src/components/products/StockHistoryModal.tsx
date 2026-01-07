import { X, History, ArrowUpRight, ArrowDownRight, Calendar, Package } from 'lucide-react';

interface StockLog {
  id: string;
  barcode: string;
  productName: string;
  oldStock: number;
  newStock: number;
  change: number;
  reason: string;
  source: string;
  timestamp: string;
}

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  history: StockLog[];
  loading: boolean;
}

export function StockHistoryModal({
  isOpen,
  onClose,
  productName,
  history,
  loading,
}: StockHistoryModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
              <History size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Stok Geçmişi</h3>
              <p className="text-xs text-gray-500 font-medium">{productName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-gray-100"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 max-h-[60vh] custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500 font-medium italic">
                Geçmiş veriler yükleniyor...
              </p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
                <Package size={32} />
              </div>
              <p className="text-gray-900 font-bold">Kayıt Bulunamadı</p>
              <p className="text-gray-500 text-xs mt-1">
                Bu ürün için henüz bir stok hareketi kaydedilmemiş.
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-100"></div>

              <div className="space-y-8 relative">
                {history.map((log) => {
                  const { date, time } = formatDate(log.timestamp);
                  const isIncrease = log.change > 0;

                  return (
                    <div key={log.id} className="flex gap-6 group">
                      {/* Icon Dot */}
                      <div
                        className={`w-10 h-10 rounded-xl shrink-0 z-10 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${
                          isIncrease ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {isIncrease ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                      </div>

                      {/* Details */}
                      <div className="flex-1 pt-1">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <span
                              className={`text-sm font-black ${isIncrease ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {isIncrease ? '+' : ''}
                              {log.change} Adet
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 ml-2 uppercase tracking-wider">
                              {log.source}
                            </span>
                          </div>
                          <div className="flex flex-col items-end text-[10px] font-bold text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar size={10} />
                              {date}
                            </div>
                            <span>{time}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 font-medium mb-2">{log.reason}</p>
                        <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                              Önceki
                            </p>
                            <p className="text-sm font-bold text-gray-600">{log.oldStock}</p>
                          </div>
                          <div className="w-px h-6 bg-gray-200"></div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                              Sonraki
                            </p>
                            <p className="text-sm font-bold text-gray-900">{log.newStock}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-gray-200"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
