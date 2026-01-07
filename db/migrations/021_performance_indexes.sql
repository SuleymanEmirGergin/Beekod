-- Products table indexes
SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'products'
    AND column_name = 'barcode'
);
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'products'
    AND index_name = 'idx_products_barcode'
);
SET @sql = IF(@col_exists = 1 AND @idx_exists = 0, 'CREATE INDEX idx_products_barcode ON products(barcode)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'products'
    AND column_name = 'category'
);
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'products'
    AND index_name = 'idx_products_category'
);
SET @sql = IF(@col_exists = 1 AND @idx_exists = 0, 'CREATE INDEX idx_products_category ON products(category)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'products'
    AND column_name = 'stock'
);
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'products'
    AND index_name = 'idx_products_stock'
);
SET @sql = IF(@col_exists = 1 AND @idx_exists = 0, 'CREATE INDEX idx_products_stock ON products(stock)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'products'
    AND column_name = 'created_at'
);
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'products'
    AND index_name = 'idx_products_created_at'
);
SET @sql = IF(@col_exists = 1 AND @idx_exists = 0, 'CREATE INDEX idx_products_created_at ON products(created_at)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Orders table indexes
SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND column_name = 'request_id'
);
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND index_name = 'idx_orders_request_id'
);
SET @sql = IF(@col_exists = 1 AND @idx_exists = 0, 'CREATE INDEX idx_orders_request_id ON orders(request_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND column_name = 'status_label'
);
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND index_name = 'idx_orders_status_label'
);
SET @sql = IF(@col_exists = 1 AND @idx_exists = 0, 'CREATE INDEX idx_orders_status_label ON orders(status_label)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND column_name = 'created_at'
);
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND index_name = 'idx_orders_created_at'
);
SET @sql = IF(@col_exists = 1 AND @idx_exists = 0, 'CREATE INDEX idx_orders_created_at ON orders(created_at)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND column_name = 'source_name'
);
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND index_name = 'idx_orders_source_name'
);
SET @sql = IF(@col_exists = 1 AND @idx_exists = 0, 'CREATE INDEX idx_orders_source_name ON orders(source_name)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Order items table indexes
SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'order_items'
    AND column_name = 'order_id'
);
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'order_items'
    AND index_name = 'idx_order_items_order_id'
);
SET @sql = IF(@col_exists = 1 AND @idx_exists = 0, 'CREATE INDEX idx_order_items_order_id ON order_items(order_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'order_items'
    AND column_name = 'sku'
);
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'order_items'
    AND index_name = 'idx_order_items_sku'
);
SET @sql = IF(@col_exists = 1 AND @idx_exists = 0, 'CREATE INDEX idx_order_items_sku ON order_items(sku)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Stock history table indexes
SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'stock_history'
    AND column_name = 'barcode'
);
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'stock_history'
    AND index_name = 'idx_stock_history_barcode'
);
SET @sql = IF(@col_exists = 1 AND @idx_exists = 0, 'CREATE INDEX idx_stock_history_barcode ON stock_history(barcode)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'stock_history'
    AND column_name = 'created_at'
);
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'stock_history'
    AND index_name = 'idx_stock_history_created_at'
);
SET @sql = IF(@col_exists = 1 AND @idx_exists = 0, 'CREATE INDEX idx_stock_history_created_at ON stock_history(created_at)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Notifications table indexes
SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'notifications'
    AND column_name = 'user_id'
);
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'notifications'
    AND index_name = 'idx_notifications_user_id'
);
SET @sql = IF(@col_exists = 1 AND @idx_exists = 0, 'CREATE INDEX idx_notifications_user_id ON notifications(user_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'notifications'
    AND column_name = 'created_at'
);
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'notifications'
    AND index_name = 'idx_notifications_created_at'
);
SET @sql = IF(@col_exists = 1 AND @idx_exists = 0, 'CREATE INDEX idx_notifications_created_at ON notifications(created_at)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'notifications'
    AND column_name = 'is_read'
);
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'notifications'
    AND index_name = 'idx_notifications_is_read'
);
SET @sql = IF(@col_exists = 1 AND @idx_exists = 0, 'CREATE INDEX idx_notifications_is_read ON notifications(is_read)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
