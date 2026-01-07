import { useState, useEffect } from 'react';
import { ModalV2 } from './shared/';
import { Badge } from './shared/';
import { Button } from './shared/';
import { Check, Minus, Plus, Bell } from 'lucide-react';
import { InventoryProduct } from '../services/inventory';

interface UpdateInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    productId: string,
    newQuantity: number,
    newPrice: string,
    alertSettings?: { enabled: boolean; threshold: number; costPrice?: number },
  ) => void;
  selectedProduct?: InventoryProduct | null;
}

export function UpdateInventoryModal({
  isOpen,
  onClose,
  onUpdate,
  selectedProduct,
}: UpdateInventoryModalProps) {
  const [stock, setStock] = useState(selectedProduct?.stock || 0);
  const [price, setPrice] = useState(selectedProduct?.numericPrice.toString() || '0');
  const [costPrice, setCostPrice] = useState(selectedProduct?.costPrice?.toString() || '0');
  const [lowStockAlertEnabled, setLowStockAlertEnabled] = useState(
    !!selectedProduct?.alertThreshold,
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    selectedProduct?.alertThreshold?.toString() || '10',
  );

  useEffect(() => {
    if (selectedProduct) {
      setStock(selectedProduct.stock);
      setPrice(selectedProduct.numericPrice.toString());
      setCostPrice(selectedProduct.costPrice?.toString() || '0');
      setLowStockAlertEnabled(!!selectedProduct.alertThreshold);
      setLowStockThreshold(selectedProduct.alertThreshold?.toString() || '10');
    }
  }, [selectedProduct]);

  const handleUpdate = () => {
    if (selectedProduct) {
      const thresholdNum = parseInt(lowStockThreshold) || 10;
      const costNum = parseFloat(costPrice) || 0;
      onUpdate(selectedProduct.id, stock, price, {
        enabled: lowStockAlertEnabled,
        threshold: thresholdNum,
        costPrice: costNum,
      });
    }
    onClose();
  };

  if (!selectedProduct) return null;

  return (
    <ModalV2
      isOpen={isOpen}
      onClose={onClose}
      title="Update Inventory"
      subtitle="Make quick adjustments to product stock levels."
    >
      {/* Product info */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="w-20 h-20 bg-[#FFE5CC] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img
            src={selectedProduct.image}
            alt={selectedProduct.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-sm text-gray-900 mb-1">{selectedProduct.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">SKU: {selectedProduct.sku}</span>
            <Badge
              variant={
                selectedProduct.status === 'In Stock'
                  ? 'success'
                  : selectedProduct.status === 'Low Stock'
                    ? 'warning'
                    : 'error'
              }
              className="text-xs"
            >
              {selectedProduct.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-6">
        {/* Stock Quantity */}
        <div>
          <label className="block text-xs text-[#B8934D] mb-2 uppercase tracking-wide">
            Stock Quantity
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStock(Math.max(0, stock - 1))}
              className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(parseInt(e.target.value) || 0)}
              className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-center text-gray-900 focus:outline-none focus:border-gray-300"
            />
            <button
              onClick={() => setStock(stock + 1)}
              className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Price and Cost Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#B8934D] mb-2 uppercase tracking-wide">
              Unit Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                ₺
              </span>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#B8934D] mb-2 uppercase tracking-wide">
              Maliyet
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                ₺
              </span>
              <input
                type="text"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert Settings */}
      <div className="mt-6 p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-100">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm text-gray-900">Low Stock Alert</h4>
              <button
                onClick={() => setLowStockAlertEnabled(!lowStockAlertEnabled)}
                className="relative"
              >
                <div
                  className={`w-11 h-6 rounded-full transition-colors duration-200 ${lowStockAlertEnabled ? 'bg-[#F5B800]' : 'bg-gray-300'}`}
                ></div>
                <div
                  className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${lowStockAlertEnabled ? 'translate-x-5' : ''}`}
                ></div>
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Get notified when stock falls below the threshold
            </p>

            {lowStockAlertEnabled && (
              <div className="mt-3">
                <label className="block text-xs text-gray-700 mb-2">Alert Threshold (units)</label>
                <input
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-orange-400"
                  placeholder="10"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-8">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleUpdate} className="flex items-center gap-2">
          <Check className="w-4 h-4" />
          Update Stock
        </Button>
      </div>
    </ModalV2>
  );
}
