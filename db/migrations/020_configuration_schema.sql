CREATE TABLE IF NOT EXISTS configuration (
    id INT PRIMARY KEY DEFAULT 1,
    data JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT single_row CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial configuration seed
INSERT IGNORE INTO configuration (id, data) VALUES (1, '{
    "company": {
        "name": "Beekod Wholesale",
        "timezone": "Europe/Istanbul",
        "currency": "TRY",
        "language": "Turkish"
    },
    "notifications": {
        "email": true,
        "order": true,
        "stock": true,
        "marketplace": false
    },
    "security": {
        "twoFactorAuth": false,
        "sessionTimeout": "30",
        "ipWhitelist": false
    },
    "appearance": {
        "theme": "Light",
        "compactMode": false,
        "showAnimations": true
    },
    "data": {
        "autoBackup": true,
        "backupFrequency": "Daily",
        "dataRetention": "12"
    },
    "sync": {
        "products": true,
        "orders": true,
        "autoSyncFrequency": "Every 15 Minutes"
    }
}');
