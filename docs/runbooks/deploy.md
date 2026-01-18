# Deployment & Rollback Runbook

## Deployment Checklist

### Pre-Deployment
1.  **Backup Verification:** Ensure the latest backup is verified.
    ```bash
    npx tsx scripts/ops/verify-backup.ts
    ```
2.  **Schema Drift Check:** Run integrity tests locally or in CI.
    ```bash
    npm test tests/schema/integrity.test.ts
    ```
3.  **Environment Audit:** Check for missing env vars.
    ```bash
    # (Optional) Dry-run app start
    MARKETPLACE_MODE=mock npm start -- --dry-run
    ```

### During Deployment (Rolling Update)
1.  **Drain Connections:** The application handles `SIGTERM` by closing the HTTP server first, then the Queue workers, then the DB pool.
2.  **Monitor Logs:** Watch for `server.startup_failed` or `process.uncaught_exception`.
3.  **Monitor Health:**
    ```bash
    watch -n 1 "curl -s http://localhost:3000/health | jq"
    ```

### Post-Deployment Verification
1.  **Ops Inspection:**
    ```bash
    npx tsx scripts/ops/check-system.ts
    ```
    *   Verify `db.active` is not zero (if traffic exists).
    *   Verify `queue.total` is reachable.
2.  **Smoke Test:**
    *   Login to frontend.
    *   View Products list.

## Rollback Checklist

If the deployment fails (CrashLoopBackOff, 500 errors, High Latency):

1.  **Revert Image/Version:** Deploy the previous stable Docker tag or git commit.
2.  **Database Rollback (If Migrations Failed):**
    *   *Warning:* Down migrations can be destructive.
    *   If safe: `npm run migrate:down`
    *   If unsafe/corrupt: Restore from backup (See `backup-restore.md`).
3.  **Verify Stability:** Run the Post-Deployment Verification steps again.

## Zero-Downtime Notes
-   The app supports graceful shutdown (2s default + 5s forced timeout).
-   Ensure your load balancer health check interval is short (e.g., 5s) to route traffic away quickly during the rolling restart.
