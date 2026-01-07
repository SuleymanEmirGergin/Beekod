import { pool } from "../db.js";
import { logger } from "../logger.js";

const queries = [
  `CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        marketplace ENUM('Trendyol', 'Hepsiburada', 'N11', 'Pazarama') NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        image_url TEXT,
        customer_name VARCHAR(255) NOT NULL,
        question_text TEXT NOT NULL,
        status ENUM('replied', 'unreplied') DEFAULT 'unreplied',
        answer TEXT,
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  `CREATE TABLE IF NOT EXISTS social_posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        platform ENUM('Instagram', 'TikTok', 'Facebook', 'Twitter', 'LinkedIn') NOT NULL,
        content TEXT NOT NULL,
        media_url TEXT,
        scheduled_date TIMESTAMP NOT NULL,
        status ENUM('Draft', 'Scheduled', 'Posted', 'Failed') DEFAULT 'Draft',
        product_id VARCHAR(255),
        ai_generated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
  `CREATE TABLE IF NOT EXISTS video_analytics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        video_id VARCHAR(255) NOT NULL,
        product_barcode VARCHAR(50),
        platform ENUM('instagram', 'tiktok', 'facebook', 'youtube', 'twitter') NOT NULL,
        platform_video_id VARCHAR(255),
        views INT DEFAULT 0,
        likes INT DEFAULT 0,
        comments INT DEFAULT 0,
        shares INT DEFAULT 0,
        saves INT DEFAULT 0,
        engagement_rate FLOAT DEFAULT 0,
        average_watch_time FLOAT,
        completion_rate FLOAT,
        top_countries JSON,
        top_age_groups JSON,
        male_percentage FLOAT,
        female_percentage FLOAT,
        peak_viewing_hours JSON,
        published_at TIMESTAMP NULL,
        last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        performance_score INT DEFAULT 0,
        recommended_posting_time VARCHAR(255),
        suggested_improvements JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_video (video_id, platform)
    )`,
];

async function migrate() {
  for (const sql of queries) {
    try {
      await pool.query(sql);
      console.log("Executed query successfully");
    } catch (error) {
      console.error("Migration query failed:", error);
    }
  }
  process.exit(0);
}

migrate();
