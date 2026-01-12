/**
 * Modules - Domain Layer
 * 
 * Central exports for all domain modules.
 * Each module represents a bounded context in the application.
 * 
 * @module modules
 */

// Products Module
export * as products from "./products/index.js";

// Orders Module
export * as orders from "./orders/index.js";

// Analytics Module
export * as analytics from "./analytics/index.js";

// Invoices Module  
export * as invoices from "./invoices/index.js";

// Shipping Module
export * as shipping from "./shipping/index.js";

// Search Module
export * as search from "./search/index.js";

// Auth Module
export * as auth from "./auth/index.js";

// Notifications Module
export * as notifications from "./notifications/index.js";

// Team Module
export * as team from "./team/index.js";

// Content Module
export * as content from "./content/index.js";

// ===========================================
// Convenient Router Exports for server.ts
// ===========================================
export { productRouter } from "./products/index.js";
export { orderRouter } from "./orders/index.js";
export { analyticsRouter } from "./analytics/index.js";
export { invoiceRouter } from "./invoices/index.js";
export { searchRouter } from "./search/index.js";
export { authRouter } from "./auth/index.js";
export { notificationRouter } from "./notifications/index.js";
export { teamRouter } from "./team/index.js";
export { socialRouter, videoRouter } from "./content/index.js";

