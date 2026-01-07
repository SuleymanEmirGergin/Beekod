CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id VARCHAR(64) NOT NULL UNIQUE,
  source_name VARCHAR(64) NOT NULL,
  source_id VARCHAR(64),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(64),
  customer_address TEXT,
  order_date VARCHAR(64) NOT NULL,
  total_amount VARCHAR(64) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'TRY',
  status_label VARCHAR(64) NOT NULL DEFAULT 'New',
  status_color VARCHAR(64),
  status_dot VARCHAR(64),
  products_list TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_order_request (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(64) NOT NULL,
  price VARCHAR(64) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  image_url VARCHAR(512),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
