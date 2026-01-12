-- =============================================
-- AI Audit Logs Table
-- 
-- Stores all AI interactions for compliance,
-- debugging, and analytics
-- =============================================

CREATE TABLE IF NOT EXISTS ai_audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Tenant isolation
    tenant_id VARCHAR(100) NOT NULL DEFAULT 'default',
    user_id VARCHAR(100) NOT NULL,
    
    -- Request data
    request_text TEXT NOT NULL,
    
    -- AI response data
    intent VARCHAR(255) NOT NULL,
    tool_calls_json JSON,
    tool_results_json JSON,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for common queries
    INDEX idx_tenant_created (tenant_id, created_at DESC),
    INDEX idx_user_created (user_id, created_at DESC),
    INDEX idx_intent (intent),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Optional: Partitioning for large datasets
-- Uncomment if you expect high volume
-- =============================================
-- ALTER TABLE ai_audit_logs
-- PARTITION BY RANGE (UNIX_TIMESTAMP(created_at)) (
--     PARTITION p2026_01 VALUES LESS THAN (UNIX_TIMESTAMP('2026-02-01')),
--     PARTITION p2026_02 VALUES LESS THAN (UNIX_TIMESTAMP('2026-03-01')),
--     PARTITION p2026_03 VALUES LESS THAN (UNIX_TIMESTAMP('2026-04-01')),
--     PARTITION p_future VALUES LESS THAN MAXVALUE
-- );

-- =============================================
-- Auto-cleanup: Delete logs older than 90 days
-- Run this as a scheduled job if needed
-- =============================================
-- CREATE EVENT IF NOT EXISTS cleanup_ai_audit_logs
-- ON SCHEDULE EVERY 1 DAY
-- DO DELETE FROM ai_audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
