#!/bin/bash

set -e

echo "🚀 CryptoShop Quick Migration"
echo "=============================="
echo ""

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    exit 1
fi

# Get or start database container
DB_CONTAINER=$(docker ps -q -f name=cryptoshop-db)

if [ -z "$DB_CONTAINER" ]; then
    echo "⚠️  Starting database..."
    docker-compose up -d postgres
    sleep 15
    DB_CONTAINER=$(docker ps -q -f name=cryptoshop-db)
fi

echo "✓ Database container: $DB_CONTAINER"
echo ""

# Drop and recreate database
echo "🗄️  Recreating database..."
docker exec -i $DB_CONTAINER psql -U postgres <<EOF
DROP DATABASE IF EXISTS cryptoshop;
CREATE DATABASE cryptoshop;
\c cryptoshop
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOF

echo "✓ Database created"
echo ""

# Run migration
echo "📊 Running migration..."
docker exec -i $DB_CONTAINER psql -U postgres -d cryptoshop < database/00_complete_migration.sql 2>&1 | grep -v "NOTICE:" | grep -v "^$" || true

echo ""
echo "✅ Migration Complete!"
echo ""
echo "📋 Verify tables:"
docker exec -i $DB_CONTAINER psql -U postgres -d cryptoshop -c "\dt" | grep -v "^$"

echo ""
echo "👤 Default admin user:"
echo "   Username: admin"
echo "   Password: admin123"
echo "   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!"
echo ""
echo "🚀 Next: Restart backend and open http://$(hostname -I | awk '{print $1}')"
echo ""
