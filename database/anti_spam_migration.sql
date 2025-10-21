-- Anti-Spam Protection Migration
-- Adds ban functionality to prevent order spam

-- Add banned_until field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP DEFAULT NULL;

-- Add index for faster ban checks
CREATE INDEX IF NOT EXISTS idx_users_banned_until ON users(banned_until) WHERE banned_until IS NOT NULL;

-- Add index on orders for rate limiting checks
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at);

-- Add comments for documentation
COMMENT ON COLUMN users.banned_until IS 'Timestamp until which user is banned. NULL means not banned.';
