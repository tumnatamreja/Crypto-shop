-- ============================================
-- Product Variants & Stock Management System
-- ============================================
-- Migrates from simple price tiers to full variant system
-- with stock tracking per city per variant
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Product Variants Table
-- ============================================
-- Stores product variations (5гр, 10гр, 5бр, 10бр...)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- Variant details
    variant_name VARCHAR(100) NOT NULL,        -- "5гр", "10бр", "20гр"
    variant_type VARCHAR(20) NOT NULL,         -- "гр" or "бр"
    amount DECIMAL(10,2) NOT NULL,             -- 5, 10, 20, 50...
    price DECIMAL(10,2) NOT NULL,              -- Price for this variant

    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,              -- Display order

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    UNIQUE(product_id, variant_name),
    CHECK (amount > 0),
    CHECK (price >= 0)
);

CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_active ON product_variants(is_active);

COMMENT ON TABLE product_variants IS 'Product variations with different amounts and prices (e.g., 5гр, 10гр, 5бр)';

-- ============================================
-- 2. Variant Stock per City Table
-- ============================================
-- Tracks stock availability for each variant in each city
CREATE TABLE IF NOT EXISTS variant_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,

    -- Stock tracking
    stock_amount DECIMAL(10,2) NOT NULL DEFAULT 0,        -- Available stock (in гр or бр)
    low_stock_threshold DECIMAL(10,2) DEFAULT 10,         -- Alert when stock is low
    reserved_amount DECIMAL(10,2) DEFAULT 0,              -- Reserved for pending orders

    -- Metadata
    last_restock_date TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    UNIQUE(variant_id, city_id),
    CHECK (stock_amount >= 0),
    CHECK (reserved_amount >= 0),
    CHECK (low_stock_threshold >= 0)
);

CREATE INDEX idx_variant_stock_variant ON variant_stock(variant_id);
CREATE INDEX idx_variant_stock_city ON variant_stock(city_id);
CREATE INDEX idx_variant_stock_low ON variant_stock(stock_amount) WHERE stock_amount <= low_stock_threshold;

COMMENT ON TABLE variant_stock IS 'Stock tracking per variant per city with low stock alerts';

-- ============================================
-- 3. Helper Functions
-- ============================================

-- Function: Get available stock for variant in city
CREATE OR REPLACE FUNCTION get_available_stock(
    p_variant_id UUID,
    p_city_id UUID
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    available DECIMAL(10,2);
BEGIN
    SELECT (stock_amount - reserved_amount)
    INTO available
    FROM variant_stock
    WHERE variant_id = p_variant_id AND city_id = p_city_id;

    RETURN COALESCE(available, 0);
END;
$$ LANGUAGE plpgsql;

-- Function: Get all active variants for product
CREATE OR REPLACE FUNCTION get_product_variants(p_product_id UUID)
RETURNS TABLE (
    variant_id UUID,
    variant_name VARCHAR,
    variant_type VARCHAR,
    amount DECIMAL,
    price DECIMAL,
    total_stock DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pv.id,
        pv.variant_name,
        pv.variant_type,
        pv.amount,
        pv.price,
        COALESCE(SUM(vs.stock_amount - vs.reserved_amount), 0) as total_stock
    FROM product_variants pv
    LEFT JOIN variant_stock vs ON pv.id = vs.variant_id
    WHERE pv.product_id = p_product_id AND pv.is_active = true
    GROUP BY pv.id, pv.variant_name, pv.variant_type, pv.amount, pv.price
    ORDER BY pv.sort_order, pv.amount;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if variant is available in city
CREATE OR REPLACE FUNCTION is_variant_available(
    p_variant_id UUID,
    p_city_id UUID,
    p_requested_amount DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    available DECIMAL(10,2);
BEGIN
    available := get_available_stock(p_variant_id, p_city_id);
    RETURN available >= p_requested_amount;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Triggers
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_variants_timestamp
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_variant_stock_timestamp
    BEFORE UPDATE ON variant_stock
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ============================================
-- 5. Update Order Items Table
-- ============================================
-- Add variant_id to order_items
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id),
ADD COLUMN IF NOT EXISTS variant_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS variant_amount DECIMAL(10,2);

CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(variant_id);

COMMENT ON COLUMN order_items.variant_id IS 'Reference to the product variant ordered';
COMMENT ON COLUMN order_items.variant_name IS 'Snapshot of variant name at time of order';
COMMENT ON COLUMN order_items.variant_amount IS 'Amount of variant ordered (e.g., 5гр, 10бр)';

-- ============================================
-- 6. Migration: Convert existing price_tiers to variants
-- ============================================
-- This will create default variants from existing products
-- Run this after deploying the new code

-- Insert default variant for each product based on base price
INSERT INTO product_variants (product_id, variant_name, variant_type, amount, price, sort_order)
SELECT
    id as product_id,
    '1бр' as variant_name,
    'бр' as variant_type,
    1 as amount,
    price,
    0 as sort_order
FROM products
WHERE id NOT IN (SELECT DISTINCT product_id FROM product_variants)
ON CONFLICT (product_id, variant_name) DO NOTHING;

-- Initialize stock for all cities for new default variants
INSERT INTO variant_stock (variant_id, city_id, stock_amount)
SELECT
    pv.id as variant_id,
    c.id as city_id,
    100 as stock_amount  -- Default starting stock
FROM product_variants pv
CROSS JOIN cities c
WHERE pv.id NOT IN (SELECT DISTINCT variant_id FROM variant_stock)
ON CONFLICT (variant_id, city_id) DO NOTHING;

-- ============================================
-- 7. Views for Easy Querying
-- ============================================

-- View: Product variants with stock info
CREATE OR REPLACE VIEW v_product_variants_with_stock AS
SELECT
    p.id as product_id,
    p.name as product_name,
    pv.id as variant_id,
    pv.variant_name,
    pv.variant_type,
    pv.amount,
    pv.price,
    pv.is_active,
    c.id as city_id,
    c.name as city_name,
    vs.stock_amount,
    vs.reserved_amount,
    (vs.stock_amount - vs.reserved_amount) as available_stock,
    CASE
        WHEN (vs.stock_amount - vs.reserved_amount) <= 0 THEN 'out_of_stock'
        WHEN (vs.stock_amount - vs.reserved_amount) <= vs.low_stock_threshold THEN 'low_stock'
        ELSE 'in_stock'
    END as stock_status
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
LEFT JOIN variant_stock vs ON pv.id = vs.variant_id
LEFT JOIN cities c ON vs.city_id = c.id
WHERE p.is_active = true AND pv.is_active = true;

COMMENT ON VIEW v_product_variants_with_stock IS 'Complete view of products with variants and stock status per city';

-- ============================================
-- SUCCESS!
-- ============================================
-- Product variants and stock management system created successfully!
-- Next steps:
-- 1. Add backend API endpoints
-- 2. Build admin UI for managing variants and stock
-- 3. Update customer order flow
