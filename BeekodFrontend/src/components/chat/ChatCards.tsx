import React from 'react';
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  BarChart2,
  Eye,
  Edit3,
  ExternalLink,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// --- Product Card ---
export const ProductCard: React.FC<{
  product: any;
  onAction?: (action: string, barcode: string) => void;
}> = ({ product, onAction }) => {
  if (!product) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden my-2 max-w-sm">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-8 h-8 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-900 truncate">{product.name}</h4>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{product.barcode}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-bold text-gray-900">
                {product.price} {product.currency}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  product.stock < 10 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                }`}
              >
                Stok: {product.stock}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={() => onAction?.('VIEW_PRODUCT', product.barcode)}
            className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <Eye className="w-3.5 h-3.5" /> Detaylar
          </button>
          <button
            onClick={() => onAction?.('UPDATE_PRODUCT', product.barcode)}
            className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
          >
            <Edit3 className="w-3.5 h-3.5" /> Düzenle
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Stats Card ---
export const StatsCard: React.FC<{
  label: string;
  value: string | number;
  trend?: number;
  icon?: 'sales' | 'products' | 'alert' | 'profit';
}> = ({ label, value, trend, icon }) => {
  const Icon = {
    sales: DollarSign,
    products: Package,
    alert: AlertTriangle,
    profit: TrendingUp,
  }[icon || 'sales'];

  return (
    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 my-1">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          icon === 'alert' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">{value}</span>
          {trend !== undefined && (
            <span
              className={`text-[10px] font-bold flex items-center ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {trend >= 0 ? (
                <TrendingUp className="w-2.5 h-2.5" />
              ) : (
                <TrendingDown className="w-2.5 h-2.5" />
              )}
              %{Math.abs(trend)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Analytics Chart ---
export const AnalyticsChart: React.FC<{
  data: any[];
  type?: 'line' | 'bar';
  title?: string;
}> = ({ data, type = 'line', title }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm my-2 h-64">
      {title && <h4 className="text-xs font-bold text-gray-900 mb-4">{title}</h4>}
      <ResponsiveContainer width="100%" height="85%">
        {type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
            <YAxis fontSize={10} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ fontWeight: 'bold', fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: '#3b82f6' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
            <YAxis fontSize={10} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: '#f9fafb' }}
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

// --- Product List ---
export const ProductList: React.FC<{
  items: any[];
  title?: string;
  onItemClick?: (barcode: string) => void;
}> = ({ items, title, onItemClick }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden my-2">
      {title && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 italic text-xs font-medium text-gray-600">
          {title}
        </div>
      )}
      <div className="divide-y divide-gray-50">
        {items.map((item, idx) => (
          <div
            key={item.barcode || idx}
            className="p-3 hover:bg-gray-50 transition-colors flex items-center gap-3 cursor-pointer"
            onClick={() => onItemClick?.(item.barcode)}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                item.stock < 10 ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
              }`}
            >
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold text-gray-900 truncate">{item.name}</h5>
              <p className="text-[10px] text-gray-500">
                {item.barcode} • Stok: {item.stock}
              </p>
            </div>
            <div className="text-xs font-bold text-gray-900 whitespace-nowrap">
              {item.price} {item.currency}
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-300" />
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Content Card ---
import { useState } from 'react';
import { Copy, Check, Sparkles } from 'lucide-react';

export const ContentCard = ({ data }: { data: any }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const platformLabels: Record<string, string> = {
    seo: 'SEO',
    instagram: 'Instagram',
    facebook: 'Facebook',
    twitter: 'Twitter',
    tiktok: 'TikTok',
    translation: 'Çeviri/Translation',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-2 max-w-sm">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 border-b border-indigo-100 flex justify-between items-center">
        <div>
          <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            {data.title || 'İçerik'}
          </h4>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
            {platformLabels[data.platform] || data.platform || 'Content'}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-gray-700"
          title="Kopyala"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="p-4 bg-gray-50/50">
        <div className="prose prose-sm max-w-none text-gray-700 text-xs whitespace-pre-wrap font-mono bg-white p-3 rounded-lg border border-gray-200">
          {data.text}
        </div>
      </div>

      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-[10px] text-center text-gray-400">
        Gemini AI tarafından oluşturuldu ✨
      </div>
    </div>
  );
};
