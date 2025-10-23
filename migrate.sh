#!/bin/bash

# Database Migration Script for CryptoShop v2.1
# This script applies all database migrations in the correct order

set -e  # Exit on error

echo "🚀 Starting CryptoShop Database Migration..."
echo ""

# Database credentials
DB_USER="cryptoshop_user"
DB_NAME="cryptoshop"

# Check if database exists
echo "📊 Checking database connection..."
if psql -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful!"
else
    echo "❌ Cannot connect to database!"
    echo "Please check your PostgreSQL credentials and database."
    exit 1
fi

echo ""
echo "📝 Applying migrations..."
echo ""

# Migration 1: Chat System
echo "1️⃣ Applying chat_migration.sql..."
if psql -U $DB_USER -d $DB_NAME -f database/chat_migration.sql > /dev/null 2>&1; then
    echo "✅ Chat migration completed"
else
    echo "⚠️  Chat migration failed or already applied"
fi

# Migration 2: v3 Features (Referrals, Promo Codes, Price Tiers)
echo "2️⃣ Applying migration_v3.sql..."
if psql -U $DB_USER -d $DB_NAME -f database/migration_v3.sql > /dev/null 2>&1; then
    echo "✅ V3 migration completed"
else
    echo "⚠️  V3 migration failed or already applied"
fi

# Migration 3: Anti-Spam Protection
echo "3️⃣ Applying anti_spam_migration.sql..."
if psql -U $DB_USER -d $DB_NAME -f database/anti_spam_migration.sql > /dev/null 2>&1; then
    echo "✅ Anti-spam migration completed"
else
    echo "⚠️  Anti-spam migration failed or already applied"
fi

# Migration 4: Cities and Districts
echo "4️⃣ Applying cities_districts_migration.sql..."
if psql -U $DB_USER -d $DB_NAME -f database/cities_districts_migration.sql 2>&1 | grep -q "Cities and Districts migration completed"; then
    echo "✅ Cities and districts migration completed"
else
    echo "⚠️  Cities and districts migration failed or already applied"
fi

# Migration 5: Plovdiv Districts Update
echo "5️⃣ Applying plovdiv_districts_update.sql..."
if psql -U $DB_USER -d $DB_NAME -f database/plovdiv_districts_update.sql 2>&1 | grep -q "Added"; then
    echo "✅ Plovdiv districts update completed"
else
    echo "⚠️  Plovdiv update failed or already applied"
fi

# Migration 6: Product Locations (Many-to-Many)
echo "6️⃣ Applying product_locations_migration.sql..."
if psql -U $DB_USER -d $DB_NAME -f database/product_locations_migration.sql 2>&1 | grep -q "Product Locations migration completed"; then
    echo "✅ Product locations migration completed"
else
    echo "⚠️  Product locations migration failed or already applied"
fi

# Migration 7: Product Variants & Stock System
echo "7️⃣ Applying product_variants_migration.sql..."
if psql -U $DB_USER -d $DB_NAME -f database/product_variants_migration.sql > /dev/null 2>&1; then
    echo "✅ Product variants & stock system migration completed"
else
    echo "⚠️  Product variants migration failed or already applied"
fi

echo ""
echo "🎉 Database migration completed!"
echo ""
echo "📊 Checking database status..."
echo ""

# Show table counts
echo "Cities: $(psql -U $DB_USER -d $DB_NAME -t -c 'SELECT COUNT(*) FROM cities;' 2>/dev/null || echo '0')"
echo "Districts: $(psql -U $DB_USER -d $DB_NAME -t -c 'SELECT COUNT(*) FROM districts;' 2>/dev/null || echo '0')"
echo "Products: $(psql -U $DB_USER -d $DB_NAME -t -c 'SELECT COUNT(*) FROM products;' 2>/dev/null || echo '0')"
echo "Product Variants: $(psql -U $DB_USER -d $DB_NAME -t -c 'SELECT COUNT(*) FROM product_variants;' 2>/dev/null || echo '0')"
echo "Users: $(psql -U $DB_USER -d $DB_NAME -t -c 'SELECT COUNT(*) FROM users;' 2>/dev/null || echo '0')"
echo "Orders: $(psql -U $DB_USER -d $DB_NAME -t -c 'SELECT COUNT(*) FROM orders;' 2>/dev/null || echo '0')"

echo ""
echo "✅ All done! Your database is ready."
echo ""
