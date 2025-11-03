-- ============================================
-- CryptoShop Database Schema - Complete Migration
-- Version: 2.0 - Production Ready
-- ============================================

-- Drop existing tables if they exist (clean start)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS variant_stock CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS product_districts CASCADE;
DROP TABLE IF EXISTS product_cities CASCADE;
DROP TABLE IF EXISTS districts CASCADE;
DROP TABLE IF EXISTS cities CASCADE;
DROP TABLE IF EXISTS promo_codes CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telegram VARCHAR(100),
    is_admin BOOLEAN DEFAULT FALSE,
    banned_until TIMESTAMP,
    total_referral_earnings DECIMAL(10,2) DEFAULT 0,
    total_referrals INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_telegram ON users(telegram);
CREATE INDEX idx_users_is_admin ON users(is_admin);

-- ============================================
-- CITIES & DISTRICTS
-- ============================================
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(city_id, name)
);

CREATE INDEX idx_districts_city ON districts(city_id);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'EUR',
    picture_link TEXT,
    quantity INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_price ON products(price);

-- ============================================
-- PRODUCT VARIANTS (5гр, 10гр, etc.)
-- ============================================
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_name VARCHAR(50) NOT NULL, -- "5гр", "10гр", etc.
    variant_type VARCHAR(10) NOT NULL CHECK (variant_type IN ('гр', 'бр')),
    amount DECIMAL(10,2) NOT NULL, -- 5.00, 10.00, etc.
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, variant_name)
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_active ON product_variants(is_active);

-- ============================================
-- VARIANT STOCK BY CITY
-- ============================================
CREATE TABLE variant_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    stock_amount DECIMAL(10,2) DEFAULT 0,
    reserved_amount DECIMAL(10,2) DEFAULT 0,
    low_stock_threshold DECIMAL(10,2) DEFAULT 10,
    last_restock_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(variant_id, city_id)
);

CREATE INDEX idx_variant_stock_variant ON variant_stock(variant_id);
CREATE INDEX idx_variant_stock_city ON variant_stock(city_id);
CREATE INDEX idx_variant_stock_low ON variant_stock(stock_amount) WHERE stock_amount < low_stock_threshold;

-- ============================================
-- PRODUCT LOCATIONS (where products are available)
-- ============================================
CREATE TABLE product_cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, city_id)
);

CREATE TABLE product_districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, district_id)
);

CREATE INDEX idx_product_cities_product ON product_cities(product_id);
CREATE INDEX idx_product_districts_product ON product_districts(product_id);

-- ============================================
-- PROMO CODES
-- ============================================
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_promo_codes_code ON promo_codes(UPPER(code));
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    promo_code VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'EUR',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired')),
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered')),
    payment_id VARCHAR(255),
    city_id UUID REFERENCES cities(id),
    district_id UUID REFERENCES districts(id),
    city VARCHAR(100),
    district VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_delivery ON orders(delivery_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_id ON orders(payment_id);

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_picture TEXT,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    variant_name VARCHAR(50),
    variant_amount DECIMAL(10,2),
    delivery_map_link TEXT,
    delivery_image_link TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_variant ON order_items(variant_id);

-- ============================================
-- REFERRALS
-- ============================================
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
    reward_amount DECIMAL(10,2) DEFAULT 0,
    activated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(referred_user_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX idx_referrals_status ON referrals(status);

-- ============================================
-- CHAT MESSAGES
-- ============================================
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) CHECK (sender_type IN ('user', 'admin')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_user ON chat_messages(user_id);
CREATE INDEX idx_chat_unread ON chat_messages(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_chat_created ON chat_messages(created_at DESC);

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Default cities (Bulgarian cities)
INSERT INTO cities (name, is_active) VALUES
('София', true),
('Пловдив', true),
('Варна', true),
('Бургас', true),
('Русе', true),
('Стара Загора', true),
('Плевен', true),
('Велико Търново', true)
ON CONFLICT (name) DO NOTHING;

-- Default districts for Sofia
INSERT INTO districts (city_id, name, is_active)
SELECT id, 'Център', true FROM cities WHERE name = 'София'
UNION ALL
SELECT id, 'Люлин', true FROM cities WHERE name = 'София'
UNION ALL
SELECT id, 'Студентски град', true FROM cities WHERE name = 'София'
UNION ALL
SELECT id, 'Лозенец', true FROM cities WHERE name = 'София'
UNION ALL
SELECT id, 'Младост', true FROM cities WHERE name = 'София'
ON CONFLICT DO NOTHING;

-- Default districts for Plovdiv
INSERT INTO districts (city_id, name, is_active)
SELECT id, 'Център', true FROM cities WHERE name = 'Пловдив'
UNION ALL
SELECT id, 'Тракия', true FROM cities WHERE name = 'Пловдив'
UNION ALL
SELECT id, 'Марица', true FROM cities WHERE name = 'Пловдив'
ON CONFLICT DO NOTHING;

-- Default admin user (password: admin123 - CHANGE THIS!)
-- Password hash for "admin123"
INSERT INTO users (username, password, is_admin, created_at)
VALUES (
    'admin',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    true,
    NOW()
)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variants_updated_at BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variant_stock_updated_at BEFORE UPDATE ON variant_stock
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- Sales by product
CREATE OR REPLACE VIEW v_product_sales AS
SELECT
    p.id,
    p.name,
    COUNT(DISTINCT o.id) as total_orders,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.product_price * oi.quantity) as total_revenue
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'paid'
GROUP BY p.id, p.name;

-- User statistics
CREATE OR REPLACE VIEW v_user_stats AS
SELECT
    u.id,
    u.username,
    COUNT(DISTINCT o.id) as total_orders,
    SUM(o.total_amount) as total_spent,
    u.total_referral_earnings,
    u.total_referrals
FROM users u
LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'paid'
GROUP BY u.id, u.username, u.total_referral_earnings, u.total_referrals;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cryptoshop;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cryptoshop;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cryptoshop;

-- ============================================
-- VERIFICATION
-- ============================================

-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- List all indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Print success message
DO $$
BEGIN
    RAISE NOTICE '✅ CryptoShop Database Migration Complete!';
    RAISE NOTICE '📊 Tables created: 13';
    RAISE NOTICE '🔑 Indexes created: 25+';
    RAISE NOTICE '🏙️  Default cities: 8';
    RAISE NOTICE '📍 Default districts: 8';
    RAISE NOTICE '👤 Default admin user: admin (password: admin123 - CHANGE THIS!)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Change admin password immediately!';
    RAISE NOTICE '🚀 Ready for deployment!';
END $$;
