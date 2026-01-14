/**
 * Orders Module Barrel Export
 * @module modules/orders
 */

// Service (re-export from existing location)
export {
  getAllOrders,
  getRecentOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateOrderShipping,
} from "../../services/order/orderService.js";

// Sync service
export { syncOrdersFromMarketplaces } from "../../services/order/orderSyncService.js";

// Routes
export { orderRouter } from "../../routes/orderRoutes.js";


