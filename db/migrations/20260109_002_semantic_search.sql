-- ============================================================
-- Migration: Semantic Search Support
-- Date: 2026-01-09
-- Description: Add product_embeddings table for vector search
-- ============================================================

-- Product Embeddings table for semantic search
CREATE TABLE IF NOT EXISTS product_embeddings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barcode VARCHAR(50) NOT NULL UNIQUE,
    embedding JSON NOT NULL COMMENT 'Vector embedding (64+ dimensions)',
    text_content TEXT COMMENT 'Original text used for embedding',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_barcode (barcode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product accessory relationships
CREATE TABLE IF NOT EXISTS product_accessories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    main_product_barcode VARCHAR(50) NOT NULL,
    accessory_barcode VARCHAR(50) NOT NULL,
    relationship_type ENUM('official', 'compatible', 'suggested') DEFAULT 'compatible',
    confidence_score DECIMAL(3,2) DEFAULT 0.8,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_main_accessory (main_product_barcode, accessory_barcode),
    INDEX idx_main_product (main_product_barcode),
    INDEX idx_accessory (accessory_barcode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add is_accessory flag to products table (if not exists)
-- This is a safe ALTER that won't fail if column exists
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'products' 
    AND COLUMN_NAME = 'is_accessory'
);

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE products ADD COLUMN is_accessory BOOLEAN DEFAULT FALSE AFTER category',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add accessory_category column (if not exists)
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'products' 
    AND COLUMN_NAME = 'accessory_category'
);

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE products ADD COLUMN accessory_category VARCHAR(100) AFTER is_accessory',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
