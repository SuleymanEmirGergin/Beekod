ALTER TABLE products
ADD COLUMN product_type ENUM('standard', 'packet', 'digital') DEFAULT 'standard',
ADD COLUMN preparation_days INT DEFAULT 3;
