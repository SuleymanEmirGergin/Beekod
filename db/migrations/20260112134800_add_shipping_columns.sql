-- Add shipping columns to orders table
ALTER TABLE orders ADD COLUMN cargo_company VARCHAR(50);
ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(50);
