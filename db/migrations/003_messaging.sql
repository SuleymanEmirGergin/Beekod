USE `beekod`;

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  content TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES wholesalers(id),
  FOREIGN KEY (receiver_id) REFERENCES wholesalers(id),
  INDEX idx_conversation (sender_id, receiver_id),
  INDEX idx_unread (receiver_id, is_read)
);
