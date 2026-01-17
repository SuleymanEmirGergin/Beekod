import { createPool } from 'mysql2/promise';
import { config } from '../../src/config.js';

async function fixSchema() {
  console.log('Connecting to database...');
  console.log('DB Config:', {
    host: config.db.host,
    user: config.db.user,
    database: config.db.database,
    passwordLength: config.db.password ? config.db.password.length : 0
  });
  const pool = createPool({
    host: 'localhost',
    user: 'root',
    password: 'Emreemir21.',
    database: config.db.database,
    multipleStatements: true
  });

  try {
    console.log('Creating team_members table if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_members (
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
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Checking for password_hash column...');
    const [columns] = await pool.query<any[]>(`SHOW COLUMNS FROM team_members LIKE 'password_hash'`);

    if (columns.length === 0) {
      console.log('Adding password_hash and other columns...');
      await pool.query(`
        ALTER TABLE team_members
        ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '$2b$10$X7X7X7X7X7X7X7X7X7X7u.X7X7X7X7X7X7X7X7X7X7X7X7X7X7',
        ADD COLUMN last_login TIMESTAMP NULL,
        ADD COLUMN reset_token VARCHAR(255) NULL,
        ADD COLUMN reset_token_expires TIMESTAMP NULL;
      `);
      console.log('Columns added.');
    } else {
      console.log('password_hash column already exists.');
    }

    console.log('Schema fix completed.');

  } catch (error) {
    console.error('Error fixing schema:', error);
  } finally {
    await pool.end();
  }
}

fixSchema();
