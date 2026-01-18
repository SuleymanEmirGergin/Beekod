# Database Backup & Restore Runbook

## Overview
This runbook details the procedure for restoring the database from a backup and verifying its integrity.

## Prerequisites
- Access to the backup file (`.sql`, `.dump`, or `.sql.gz`).
- `mysql` command-line client installed.
- Credentials for a **disposable** database instance (do NOT test restores on production).

## Restore Procedure

1.  **Prepare Target Database**
    ```bash
    # Create a fresh database
    mysql -h <host> -u <user> -p -e "DROP DATABASE IF EXISTS verify_restore; CREATE DATABASE verify_restore;"
    ```

2.  **Import Backup**
    ```bash
    # If compressed
    gunzip < backup.sql.gz | mysql -h <host> -u <user> -p verify_restore

    # If raw SQL
    mysql -h <host> -u <user> -p verify_restore < backup.sql
    ```

3.  **Run Migrations (If needed)**
    If the backup is data-only or schema-frozen at an old version, run migrations:
    ```bash
    # Point config to the restore DB
    export DB_NAME=verify_restore
    npm run migrate
    ```

## Verification

Run the automated verification script:

```bash
export VERIFY_DB_HOST=localhost
export VERIFY_DB_USER=root
export VERIFY_DB_NAME=verify_restore
npx tsx scripts/ops/verify-backup.ts
```

### Manual Checks
1.  **Check Key Tables**
    ```sql
    SELECT COUNT(*) FROM products;
    SELECT COUNT(*) FROM orders;
    ```
2.  **Check Recent Data**
    ```sql
    SELECT created_at FROM orders ORDER BY created_at DESC LIMIT 1;
    ```

## Failure Scenarios

-   **Import Fails:** Check MySQL version compatibility.
-   **Missing Data:** Verify the backup generation process (e.g., was `mysqldump` running with `--single-transaction`?).
