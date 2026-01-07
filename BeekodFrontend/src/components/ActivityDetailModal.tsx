import {
  X,
  ShoppingBag,
  RefreshCw,
  Tag,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  Clock,
  Package,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

interface ActivityDetail {
  type: 'order' | 'sync' | 'price' | 'alert';
  title: string;
  description: string;
  time: string;
  details: {
    orderId?: string;
    customer?: string;
    customerEmail?: string;
    amount?: string;
    status?: string;
    shippingAddress?: string;
    carrier?: string;
    trackingNumber?: string;
    items?: Array<{ name: string; quantity: number; price: string }>;

    syncType?: string;
    itemsSynced?: number;
    marketplace?: string;
    duration?: string;

    productName?: string;
    sku?: string;
    oldPrice?: string;
    newPrice?: string;
    change?: string;
    reason?: string;
    updatedBy?: string;

    alertType?: string;
    currentStock?: number;
    threshold?: number;
    urgency?: string;
    location?: string;
  };
}

interface ActivityDetailModalProps {
  activity: ActivityDetail | null;
  onClose: () => void;
}

export function ActivityDetailModal({ activity, onClose }: ActivityDetailModalProps) {
  if (!activity) return null;

  const renderOrderDetails = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-700 mb-1">Order ID</p>
            <p className="text-xl text-gray-900">#{activity.details.orderId}</p>
          </div>
          <div
            className={`px-3 py-1.5 rounded-full text-sm ${
              activity.details.status === 'Delivered'
                ? 'bg-green-50 text-green-700'
                : activity.details.status === 'Shipped'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-yellow-50 text-yellow-700'
            }`}
          >
            {activity.details.status}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-600">Total Amount</p>
            <p className="text-lg text-gray-900">{activity.details.amount}</p>
          </div>
          <div className="h-8 w-px bg-blue-200"></div>
          <div>
            <p className="text-xs text-gray-600">Placed</p>
            <p className="text-sm text-gray-900">{activity.time}</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm text-gray-700 mb-3">Customer Information</h4>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900">{activity.details.customer}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{activity.details.shippingAddress}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm text-gray-700 mb-3">Shipping Details</h4>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Carrier</span>
            <span className="text-sm text-gray-900">{activity.details.carrier}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Tracking Number</span>
            <span className="text-sm text-gray-900 font-mono">
              {activity.details.trackingNumber}
            </span>
          </div>
        </div>
      </div>

      {activity.details.items && (
        <div>
          <h4 className="text-sm text-gray-700 mb-3">Order Items</h4>
          <div className="space-y-2">
            {activity.details.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-900">{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSyncDetails = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-gray-900">Sync completed successfully</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Items Synced</p>
            <p className="text-xl text-gray-900">{activity.details.itemsSynced}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Duration</p>
            <p className="text-lg text-gray-900">{activity.details.duration}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Status</p>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700">Success</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm text-gray-700 mb-3">Sync Details</h4>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Marketplace</span>
            <span className="text-sm text-gray-900">{activity.details.marketplace}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Sync Type</span>
            <span className="text-sm text-gray-900">{activity.details.syncType}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Started</span>
            <span className="text-sm text-gray-900">{activity.time}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm text-gray-700 mb-3">Synchronized Items</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Products</p>
            <p className="text-lg text-gray-900">234</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Prices</p>
            <p className="text-lg text-gray-900">189</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPriceDetails = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-700 mb-1">Product</p>
            <p className="text-lg text-gray-900">{activity.details.productName}</p>
            <p className="text-xs text-gray-500">SKU: {activity.details.sku}</p>
          </div>
          <div className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-sm">
            Pending Approval
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm text-gray-700 mb-3">Price Change</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Current Price</p>
              <p className="text-xl text-gray-900">{activity.details.oldPrice}</p>
            </div>
            <div className="text-gray-400 text-2xl">→</div>
            <div>
              <p className="text-xs text-gray-600 mb-1">New Price</p>
              <p className="text-xl text-gray-900">{activity.details.newPrice}</p>
            </div>
            <div
              className={`px-3 py-1.5 rounded-lg ${
                activity.details.change?.startsWith('+')
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {activity.details.change}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm text-gray-700 mb-3">Change Information</h4>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Reason</span>
            <span className="text-sm text-gray-900">{activity.details.reason}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Updated By</span>
            <span className="text-sm text-gray-900">{activity.details.updatedBy}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Timestamp</span>
            <span className="text-sm text-gray-900">{activity.time}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAlertDetails = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-gray-900">Low Stock Alert</p>
        </div>
        <div className="mb-3">
          <p className="text-lg text-gray-900 mb-1">{activity.details.productName}</p>
          <p className="text-xs text-gray-500">SKU: {activity.details.sku}</p>
        </div>
        <div
          className={`px-3 py-1.5 rounded-full text-sm inline-block ${
            activity.details.urgency === 'critical'
              ? 'bg-red-50 text-red-700'
              : 'bg-orange-50 text-orange-700'
          }`}
        >
          {activity.details.urgency === 'critical' ? 'Critical' : 'Warning'}
        </div>
      </div>

      <div>
        <h4 className="text-sm text-gray-700 mb-3">Stock Information</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Current Stock</span>
            <span className="text-lg text-gray-900">{activity.details.currentStock} units</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Alert Threshold</span>
            <span className="text-sm text-gray-900">{activity.details.threshold} units</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                activity.details.urgency === 'critical' ? 'bg-red-500' : 'bg-orange-500'
              }`}
              style={{
                width: `${((activity.details.currentStock || 0) / (activity.details.threshold || 1)) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm text-gray-700 mb-3">Location & Details</h4>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Warehouse Location</span>
            <span className="text-sm text-gray-900">{activity.details.location}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Alert Triggered</span>
            <span className="text-sm text-gray-900">{activity.time}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Alert Type</span>
            <span className="text-sm text-gray-900">{activity.details.alertType}</span>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
        <p className="text-sm text-gray-900 mb-2">⚠️ Recommended Action</p>
        <p className="text-sm text-gray-700">
          Restock immediately to avoid potential stockouts. Estimated time to depletion: 2-3 days
          based on current sales velocity.
        </p>
      </div>
    </div>
  );

  const getIcon = () => {
    switch (activity.type) {
      case 'order':
        return ShoppingBag;
      case 'sync':
        return RefreshCw;
      case 'price':
        return Tag;
      case 'alert':
        return AlertTriangle;
      default:
        return ShoppingBag;
    }
  };

  const getIconColor = () => {
    switch (activity.type) {
      case 'order':
        return 'text-blue-600';
      case 'sync':
        return 'text-green-600';
      case 'price':
        return 'text-yellow-600';
      case 'alert':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getIconBgColor = () => {
    switch (activity.type) {
      case 'order':
        return 'bg-blue-50';
      case 'sync':
        return 'bg-green-50';
      case 'price':
        return 'bg-yellow-50';
      case 'alert':
        return 'bg-red-50';
      default:
        return 'bg-blue-50';
    }
  };

  const Icon = getIcon();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 ${getIconBgColor()} rounded-lg flex items-center justify-center`}
            >
              <Icon className={`w-5 h-5 ${getIconColor()}`} />
            </div>
            <h3 className="text-xl text-gray-900">Activity Details</h3>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {activity.type === 'order' && renderOrderDetails()}
        {activity.type === 'sync' && renderSyncDetails()}
        {activity.type === 'price' && renderPriceDetails()}
        {activity.type === 'alert' && renderAlertDetails()}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm transition-colors"
          >
            Close
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
          >
            {activity.type === 'price'
              ? 'Approve Change'
              : activity.type === 'alert'
                ? 'Restock Now'
                : 'View Full Details'}
          </button>
        </div>
      </div>
    </div>
  );
}
