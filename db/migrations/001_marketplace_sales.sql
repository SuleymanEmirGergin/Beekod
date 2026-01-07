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
  INDEX idx_marketplace_barcode (barcode)
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
