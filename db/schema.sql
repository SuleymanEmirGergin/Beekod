CREATE DATABASE IF NOT EXISTS `beekod` CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
USE `beekod`;

CREATE TABLE IF NOT EXISTS schema_migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  barcode VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  alert_threshold INT NOT NULL DEFAULT 10,
  currency VARCHAR(8) NOT NULL DEFAULT "TRY",
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_category (category)
);

CREATE TABLE IF NOT EXISTS action_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  intent VARCHAR(64) NOT NULL,
  locale VARCHAR(8) NOT NULL,
  message TEXT NOT NULL,
  barcode VARCHAR(64),
  amount DECIMAL(10,2),
  response TEXT,
  success TINYINT(1) NOT NULL DEFAULT 1,
  error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_action_logs_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  marketplace VARCHAR(64) NOT NULL,
  barcode VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT "",
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT "TRY",
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_marketplace_barcode (marketplace, barcode),
  INDEX idx_marketplace (marketplace),
  INDEX idx_marketplace_barcode (barcode),
  INDEX idx_marketplace_listings_updated_at (updated_at)
);

CREATE TABLE IF NOT EXISTS sales_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  order_date DATE NOT NULL,
  barcode VARCHAR(64) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT "TRY",
  marketplace VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sales_barcode (barcode),
  INDEX idx_sales_date (order_date),
  INDEX idx_sales_marketplace (marketplace)
);

CREATE TABLE IF NOT EXISTS rate_limits (
  rate_key VARCHAR(255) NOT NULL PRIMARY KEY,
  window_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  count INT NOT NULL DEFAULT 0,
  INDEX idx_rate_limits_window_start (window_start)
);

CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  barcode VARCHAR(64),
  original_hash CHAR(64),
  original_path VARCHAR(512) NOT NULL,
  processed_path VARCHAR(512) NOT NULL,
  profile VARCHAR(64) NOT NULL,
  marketplace VARCHAR(64),
  meta_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product_images_barcode (barcode),
  INDEX idx_product_images_hash_profile (original_hash, profile),
  INDEX idx_product_images_barcode_hash (barcode, original_hash),
  CONSTRAINT fk_product_images_barcode FOREIGN KEY (barcode) REFERENCES products(barcode) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS image_inspects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image_id INT,
  barcode VARCHAR(64),
  marketplace VARCHAR(64),
  profile VARCHAR(64),
  source VARCHAR(32),
  score INT,
  issue_count INT,
  warn_count INT,
  fail_count INT,
  summary_en VARCHAR(512),
  summary_tr VARCHAR(512),
  report_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_image_inspects_image (image_id),
  INDEX idx_image_inspects_barcode (barcode),
  INDEX idx_image_inspects_profile (profile),
  INDEX idx_image_inspects_created (created_at)
);

CREATE TABLE IF NOT EXISTS jobs (
  id CHAR(36) PRIMARY KEY,
  type VARCHAR(64) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'queued',
  payload JSON,
  result JSON,
  error TEXT,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  next_run_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  worker_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  finished_at TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jobs_status_next (status, next_run_at),
  INDEX idx_jobs_type (type)
);

CREATE TABLE IF NOT EXISTS job_dead_letters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id CHAR(36) NOT NULL,
  type VARCHAR(64) NOT NULL,
  payload JSON,
  error TEXT,
  attempts INT NOT NULL,
  max_attempts INT NOT NULL,
  failed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_job_dead_letters_job (job_id),
  INDEX idx_job_dead_letters_type (type)
);

CREATE TABLE IF NOT EXISTS admin_settings (
  setting_key VARCHAR(64) PRIMARY KEY,
  setting_value JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_alerts (
  barcode VARCHAR(64) PRIMARY KEY,
  last_alerted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_stock_alerts_last (last_alerted_at)
);

CREATE TABLE IF NOT EXISTS integrations (
  provider_id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  connected TINYINT(1) NOT NULL DEFAULT 0,
  last_sync VARCHAR(64) NULL,
  items_synced INT NOT NULL DEFAULT 0,
  config JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS marketplace_credentials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  marketplace VARCHAR(50) NOT NULL,
  credentials_json TEXT NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_creds_user (user_id),
  INDEX idx_creds_marketplace (marketplace)
);

CREATE TABLE IF NOT EXISTS marketplace_jobs (
  id CHAR(36) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'queued',
  marketplace VARCHAR(50) NOT NULL,
  payload_json JSON,
  external_task_id VARCHAR(100),
  result_json JSON,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jobs_status (status),
  INDEX idx_jobs_type (type),
  INDEX idx_jobs_marketplace (marketplace)
);

CREATE TABLE IF NOT EXISTS canonical_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gtin VARCHAR(14) UNIQUE,
  title VARCHAR(255),
  description TEXT,
  brand VARCHAR(100),
  attributes_json JSON,
  images_json JSON,
  source_url VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_canonical_gtin (gtin)
);

