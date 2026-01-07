-- Add preparation_days column if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = DATABASE() 
    AND table_name = 'products' 
    AND column_name = 'preparation_days'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE products ADD COLUMN preparation_days INT DEFAULT 3', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add translations column if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = DATABASE() 
    AND table_name = 'products' 
    AND column_name = 'translations'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE products ADD COLUMN translations JSON', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create product_prices table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barcode VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    start_date DATETIME,
    end_date DATETIME,
    price_type VARCHAR(50) DEFAULT 'STANDARD',
    priority INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY idx_product_prices_barcode (barcode),
    KEY idx_product_prices_dates (start_date, end_date),
    CONSTRAINT fk_product_prices_barcode FOREIGN KEY (barcode) REFERENCES products(barcode) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;
