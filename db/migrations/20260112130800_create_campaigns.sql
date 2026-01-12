CREATE TABLE IF NOT EXISTS campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('email', 'sms', 'push') NOT NULL,
  audience VARCHAR(50) NOT NULL,
  content TEXT,
  status ENUM('draft', 'scheduled', 'active', 'completed') DEFAULT 'draft',
  stats_sent INT DEFAULT 0,
  stats_opened INT DEFAULT 0,
  stats_clicked INT DEFAULT 0,
  revenue DECIMAL(10, 2) DEFAULT 0.00,
  scheduled_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_campaigns_status (status),
  INDEX idx_campaigns_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
