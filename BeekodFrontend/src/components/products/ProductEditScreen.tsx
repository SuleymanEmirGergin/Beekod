
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Save, Plus, Trash, Globe, Truck, Tag, Layers,
    Settings, Image as ImageIcon, Sparkles, Link as LinkIcon, RefreshCw,
    ExternalLink, X, Video, Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, updateProduct, createProduct, Product, ProductPrice, getProductPrices, addProductPrice, deleteProductPrice } from '../../services/products';
import { generateAIVideo } from '../../services/video';
import { ToastV2 } from '../shared/ToastV2';
import { getProductPreview } from '../../services/productImportService'; // New import
import { mapExternalAttributes, buildRichDescription, CATEGORY_SCHEMAS } from '../../services/attributeService'; // New import

type Tab = 'general' | 'attributes' | 'pricing' | 'cargo' | 'seo';

export function ProductEditScreen() {
    const { barcode } = useParams<{ barcode: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const importState = location.state as any; // { source, title, price, ... }

    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [activeLang, setActiveLang] = useState<'tr' | 'en'>('tr'); // New: Language State
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({ title: '', message: '' });
    const [showPriceModal, setShowPriceModal] = useState(false); // New: Price Modal State
    const [isVideoLoading, setIsVideoLoading] = useState(false);

    // Helper to get/set localized values
    const getLocalizedValue = (field: 'name' | 'description') => {
        if (activeLang === 'tr') return formData[field] || '';
        return formData.translations?.['en']?.[field] || '';
    };

    const setLocalizedValue = (field: 'name' | 'description', value: string) => {
        if (activeLang === 'tr') {
            setFormData({ ...formData, [field]: value });
        } else {
            const currentTranslations = formData.translations || {};
            const enTranslation = currentTranslations['en'] || {};
            setFormData({
                ...formData,
                translations: {
                    ...currentTranslations,
                    en: { ...enTranslation, [field]: value }
                }
            });
        }
    };

    // Form State
    const [formData, setFormData] = useState<Partial<Product> & { attributes?: Record<string, string> }>({});
    const [prices, setPrices] = useState<ProductPrice[]>([]);
    const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
    const [missingAttributes, setMissingAttributes] = useState<string[]>([]);

    // Fetch Product (Edit Mode)
    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: getProducts,
        enabled: !!barcode
    });

    const product = barcode ? products?.find(p => p.barcode === barcode) : null;

    // Fetch Prices (Edit Mode Only)
    const { data: fetchedPrices } = useQuery({
        queryKey: ['product-prices', barcode],
        queryFn: () => getProductPrices(barcode || ''),
        enabled: !!barcode
    });

    // Effect: Prefill for Edit Mode
    useEffect(() => {
        if (product) {
            setFormData(product);
        }
    }, [product]);

    const handleAIAutoFill = async () => {
        if (!importState?.productUrl) return;

        setIsLoadingAttributes(true);
        try {
            const preview = await getProductPreview(importState.productUrl);

            if (preview && (preview.attributes || preview.prefillAttributes)) {
                // Prefer backend normalized attributes (prefillAttributes) over raw attributes
                const rawAttrs = preview.attributes || {};
                const mappedAttrs = preview.prefillAttributes || mapExternalAttributes(rawAttrs);

                // Extract brand from raw attributes (it's usually "Marka" in Turkish sites)
                const brandFromAttrs = rawAttrs["Marka"] || rawAttrs["marka"] || rawAttrs["brand"] || rawAttrs["Brand"] || "";

                // Auto-generate rich description (PLAIN TEXT for textarea)
                // Avoid HTML tags since we use a standard textarea
                let richDescription = preview.snippet || importState.snippet || "";

                // Append bullet points as plain text
                const attrEntries = Object.entries(mappedAttrs);
                if (attrEntries.length > 0) {
                    richDescription += "\n\nÖne Çıkan Özellikler:\n";
                    attrEntries.forEach(([key, val]) => {
                        richDescription += `• ${key}: ${val}\n`;
                    });
                }

                // Heuristic Category Detection
                // If backend didn't return a category, try to guess based on attributes
                let detectedCategory = formData.category || preview.category || "";
                if (!detectedCategory) {
                    const keys = Object.keys(mappedAttrs);
                    if (keys.includes("RAM") || keys.includes("Hafıza") || keys.includes("İşletim Sistemi")) {
                        detectedCategory = "Cep Telefonu";
                    } else if (keys.includes("İşlemci") && keys.includes("Ekran Kartı")) {
                        detectedCategory = "Bilgisayar";
                    } else {
                        // Always fallback to "Genel" to ensure form is populated
                        detectedCategory = "Genel";
                    }
                }

                // Final Fallback: If still no category but we have attributes, set to "Genel"
                // (Redundant but safe check removed as logic above covers it)

                setFormData(prev => ({
                    ...prev,
                    description: richDescription,
                    category: detectedCategory,
                    brand: prev.brand || brandFromAttrs, // Populate brand from Marka attribute
                    attributes: mappedAttrs
                }));

                setToastMessage({ title: 'AI Otomatik Doldurma', message: 'Ürün özellikleri ve açıklama otomatik dolduruldu.' });
                setShowToast(true);
            }
        } catch (err) {
            console.error("Failed to auto-fill attributes", err);
            setToastMessage({ title: 'Hata', message: 'Otomatik doldurma başarısız oldu.' });
            setShowToast(true);
        } finally {
            setIsLoadingAttributes(false);
        }
    };

    // Effect: Prefill for Create/Import Mode
    useEffect(() => {
        if (!barcode && importState) {
            const passedAttributes = importState.attributes || {};
            const hasAttributes = Object.keys(passedAttributes).length > 0;

            // Map passed attributes immediately using service
            const mappedAttributes = hasAttributes ? mapExternalAttributes(passedAttributes) : {};

            // Phase 1: Fast Prefill (Title, Price, Attributes if available)
            setFormData(prev => ({
                ...prev,
                name: importState.title || '',
                price: importState.price || 0,
                currency: importState.currency || 'TRY',
                category: importState.categoryHint || importState.category || '',
                brand: importState.brandHint || '',
                images: importState.imageUrl ? [importState.imageUrl] : [],
                attributes: hasAttributes ? mappedAttributes : prev.attributes
            }));

            // Phase 2: Async Attribute Extraction (Only if we don't have attributes yet)
            // If we already have attributes from the search result (e.g. from Title Regex), 
            // we might still want to fetch the page for *more* details (description, images), 
            // but we shouldn't overwrite existing good data.
            if (importState.productUrl && !hasAttributes) {
                handleAIAutoFill();
            } else if (hasAttributes) {
                // If we have attributes but maybe no description, let's just create a basic description
                let richDesc = importState.snippet || "";

                // Append extracted attributes to description for visibility
                const attrEntries = Object.entries(mappedAttributes);
                if (attrEntries.length > 0) {
                    richDesc += "\n\nÖne Çıkan Özellikler:\n";
                    attrEntries.forEach(([key, val]) => {
                        richDesc += `• ${key}: ${val}\n`;
                    });
                }

                setFormData(prev => ({ ...prev, description: richDesc }));
            }
        }
    }, [barcode, importState]);

    // Effect: Calculate missing attributes based on category
    useEffect(() => {
        if (formData.category) {
            // Find closest matching schema
            const schemaKey = Object.keys(CATEGORY_SCHEMAS).find(k => formData.category?.includes(k)) || 'default';
            const requiredFields = CATEGORY_SCHEMAS[schemaKey] || [];

            const filledKeys = Object.keys(formData.attributes || {});
            const missing = requiredFields.filter(f => !filledKeys.includes(f));
            setMissingAttributes(missing);
        }
    }, [formData.category, formData.attributes]);

    useEffect(() => {
        if (fetchedPrices) {
            setPrices(fetchedPrices);
        }
    }, [fetchedPrices]);

    const saveMutation = useMutation({
        mutationFn: async (data: Partial<Product>) => {
            if (barcode) {
                return updateProduct(barcode, data);
            } else {
                const payload = {
                    ...data,
                    stock: data.stock || 0,
                    barcode: data.barcode || `AUTO-${Date.now()}`,
                } as any;
                return createProduct(payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setToastMessage({ title: 'Başarılı', message: `Ürün başarıyla ${barcode ? 'güncellendi' : 'oluşturuldu'}` });
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
                navigate('/products');
            }, 1500);
        }
    });

    const handleSave = () => {
        if (!formData.name) {
            setToastMessage({ title: 'Hata', message: 'Ürün Adı zorunludur.' });
            setShowToast(true);
            return;
        }
        saveMutation.mutate(formData);
    };

    if (barcode && !product && !products) return <div className="p-8 text-center bg-gray-50 flex items-center justify-center">Ürün yükleniyor...</div>;

    const isImportMode = !barcode && importState?.source;

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/products')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">
                            {barcode ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {barcode ? `Barkod: ${barcode}` : 'Yeni bir envanter kalemi oluşturun'}
                        </p>
                    </div>
                </div>

                {/* Source Context Card */}
                {isImportMode && (
                    <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="flex flex-col">
                            <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">İçe Aktarma Kaynağı</span>
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 capitalize">
                                {importState.source}
                                <span className="text-xs font-normal text-gray-500">|</span>
                                {importState.price} {importState.currency}
                            </div>
                        </div>
                        {importState.productUrl && (
                            <a href={importState.productUrl} target="_blank" rel="noopener noreferrer"
                                className="p-2 bg-white rounded-md border border-gray-200 hover:text-blue-600 transition-colors">
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                )}

                <button
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {saveMutation.isPending ? 'Kaydediliyor...' : 'Ürünü Kaydet'}
                </button>
            </header>

            {/* Tabs */}
            <div className="px-6 pt-4 border-b border-gray-200 bg-white">
                <div className="flex gap-6 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'general', label: 'Genel Bilgiler', icon: Settings },
                        { id: 'attributes', label: 'Özellikler & Detaylar', icon: Layers },
                        { id: 'pricing', label: 'Fiyatlandırma', icon: Tag },
                        { id: 'cargo', label: 'Kargo & Gönderim', icon: Truck },
                        { id: 'seo', label: 'SEO & Meta Verileri', icon: Globe },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`flex items-center gap-2 pb-4 px-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'border-[#F5B800] text-[#B8934D]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="font-medium text-sm">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <div className="max-w-7xl mx-auto">

                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-medium text-gray-900">Ürün Bilgileri</h3>
                                        {/* Language Tabs */}
                                        <div className="flex bg-gray-100 p-1 rounded-lg">
                                            <button
                                                onClick={() => setActiveLang('tr')}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeLang === 'tr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                TR (Türkçe)
                                            </button>
                                            <button
                                                onClick={() => setActiveLang('en')}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeLang === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                EN (English)
                                            </button>
                                        </div>
                                    </div>

                                    {/* Product Type Selection */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Tipi</label>
                                        <div className="flex gap-4">
                                            {[
                                                { id: 'standard', label: 'Standart Ürün' },
                                                { id: 'packet', label: 'Paket / Set' },
                                                { id: 'digital', label: 'Dijital Ürün' }
                                            ].map(type => (
                                                <label key={type.id} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="product_type"
                                                        className="text-[#F5B800] focus:ring-[#F5B800]"
                                                        checked={(formData.product_type || 'standard') === type.id}
                                                        onChange={() => setFormData({ ...formData, product_type: type.id as any })}
                                                    />
                                                    <span className="text-sm text-gray-700">{type.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Ürün Adı ({activeLang.toUpperCase()}) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={getLocalizedValue('name')}
                                                onChange={e => setLocalizedValue('name', e.target.value)}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F5B800] outline-none"
                                                placeholder={activeLang === 'tr' ? 'Örn: iPhone 15 Pro Max' : 'Ex: iPhone 15 Pro Max'}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Açıklama ({activeLang.toUpperCase()})
                                            </label>
                                            <textarea
                                                rows={6}
                                                value={getLocalizedValue('description')}
                                                onChange={e => setLocalizedValue('description', e.target.value)}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F5B800] outline-none resize-none font-mono text-sm"
                                                placeholder={activeLang === 'tr' ? 'Ürün detaylarını buraya girin...' : 'Enter product details here...'}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-medium text-gray-900">Medya</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    if (!formData.images?.[0]) {
                                                        setToastMessage({ title: 'Hata', message: 'Video için en az bir görsel gerekli.' });
                                                        setShowToast(true);
                                                        return;
                                                    }
                                                    setIsVideoLoading(true);
                                                    try {
                                                        await generateAIVideo(barcode || 'unknown', 'creative');
                                                        setToastMessage({ title: 'Başarılı', message: 'Video oluşturma başlatıldı!' });
                                                        setShowToast(true);
                                                    } catch (e) {
                                                        console.error(e);
                                                        setToastMessage({ title: 'Hata', message: 'Video servisine ulaşılamadı.' });
                                                        setShowToast(true);
                                                    } finally {
                                                        setIsVideoLoading(false);
                                                    }
                                                }}
                                                disabled={isVideoLoading}
                                                className="text-sm text-purple-600 font-medium hover:underline flex items-center gap-1 disabled:opacity-50">
                                                {isVideoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                                                {isVideoLoading ? 'Oluşturuluyor...' : 'Viral Video Oluştur (AI)'}
                                            </button>
                                            <button className="text-sm text-[#B8934D] font-medium hover:underline flex items-center gap-1">
                                                <Plus className="w-4 h-4" /> Görsel Ekle
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                        {formData.images && formData.images.length > 0 ? (
                                            formData.images.map((img, idx) => (
                                                <div key={idx} className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden group">
                                                    <img src={img} alt={`Ürün ${idx}`} className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => {
                                                            const newImages = formData.images?.filter((_, i) => i !== idx);
                                                            setFormData({ ...formData, images: newImages });
                                                        }}
                                                        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-full py-8 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg text-gray-400 bg-gray-50/50">
                                                <ImageIcon className="w-8 h-8 mb-2" />
                                                <span className="text-sm">Henüz görsel eklenmedi</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Ürün Tanımlama</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Ürün Kodu / SKU</label>
                                            <input
                                                type="text"
                                                value={formData.product_code || ''}
                                                onChange={e => setFormData({ ...formData, product_code: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Barkod</label>
                                            <input
                                                type="text"
                                                value={formData.barcode || ''}
                                                onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                                                disabled={!!barcode}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-sm bg-gray-50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Organizasyon</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Marka</label>
                                            <input
                                                type="text"
                                                value={formData.brand || ''}
                                                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Kategori</label>
                                            <input
                                                type="text"
                                                value={formData.category || ''}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Hazırlık Süresi (Gün)</label>
                                            <input
                                                type="number"
                                                value={formData.preparation_days ?? 3}
                                                onChange={e => setFormData({ ...formData, preparation_days: parseInt(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Stok & Fiyat</h3>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Stok</label>
                                            <input
                                                type="number"
                                                value={formData.stock || 0}
                                                onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Birim</label>
                                            <select
                                                value={formData.unit || 'adet'}
                                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-sm bg-white"
                                            >
                                                <option value="adet">Adet</option>
                                                <option value="kg">Kg</option>
                                                <option value="gr">Gram</option>
                                                <option value="lt">Litre</option>
                                                <option value="m">Metre</option>
                                                <option value="koli">Koli</option>
                                                <option value="set">Set</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">KDV (%)</label>
                                            <input
                                                type="number"
                                                value={formData.vat_rate || 18}
                                                onChange={e => setFormData({ ...formData, vat_rate: parseInt(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Temel Fiyat</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={formData.price || 0}
                                                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-sm pr-12 font-semibold"
                                                />
                                                <span className="absolute right-3 top-2 text-gray-400 text-sm">{formData.currency || 'TRY'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center pt-5">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" className="rounded text-[#F5B800] focus:ring-[#F5B800]" />
                                                <span className="text-sm text-gray-600">Döviz Kuru ile Otomatik Güncelle</span>
                                            </label>
                                        </div>
                                    </div>

                                    {isImportMode && (
                                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                                                <div>
                                                    <h4 className="text-sm font-semibold text-purple-900">AI Otomatik Doldurma</h4>
                                                    <p className="text-xs text-purple-700 mt-1 mb-3">Açıklama ve teknik özellikleri kaynak URL'den çekin.</p>
                                                    <button
                                                        onClick={handleAIAutoFill}
                                                        disabled={isLoadingAttributes}
                                                        className="text-xs bg-white border border-purple-200 text-purple-700 px-3 py-1.5 rounded-md hover:bg-purple-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                                        {isLoadingAttributes ? (
                                                            <>
                                                                <RefreshCw className="w-3 h-3 animate-spin" />
                                                                Analiz Ediliyor...
                                                            </>
                                                        ) : (
                                                            'Otomatik Doldurmayı Başlat'
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pricing Tab */}
                    {activeTab === 'pricing' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[400px]">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium text-gray-900">Fiyat Geçmişi & Katmanlar</h3>
                                    <button
                                        onClick={() => setShowPriceModal(true)}
                                        className="flex items-center gap-2 text-sm text-[#B8934D] font-medium hover:underline">
                                        <Plus className="w-4 h-4" /> Fiyat Kuralı Ekle
                                    </button>
                                </div>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                            <tr>
                                                <th className="px-6 py-3">Tür</th>
                                                <th className="px-6 py-3">Fiyat</th>
                                                <th className="px-6 py-3">Başlangıç</th>
                                                <th className="px-6 py-3">Bitiş</th>
                                                <th className="px-6 py-3">İşlemler</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {prices.length > 0 ? prices.map(p => (
                                                <tr key={p.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium">{p.price_type}</td>
                                                    <td className="px-6 py-4">{p.price} {p.currency}</td>
                                                    <td className="px-6 py-4">{p.start_date ? new Date(p.start_date).toLocaleDateString() : '-'}</td>
                                                    <td className="px-6 py-4">{p.end_date ? new Date(p.end_date).toLocaleDateString() : '-'}</td>
                                                    <td className="px-6 py-4">
                                                        <button onClick={() => deleteProductPrice(barcode!, p.id)} className="text-red-600 hover:text-red-700">
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">Tanımlanmış özel fiyat bulunamadı.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'attributes' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[400px]">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Kategori Özellikleri: {formData.category || 'Genel'}</h3>

                            {isLoadingAttributes && (
                                <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg text-sm mb-4 animate-pulse">
                                    <Sparkles className="w-4 h-4" />
                                    AI, ürün özelliklerini analiz ediyor ve çıkarıyor...
                                </div>
                            )}

                            {missingAttributes.length > 0 && !isLoadingAttributes && (
                                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg text-sm mb-6">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span>Eksik Nitelikler: {missingAttributes.join(', ')}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                {/* Dynamic Form Rendering */}
                                {(CATEGORY_SCHEMAS[Object.keys(CATEGORY_SCHEMAS).find(k => formData.category?.includes(k)) || 'default'] || []).map(attr => (
                                    <div key={attr}>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{attr}</label>
                                        <input
                                            type="text"
                                            value={formData.attributes?.[attr] || ''}
                                            onChange={e => setFormData({
                                                ...formData,
                                                attributes: { ...formData.attributes, [attr]: e.target.value }
                                            })}
                                            className={`w-full px-4 py-2.5 border rounded-lg outline-none bg-white transition-colors ${formData.attributes?.[attr]
                                                ? 'border-green-200 bg-green-50/30 focus:border-green-500'
                                                : 'border-gray-200 focus:border-[#F5B800]'
                                                }`}
                                            placeholder={`${attr} giriniz...`}
                                        />
                                    </div>
                                ))}

                                {/* Extra attributes not in schema but found */}
                                {Object.keys(formData.attributes || {}).map(key => {
                                    const schemaKey = Object.keys(CATEGORY_SCHEMAS).find(k => formData.category?.includes(k)) || 'default';
                                    const schema = CATEGORY_SCHEMAS[schemaKey] || [];
                                    if (schema.includes(key)) return null; // Already rendered above

                                    return (
                                        <div key={key}>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{key} (Ekstra)</label>
                                            <input
                                                type="text"
                                                value={formData.attributes?.[key] || ''}
                                                onChange={e => setFormData({
                                                    ...formData,
                                                    attributes: { ...formData.attributes, [key]: e.target.value }
                                                })}
                                                className="w-full px-4 py-2.5 border border-indigo-100 bg-indigo-50/20 rounded-lg outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'cargo' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[400px]">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium text-gray-900">Gönderim Bilgileri</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Desi</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={formData.cargo_desi || ''}
                                                onChange={e => setFormData({ ...formData, cargo_desi: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Paket Ağırlığı (kg)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={formData.weight || ''}
                                                onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Kargo Firması</label>
                                        <select
                                            value={formData.cargo_company || ''}
                                            onChange={e => setFormData({ ...formData, cargo_company: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none bg-white"
                                        >
                                            <option value="">Seçiniz</option>
                                            <option value="yurtici">Yurtiçi Kargo</option>
                                            <option value="aras">Aras Kargo</option>
                                            <option value="mng">MNG Kargo</option>
                                            <option value="surat">Sürat Kargo</option>
                                            <option value="ptt">PTT Kargo</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium text-gray-900">Paket Boyutları (cm)</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">En</label>
                                            <input
                                                type="number"
                                                value={formData.width || ''}
                                                onChange={e => setFormData({ ...formData, width: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Boy</label>
                                            <input
                                                type="number"
                                                value={formData.height || ''}
                                                onChange={e => setFormData({ ...formData, height: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Yükseklik</label>
                                            <input
                                                type="number"
                                                value={formData.length || ''}
                                                onChange={e => setFormData({ ...formData, length: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <div className="flex gap-2">
                                            <Truck className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <h4 className="text-sm font-bold text-blue-900">Kargo Hesaplaması</h4>
                                                <p className="text-xs text-blue-700 mt-1">
                                                    Girdiğiniz boyutlar ve ağırlığa göre tahmini kargo maliyeti: <span className="font-bold">₺{(formData.cargo_desi || 1) * 15 + 25}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'seo' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[400px]">
                            <h3 className="text-lg font-medium text-gray-900 mb-6">SEO & Meta Verileri</h3>
                            <p className="text-gray-500 italic">SEO optimizasyonu özellikleri yakında eklenecek.</p>
                        </div>
                    )}

                </div>
            </div>

            {showToast && (
                <ToastV2
                    title={toastMessage.title}
                    message={toastMessage.message}
                    isVisible={showToast}
                    onClose={() => setShowToast(false)}
                />
            )}

            {/* Simple Price Modal */}
            {showPriceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Yeni Fiyat Kuralı</h3>
                            <button onClick={() => setShowPriceModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Fiyat Tipi</label>
                                <select id="priceType" className="w-full border rounded-lg p-2">
                                    <option value="SALE">İndirimli Fiyat</option>
                                    <option value="VIP">VIP Özel Fiyat</option>
                                    <option value="WHOLESALE">Toptan Fiyat</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Fiyat</label>
                                <input type="number" id="priceValue" className="w-full border rounded-lg p-2" placeholder="0.00" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Başlangıç</label>
                                    <input type="date" id="startDate" className="w-full border rounded-lg p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Bitiş</label>
                                    <input type="date" id="endDate" className="w-full border rounded-lg p-2" />
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    // Mock implementation for demo
                                    setPrices(prev => [...prev, {
                                        id: Date.now(),
                                        barcode: barcode || 'TEMP',
                                        price: parseFloat((document.getElementById('priceValue') as HTMLInputElement).value),
                                        currency: 'TRY',
                                        price_type: (document.getElementById('priceType') as HTMLSelectElement).value as any,
                                        start_date: (document.getElementById('startDate') as HTMLInputElement).value,
                                        end_date: (document.getElementById('endDate') as HTMLInputElement).value,
                                        priority: 1
                                    }]);
                                    setShowPriceModal(false);
                                    setToastMessage({ title: 'Eklendi', message: 'Fiyat kuralı listeye eklendi (Kaydetmeyi unutmayın)' });
                                    setShowToast(true);
                                }}
                                className="w-full py-2 bg-[#F5B800] rounded-lg font-bold mt-2">
                                Ekle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
