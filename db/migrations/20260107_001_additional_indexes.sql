-- Optimizing Products table
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'name'
);
SET @idx_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE() AND table_name = 'products' AND index_name = 'idx_products_name'
);
SET @sql = IF(@col_exists = 1 AND @idx_exists = 0, 'CREATE INDEX idx_products_name ON products(name)', 'SELECT "Index idx_products_name already exists or column missing"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'updated_at'
);
SET @idx_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE() AND table_name = 'products' AND index_name = 'idx_products_updated_at'
);
SET @sql = IF(@col_exists = 1 AND @idx_exists = 0, 'CREATE INDEX idx_products_updated_at ON products(updated_at)', 'SELECT "Index idx_products_updated_at already exists or column missing"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Optimizing Jobs table
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE() AND table_name = 'jobs' AND column_name = 'created_at'
);
SET @idx_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE() AND table_name = 'jobs' AND index_name = 'idx_jobs_created_at'
);
SET @sql = IF(@col_exists = 1 AND @idx_exists = 0, 'CREATE INDEX idx_jobs_created_at ON jobs(created_at)', 'SELECT "Index idx_jobs_created_at already exists or column missing"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE() AND table_name = 'jobs' AND column_name = 'worker_id'
);
SET @idx_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE() AND table_name = 'jobs' AND index_name = 'idx_jobs_worker_id'
);
SET @sql = IF(@col_exists = 1 AND @idx_exists = 0, 'CREATE INDEX idx_jobs_worker_id ON jobs(worker_id)', 'SELECT "Index idx_jobs_worker_id already exists or column missing"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
