# CI/CD Summary

The following automated verifications have been added to the codebase:

## 1. `docker-e2e` Workflow
*   **File:** `.github/workflows/docker-e2e.yml`
*   **Proves:**
    *   The application builds and starts successfully in a containerized environment (matching Prod).
    *   MySQL and Redis containers are reachable and healthy.
    *   The API `/health` endpoint correctly reports "ok" when connected to real infrastructure.
    *   The Schema Integrity Check (`scripts/db/check-schema.ts`) passes against a real MySQL 8.0 instance.

## 2. Schema Integrity Checks
*   **Script:** `scripts/db/check-schema.ts`
*   **Proves:**
    *   `products` table has a PRIMARY KEY.
    *   `products` table has a UNIQUE index on `barcode` (crucial for atomic upserts).
    *   `audit_logs` table structure is valid.

## 3. Scheduler Integration Tests
*   **Test:** `tests/integration/scheduler.test.ts`
*   **Proves:**
    *   Periodic jobs (`maintenance.cleanup`, `marketplace.sync_all`) are correctly registered with BullMQ.
    *   Cron intervals match the configuration.

## 4. Load Simulation Guardrails
*   **Script:** `scripts/tests/load-simulation.ts`
*   **Proves:**
    *   System sustains 20 concurrent requests without crashing.
    *   Error rate stays below 5%.
    *   Slow request rate (>500ms) stays below 10%.

## 5. Security Redaction Tests
*   **Test:** `tests/unit/logger.test.ts`
*   **Proves:**
    *   Sensitive keys (`password`, `token`) are redacted from logs before transport.
