-- Product Locations Migration
-- Associates products with available cities and districts for delivery

-- ============================================================
-- 1. DROP OLD CITIES (Keep only 4 cities)
-- ============================================================

-- Remove all cities except Sofia, Plovdiv, Burgas, Varna
DELETE FROM districts WHERE city_id NOT IN (
    SELECT id FROM cities WHERE name IN ('София', 'Пловдив', 'Бургас', 'Варна')
);

DELETE FROM cities WHERE name NOT IN ('София', 'Пловдив', 'Бургас', 'Варна');

-- Update sort order for remaining cities
UPDATE cities SET sort_order = 1 WHERE name = 'София';
UPDATE cities SET sort_order = 2 WHERE name = 'Пловдив';
UPDATE cities SET sort_order = 3 WHERE name = 'Бургас';
UPDATE cities SET sort_order = 4 WHERE name = 'Варна';

-- ============================================================
-- 2. PRODUCT-CITY ASSOCIATION (Many-to-Many)
-- ============================================================

CREATE TABLE IF NOT EXISTS product_available_cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, city_id)
);

CREATE INDEX idx_product_cities_product ON product_available_cities(product_id);
CREATE INDEX idx_product_cities_city ON product_available_cities(city_id);
CREATE INDEX idx_product_cities_active ON product_available_cities(is_active);

COMMENT ON TABLE product_available_cities IS 'Defines which cities each product can be delivered to';
COMMENT ON COLUMN product_available_cities.is_active IS 'Can temporarily disable delivery to a city without deleting the association';

-- ============================================================
-- 3. PRODUCT-DISTRICT ASSOCIATION (Many-to-Many)
-- ============================================================

CREATE TABLE IF NOT EXISTS product_available_districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, district_id),
    FOREIGN KEY (product_id, city_id) REFERENCES product_available_cities(product_id, city_id) ON DELETE CASCADE
);

CREATE INDEX idx_product_districts_product ON product_available_districts(product_id);
CREATE INDEX idx_product_districts_city ON product_available_districts(city_id);
CREATE INDEX idx_product_districts_district ON product_available_districts(district_id);
CREATE INDEX idx_product_districts_active ON product_available_districts(is_active);

COMMENT ON TABLE product_available_districts IS 'Defines which districts each product can be delivered to within a city';
COMMENT ON COLUMN product_available_districts.city_id IS 'Denormalized city_id for faster queries';

-- ============================================================
-- 4. HELPER FUNCTIONS
-- ============================================================

-- Function to get available cities for a product
CREATE OR REPLACE FUNCTION get_product_cities(p_product_id UUID)
RETURNS TABLE (
    city_id UUID,
    city_name VARCHAR,
    city_name_en VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name, c.name_en
    FROM cities c
    INNER JOIN product_available_cities pac ON c.id = pac.city_id
    WHERE pac.product_id = p_product_id
      AND pac.is_active = true
      AND c.is_active = true
    ORDER BY c.sort_order, c.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get available districts for a product in a specific city
CREATE OR REPLACE FUNCTION get_product_districts(p_product_id UUID, p_city_id UUID)
RETURNS TABLE (
    district_id UUID,
    district_name VARCHAR,
    district_name_en VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT d.id, d.name, d.name_en
    FROM districts d
    INNER JOIN product_available_districts pad ON d.id = pad.district_id
    WHERE pad.product_id = p_product_id
      AND pad.city_id = p_city_id
      AND pad.is_active = true
      AND d.is_active = true
    ORDER BY d.sort_order, d.name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. DEFAULT SETUP FOR EXISTING PRODUCTS
-- ============================================================

-- By default, make all products available in all 4 cities and all their districts
-- Admins can then customize per product

DO $$
DECLARE
    p_rec RECORD;
    c_rec RECORD;
    d_rec RECORD;
BEGIN
    -- For each active product
    FOR p_rec IN SELECT id FROM products WHERE is_active = true LOOP
        -- Add all 4 cities
        FOR c_rec IN SELECT id FROM cities WHERE is_active = true LOOP
            INSERT INTO product_available_cities (product_id, city_id)
            VALUES (p_rec.id, c_rec.id)
            ON CONFLICT (product_id, city_id) DO NOTHING;

            -- Add all districts for this city
            FOR d_rec IN SELECT id FROM districts WHERE city_id = c_rec.id AND is_active = true LOOP
                INSERT INTO product_available_districts (product_id, city_id, district_id)
                VALUES (p_rec.id, c_rec.id, d_rec.id)
                ON CONFLICT (product_id, district_id) DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Default locations assigned to all active products';
END $$;

-- ============================================================
-- 6. VALIDATION TRIGGER
-- ============================================================

-- Ensure district belongs to the specified city
CREATE OR REPLACE FUNCTION validate_product_district()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if district belongs to the city
    IF NOT EXISTS (
        SELECT 1 FROM districts
        WHERE id = NEW.district_id AND city_id = NEW.city_id
    ) THEN
        RAISE EXCEPTION 'District % does not belong to city %', NEW.district_id, NEW.city_id;
    END IF;

    -- Check if product-city association exists
    IF NOT EXISTS (
        SELECT 1 FROM product_available_cities
        WHERE product_id = NEW.product_id AND city_id = NEW.city_id
    ) THEN
        RAISE EXCEPTION 'Product % is not available in city %', NEW.product_id, NEW.city_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_product_district_trigger
    BEFORE INSERT OR UPDATE ON product_available_districts
    FOR EACH ROW
    EXECUTE FUNCTION validate_product_district();

-- ============================================================
-- COMPLETION MESSAGE
-- ============================================================

DO $$
DECLARE
    product_count INTEGER;
    city_count INTEGER;
    district_count INTEGER;
    associations INTEGER;
BEGIN
    SELECT COUNT(*) INTO product_count FROM products WHERE is_active = true;
    SELECT COUNT(*) INTO city_count FROM cities WHERE is_active = true;
    SELECT COUNT(*) INTO district_count FROM districts WHERE is_active = true;
    SELECT COUNT(*) INTO associations FROM product_available_cities;

    RAISE NOTICE '✅ Product Locations migration completed!';
    RAISE NOTICE 'Cities: %', city_count;
    RAISE NOTICE 'Districts: %', district_count;
    RAISE NOTICE 'Products: %', product_count;
    RAISE NOTICE 'Product-City associations: %', associations;
END $$;
