-- V3.0 Migration: Referral System, Promo Codes, Location-based & Quantity-based Pricing

-- ============================================================
-- 1. REFERRAL SYSTEM
-- ============================================================

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, rewarded
    reward_amount DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP,
    UNIQUE(referred_user_id) -- Each user can only be referred once
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX idx_referrals_status ON referrals(status);

-- Add referral code to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_referral_earnings DECIMAL(10, 2) DEFAULT 0.00;

-- Generate unique referral codes for existing users
UPDATE users SET referral_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)) WHERE referral_code IS NULL;

-- ============================================================
-- 2. PROMO CODES
-- ============================================================

CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL, -- percentage, fixed
    discount_value DECIMAL(10, 2) NOT NULL,
    max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
    current_uses INTEGER DEFAULT 0,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP DEFAULT NULL, -- NULL = no expiration
    is_active BOOLEAN DEFAULT TRUE,
    min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active);

-- Promo code usage tracking
CREATE TABLE IF NOT EXISTS promo_code_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    discount_amount DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(promo_code_id, user_id, order_id)
);

CREATE INDEX idx_promo_usage_code ON promo_code_usage(promo_code_id);
CREATE INDEX idx_promo_usage_user ON promo_code_usage(user_id);

-- ============================================================
-- 3. LOCATION-BASED ORDERING
-- ============================================================

-- Add location fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX idx_orders_city ON orders(city);
CREATE INDEX idx_orders_district ON orders(district);

-- ============================================================
-- 4. QUANTITY-BASED PRICING
-- ============================================================

-- Price tiers table for quantity-based pricing
CREATE TABLE IF NOT EXISTS product_price_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL, -- 1, 2, 3, 5, 10, 20
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, quantity)
);

CREATE INDEX idx_price_tiers_product ON product_price_tiers(product_id);
CREATE INDEX idx_price_tiers_quantity ON product_price_tiers(quantity);

-- ============================================================
-- 5. ORDERS TABLE UPDATES
-- ============================================================

-- Add promo code tracking to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2);

-- Update existing orders subtotal to match total_amount
UPDATE orders SET subtotal = total_amount WHERE subtotal IS NULL;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE referrals IS 'User referral tracking system';
COMMENT ON TABLE promo_codes IS 'Promotional discount codes';
COMMENT ON TABLE promo_code_usage IS 'Track promo code usage per user';
COMMENT ON TABLE product_price_tiers IS 'Quantity-based pricing for products';
COMMENT ON COLUMN orders.city IS 'Delivery city (София, Пловдив)';
COMMENT ON COLUMN orders.district IS 'Delivery district/квартал';
COMMENT ON COLUMN orders.promo_code IS 'Applied promo code';
COMMENT ON COLUMN orders.discount_amount IS 'Discount from promo code';
COMMENT ON COLUMN orders.subtotal IS 'Order total before discount';

-- ============================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================

-- Sample promo codes
INSERT INTO promo_codes (code, discount_type, discount_value, max_uses, valid_until, min_order_amount)
VALUES
    ('WELCOME10', 'percentage', 10, NULL, NULL, 0),
    ('FIRST20', 'percentage', 20, 100, NULL, 50),
    ('SAVE5', 'fixed', 5, NULL, NULL, 0)
ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE promo_codes IS 'Example codes: WELCOME10 (10% off), FIRST20 (20% off for first 100 users, min €50), SAVE5 (€5 off)';
