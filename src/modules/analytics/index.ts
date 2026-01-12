/**
 * Analytics Module Barrel Export
 * @module modules/analytics
 */

// Service (re-export from existing location)
export {
  getDashboardStats,
  getProductPerformance,
  getRevenueTimeline,
  getProfitMargins,
  getInventoryHealth,
  getMarketplacePerformance,
  getTopSellers,
  getSalesSummary,
  searchProducts,
  getProductSalesDetail,
  getInventoryForecast,
} from "../../services/analyticsService.js";

// Dashboard service
export { getDashboardData } from "../../services/dashboardService.js";

// Routes
export { analyticsRouter } from "../../routes/analyticsRoutes.js";


