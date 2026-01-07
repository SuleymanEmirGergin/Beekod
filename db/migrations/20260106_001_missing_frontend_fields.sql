-- Migration: Add missing frontend fields to products table
-- Date: 2026-01-06
-- Description: Adds columns required by ProductEditScreen.tsx Gap Analysis features

ALTER TABLE products
ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS product_code VARCHAR(64) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS vat_rate INT DEFAULT 18,
ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'adet',
ADD COLUMN IF NOT EXISTS brand VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS attributes JSON DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cargo_company VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cargo_desi DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS width DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS height DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS length DECIMAL(10,2) DEFAULT NULL;

-- Create index for brand and product_code
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);

INSERT INTO schema_migrations (name) VALUES ('20260106_001_missing_frontend_fields')
ON DUPLICATE KEY UPDATE name = name;
