import {
  X,
  ShoppingBag,
  AlertTriangle,
  Tag,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  Package,
} from 'lucide-react';
import { useState } from 'react';
import trendyolLogo from 'figma:asset/1230e43a58a5ec2cbca646dd9964cda0a5eb57b2.png';
import hepsiburadaLogo from 'figma:asset/563328772dcd4f9d76dd21b5abc99b99a49e8f70.png';

interface ModalProps {
  onClose: () => void;
  onNavigate: (screen: string) => void;
  setToastMessage: (message: { title: string; message: string }) => void;
  handleSyncChannels?: () => void;
}

export function TodaysOrdersModal({ onClose, onNavigate }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-blue-200 shadow-xl shadow-blue-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl text-gray-900">Today's Orders</h3>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 mb-1">Total Orders Today</p>
              <p className="text-3xl text-gray-900">142</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-700 mb-1">Revenue</p>
              <p className="text-2xl text-gray-900">€12,450</p>
            </div>
            <div className="text-right bg-white px-4 py-2 rounded-lg border border-blue-100">
              <p className="text-sm text-green-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +12% vs yesterday
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {[
            {
              id: '8821',
              customer: 'John Smith',
              amount: '€1,234.50',
              status: 'Shipped',
              time: '10:32 AM',
            },
            {
              id: '8820',
              customer: 'Sarah Johnson',
              amount: '€899.00',
              status: 'Processing',
              time: '10:15 AM',
            },
            {
              id: '8819',
              customer: 'Michael Brown',
              amount: '€2,456.00',
              status: 'Delivered',
              time: '09:45 AM',
            },
            {
              id: '8818',
              customer: 'Emma Davis',
              amount: '€567.50',
              status: 'Shipped',
              time: '09:20 AM',
            },
            {
              id: '8817',
              customer: 'James Wilson',
              amount: '€1,890.00',
              status: 'Processing',
              time: '08:55 AM',
            },
          ].map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 to-white hover:from-blue-50 hover:to-blue-50/50 rounded-lg transition-colors border border-blue-100/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-blue-100">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">Order #{order.id}</p>
                  <p className="text-xs text-gray-500">{order.customer}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-900">{order.amount}</p>
                <p className="text-xs text-gray-500">{order.time}</p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs ${
                  order.status === 'Delivered'
                    ? 'bg-green-50 text-green-700'
                    : order.status === 'Shipped'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-yellow-50 text-yellow-700'
                }`}
              >
                {order.status}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onNavigate('orders');
            }}
            className="flex-1 px-4 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
          >
            View All Orders
          </button>
        </div>
      </div>
    </div>
  );
}

export function LowStockAlertsModal({ onClose, onNavigate }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="text-xl text-gray-900">Low Stock Alerts</h3>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 mb-2">
            ⚠️ <span className="font-medium">8 products</span> need immediate restocking
          </p>
          <p className="text-xs text-gray-600">
            Low stock items may result in lost sales if not restocked soon
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              name: 'iPhone 15 Pro Max - 256GB Titanium',
              sku: 'BK-IP15PM-256',
              current: 23,
              threshold: 50,
              urgency: 'high',
            },
            {
              name: 'Apple AirPods Pro 2nd Gen',
              sku: 'BK-APP2-WH',
              current: 18,
              threshold: 30,
              urgency: 'high',
            },
            {
              name: 'Samsung Galaxy S24 Ultra',
              sku: 'BK-SGS24U-512',
              current: 27,
              threshold: 40,
              urgency: 'medium',
            },
            {
              name: 'MacBook Pro 14" M3',
              sku: 'BK-MBP14-M3',
              current: 12,
              threshold: 20,
              urgency: 'high',
            },
            {
              name: 'iPad Air 11" M2',
              sku: 'BK-IPAD-AIR11',
              current: 15,
              threshold: 25,
              urgency: 'medium',
            },
            {
              name: 'Sony WH-1000XM5 Headphones',
              sku: 'BK-SNY-WH1000',
              current: 8,
              threshold: 15,
              urgency: 'high',
            },
          ].map((product) => (
            <div
              key={product.sku}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm text-gray-900 mb-1">{product.name}</p>
                  <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs ${
                    product.urgency === 'high'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-orange-50 text-orange-700'
                  }`}
                >
                  {product.urgency === 'high' ? 'Urgent' : 'Medium'}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Current Stock</span>
                    <span className="text-xs text-gray-900">
                      {product.current} / {product.threshold} units
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${product.urgency === 'high' ? 'bg-red-500' : 'bg-orange-500'}`}
                      style={{ width: `${(product.current / product.threshold) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('inventory');
                  }}
                  className="px-3 py-1.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-xs transition-colors"
                >
                  Restock
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onNavigate('inventory');
            }}
            className="flex-1 px-4 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
          >
            Manage Inventory
          </button>
        </div>
      </div>
    </div>
  );
}

interface PriceChange {
  id: string;
  name: string;
  old: string;
  new: string;
  change: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export function PriceChangesModal({ onClose, setToastMessage }: ModalProps) {
  // Load price changes from localStorage
  const loadPriceChanges = (): PriceChange[] => {
    const saved = localStorage.getItem('beekod_price_changes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: '1',
        name: 'iPhone 15 Pro Max - 256GB Titanium',
        old: '€1,199.00',
        new: '€1,249.00',
        change: '+4.2%',
        reason: 'Demand surge',
        status: 'pending',
      },
      {
        id: '2',
        name: 'Samsung Galaxy S24 Ultra',
        old: '€1,299.00',
        new: '€1,199.00',
        change: '-7.7%',
        reason: 'Competitor pricing',
        status: 'pending',
      },
      {
        id: '3',
        name: 'Apple AirPods Pro 2nd Gen',
        old: '€249.00',
        new: '€269.00',
        change: '+8.0%',
        reason: 'Stock shortage',
        status: 'pending',
      },
      {
        id: '4',
        name: 'MacBook Pro 14" M3',
        old: '€1,999.00',
        new: '€1,899.00',
        change: '-5.0%',
        reason: 'Promotional campaign',
        status: 'approved',
      },
      {
        id: '5',
        name: 'iPad Air 11" M2',
        old: '€749.00',
        new: '€799.00',
        change: '+6.7%',
        reason: 'Supplier cost increase',
        status: 'pending',
      },
    ] as PriceChange[];
  };

  const [priceChanges, setPriceChanges] = useState<PriceChange[]>(loadPriceChanges);

  const pendingCount = priceChanges.filter((p) => p.status === 'pending').length;

  const handleApprove = (id: string) => {
    const approvedPrice = priceChanges.find((p) => p.id === id);

    const updatedPriceChanges = priceChanges.map(
      (price): PriceChange => (price.id === id ? { ...price, status: 'approved' } : price),
    );

    setPriceChanges(updatedPriceChanges);
    localStorage.setItem('beekod_price_changes', JSON.stringify(updatedPriceChanges));

    if (approvedPrice) {
      // Update inventory prices in localStorage
      const inventoryData = localStorage.getItem('beekod_inventory');
      if (inventoryData) {
        const inventory = JSON.parse(inventoryData);
        const updatedInventory = inventory.map((product: any) => {
          // Match product names - handle both exact and partial matches
          if (
            product.name === approvedPrice.name ||
            product.name.includes(approvedPrice.name.split(' -')[0]) ||
            approvedPrice.name.includes(product.name.split(' -')[0])
          ) {
            console.log('Updating price for:', product.name, 'to', approvedPrice.new);
            return { ...product, price: approvedPrice.new };
          }
          return product;
        });
        localStorage.setItem('beekod_inventory', JSON.stringify(updatedInventory));
        console.log('Inventory updated in localStorage');

        // Trigger a storage event to notify other components
        window.dispatchEvent(new Event('storage'));
      }

      setToastMessage({
        title: '✅ Price Change Approved!',
        message: `${approvedPrice.name} updated to ${approvedPrice.new}`,
      });
      setTimeout(() => setToastMessage({ title: '', message: '' }), 3000);
    }
  };

  const handleReject = (id: string) => {
    const rejectedPrice = priceChanges.find((p) => p.id === id);
    const updatedPriceChanges = priceChanges.filter((price) => price.id !== id);

    setPriceChanges(updatedPriceChanges);
    localStorage.setItem('beekod_price_changes', JSON.stringify(updatedPriceChanges));

    if (rejectedPrice) {
      setToastMessage({
        title: '❌ Price Change Rejected',
        message: `${rejectedPrice.name} price change declined`,
      });
      setTimeout(() => setToastMessage({ title: '', message: '' }), 3000);
    }
  };

  const handleApproveAll = () => {
    const pendingItems = priceChanges.filter((p) => p.status === 'pending');

    // Update all prices in localStorage
    const inventoryData = localStorage.getItem('beekod_inventory');
    if (inventoryData) {
      const inventory = JSON.parse(inventoryData);
      const updatedInventory = inventory.map((product: any) => {
        const priceChange = pendingItems.find(
          (p) =>
            product.name === p.name ||
            product.name.includes(p.name.split(' -')[0]) ||
            p.name.includes(product.name.split(' -')[0]),
        );
        if (priceChange) {
          console.log('Approving all - Updating price for:', product.name, 'to', priceChange.new);
          return { ...product, price: priceChange.new };
        }
        return product;
      });
      localStorage.setItem('beekod_inventory', JSON.stringify(updatedInventory));
      console.log('All prices updated in localStorage');

      // Trigger a storage event to notify other components
      window.dispatchEvent(new Event('storage'));
    }

    const updatedPriceChanges = priceChanges.map(
      (price): PriceChange => ({ ...price, status: 'approved' }),
    );
    setPriceChanges(updatedPriceChanges);
    localStorage.setItem('beekod_price_changes', JSON.stringify(updatedPriceChanges));

    setToastMessage({
      title: '🎉 All Approved!',
      message: `${pendingItems.length} price changes have been approved and applied`,
    });
    setTimeout(() => setToastMessage({ title: '', message: '' }), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-purple-200 shadow-xl shadow-purple-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl text-gray-900">AI Price Recommendations</h3>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-100 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-purple-200">
              <Tag className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-sm text-purple-900 font-medium">
              {pendingCount} price update{pendingCount !== 1 ? 's' : ''} pending approval
            </p>
          </div>
          <p className="text-xs text-purple-700">
            Review and approve AI-suggested price changes based on market conditions
          </p>
        </div>

        <div className="space-y-3">
          {priceChanges.map((price) => (
            <div
              key={price.id}
              className="p-4 bg-gradient-to-r from-purple-50/50 to-white hover:from-purple-50 hover:to-purple-50/50 rounded-lg transition-colors border border-purple-100/50"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm text-gray-900 mb-1">{price.name}</p>
                  <p className="text-xs text-purple-600">💡 {price.reason}</p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    price.status === 'approved'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}
                >
                  {price.status === 'approved' ? '✓ Approved' : '⏳ Pending'}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white px-3 py-2 rounded-lg border border-purple-100">
                    <p className="text-xs text-gray-500">Current Price</p>
                    <p className="text-sm text-gray-900">{price.old}</p>
                  </div>
                  <div className="text-purple-400 text-xl">→</div>
                  <div className="bg-white px-3 py-2 rounded-lg border border-purple-100">
                    <p className="text-xs text-gray-500">New Price</p>
                    <p className="text-sm text-gray-900">{price.new}</p>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      price.change.startsWith('+')
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {price.change}
                  </div>
                </div>
                {price.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(price.id)}
                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg text-xs transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(price.id)}
                      className="px-3 py-1.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-xs transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {priceChanges.length === 0 && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-purple-300" />
            </div>
            <p className="text-sm text-gray-500">All price changes reviewed</p>
            <p className="text-xs text-gray-400 mt-1">No pending changes at this time</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm transition-colors"
          >
            Close
          </button>
          {pendingCount > 0 && (
            <button
              onClick={handleApproveAll}
              className="flex-1 px-4 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
            >
              Approve All ({pendingCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SyncStatusModal({ onClose, handleSyncChannels }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-green-200 shadow-xl shadow-green-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl text-gray-900">Sync Status</h3>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-100 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-900 font-medium">All systems operational</p>
          </div>
          <p className="text-xs text-green-700">
            Last sync: 2 minutes ago • Next sync: in 58 minutes
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm text-gray-700 mb-3">Marketplace Connections</h4>
            <div className="space-y-2">
              {[
                {
                  name: 'Trendyol',
                  logo: trendyolLogo,
                  status: 'connected',
                  lastSync: '2 mins ago',
                  products: 234,
                },
                {
                  name: 'Hepsiburada',
                  logo: hepsiburadaLogo,
                  status: 'connected',
                  lastSync: '2 mins ago',
                  products: 189,
                },
              ].map((marketplace) => (
                <div
                  key={marketplace.name}
                  className="p-4 bg-gradient-to-r from-green-50/50 to-white hover:from-green-50 hover:to-green-50/50 rounded-lg transition-colors border border-green-100/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-green-200">
                        <img
                          src={marketplace.logo}
                          alt={marketplace.name}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">{marketplace.name}</p>
                        <p className="text-xs text-gray-500">
                          {marketplace.products} products synced
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-700 font-medium">Connected</span>
                      </div>
                      <p className="text-xs text-gray-500">Last sync: {marketplace.lastSync}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm text-gray-700 mb-3">Sync History</h4>
            <div className="space-y-2">
              {[
                {
                  time: '10:32 AM',
                  action: 'Full inventory sync completed',
                  status: 'success',
                  items: 423,
                },
                {
                  time: '09:15 AM',
                  action: 'Price updates synchronized',
                  status: 'success',
                  items: 15,
                },
                { time: '08:45 AM', action: 'Stock levels updated', status: 'success', items: 234 },
                { time: '08:00 AM', action: 'Order status sync', status: 'success', items: 67 },
              ].map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50/30 to-white rounded-lg border border-green-100/30"
                >
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{log.action}</p>
                    <p className="text-xs text-gray-500">
                      {log.items} items • {log.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              if (handleSyncChannels) handleSyncChannels();
            }}
            className="flex-1 px-4 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Sync Now
          </button>
        </div>
      </div>
    </div>
  );
}
