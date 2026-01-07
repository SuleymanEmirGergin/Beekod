-- Optimizations for frequent queries

-- Product search performance
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Marketplace listings sorting performance
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_updated_at ON marketplace_listings(updated_at);

-- Analytics date filtering performance
-- (created_at index already exists on action_logs in schema.sql but making sure it is explicit or if missing)
-- Checking schema.sql, idx_action_logs_created_at exists.
-- But let's add idx_action_logs_intent for analytics stats if missed.
CREATE INDEX IF NOT EXISTS idx_action_logs_intent ON action_logs(intent);
