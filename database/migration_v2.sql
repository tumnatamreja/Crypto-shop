-- Migration from v1 to v2
-- Run this if you have an existing database

-- Backup your database first!
-- pg_dump -U cryptoshop_user cryptoshop > backup.sql

-- 1. Update Products table
ALTER TABLE products
    DROP COLUMN IF EXISTS map_link,
    DROP COLUMN IF EXISTS image_link,
    ADD COLUMN IF NOT EXISTS picture_link VARCHAR(500),
    ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
    ALTER COLUMN currency SET DEFAULT 'EUR';

-- 2. Update Orders table
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'pending',
    ALTER COLUMN currency SET DEFAULT 'EUR';

-- Create index for delivery_status
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);

-- 3. Update Order_items table
ALTER TABLE order_items
    DROP COLUMN IF EXISTS map_link,
    DROP COLUMN IF EXISTS image_link,
    ADD COLUMN IF NOT EXISTS product_picture VARCHAR(500),
    ADD COLUMN IF NOT EXISTS delivery_map_link VARCHAR(500),
    ADD COLUMN IF NOT EXISTS delivery_image_link VARCHAR(500),
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

-- 4. Update existing products to have default picture_link
UPDATE products SET picture_link = 'https://via.placeholder.com/200'
WHERE picture_link IS NULL;

-- 5. Make picture_link NOT NULL after setting defaults
ALTER TABLE products
    ALTER COLUMN picture_link SET NOT NULL;

COMMIT;

-- Verify migration
SELECT 'Products columns:' as info;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'products' ORDER BY ordinal_position;

SELECT 'Orders columns:' as info;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'orders' ORDER BY ordinal_position;

SELECT 'Order_items columns:' as info;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'order_items' ORDER BY ordinal_position;
