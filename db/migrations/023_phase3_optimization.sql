-- Phase 3 Optimizations
-- 1. Ensure 'category' column exists in products
SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'products'
    AND column_name = 'category'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE products ADD COLUMN category VARCHAR(255) AFTER name', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Index on products(category)
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'products'
    AND index_name = 'idx_products_category'
);
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_products_category ON products(category)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Index on action_logs(created_at)
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'action_logs'
    AND index_name = 'idx_action_logs_created_at'
);
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_action_logs_created_at ON action_logs(created_at)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Index on marketplace_listings(updated_at)
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'marketplace_listings'
    AND index_name = 'idx_marketplace_listings_updated_at'
);
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_marketplace_listings_updated_at ON marketplace_listings(updated_at)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
