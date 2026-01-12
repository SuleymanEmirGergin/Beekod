-- ============================================================
-- Fix Script: Drop chatbot tables with correct foreign key handling
-- Run this before 20260109_001_chatbot_wholesaler.sql
-- ============================================================

-- Disable foreign key checks for clean drop
SET FOREIGN_KEY_CHECKS = 0;

-- Drop chatbot-related tables
DROP TABLE IF EXISTS wholesaler_messages;
DROP TABLE IF EXISTS wholesaler_products;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_sessions;
DROP TABLE IF EXISTS chat_audit_logs;
DROP TABLE IF EXISTS product_embeddings;
DROP TABLE IF EXISTS product_accessories;

-- Drop the foreign key constraint from messages table first (if exists)
-- Then we can drop wholesalers
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_NAME = 'messages_ibfk_1' 
    AND TABLE_NAME = 'messages' 
    AND TABLE_SCHEMA = DATABASE());

SET @sql = IF(@fk_exists > 0, 
    'ALTER TABLE messages DROP FOREIGN KEY messages_ibfk_1',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Now drop wholesalers
DROP TABLE IF EXISTS wholesalers;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Success message
SELECT 'Tables dropped successfully. Now run 20260109_001_chatbot_wholesaler.sql' AS status;
