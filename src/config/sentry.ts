import * as Sentry from "@sentry/node";
import { logger } from "../logger.js";

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development";
const SENTRY_ENABLED = process.env.SENTRY_ENABLED === "true";

export function initSentry(): void {
  if (!SENTRY_ENABLED) {
    logger.info("sentry.disabled");
    return;
  }

  if (!SENTRY_DSN) {
    logger.warn("sentry.no_dsn_configured");
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,
      tracesSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,
      integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
    });

    logger.info("sentry.initialized", { environment: SENTRY_ENVIRONMENT });
  } catch (error) {
    logger.error("sentry.init_failed", { err: error });
  }
}

export function captureSentryException(error: Error, context?: Record<string, any>): void {
  if (!SENTRY_ENABLED) return;

  Sentry.captureException(error, {
    extra: context,
  });
}

export { Sentry };
