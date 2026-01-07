
import { useState } from 'react';
import { Search, Loader2, Download, ExternalLink, RefreshCw, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import {
  searchUniversal,
  importProductFromUrl,
  UniversalSearchResult,
  formatCurrency,
} from '../../services/products';
import { ToastV2 } from '../shared/';

interface UniversalSearchModalProps {
  onClose: () => void;
  onImportSuccess: () => void;
}

export function UniversalSearchModal({ onClose, onImportSuccess }: UniversalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UniversalSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [importingUrl, setImportingUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  // Search Mutation
  const searchMutation = useMutation({
    mutationFn: searchUniversal,
    onMutate: () => {
      setIsSearching(true);
      setResults([]);
    },
    onSuccess: (data) => {
      setResults(data);
      setIsSearching(false);
    },
    onError: () => {
      setIsSearching(false);
      setToast({ title: 'Hata', message: 'Pazar yerlerinde arama yapılamadı. Lütfen tekrar deneyin.' });
    },
  });

  // Import Mutation
  const importMutation = useMutation({
    mutationFn: importProductFromUrl,
    onMutate: (url: string) => {
      setImportingUrl(url);
    },
    onSuccess: () => {
      setImportingUrl(null);
      setToast({ title: 'Başarılı', message: 'Ürün başarıyla içe aktarıldı!' });
      setTimeout(() => {
        onImportSuccess();
        onClose();
      }, 1500);
    },
    onError: () => {
      setImportingUrl(null);
      setToast({
        title: 'Hata',
        message: 'Ürün içe aktarılamadı. Lütfen tekrar deneyin veya URL\'yi kontrol edin.',
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      searchMutation.mutate(query);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Evrensel Pazar Yeri Araması</h3>
            <p className="text-sm text-gray-500 mt-1">
              Trendyol ve Hepsiburada'dan ürün arayın ve içe aktarın
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Ürün adı, marka girin veya bir URL yapıştırın..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5B800] focus:border-transparent transition-all shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="px-6 py-3 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              Ara
            </button>
          </form>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#F5B800]" />
              <p>Pazar yerlerinde aranıyor...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
                >
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={result.image}
                      alt={result.title}
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-semibold shadow-sm border border-gray-100 flex items-center gap-1">
                      {result.source === 'Trendyol' ? (
                        <span className="text-orange-600">Trendyol</span>
                      ) : (
                        <span className="text-orange-500">Hepsiburada</span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h4
                      className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 min-h-[40px]"
                      title={result.title}
                    >
                      {result.title}
                    </h4>
                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Fiyat</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(result.price, result.currency)}
                        </p>
                      </div>
                      {result.rating && (
                        <div className="flex items-center gap-1 text-xs bg-yellow-50 px-2 py-1 rounded text-yellow-700">
                          <span>★</span>
                          <span>{result.rating}</span>
                          <span className="text-gray-400">({result.reviewCount})</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        title="Pazar Yerinde Görüntüle"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => importMutation.mutate(result.url)}
                        disabled={importingUrl === result.url}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm transition-colors disabled:opacity-70"
                      >
                        {importingUrl === result.url ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            İçe Aktarılıyor...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Ürünü İçe Aktar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query && !isSearching ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Sonuç bulunamadı</h3>
              <p className="text-gray-500 mt-1">
                Farklı bir arama terimi deneyin veya doğrudan ürün URL'sini yapıştırın.
              </p>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Ne arıyorsunuz?</h3>
              <p className="text-gray-500 mt-1">
                Trendyol ve Hepsiburada üzerinde anında arama yapın.
              </p>
              <div className="flex gap-2 justify-center mt-6">
                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600">
                  iPhone 15
                </span>
                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600">
                  Nike Air Max
                </span>
                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600">
                  Sony Kulaklık
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <ToastV2
          title={toast.title}
          message={toast.message}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
