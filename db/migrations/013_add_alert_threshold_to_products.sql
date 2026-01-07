SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'products'
    AND column_name = 'alert_threshold'
);
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE products ADD COLUMN alert_threshold INT NOT NULL DEFAULT 10 AFTER stock',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
