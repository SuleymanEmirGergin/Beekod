import "../env.js";
import "./lib/sentry.js"; // Import Sentry initialization
import * as Sentry from "@sentry/node";
import path from "path";
import express from "express";
import cors from "cors";

// Core infrastructure - use new modular imports
import { config, logConfigStatus } from "./core/config/index.js";
import { logger } from "./core/logging/index.js";
import { imageRouter, productImageRouter } from "./images/imageRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestContext } from "./middleware/requestContext.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { securityHeaders } from "./middleware/securityHeaders.js";

// ===========================================
// Route Imports
// Alternative: Import from modules for cleaner architecture:
// import { productRouter, orderRouter, analyticsRouter, ... } from "./modules/index.js";
// ===========================================
import { adminRouter } from "./routes/adminRoutes.js";
import { authRouter } from './routes/authRoutes.js';
import { auditRouter } from './routes/auditRoutes.js';
import { adminSettingsRouter } from "./routes/adminSettingsRoutes.js";
import { cacheRouter } from "./routes/cacheRoutes.js";

import { competitorRouter } from "./routes/competitorRoutes.js";
import { contentConfigRouter } from "./routes/contentConfigRoutes.js";
import { contentPreviewRouter } from "./routes/contentPreviewRoutes.js";
import { docsRouter } from "./routes/docsRoutes.js";
import { healthRouter } from "./routes/healthRoutes.js";
import { logRouter } from "./routes/logRoutes.js";
import { marketplaceRouter } from "./routes/marketplaceRoutes.js"; // ✅ Imported
import { marketplaceMappingRouter } from "./routes/marketplaceMappingRoutes.js";
import { messageRouter } from "./routes/messageRoutes.js";
import { jobRouter } from "./routes/jobRoutes.js";
import { opsRouter } from "./routes/opsRoutes.js";
import { productRouter } from "./routes/productRoutes.js";
import { rateLimitRouter } from "./routes/rateLimitRoutes.js";
import { reportRouter } from "./routes/reportRoutes.js";
import { salesRouter } from "./routes/salesRoutes.js";
import { searchRouter } from "./routes/searchRoutes.js";
import { orderRouter } from "./routes/orderRoutes.js";
import { integrationRouter } from "./routes/integrationRoutes.js";
import { teamRouter } from "./routes/teamRoutes.js";
import { uploadRouter } from "./routes/uploadRoutes.js";
import { dashboardRouter } from "./routes/dashboardRoutes.js";
import { shippingRouter } from "./routes/shippingRoutes.js";
import { analyticsRouter } from "./routes/analyticsRoutes.js";
import { configRouter } from "./routes/configRoutes.js";
import { profileRouter } from "./routes/profileRoutes.js";
import { invoiceRouter } from "./routes/invoiceRoutes.js";
import { socketService } from "./services/socketService.js";
import { startScheduler } from "./services/jobQueue.js";
import { startStockAlertJob, stopStockAlertJob } from "./services/alertService.js";
import questionRouter from "./routes/questionRoutes.js";
import { intelligenceRouter } from "./routes/intelligenceRoutes.js";
import videoRouter from "./routes/videoRoutes.js";
import { socialRouter } from "./routes/socialRoutes.js";
import { notificationRouter } from "./routes/notificationRoutes.js";
import { videoAnalyticsRouter } from "./routes/videoAnalyticsRoutes.js";
import { revenueRouter } from "./routes/revenueRoutes.js";
import feedbackRouter from "./routes/feedbackRoutes.js";
import productImportRouter from "./routes/productImportRoutes.js";
import { trendyolRouter } from "./routes/trendyolRoutes.js";
import { n11Router } from "./routes/n11Routes.js";
import { hepsiburadaRouter } from "./routes/hepsiburadaRoutes.js";
import { ciceksepetiRouter } from "./routes/ciceksepetiRoutes.js";
import { inventoryRouter } from "./routes/inventoryRoutes.js";
import aiModelRouter from "./routes/aiModelRoutes.js";
import chatbotRouter from "./routes/chatbotRoutes.js";
import wholesalerRouter from "./routes/wholesalerRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import { registerProcessHandlers } from "./monitoring/processHandlers.js";

// Log configuration status on startup
logConfigStatus(logger);

process.on("unhandledRejection", (reason: unknown) => {
  const stack = reason instanceof Error ? reason.stack : String(reason);
  logger.error("process.unhandled_rejection", { reason: stack });
});

process.on("uncaughtException", (err: Error) => {
  logger.error("process.uncaught_exception", { err: err.stack || err.message });
});

const app = express();
app.disable("x-powered-by");

// Sentry middleware is now handled via setupExpressErrorHandler or auto-instrumentation

// CORS configuration for frontend
app.use(
  cors({
    origin: [...(config.security.cors.origins || []), "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:3000", "http://localhost:5175", "http://127.0.0.1:5175"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-key"],
  }),
);

app.use(express.json({ limit: config.server.jsonBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: config.server.urlEncodedBodyLimit }));
app.use(requestContext);
app.use(securityHeaders);
const publicBase = config.images.publicBase;
const publicPath = publicBase.startsWith("http") ? new URL(publicBase).pathname : publicBase;
app.use(publicPath, express.static(path.resolve(config.images.storagePath)));
app.use("/api/images", imageRouter);
app.use("/api/products/images", productImageRouter);
app.use(rateLimit);

app.use(healthRouter);
app.use("/api/auth", authRouter);
app.use('/api/audit-logs', auditRouter);
app.use(adminRouter);
app.use(adminSettingsRouter);
app.use(contentConfigRouter);
app.use(contentPreviewRouter);
app.use(docsRouter);
app.use("/api/product-import", productImportRouter);
app.use("/api/products", productRouter);
app.use("/api/marketplaces", marketplaceRouter); // ✅ Registered
app.use("/api/marketplaces/mapping", marketplaceMappingRouter);
app.use("/api/search", searchRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/logs", logRouter);
app.use("/api/cache", cacheRouter);
app.use("/api/messages", messageRouter);
app.use("/api/rate-limits", rateLimitRouter);
app.use("/api/reports", reportRouter);
app.use("/api/sales", salesRouter);
app.use("/api/questions", questionRouter);
app.use("/api/video", videoRouter);
app.use("/api/social", socialRouter);
app.use("/api/intelligence", intelligenceRouter);
import { campaignRouter } from "./routes/campaignRoutes.js";

// ... existing imports

// Routes
// ... existing routes
app.use("/api/notifications", notificationRouter);
app.use("/api/campaigns", campaignRouter);
app.use("/api/social", socialRouter);
// ...
app.use("/api/video-analytics", videoAnalyticsRouter);
app.use("/api/revenue", revenueRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/product-import", productImportRouter);
app.use("/api/trendyol", trendyolRouter); // ✅ Trendyol Category API
app.use("/api/n11", n11Router); // ✅ N11 Category API
app.use("/api/hepsiburada", hepsiburadaRouter); // ✅ Hepsiburada API
app.use("/api/ciceksepeti", ciceksepetiRouter); // ✅ Çiçeksepeti API

app.use("/api/orders", orderRouter);
app.use("/api/shipping", shippingRouter); // ✅ Shipping API
app.use("/api/integrations", integrationRouter);
app.use("/api/team", teamRouter);
app.use("/api/competitors", competitorRouter);
app.use("/api/jobs", jobRouter);
// Chat router'ı daha spesifik route'lardan sonra ama genel /api route'larından önce
app.use("/api/ops", opsRouter);
app.use("/api", dashboardRouter);
app.use("/api/config", configRouter);
app.use("/api/profiles", profileRouter);

app.use("/api/invoices", invoiceRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/ai-model", aiModelRouter);

// Chatbot & Wholesaler Network
app.use("/api/chat", chatbotRouter);
app.use("/api/wholesaler", wholesalerRouter);
app.use("/api/ai", aiRoutes);

// SPA Fallback - Serve index.html for unknown routes
app.get("*", (req, res, next) => {
  // Skip API routes to let them 404 naturally if not found
  if (req.path.startsWith("/api") || req.path.startsWith("/images") || req.path.startsWith("/products")) {
    return next();
  }
  res.sendFile(path.resolve("public", "index.html"));
});
app.use(express.static(path.resolve("public")));
// Sentry Error Handler (v8+)
Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

startScheduler();
startStockAlertJob();

let server: any;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(config.port, () => {
    logger.info("server.listen", { port: config.port });
    // Initialize socket service with the http server instance
    socketService.initialize(server);
    // Set server timeout to 5 minutes to handle long polling AI tasks
    server.setTimeout(300000);
  });
}

export { app };

registerProcessHandlers(async (signal) => {
  logger.info("server.shutdown", { signal });
  stopStockAlertJob();
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});
