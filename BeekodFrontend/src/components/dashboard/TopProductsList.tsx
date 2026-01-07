import { ArrowRight } from 'lucide-react';
import { TopSellingProduct } from '../../services/dashboard';

interface TopProductsListProps {
  products: TopSellingProduct[];
}

export function TopProductsList({ products }: TopProductsListProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-gray-900 font-semibold">En Çok Satılan Ürünler</h3>
        <a
          href="#"
          className="flex items-center text-xs text-blue-500 hover:text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full transition-colors"
        >
          Raporu Görüntüle <ArrowRight className="w-3 h-3 ml-1" />
        </a>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <div className="space-y-4">
          {products && products.length > 0 ? (
            products.map((product, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border border-gray-200">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      RESİM
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate" title={product.name}>
                    {product.name}
                  </p>
                  {/* Mock SKU or Category if needed */}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{product.orders}</p>
                  <p className="text-xs text-gray-500">Sipariş</p>
                </div>
                <div className="text-right w-12">
                  <p className="text-sm font-bold text-gray-900">{product.quantity}</p>
                  <p className="text-xs text-gray-500">Miktar</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">Ürün bulunamadı</div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-50 text-center">
        <a
          href="#"
          className="flex items-center justify-center text-xs text-blue-500 hover:text-blue-600 bg-blue-50 px-4 py-2 rounded-lg transition-colors inline-flex w-full"
        >
          Ürünlere Git <ArrowRight className="w-3 h-3 ml-1" />
        </a>
      </div>
    </div>
  );
}
