import { useState, useEffect } from 'react';
import { Plus, Trash2, Box, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Variant {
  sku: string;
  description: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}

interface VariantEditorProps {
  initialVariants?: Variant[];
  onChange: (variants: Variant[]) => void;
  basePrice: number;
  baseStock: number;
}

export function VariantEditor({
  initialVariants = [],
  onChange,
  basePrice,
  baseStock,
}: VariantEditorProps) {
  const [variants, setVariants] = useState<Variant[]>(initialVariants);
  const [attributes, setAttributes] = useState<{ name: string; values: string[] }[]>([
    { name: 'Renk', values: [] },
    { name: 'Beden', values: [] },
  ]);

  useEffect(() => {
    onChange(variants);
  }, [variants]);

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        sku: `VAR-${Date.now()}`,
        description: 'Yeni Varyant',
        price: basePrice,
        stock: 0,
        attributes: {},
      },
    ]);
  };

  const removeVariant = (index: number) => {
    const next = [...variants];
    next.splice(index, 1);
    setVariants(next);
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const next = [...variants];
    next[index] = { ...next[index], [field]: value };
    setVariants(next);
  };

  const updateAttribute = (index: number, key: string, value: string) => {
    const next = [...variants];
    next[index] = {
      ...next[index],
      attributes: { ...next[index].attributes, [key]: value },
    };
    // Auto generate description
    const attrs = Object.values(next[index].attributes).join(' - ');
    next[index].description = attrs || 'Varyant';
    setVariants(next);
  };

  const generateCombinations = () => {
    // Simple generator: take all values from attributes that have values
    const activeAttributes = attributes.filter((a) => a.values.length > 0);
    if (activeAttributes.length === 0) {
      toast.error('Lütfen önce özellik değerlerini ekleyin (örn: Kırmızı, Mavi)');
      return;
    }

    // Recursive helper to generate Cartesian product
    const cartesian = (args: string[][]) => {
      return args.reduce<string[][]>(
        (a, b) => {
          return a.flatMap((d) => b.map((e) => [d, e].flat()));
        },
        [[]],
      );
    };

    const combinations = cartesian(
      activeAttributes.map((a) => a.values.map((v) => ({ name: a.name, value: v })) as any),
    );

    const newVariants: Variant[] = combinations.map((combo: any[], idx) => {
      const attrs: Record<string, string> = {};
      combo.forEach((c) => (attrs[c.name] = c.value));

      const desc = combo.map((c) => c.value).join(' - ');

      return {
        sku: `VAR-${Date.now()}-${idx}`,
        description: desc,
        price: basePrice,
        stock: Math.floor(baseStock / combinations.length) || 0,
        attributes: attrs,
      };
    });

    if (
      confirm(
        `${newVariants.length} adet varyant oluşturulacak. Mevcut varyantlar silinecek. Onaylıyor musunuz?`,
      )
    ) {
      setVariants(newVariants);
    }
  };

  return (
    <div className="space-y-6 border border-gray-200 rounded-xl p-6 bg-gray-50/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Box className="w-5 h-5 text-[#F5B800]" />
          <h3 className="text-lg font-bold text-gray-900">Varyant Yönetimi</h3>
        </div>
        <button
          onClick={addVariant}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Manuel Ekle
        </button>
      </div>

      {/* Generator Section */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Otomatik Oluşturucu</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attributes.map((attr, idx) => (
            <div key={idx}>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {attr.name} Değerleri (Virgülle ayırın)
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="Örn: S, M, L"
                onChange={(e) => {
                  const vals = e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  const next = [...attributes];
                  next[idx].values = vals;
                  setAttributes(next);
                }}
              />
            </div>
          ))}
        </div>
        <button
          onClick={generateCombinations}
          className="w-full flex items-center justify-center gap-2 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Kombinasyonları Oluştur
        </button>
      </div>

      {/* Variants List */}
      <div className="space-y-3">
        {variants.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Henüz varyant eklenmedi.</div>
        ) : (
          variants.map((variant, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-bottom-2"
            >
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Açıklama / Varyant
                </label>
                <input
                  value={variant.description}
                  onChange={(e) => updateVariant(idx, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#F5B800] outline-none"
                />
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-gray-500 mb-1">SKU</label>
                <input
                  value={variant.sku}
                  onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#F5B800] outline-none"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-gray-500 mb-1">Stok</label>
                <input
                  type="number"
                  value={variant.stock}
                  onChange={(e) => updateVariant(idx, 'stock', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#F5B800] outline-none"
                />
              </div>
              <div className="w-28">
                <label className="block text-xs font-medium text-gray-500 mb-1">Fiyat</label>
                <input
                  type="number"
                  value={variant.price}
                  onChange={(e) => updateVariant(idx, 'price', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#F5B800] outline-none"
                />
              </div>
              <button
                onClick={() => removeVariant(idx)}
                className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors mb-[1px]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
