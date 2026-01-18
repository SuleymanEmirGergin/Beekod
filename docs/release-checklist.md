# Beekod Release Checklist

## 1. Pre-Deployment Verification
- [ ] **Backup Verification:** Run `npx tsx scripts/ops/verify-backup.ts` (requires `BACKUP_FILE` env var) to confirm restore integrity.
- [ ] **Schema Drift:** Run `npx tsx scripts/db/check-schema.ts` to verify critical indexes (Product Barcode Unique) exist.
- [ ] **Security Audit:** Run `npx tsx scripts/security/audit.ts` to ensure no critical CVEs.

## 2. Deployment (Docker Compose)
- [ ] **Build:** `docker compose build --no-cache`
- [ ] **Start:** `docker compose up -d`
- [ ] **Healthcheck:**
    ```bash
    # Wait for healthy state
    watch "docker compose ps"

    # Check Backend Health (Redis + DB connectivity)
    curl -f http://localhost:3000/health
    ```

## 3. Post-Deployment Verification
- [ ] **Ops Inspection:**
    ```bash
    curl -H "x-admin-key: <ADMIN_KEY>" http://localhost:3000/api/ops/inspect
    ```
    *   Verify `health.score` is 2 (Healthy).
    *   Verify `scheduler.enabled` is true if expected.
- [ ] **Smoke Test:** Login to UI and load Product List.

## 4. Rollback Plan
If `health` endpoint returns 500 or logs show `request.slow_or_heavy` spikes:
1.  **Revert:** `docker compose down && docker compose -f docker-compose.old.yml up -d` (if backups kept).
2.  **Restore DB:** Use `docs/runbooks/backup-restore.md` if data corruption occurred.
