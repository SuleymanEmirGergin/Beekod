USE `beekod`;

SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'wholesalers'
    AND column_name = 'is_visible'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE wholesalers ADD COLUMN is_visible TINYINT(1) DEFAULT 1', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'wholesalers'
    AND index_name = 'idx_wholesalers_visible'
);
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_wholesalers_visible ON wholesalers (is_visible)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
