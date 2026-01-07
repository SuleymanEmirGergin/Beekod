
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { env } from "../config/env.js";
import { logger } from "../logger.js";

if (env.SENTRY_ENABLED && env.SENTRY_DSN) {
    logger.info("sentry.init", { enabled: true });
    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.SENTRY_ENVIRONMENT || (env.NODE_ENV === "production" ? "production" : "development"),
        integrations: [
            nodeProfilingIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: 1.0, // Capture 100% of transactions for now (adjust in prod)
        // Set sampling rate for profiling - this is relative to tracesSampleRate
        profilesSampleRate: 1.0,
    });
} else {
    logger.info("sentry.init", { enabled: false, reason: "Missing DSN or Disabled" });
}
