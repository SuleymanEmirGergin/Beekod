-- Add shipping fields to orders table
ALTER TABLE orders 
ADD COLUMN shipping_provider VARCHAR(64) NULL,
ADD COLUMN tracking_number VARCHAR(128) NULL,
ADD COLUMN shipping_label_url VARCHAR(512) NULL;

-- Create notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  channel VARCHAR(32) NOT NULL, -- 'email', 'webhook', 'in_app'
  event_type VARCHAR(64) NOT NULL, -- 'low_stock', 'new_order', 'shipping_update'
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  config_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_channel_event (channel, event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
