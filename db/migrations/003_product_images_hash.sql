SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'product_images'
    AND column_name = 'original_hash'
);
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE product_images ADD COLUMN original_hash CHAR(64) NULL AFTER barcode',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'product_images'
    AND index_name = 'idx_product_images_hash_profile'
);
SET @sql = IF(
  @idx_exists = 0,
  'CREATE INDEX idx_product_images_hash_profile ON product_images (original_hash, profile)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'product_images'
    AND index_name = 'idx_product_images_barcode_hash'
);
SET @sql = IF(
  @idx_exists = 0,
  'CREATE INDEX idx_product_images_barcode_hash ON product_images (barcode, original_hash)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
