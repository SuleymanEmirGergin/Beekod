USE `beekod`;
ALTER DATABASE `beekod` CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
SET NAMES utf8mb4;

-- Wholesalers Table
CREATE TABLE IF NOT EXISTS wholesalers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

ALTER TABLE wholesalers CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;

-- Add wholesaler_id to products (idempotent)
SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'products'
    AND column_name = 'wholesaler_id'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE products ADD COLUMN wholesaler_id INT DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'products'
    AND index_name = 'idx_wholesaler'
);
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE products ADD INDEX idx_wholesaler (wholesaler_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Seed wholesalers (idempotent)
INSERT INTO wholesalers (name, phone, email)
SELECT 'Beekod Ana Depo', '555-000-1111', 'depo@beekod.com'
WHERE NOT EXISTS (SELECT 1 FROM wholesalers WHERE name = 'Beekod Ana Depo');

INSERT INTO wholesalers (name, phone, email)
SELECT 'Ahmet Abi Toptan', '555-123-4567', 'ahmet@toptan.com'
WHERE NOT EXISTS (SELECT 1 FROM wholesalers WHERE name = 'Ahmet Abi Toptan');

INSERT INTO wholesalers (name, phone, email)
SELECT 'Mehmet Ayakkabı', '555-987-6543', 'mehmet@ayakkabi.com'
WHERE NOT EXISTS (SELECT 1 FROM wholesalers WHERE name = 'Mehmet Ayakkabı');

SET @beeko_id = (SELECT id FROM wholesalers WHERE name = 'Beekod Ana Depo' LIMIT 1);
SET @ahmet_id = (SELECT id FROM wholesalers WHERE name = 'Ahmet Abi Toptan' LIMIT 1);
SET @mehmet_id = (SELECT id FROM wholesalers WHERE name = 'Mehmet Ayakkabı' LIMIT 1);

-- Assign existing products to 'Beekod Ana Depo'
UPDATE products
SET wholesaler_id = @beeko_id
WHERE wholesaler_id IS NULL
  AND @beeko_id IS NOT NULL;

-- Insert some dummy products for other wholesalers
INSERT INTO products (barcode, name, price, stock, wholesaler_id)
SELECT '8680000000001', 'Rakip Bot Siyah 42', 450.00, 100, @ahmet_id
WHERE @ahmet_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM products WHERE barcode = '8680000000001');

INSERT INTO products (barcode, name, price, stock, wholesaler_id)
SELECT '8680000000002', 'Rakip Spor Ayakkabi Beyaz', 300.00, 50, @mehmet_id
WHERE @mehmet_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM products WHERE barcode = '8680000000002');

-- Clean invalid wholesaler references before FK
UPDATE products
SET wholesaler_id = NULL
WHERE wholesaler_id IS NOT NULL
  AND wholesaler_id NOT IN (SELECT id FROM wholesalers);

-- Add FK constraint (idempotent)
SET @fk_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
  WHERE constraint_schema = DATABASE()
    AND constraint_name = 'fk_products_wholesaler'
);
SET @sql = IF(
  @fk_exists = 0,
  'ALTER TABLE products ADD CONSTRAINT fk_products_wholesaler FOREIGN KEY (wholesaler_id) REFERENCES wholesalers(id) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
