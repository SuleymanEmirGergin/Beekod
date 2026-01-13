-- Drop and Recreate table to ensure correct schema
DROP TABLE IF EXISTS team_members;

CREATE TABLE team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role ENUM('Owner', 'Admin', 'Member', 'Viewer') DEFAULT 'Member',
    status ENUM('Active', 'Pending') DEFAULT 'Pending',
    avatar VARCHAR(512),
    phone VARCHAR(50),
    location VARCHAR(255),
    position VARCHAR(255),
    bio TEXT,
    password_hash VARCHAR(255) NOT NULL,
    last_login TIMESTAMP NULL,
    reset_token VARCHAR(255) NULL,
    reset_token_expires TIMESTAMP NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


