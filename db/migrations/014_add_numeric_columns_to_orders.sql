SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND column_name = 'total_amount_numeric'
);
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE orders ADD COLUMN total_amount_numeric DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER total_amount',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'order_items'
    AND column_name = 'price_numeric'
);
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE order_items ADD COLUMN price_numeric DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER price',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
