# Troubleshooting Runbook

## Overview
This guide helps diagnose and resolve common production issues.

## 1. High Database Contention / Deadlocks

### Symptoms
- Logs show `ER_LOCK_DEADLOCK` or `ER_LOCK_WAIT_TIMEOUT`.
- Slow response times on write-heavy endpoints (e.g., product updates, order sync).
- High "DB query count" metrics in profiler logs.

### Diagnosis
1.  Check active queries:
    ```sql
    SHOW FULL PROCESSLIST;
    ```
2.  Check engine status for lock details:
    ```sql
    SHOW ENGINE INNODB STATUS;
    ```
3.  Use the Ops Inspector:
    ```bash
    npx tsx scripts/ops/check-system.ts
    ```

### Mitigation
-   **Immediate:** Kill blocking sessions if necessary (carefully).
-   **Code Fix:** Ensure transactions access tables in a consistent order.
-   **Retry Logic:** The system has automatic retries for deadlocks. If failures persist, the contention is severe and structural.

## 2. Slow API Requests

### Symptoms
- `request.slow_or_heavy` warnings in logs.
- P99 latency spikes.

### Diagnosis
1.  Check the `queryCount` in the log entry. If > 50, it's likely an N+1 issue.
2.  Check `durationMs`. If high but `queryCount` is low, check for:
    -   External API timeouts (Circuit Breaker status).
    -   Heavy computation / event loop blocking.
    -   Large payload serialization.

### Mitigation
-   Enable caching for read-heavy endpoints.
-   Optimize SQL queries (add indexes, use batching).

## 3. Queue Backlog

### Symptoms
- `jobs.dead_letter_list` growing.
- Jobs stuck in "wait" state.

### Diagnosis
1.  Check Redis health via `/health` or Ops Inspector.
2.  Inspect DLQ:
    ```bash
    curl -H "x-admin-key: <key>" http://localhost:3000/api/jobs/dead-letter
    ```

### Mitigation
-   Scale up workers (if CPU bound).
-   Fix "poison pill" payloads causing crashes.
-   Retry failed jobs in bulk:
    ```bash
    curl -X POST -H "x-admin-key: <key>" http://localhost:3000/api/jobs/retry-all
    ```
