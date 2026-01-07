SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'products'
    AND column_name = 'category'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE products ADD COLUMN category VARCHAR(255) NULL AFTER name', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'products'
    AND column_name = 'description'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE products ADD COLUMN description TEXT NULL AFTER category', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
