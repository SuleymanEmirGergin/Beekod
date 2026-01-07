CREATE TABLE IF NOT EXISTS job_dead_letters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id CHAR(36) NOT NULL,
  type VARCHAR(64) NOT NULL,
  payload JSON,
  error TEXT,
  attempts INT NOT NULL,
  max_attempts INT NOT NULL,
  failed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_job_dead_letters_job (job_id),
  INDEX idx_job_dead_letters_type (type)
);
