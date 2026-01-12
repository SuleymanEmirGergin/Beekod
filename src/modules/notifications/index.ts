/**
 * Notifications Module Barrel Export
 * @module modules/notifications
 */

// Services
export * from "../../services/notificationService.js";
export * from "../../services/alertService.js";
export * from "../../services/emailClient.js";

// Routes
export { notificationRouter } from "../../routes/notificationRoutes.js";

