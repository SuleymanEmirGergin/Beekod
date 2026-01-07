-- Add password_hash column to team_members table
ALTER TABLE team_members
ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '$2b$10$X7X7X7X7X7X7X7X7X7X7u.X7X7X7X7X7X7X7X7X7X7X7X7X7X7'; -- Default invalid hash

-- Add last_login column
ALTER TABLE team_members
ADD COLUMN last_login TIMESTAMP NULL;

-- Add reset_token columns for password recovery
ALTER TABLE team_members
ADD COLUMN reset_token VARCHAR(255) NULL,
ADD COLUMN reset_token_expires TIMESTAMP NULL;
