import { User, Package } from 'lucide-react';
import { Card } from '../ui/card'; // Assuming shadcn card exists or I use div

export function StatsGrid() {
  // Hardcoded counts for "Cariler" and "Ürünler" as requested or fetch?
  // User screen shows "Cariler 187" and "Ürünler 1,102".
  // The API doesn't return these counts yet (only orders stats).
  // I should probably update backend to return these or keep them static/mock for now as per "frontend tasarımlarımı baz alarak"
  // I will make them static for now to match design exactly, or fetch if I can.
  // API returns "orders", "revenue", "returns", "profit".
  // "Cariler" (Customers?) and "Ürünler" (Products) counts might need separate calls or update backend.
  // For MVP speed and pixel perfect match, I'll use static or mock data matching screenshot but enable them to take props later.

  return (
    <div className="grid grid-cols-2 gap-6 mb-6">
      <div className="bg-white rounded-xl p-6 flex items-start justify-between shadow-sm border border-gray-100">
        <div>
          <h3 className="text-gray-500 font-medium mb-2">CARİLER</h3>
          <p className="text-3xl font-bold text-gray-900">187</p>
          <a href="#" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
            Carileri görüntüle
          </a>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <User className="w-6 h-6 text-orange-400" />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 flex items-start justify-between shadow-sm border border-gray-100">
        <div>
          <h3 className="text-gray-500 font-medium mb-2">ÜRÜNLER</h3>
          <p className="text-3xl font-bold text-gray-900">1,102</p>
          <a href="#" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
            Ürünleri görüntüle
          </a>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <Package className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>
  );
}
