import React, { useState } from 'react';

import { Package, Globe, Plus, Search, Info, CheckCircle2, AlertCircle } from 'lucide-react';

interface SearchResult {
    title: string;
    url: string;
    site: string;
    snippet: string;
    image?: string;
    category?: string;
    price?: number;
    currency?: string;
    attributes?: Record<string, string>;
}

interface ProductSearchCardProps {
    results: SearchResult[];
    onImport: (item: SearchResult) => void;
}

export const ProductSearchCard: React.FC<ProductSearchCardProps> = ({ results, onImport }) => {
    if (!results || results.length === 0) return null;

    return (
        <div className="flex flex-col gap-3 my-3 w-full max-w-sm">
            <div className="flex items-center gap-2 px-1">
                <div className="p-1 bg-blue-50 rounded-md">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Web Arama Sonuçları</span>
            </div>

            <div className="flex flex-col gap-2">
                {results.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                        <div className="p-3 flex gap-3">
                            {/* Image Preview */}
                            <div
                                onClick={() => onImport(item)}
                                className="w-16 h-16 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-50 cursor-pointer hover:opacity-80 transition-opacity relative">
                                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-black/60 backdrop-blur-sm rounded-md flex items-center justify-center text-white text-[10px] font-bold z-10">
                                    {idx + 1}
                                </div>
                                {item.image ? (
                                    <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
                                ) : (
                                    <Package className="w-6 h-6 text-gray-300" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start gap-2">
                                        <h4
                                            onClick={() => onImport(item)}
                                            className="text-[11px] font-bold text-gray-900 leading-tight line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                                            title={item.title}>
                                            {item.title}
                                        </h4>
                                        <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium whitespace-nowrap">
                                            {item.site}
                                        </span>
                                    </div>
                                    {item.category && (
                                        <p className="text-[9px] text-blue-500 font-medium mt-1 truncate">
                                            {item.category}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex flex-col">
                                        {item.price ? (
                                            <span className="text-sm font-bold text-gray-900">
                                                {item.price.toLocaleString('tr-TR')} {item.currency === 'USD' ? '$' : item.currency === 'EUR' ? '€' : 'TL'}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-gray-400 italic">Fiyat belirtilmemiş</span>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => onImport(item)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-[10px] font-bold transition-colors shadow-sm"
                                    >
                                        <Plus className="w-3 h-3" /> Sayfama Ekle
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface ImportModalProps {
    item: SearchResult | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: any) => Promise<void>;
}

export const ProductImportModal: React.FC<ImportModalProps> = ({ item, isOpen, onClose, onConfirm }) => {
    const [formData, setFormData] = useState({
        title: '',
        price: 0,
        stock: 10,
        category: '',
        barcode: '',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        if (item) {
            setFormData({
                title: item.title,
                price: item.price || 0,
                stock: 10,
                category: item.category || '',
                barcode: '',
                description: item.snippet || ''
            });
        }
    }, [item]);

    if (!isOpen || !item) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onConfirm({
                ...formData,
                sourceUrl: item.url,
                imageUrl: item.image,
                currency: item.currency || 'TRY'
            });
            onClose();
        } catch (error) {
            console.error('Import failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="bg-gradient-to-r from-[#F5B800] to-[#E5A800] px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Plus className="w-5 h-5 text-gray-900" />
                        <h3 className="text-sm font-bold text-gray-900">Ürünü Sayfana Ekle</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-lg text-gray-900">
                        <Plus className="w-5 h-5 rotate-45" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Ürün Adı</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-1 focus:ring-[#F5B800] outline-none"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Fiyat ({item.currency || 'TRY'})</label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-1 focus:ring-[#F5B800] outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Stok Adeti</label>
                                <input
                                    type="number"
                                    value={formData.stock}
                                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-1 focus:ring-[#F5B800] outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Kategori</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="Seçilmedi"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-1 focus:ring-[#F5B800] outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Barkod (Opsiyonel)</label>
                                <input
                                    type="text"
                                    value={formData.barcode}
                                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                                    placeholder="Otomatik oluşturulur"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-1 focus:ring-[#F5B800] outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Açıklama</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-1 focus:ring-[#F5B800] outline-none resize-none"
                            />
                        </div>

                        {item.attributes && Object.keys(item.attributes).length > 0 && (
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Teknik Özellikler</label>
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
                                    {Object.entries(item.attributes).map(([key, val], i) => (
                                        <div key={i} className="flex justify-between gap-2 text-[10px]">
                                            <span className="text-gray-500 font-medium">{key}:</span>
                                            <span className="text-gray-900 font-bold text-right">{val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? 'Kaydediliyor...' : 'Ürünü Şimdi Ekle'}
                    </button>

                    <p className="text-[10px] text-gray-400 text-center px-4">
                        Bu ürün {item.site} üzerinden çekilen bilgilerle kaydedilecek.
                    </p>
                </form>
            </div>
        </div>
    );
};
