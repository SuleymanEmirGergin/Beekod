import * as Sentry from "@sentry/node";
import { logger } from "../logger.js";
import { getRequestId } from "../lib/context.js";
import { recordProcessIssue } from "../metrics.js";

type ShutdownHook = (signal: string) => Promise<void> | void;

let shuttingDown = false;

function buildMeta(error: unknown) {
  const err = error instanceof Error ? error : new Error(String(error));
  // Safely attempt to get requestId, defaulting to undefined if function unavailable (e.g. during test teardown)
  let requestId: string | undefined;
  try {
    if (typeof getRequestId === 'function') {
        requestId = getRequestId();
    }
  } catch (e) {
    // Ignore error accessing context during shutdown
  }

  return {
    name: err.name,
    message: err.message,
    stack: err.stack,
    requestId,
  };
}

function captureError(error: unknown, event: string) {
  try {
    Sentry.captureException(error, { tags: { event } });
  } catch (sentryError) {
    logger.warn("process.sentry_capture_failed", { err: sentryError });
  }
}

export function registerProcessHandlers(shutdown?: ShutdownHook) {
  process.on("unhandledRejection", (reason) => {
    const meta = buildMeta(reason);
    recordProcessIssue({ ...meta, type: "unhandledRejection" });
    logger.error("process.unhandled_rejection", meta);
    captureError(reason, "unhandledRejection");
  });

  process.on("uncaughtException", (error) => {
    const meta = buildMeta(error);
    recordProcessIssue({ ...meta, type: "uncaughtException" });
    logger.error("process.uncaught_exception", meta);
    captureError(error, "uncaughtException");
    if (shutdown && !shuttingDown) {
      shuttingDown = true;
      Promise.resolve(shutdown("uncaughtException")).finally(() => {
        setTimeout(() => process.exit(1), 5000);
      });
    }
  });

  process.on("warning", (warning) => {
    recordProcessIssue({ type: "warning", name: warning.name, message: warning.message, stack: warning.stack });
    logger.warn("process.warning", {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
    });
  });

  const signalHandler = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("process.shutdown_start", { signal });
    if (shutdown) {
      Promise.resolve(shutdown(signal)).finally(() => {
        setTimeout(() => process.exit(0), 5000);
      });
    } else {
      setTimeout(() => process.exit(0), 2000);
    }
  };

  process.on("SIGINT", () => signalHandler("SIGINT"));
  process.on("SIGTERM", () => signalHandler("SIGTERM"));
}
