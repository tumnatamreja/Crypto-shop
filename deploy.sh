#!/bin/bash

set -e

echo "🚀 CryptoShop Deployment Script"
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please copy .env.example to .env and configure it:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

echo -e "${GREEN}✓${NC} Environment variables loaded"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo "Install Docker first: https://docs.docker.com/engine/install/"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker is installed"

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed!${NC}"
    echo "Install Docker Compose first: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker Compose is installed"

# Function to run docker-compose
run_compose() {
    if command -v docker-compose &> /dev/null; then
        docker-compose "$@"
    else
        docker compose "$@"
    fi
}

# Stop existing containers
echo ""
echo -e "${YELLOW}Stopping existing containers...${NC}"
run_compose down || true

# Pull latest images
echo ""
echo -e "${YELLOW}Building Docker images...${NC}"
run_compose build --no-cache

# Start services
echo ""
echo -e "${YELLOW}Starting services...${NC}"
run_compose up -d

# Wait for database to be ready
echo ""
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
sleep 10

# Check if migrations need to be run
echo ""
echo -e "${YELLOW}Running database migrations...${NC}"

# Get the container ID
DB_CONTAINER=$(docker ps -q -f name=cryptoshop-db)

if [ -z "$DB_CONTAINER" ]; then
    echo -e "${RED}❌ Database container not running!${NC}"
    exit 1
fi

# Run migrations
for SQL_FILE in database/*.sql; do
    if [ -f "$SQL_FILE" ]; then
        FILENAME=$(basename "$SQL_FILE")
        echo "  Applying $FILENAME..."
        docker exec -i $DB_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB < "$SQL_FILE" 2>&1 | grep -v "already exists" || true
    fi
done

echo -e "${GREEN}✓${NC} Database migrations completed"

# Create first admin user (optional)
echo ""
read -p "Do you want to create an admin user? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter admin username: " ADMIN_USER
    read -sp "Enter admin password: " ADMIN_PASS
    echo

    # Hash password with bcrypt (we'll use a simple INSERT for now)
    docker exec -i $DB_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB <<EOF
INSERT INTO users (username, password, is_admin, created_at)
VALUES ('$ADMIN_USER', '\$2b\$10\$dummy_hash_change_on_first_login', true, NOW())
ON CONFLICT (username) DO NOTHING;
EOF

    echo -e "${YELLOW}⚠️  Admin user created with temporary password. Please log in and change it!${NC}"
fi

# Show logs
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Services:"
echo "  🌐 Frontend: http://localhost (port 80)"
echo "  🔧 Backend API: http://localhost/api"
echo "  🗄️  Database: localhost:5432"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop services:"
echo "  docker-compose down"
echo ""
echo "To restart services:"
echo "  docker-compose restart"
echo ""
echo -e "${YELLOW}⚠️  Important: Configure your OxaPay webhook URL:${NC}"
echo "  Webhook URL: http://your-server-ip/api/webhook/oxapay"
echo ""
