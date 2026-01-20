
CREATE TABLE IF NOT EXISTS base_models (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    name VARCHAR(100) NOT NULL,
    gender ENUM('male', 'female', 'neutral') NOT NULL DEFAULT 'neutral',
    image_url VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_gender (gender)
);

-- Seed some default models
INSERT INTO base_models (name, gender, image_url, is_active) VALUES
('Default Female', 'female', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop', 1),
('Default Male', 'male', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=1200&fit=crop', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);
