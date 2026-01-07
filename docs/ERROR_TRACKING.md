# Error Tracking with Sentry

## Overview

Beekod Chatbot uses structured logging. To enable centralized error tracking and alerting, we recommend integrating **Sentry**.

## Integration Steps

1. **Install Sentry SDK**
   ```bash
   npm install @sentry/node @sentry/profiling-node
   ```

2. **Initialize Sentry**
   Add to `src/server.ts` (top of file):
   ```typescript
   import * as Sentry from "@sentry/node";
   import { nodeProfilingIntegration } from "@sentry/profiling-node";

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     integrations: [
       nodeProfilingIntegration(),
     ],
     // Performance Monitoring
     tracesSampleRate: 1.0, //  Capture 100% of the transactions
     // Set sampling rate for profiling - this is relative to tracesSampleRate
     profilesSampleRate: 1.0,
   });
   ```

3. **Add Request Handlers**
   Add Sentry middleware before your routes:
   ```typescript
   // The request handler must be the first middleware on the app
   app.use(Sentry.Handlers.requestHandler());
   
   // Routes...
   app.use('/', routes);

   // The error handler must be registered before any other error middleware
   app.use(Sentry.Handlers.errorHandler());
   ```

## Configuration

Add to `.env`:
```env
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
```

## Best Practices

- **Context:** Always add user context if authenticated (e.g., `Sentry.setUser({ id: user.id })`).
- **Tags:** Use tags for important metadata (e.g., `marketplace: trendyol`).
- **levels:** Use `Sentry.captureException(err)` for handled errors you want to track.

### Custom Error Capture in Services

```typescript
import * as Sentry from "@sentry/node";

try {
  // critical operation
} catch (error) {
  Sentry.captureException(error, {
    tags: {
       service: 'virtualTryOn',
       marketplace: 'Trendyol'
    }
  });
  // rethrow or handle
}
```

## Alerts

Configure alerts in Sentry dashboard for:
- New issues
- High volume of errors (> 10/min)
- Regression (reopened issues)
