-- Cities and Districts Migration
-- Adds predefined cities and districts for delivery location

-- ============================================================
-- 1. CITIES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    name_en VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cities_name ON cities(name);
CREATE INDEX idx_cities_active ON cities(is_active);
CREATE INDEX idx_cities_sort ON cities(sort_order);

COMMENT ON TABLE cities IS 'Predefined cities for delivery';
COMMENT ON COLUMN cities.name IS 'City name in Bulgarian (София, Пловдив, Варна)';
COMMENT ON COLUMN cities.name_en IS 'City name in English (Sofia, Plovdiv, Varna)';
COMMENT ON COLUMN cities.sort_order IS 'Display order (lower = higher priority)';

-- ============================================================
-- 2. DISTRICTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(city_id, name)
);

CREATE INDEX idx_districts_city ON districts(city_id);
CREATE INDEX idx_districts_name ON districts(name);
CREATE INDEX idx_districts_active ON districts(is_active);
CREATE INDEX idx_districts_sort ON districts(sort_order);

COMMENT ON TABLE districts IS 'Districts/neighborhoods for each city';
COMMENT ON COLUMN districts.city_id IS 'Parent city';
COMMENT ON COLUMN districts.name IS 'District name in Bulgarian (Център, Люлин, Младост)';
COMMENT ON COLUMN districts.name_en IS 'District name in English (Center, Lyulin, Mladost)';

-- ============================================================
-- 3. UPDATE ORDERS TABLE
-- ============================================================

-- Add foreign key columns for cities and districts
ALTER TABLE orders ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES districts(id);

CREATE INDEX IF NOT EXISTS idx_orders_city_id ON orders(city_id);
CREATE INDEX IF NOT EXISTS idx_orders_district_id ON orders(district_id);

COMMENT ON COLUMN orders.city_id IS 'Selected city for delivery';
COMMENT ON COLUMN orders.district_id IS 'Selected district for delivery';

-- Keep the old text columns for backward compatibility
-- They will be populated automatically from city_id/district_id

-- ============================================================
-- 4. INSERT BULGARIAN CITIES
-- ============================================================

INSERT INTO cities (name, name_en, sort_order) VALUES
    ('София', 'Sofia', 1),
    ('Пловдив', 'Plovdiv', 2),
    ('Варна', 'Varna', 3),
    ('Бургас', 'Burgas', 4),
    ('Русе', 'Ruse', 5),
    ('Стара Загора', 'Stara Zagora', 6),
    ('Плевен', 'Pleven', 7),
    ('Сливен', 'Sliven', 8),
    ('Добрич', 'Dobrich', 9),
    ('Шумен', 'Shumen', 10),
    ('Перник', 'Pernik', 11),
    ('Хасково', 'Haskovo', 12),
    ('Ямбол', 'Yambol', 13),
    ('Пазарджик', 'Pazardzhik', 14),
    ('Благоевград', 'Blagoevgrad', 15),
    ('Велико Търново', 'Veliko Tarnovo', 16),
    ('Враца', 'Vratsa', 17),
    ('Габрово', 'Gabrovo', 18),
    ('Асеновград', 'Asenovgrad', 19),
    ('Видин', 'Vidin', 20),
    ('Казанлък', 'Kazanlak', 21),
    ('Кърджали', 'Kardzhali', 22),
    ('Кюстендил', 'Kyustendil', 23),
    ('Монтана', 'Montana', 24),
    ('Димитровград', 'Dimitrovgrad', 25),
    ('Ловеч', 'Lovech', 26),
    ('Силистра', 'Silistra', 27),
    ('Разград', 'Razgrad', 28),
    ('Търговище', 'Targovishte', 29),
    ('Дупница', 'Dupnitsa', 30)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 5. INSERT SOFIA DISTRICTS (КВАРТАЛИ)
-- ============================================================

-- Get Sofia's ID
DO $$
DECLARE
    sofia_id UUID;
BEGIN
    SELECT id INTO sofia_id FROM cities WHERE name = 'София' LIMIT 1;

    IF sofia_id IS NOT NULL THEN
        INSERT INTO districts (city_id, name, name_en, sort_order) VALUES
            -- Central districts
            (sofia_id, 'Център', 'Center', 1),
            (sofia_id, 'Лозенец', 'Lozenets', 2),
            (sofia_id, 'Иван Вазов', 'Ivan Vazov', 3),
            (sofia_id, 'Докторски паметник', 'Doctorski pametnik', 4),
            (sofia_id, 'Христо Ботев', 'Hristo Botev', 5),

            -- South/Southwest
            (sofia_id, 'Младост', 'Mladost', 10),
            (sofia_id, 'Младост 1', 'Mladost 1', 11),
            (sofia_id, 'Младост 2', 'Mladost 2', 12),
            (sofia_id, 'Младост 3', 'Mladost 3', 13),
            (sofia_id, 'Младост 4', 'Mladost 4', 14),
            (sofia_id, 'Дружба', 'Druzhba', 15),
            (sofia_id, 'Дружба 1', 'Druzhba 1', 16),
            (sofia_id, 'Дружба 2', 'Druzhba 2', 17),

            -- West
            (sofia_id, 'Люлин', 'Lyulin', 20),
            (sofia_id, 'Люлин 1', 'Lyulin 1', 21),
            (sofia_id, 'Люлин 2', 'Lyulin 2', 22),
            (sofia_id, 'Люлин 3', 'Lyulin 3', 23),
            (sofia_id, 'Люлин 4', 'Lyulin 4', 24),
            (sofia_id, 'Люлин 5', 'Lyulin 5', 25),
            (sofia_id, 'Люлин 6', 'Lyulin 6', 26),
            (sofia_id, 'Люлин 7', 'Lyulin 7', 27),
            (sofia_id, 'Люлин 8', 'Lyulin 8', 28),
            (sofia_id, 'Люлин 9', 'Lyulin 9', 29),
            (sofia_id, 'Люлин 10', 'Lyulin 10', 30),

            -- Northwest
            (sofia_id, 'Надежда', 'Nadezhda', 40),
            (sofia_id, 'Надежда 1', 'Nadezhda 1', 41),
            (sofia_id, 'Надежда 2', 'Nadezhda 2', 42),
            (sofia_id, 'Надежда 3', 'Nadezhda 3', 43),
            (sofia_id, 'Надежда 4', 'Nadezhda 4', 44),
            (sofia_id, 'Обеля', 'Obelya', 45),
            (sofia_id, 'Обеля 1', 'Obelya 1', 46),
            (sofia_id, 'Обеля 2', 'Obelya 2', 47),

            -- East
            (sofia_id, 'Овча купел', 'Ovcha kupel', 50),
            (sofia_id, 'Овча купел 1', 'Ovcha kupel 1', 51),
            (sofia_id, 'Овча купел 2', 'Ovcha kupel 2', 52),
            (sofia_id, 'Красна поляна', 'Krasna polyana', 53),
            (sofia_id, 'Красно село', 'Krasno selo', 54),
            (sofia_id, 'Хаджи Димитър', 'Hadji Dimitar', 55),

            -- North
            (sofia_id, 'Гео Милев', 'Geo Milev', 60),
            (sofia_id, 'Подуяне', 'Poduyane', 61),
            (sofia_id, 'Слатина', 'Slatina', 62),
            (sofia_id, 'Илинден', 'Ilinden', 63),
            (sofia_id, 'Левски', 'Levski', 64),
            (sofia_id, 'Студентски град', 'Studentski grad', 65),

            -- Other
            (sofia_id, 'Борово', 'Borovo', 70),
            (sofia_id, 'Витоша', 'Vitosha', 71),
            (sofia_id, 'Карпузица', 'Karpuzitsa', 72),
            (sofia_id, 'Manastirski livadi', 'Manastirski livadi', 73),
            (sofia_id, 'Редута', 'Reduta', 74),
            (sofia_id, 'Банишора', 'Banishora', 75),
            (sofia_id, 'Зона Б-5', 'Zone B-5', 76),
            (sofia_id, 'Зона Б-18', 'Zone B-18', 77),
            (sofia_id, 'Зона Б-19', 'Zone B-19', 78),
            (sofia_id, 'Симеоново', 'Simeonovo', 79),
            (sofia_id, 'Драгалевци', 'Dragalevtsi', 80),
            (sofia_id, 'Бояна', 'Boyana', 81),
            (sofia_id, 'Горна баня', 'Gorna banya', 82),
            (sofia_id, 'Княжево', 'Knyazhevo', 83)
        ON CONFLICT (city_id, name) DO NOTHING;
    END IF;
END $$;

-- ============================================================
-- 6. INSERT PLOVDIV DISTRICTS
-- ============================================================

DO $$
DECLARE
    plovdiv_id UUID;
BEGIN
    SELECT id INTO plovdiv_id FROM cities WHERE name = 'Пловдив' LIMIT 1;

    IF plovdiv_id IS NOT NULL THEN
        INSERT INTO districts (city_id, name, name_en, sort_order) VALUES
            (plovdiv_id, 'Център', 'Center', 1),
            (plovdiv_id, 'Капана', 'Kapana', 2),
            (plovdiv_id, 'Тракия', 'Trakiya', 3),
            (plovdiv_id, 'Кючук Париж', 'Kyuchuk Paris', 4),
            (plovdiv_id, 'Христо Смирненски', 'Hristo Smirnenski', 5),
            (plovdiv_id, 'Въстанически', 'Vastanicheski', 6),
            (plovdiv_id, 'Кършияка', 'Karshiyaka', 7),
            (plovdiv_id, 'Północен', 'Severen', 8),
            (plovdiv_id, 'Южен', 'Yuzhen', 9),
            (plovdiv_id, 'Западен', 'Zapaden', 10)
        ON CONFLICT (city_id, name) DO NOTHING;
    END IF;
END $$;

-- ============================================================
-- 7. INSERT VARNA DISTRICTS
-- ============================================================

DO $$
DECLARE
    varna_id UUID;
BEGIN
    SELECT id INTO varna_id FROM cities WHERE name = 'Варна' LIMIT 1;

    IF varna_id IS NOT NULL THEN
        INSERT INTO districts (city_id, name, name_en, sort_order) VALUES
            (varna_id, 'Център', 'Center', 1),
            (varna_id, 'Младост', 'Mladost', 2),
            (varna_id, 'Владислав Варненчик', 'Vladislav Varnenchik', 3),
            (varna_id, 'Виница', 'Vinitsa', 4),
            (varna_id, 'Левски', 'Levski', 5),
            (varna_id, 'Чайка', 'Chayka', 6),
            (varna_id, 'Приморски', 'Primorski', 7),
            (varna_id, 'Аспарухово', 'Asparuhovo', 8),
            (varna_id, 'Одесос', 'Odesos', 9)
        ON CONFLICT (city_id, name) DO NOTHING;
    END IF;
END $$;

-- ============================================================
-- 8. INSERT BURGAS DISTRICTS
-- ============================================================

DO $$
DECLARE
    burgas_id UUID;
BEGIN
    SELECT id INTO burgas_id FROM cities WHERE name = 'Бургас' LIMIT 1;

    IF burgas_id IS NOT NULL THEN
        INSERT INTO districts (city_id, name, name_en, sort_order) VALUES
            (burgas_id, 'Център', 'Center', 1),
            (burgas_id, 'Меден Рудник', 'Meden Rudnik', 2),
            (burgas_id, 'Зорница', 'Zornitsa', 3),
            (burgas_id, 'Изгрев', 'Izgrev', 4),
            (burgas_id, 'Славейков', 'Slaveykov', 5),
            (burgas_id, 'Лазур', 'Lazur', 6),
            (burgas_id, 'Сарафово', 'Sarafovo', 7)
        ON CONFLICT (city_id, name) DO NOTHING;
    END IF;
END $$;

-- ============================================================
-- 9. TRIGGER TO AUTO-POPULATE TEXT FIELDS
-- ============================================================

-- Function to populate city/district text fields from IDs
CREATE OR REPLACE FUNCTION populate_location_text()
RETURNS TRIGGER AS $$
BEGIN
    -- Populate city text from city_id
    IF NEW.city_id IS NOT NULL THEN
        SELECT name INTO NEW.city FROM cities WHERE id = NEW.city_id;
    END IF;

    -- Populate district text from district_id
    IF NEW.district_id IS NOT NULL THEN
        SELECT name INTO NEW.district FROM districts WHERE id = NEW.district_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS orders_populate_location ON orders;
CREATE TRIGGER orders_populate_location
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION populate_location_text();

-- ============================================================
-- 10. UPDATE EXISTING ORDERS (OPTIONAL)
-- ============================================================

-- Try to match existing text-based cities/districts to new IDs
-- This is best-effort - some may not match if spelling differs

UPDATE orders o
SET city_id = c.id
FROM cities c
WHERE LOWER(TRIM(o.city)) = LOWER(c.name)
AND o.city_id IS NULL
AND o.city IS NOT NULL;

UPDATE orders o
SET district_id = d.id
FROM districts d
JOIN cities c ON d.city_id = c.id
WHERE LOWER(TRIM(o.district)) = LOWER(d.name)
AND LOWER(TRIM(o.city)) = LOWER(c.name)
AND o.district_id IS NULL
AND o.district IS NOT NULL;

-- ============================================================
-- COMPLETION MESSAGE
-- ============================================================

DO $$
DECLARE
    city_count INTEGER;
    district_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO city_count FROM cities;
    SELECT COUNT(*) INTO district_count FROM districts;

    RAISE NOTICE '✅ Cities and Districts migration completed successfully!';
    RAISE NOTICE 'Total cities: %', city_count;
    RAISE NOTICE 'Total districts: %', district_count;
END $$;
