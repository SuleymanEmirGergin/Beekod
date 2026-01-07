import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Check, Loader2, AlertCircle } from 'lucide-react';
import { scanInvoice } from '../../services/invoice';

interface InvoiceScannerModalProps {
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export function InvoiceScannerModal({ onClose, onSuccess }: InvoiceScannerModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'review' | 'done' | 'error'>('idle');
  const [scannedData, setScannedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setStatus('idle');
      setError(null);
    }
  };

  const handleScan = async () => {
    if (!file) return;

    setStatus('analyzing');
    try {
      const data = await scanInvoice(file);
      setScannedData(data);
      setStatus('review');
    } catch (err: any) {
      console.error('Scan failed', err);
      setError(err.response?.data?.error || 'AI tarama işlemi başarısız oldu.');
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 font-display">AI Fatura Okuyucu</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-8">
          {status === 'analyzing' ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 border-4 border-yellow-100 border-t-yellow-600 rounded-full animate-spin"></div>
                <Loader2 className="w-8 h-8 text-yellow-600 absolute inset-0 m-auto animate-pulse" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">AI Faturayı İnceliyor</h4>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                Yapay zeka kalemleri, fiyatları ve vergi numaralarını analiz ediyor. Lütfen
                bekleyin...
              </p>
            </div>
          ) : status === 'review' ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl mb-6">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-green-900">AI Analizi Tamamlandı!</h4>
                  <p className="text-xs text-green-700">
                    Lütfen çıkarılan verileri kontrol edip onaylayın.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Müşteri / Cari
                  </label>
                  <input
                    type="text"
                    value={scannedData?.customer?.name || ''}
                    onChange={(e) =>
                      setScannedData({
                        ...scannedData,
                        customer: { ...scannedData.customer, name: e.target.value },
                      })
                    }
                    className="w-full bg-transparent text-sm font-bold text-gray-900 border-none p-0 focus:ring-0"
                  />
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Toplam Tutar
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-gray-900">₺</span>
                    <input
                      type="number"
                      value={scannedData?.totalAmount || 0}
                      onChange={(e) =>
                        setScannedData({ ...scannedData, totalAmount: parseFloat(e.target.value) })
                      }
                      className="w-full bg-transparent text-sm font-bold text-gray-900 border-none p-0 focus:ring-0"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Harcama Kategorisi (AI Tahmini)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Lojistik', 'Ürün Tedariği', 'Pazarlama', 'Ofis Giderleri', 'Diğer'].map(
                    (cat) => (
                      <button
                        key={cat}
                        onClick={() => setScannedData({ ...scannedData, category: cat })}
                        className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                          scannedData?.category === cat
                            ? 'bg-yellow-400 border-yellow-500 text-gray-900'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-yellow-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setStatus('idle')}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  Yeniden Tara
                </button>
                <button
                  onClick={() => onSuccess(scannedData)}
                  className="flex-[2] py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-xl hover:bg-black transition-all"
                >
                  Faturayı Kaydet
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-yellow-400 hover:bg-yellow-50/30 cursor-pointer transition-all group"
                >
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-yellow-600" />
                  </div>
                  <h4 className="text-gray-900 font-semibold mb-1">
                    Fatura Görselini Buraya Bırakın
                  </h4>
                  <p className="text-gray-500 text-sm">veya dosya seçmek için tıklayın</p>
                  <p className="text-gray-400 text-xs mt-4">JPG, PNG veya PDF (Maks. 10MB)</p>
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-[4/3] bg-gray-50">
                    <img src={preview!} className="w-full h-full object-contain" />
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                        {file.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-600">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-medium">{error}</p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  İptal
                </button>
                <button
                  disabled={!file}
                  onClick={handleScan}
                  className="flex-[2] py-3 bg-[#F5B800] hover:bg-[#E5A800] disabled:bg-gray-100 disabled:text-gray-400 text-gray-900 font-semibold rounded-xl shadow-lg shadow-yellow-200 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  AI Analizini Başlat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
