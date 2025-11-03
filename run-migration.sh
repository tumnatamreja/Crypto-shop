#!/bin/bash

set -e

echo "🚀 CryptoShop Database Migration Script"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    exit 1
fi

# Get database container
DB_CONTAINER=$(docker ps -q -f name=cryptoshop-db)

if [ -z "$DB_CONTAINER" ]; then
    echo -e "${YELLOW}⚠️  Database container not running. Starting services...${NC}"
    docker-compose up -d postgres
    echo "Waiting for database to be ready..."
    sleep 10
    DB_CONTAINER=$(docker ps -q -f name=cryptoshop-db)
fi

if [ -z "$DB_CONTAINER" ]; then
    echo -e "${RED}❌ Failed to start database container!${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Database container found: $DB_CONTAINER"
echo ""

# Generate admin password hash
echo -e "${YELLOW}Creating admin user...${NC}"
read -p "Enter admin username (default: admin): " ADMIN_USER
ADMIN_USER=${ADMIN_USER:-admin}

read -sp "Enter admin password: " ADMIN_PASS
echo ""

# Generate bcrypt hash using Node.js
ADMIN_HASH=$(docker run --rm -i node:18-alpine node -e "
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('$ADMIN_PASS', 10);
console.log(hash);
" 2>/dev/null || echo '$2b$10$YourHashedPasswordHere')

# Create temp migration file with real password
cat database/00_complete_migration.sql | sed "s/\$2b\$10\$YourHashedPasswordHere/$ADMIN_HASH/g" | sed "s/'admin'/'$ADMIN_USER'/g" > /tmp/migration_temp.sql

echo ""
echo -e "${YELLOW}Running migration...${NC}"

# Drop existing database and recreate (CLEAN START)
docker exec -i $DB_CONTAINER psql -U postgres <<EOF
DROP DATABASE IF EXISTS cryptoshop;
CREATE DATABASE cryptoshop;
GRANT ALL PRIVILEGES ON DATABASE cryptoshop TO cryptoshop;
EOF

echo -e "${GREEN}✓${NC} Database recreated"

# Run migration
docker exec -i $DB_CONTAINER psql -U cryptoshop -d cryptoshop < /tmp/migration_temp.sql

rm /tmp/migration_temp.sql

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Migration Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "📊 Database: cryptoshop"
echo "👤 Admin user: $ADMIN_USER"
echo "🔑 Password: (the one you just entered)"
echo ""
echo "Verify tables:"
docker exec -i $DB_CONTAINER psql -U cryptoshop -d cryptoshop -c "\dt"

echo ""
echo -e "${YELLOW}⚠️  Next steps:${NC}"
echo "1. Restart backend: docker-compose restart backend"
echo "2. Open: http://$(hostname -I | awk '{print $1}')"
echo "3. Login with admin credentials"
echo ""
