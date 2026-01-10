-- ============================================================
-- CHATBOT TABLES (Session + Messages + Audit)
-- ============================================================

-- Chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(255) NULL,
    mode ENUM('BEEKOD', 'TOPTANCI') DEFAULT 'BEEKOD',
    title VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSON NULL,
    INDEX idx_chat_sessions_user (user_id),
    INDEX idx_chat_sessions_mode (mode),
    INDEX idx_chat_sessions_updated (updated_at)
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    role ENUM('user', 'assistant', 'system') NOT NULL,
    content TEXT NOT NULL,
    intent VARCHAR(64) NULL,
    entities JSON NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- Chat audit logs
CREATE TABLE IF NOT EXISTS chat_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NULL,
    session_id VARCHAR(36) NOT NULL,
    action VARCHAR(64) NOT NULL,
    entity VARCHAR(64) NOT NULL,
    entity_id VARCHAR(255) NULL,
    old_value JSON NULL,
    new_value JSON NULL,
    metadata JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_session (session_id),
    INDEX idx_audit_entity (entity, entity_id),
    INDEX idx_audit_created (created_at)
);

-- ============================================================
-- WHOLESALER NETWORK TABLES (Toptancı Ağı)
-- ============================================================

-- Wholesalers (Toptancılar)
CREATE TABLE IF NOT EXISTS wholesalers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NULL,
    city VARCHAR(100) NULL,
    district VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_wholesalers_user (user_id),
    INDEX idx_wholesalers_city (city),
    INDEX idx_wholesalers_active (is_active)
);

-- Wholesaler products (Toptancı stok bilgileri)
CREATE TABLE IF NOT EXISTS wholesaler_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wholesaler_id INT NOT NULL,
    barcode VARCHAR(64) NOT NULL,
    product_name VARCHAR(255) NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NULL,
    currency VARCHAR(8) DEFAULT 'TRY',
    min_order_qty INT DEFAULT 1,
    is_available BOOLEAN GENERATED ALWAYS AS (stock_quantity > 0) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_wholesaler_barcode (wholesaler_id, barcode),
    INDEX idx_wholesaler_products_barcode (barcode),
    INDEX idx_wholesaler_products_available (is_available),
    INDEX idx_wholesaler_products_updated (updated_at),
    FOREIGN KEY (wholesaler_id) REFERENCES wholesalers(id) ON DELETE CASCADE
);

-- Wholesaler messages (Platform içi mesajlaşma)
CREATE TABLE IF NOT EXISTS wholesaler_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_wholesaler_id INT NOT NULL,
    to_wholesaler_id INT NOT NULL,
    barcode VARCHAR(64) NULL,
    product_name VARCHAR(255) NULL,
    requested_qty INT NULL,
    message_text TEXT NULL,
    include_phone BOOLEAN DEFAULT FALSE,
    sender_phone VARCHAR(20) NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    INDEX idx_messages_from (from_wholesaler_id),
    INDEX idx_messages_to (to_wholesaler_id),
    INDEX idx_messages_barcode (barcode),
    INDEX idx_messages_unread (to_wholesaler_id, is_read),
    INDEX idx_messages_created (created_at),
    FOREIGN KEY (from_wholesaler_id) REFERENCES wholesalers(id) ON DELETE CASCADE,
    FOREIGN KEY (to_wholesaler_id) REFERENCES wholesalers(id) ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA (Test Wholesalers)
-- ============================================================

-- Insert demo wholesalers for testing
INSERT IGNORE INTO wholesalers (id, company_name, city, phone, is_active) VALUES
(1, 'Ankara Toptan A.Ş.', 'Ankara', '0312 555 0001', TRUE),
(2, 'İstanbul Tedarik Ltd.', 'İstanbul', '0212 555 0002', TRUE),
(3, 'İzmir Dağıtım', 'İzmir', '0232 555 0003', TRUE),
(4, 'Bursa Ticaret', 'Bursa', '0224 555 0004', TRUE),
(5, 'Antalya Pazarlama', 'Antalya', '0242 555 0005', TRUE);

-- Insert demo products for testing (örnek barkodlar)
INSERT IGNORE INTO wholesaler_products (wholesaler_id, barcode, product_name, stock_quantity, price) VALUES
-- Ankara Toptan
(1, '8690000000001', 'Örnek Ürün 1', 150, 45.90),
(1, '8690000000002', 'Örnek Ürün 2', 0, 55.00),
(1, '8690000000003', 'Örnek Ürün 3', 75, 32.50),

-- İstanbul Tedarik
(2, '8690000000001', 'Örnek Ürün 1', 200, 44.50),
(2, '8690000000002', 'Örnek Ürün 2', 80, 54.00),

-- İzmir Dağıtım
(3, '8690000000001', 'Örnek Ürün 1', 0, 46.00),
(3, '8690000000003', 'Örnek Ürün 3', 120, 31.90),

-- Bursa Ticaret
(4, '8690000000002', 'Örnek Ürün 2', 50, 53.50),
(4, '8690000000003', 'Örnek Ürün 3', 0, 33.00),

-- Antalya Pazarlama
(5, '8690000000001', 'Örnek Ürün 1', 100, 45.00);
