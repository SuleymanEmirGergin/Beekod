-- Migration: Add product import tracking fields
-- Date: 2026-01-05
-- Description: Adds fields to track imported products from external sources

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sourceUrl VARCHAR(2048) DEFAULT NULL COMMENT 'Source URL where product was imported from',
ADD COLUMN IF NOT EXISTS sourceSite VARCHAR(255) DEFAULT NULL COMMENT 'Hostname of the source site',
ADD COLUMN IF NOT EXISTS snapshotPrice DECIMAL(10,2) DEFAULT NULL COMMENT 'Price at time of import',
ADD COLUMN IF NOT EXISTS snapshotCurrency VARCHAR(3) DEFAULT NULL COMMENT 'Currency at time of import',
ADD COLUMN IF NOT EXISTS snapshotAt DATETIME DEFAULT NULL COMMENT 'Timestamp when snapshot was taken',
ADD COLUMN IF NOT EXISTS imageUrl VARCHAR(2048) DEFAULT NULL COMMENT 'Product image URL',
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL COMMENT 'Product description';

-- Create index for source tracking
CREATE INDEX IF NOT EXISTS idx_products_source_site ON products(sourceSite);

-- Insert migration record
INSERT INTO schema_migrations (name) VALUES ('20260105_001_product_import_fields')
ON DUPLICATE KEY UPDATE name = name;
