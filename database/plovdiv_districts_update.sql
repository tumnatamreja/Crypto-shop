-- Add all Plovdiv districts
-- This adds comprehensive list of all neighborhoods in Plovdiv

DO $$
DECLARE
    plovdiv_id UUID;
BEGIN
    SELECT id INTO plovdiv_id FROM cities WHERE name = 'Пловдив' LIMIT 1;

    IF plovdiv_id IS NULL THEN
        RAISE EXCEPTION 'Plovdiv city not found!';
    END IF;

    -- Delete old Plovdiv districts first
    DELETE FROM product_available_districts WHERE city_id = plovdiv_id;
    DELETE FROM districts WHERE city_id = plovdiv_id;

    -- Insert all Plovdiv districts
    INSERT INTO districts (city_id, name, name_en, sort_order) VALUES
        -- Централен район (Central District)
        (plovdiv_id, 'Център', 'Center', 1),
        (plovdiv_id, 'Капана', 'Kapana', 2),
        (plovdiv_id, 'Стария град', 'Old Town', 3),
        (plovdiv_id, 'Кючук Париж', 'Kyuchuk Paris', 4),
        (plovdiv_id, 'Каменица', 'Kamenitsa', 5),
        (plovdiv_id, 'Христо Ботев', 'Hristo Botev', 6),

        -- Северен район (North District)
        (plovdiv_id, 'Кършияка', 'Karshiyaka', 10),
        (plovdiv_id, 'Прослав', 'Proslav', 11),
        (plovdiv_id, 'Гагарин', 'Gagarin', 12),
        (plovdiv_id, 'Севтополис', 'Sevtopolis', 13),
        (plovdiv_id, 'Христо Смирненски - Север', 'Hristo Smirnenski North', 14),

        -- Южен район (South District)
        (plovdiv_id, 'Тракия', 'Trakiya', 20),
        (plovdiv_id, 'Христо Смирненски', 'Hristo Smirnenski', 21),
        (plovdiv_id, 'Коматево', 'Komatevo', 22),
        (plovdiv_id, 'Въстанически', 'Vastanicheski', 23),
        (plovdiv_id, 'Филипово', 'Filipovo', 24),
        (plovdiv_id, 'Столипиново', 'Stolipinovo', 25),
        (plovdiv_id, 'Шекер махала', 'Sheker mahala', 26),

        -- Западен район (West District)
        (plovdiv_id, 'Смирненски', 'Smirnenski', 30),
        (plovdiv_id, 'Кукленско шосе', 'Kuklensko shose', 31),
        (plovdiv_id, 'Коматевско шосе', 'Komatevsko shose', 32),
        (plovdiv_id, 'Изгрев', 'Izgrev', 33),
        (plovdiv_id, 'Марица', 'Maritsa', 34),

        -- Източен район (East District)
        (plovdiv_id, 'Тракия - Изток', 'Trakiya East', 40),
        (plovdiv_id, 'Изток', 'Iztok', 41),
        (plovdiv_id, 'Младежки хълм', 'Mladezhki halm', 42),
        (plovdiv_id, 'Остромила', 'Ostromila', 43),
        (plovdiv_id, 'Каменица 2', 'Kamenitsa 2', 44),

        -- Северен Централен (North Central)
        (plovdiv_id, 'Лозенец', 'Lozenets', 50),
        (plovdiv_id, 'Гагарин - Север', 'Gagarin North', 51),
        (plovdiv_id, 'Коматевски проход', 'Komatevski prohod', 52),

        -- Допълнителни квартали (Additional Neighborhoods)
        (plovdiv_id, 'Беломорски', 'Belomorski', 60),
        (plovdiv_id, 'Гребна база', 'Grebna baza', 61),
        (plovdiv_id, 'Дружба', 'Druzhba', 62),
        (plovdiv_id, 'Христо Ботев - Юг', 'Hristo Botev South', 63),
        (plovdiv_id, 'Надежда', 'Nadezhda', 64),
        (plovdiv_id, 'Първомайци', 'Parvomaytsi', 65),
        (plovdiv_id, 'Каменица 1', 'Kamenitsa 1', 66),
        (plovdiv_id, 'Тракия - Център', 'Trakiya Center', 67),
        (plovdiv_id, 'Тракия - Запад', 'Trakiya West', 68),
        (plovdiv_id, 'Тракия - Север', 'Trakiya North', 69),
        (plovdiv_id, 'Тракия - Юг', 'Trakiya South', 70),
        (plovdiv_id, 'Индустриална зона - Север', 'Industrial Zone North', 71),
        (plovdiv_id, 'Индустриална зона - Юг', 'Industrial Zone South', 72),
        (plovdiv_id, 'Арменско гробище', 'Armenian Cemetery', 73),
        (plovdiv_id, 'Браниполе', 'Branipole', 74),
        (plovdiv_id, 'Младежки хълм - Запад', 'Mladezhki halm West', 75),
        (plovdiv_id, 'Каргон', 'Kargon', 76),
        (plovdiv_id, 'Христо Ботев - Север', 'Hristo Botev North', 77),
        (plovdiv_id, 'Тракия - Сървър', 'Trakiya Sarvar', 78),
        (plovdiv_id, 'Каменица - Център', 'Kamenitsa Center', 79),
        (plovdiv_id, 'Прослав - Север', 'Proslav North', 80)
    ON CONFLICT (city_id, name) DO NOTHING;

    RAISE NOTICE '✅ Added % Plovdiv districts', (SELECT COUNT(*) FROM districts WHERE city_id = plovdiv_id);
END $$;
