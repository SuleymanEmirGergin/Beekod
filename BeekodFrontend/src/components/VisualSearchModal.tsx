import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Loader2, Search, Package, ArrowRight, ImageIcon } from 'lucide-react';
import { visualSearch } from '../services/inventory';
import { toast } from 'sonner';

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductSelect: (barcode: string) => void;
}

export function VisualSearchModal({ isOpen, onClose, onProductSelect }: VisualSearchModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResults([]);
    }
  };

  const handleRunSearch = async () => {
    if (!file) return;
    setIsSearching(true);
    try {
      const matches = await visualSearch(file);
      setResults(matches);
      if (matches.length === 0) {
        toast.info('Eşleşen ürün bulunamadı.');
      }
    } catch (error) {
      toast.error('Görsel arama başarısız oldu.');
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-100">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 font-display">Görsel Arama</h3>
              <p className="text-sm text-gray-500">Ürünün fotoğrafını çekin veya yükleyin.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-3 border-dashed border-gray-200 rounded-3xl p-12 flex flex-col items-center justify-center hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer group"
            >
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Upload className="w-10 h-10 text-gray-400 group-hover:text-purple-500" />
              </div>
              <p className="text-gray-900 font-bold text-lg">Fotoğraf Yükle veya Sürükle</p>
              <p className="text-gray-500 text-sm mt-2">PNG, JPG veya WebP (Maks. 10MB)</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative aspect-video max-h-64 rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                <img src={preview} className="w-full h-full object-contain" alt="Preview" />
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setResults([]);
                  }}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!isSearching && results.length === 0 && (
                <button
                  onClick={handleRunSearch}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-purple-100 transition-all active:scale-95"
                >
                  <Search className="w-5 h-5" /> AI Taramayı Başlat
                </button>
              )}

              {isSearching && (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />
                    <Search className="w-6 h-6 text-purple-600 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <p className="mt-6 text-gray-900 font-bold animate-pulse">Ürün tanımlanıyor...</p>
                  <p className="text-sm text-gray-500">Kataloğunuzda eşleşme aranıyor.</p>
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Bulunan Sonuçlar
                  </h4>
                  <div className="space-y-3">
                    {results.map((res, idx) => (
                      <button
                        key={idx}
                        onClick={() => onProductSelect(res.product.barcode)}
                        className="w-full flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-purple-400 hover:shadow-md transition-all group text-left"
                      >
                        <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                          {res.product.images?.[0] ? (
                            <img
                              src={res.product.images[0]}
                              className="w-full h-full object-cover"
                              alt={res.product.name}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-bold text-gray-900 line-clamp-1">
                            {res.product.name}
                          </h5>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">{res.product.barcode}</span>
                            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                              %{Math.round(res.confidence * 100)} Eşleşme
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
