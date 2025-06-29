#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 ProjectHub Docker Setup${NC}"
echo "================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}📝 Please edit .env file with your actual values (especially GOOGLE_API_KEY)${NC}"
        echo -e "${YELLOW}Press Enter to continue after editing .env file...${NC}"
        read
    else
        echo -e "${RED}❌ .env.example file not found. Please create .env file manually.${NC}"
        exit 1
    fi
fi

# Create data directory if it doesn't exist
mkdir -p data

echo -e "${BLUE}🛠️  Building and starting services...${NC}"

# Build and start all services
docker-compose up --build -d

echo -e "${GREEN}✅ Services starting up...${NC}"
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
echo "================================="

# Wait a moment for services to start
sleep 5

# Check service health
services=("projecthub-frontend" "projecthub-api" "projecthub-ai")
ports=("3000" "7001" "8000")
names=("Frontend" "Backend API" "AI Service")

for i in "${!services[@]}"; do
    service=${services[$i]}
    port=${ports[$i]}
    name=${names[$i]}
    
    if docker-compose ps --services --filter "status=running" | grep -q "$service"; then
        echo -e "${GREEN}✅ $name: Running on port $port${NC}"
    else
        echo -e "${RED}❌ $name: Not running${NC}"
    fi
done

echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo "================================="
echo -e "${GREEN}Frontend:${NC}    http://localhost:3000"
echo -e "${GREEN}Backend API:${NC} http://localhost:7001"
echo -e "${GREEN}AI Service:${NC}  http://localhost:8000"
echo -e "${GREEN}API Docs:${NC}    http://localhost:7001/swagger"
echo ""

echo -e "${BLUE}📋 Useful Commands:${NC}"
echo "================================="
echo "View logs:           docker-compose logs -f"
echo "View specific logs:  docker-compose logs -f [service-name]"
echo "Stop services:       docker-compose down"
echo "Restart services:    docker-compose restart"
echo "Rebuild services:    docker-compose up --build"
echo ""

echo -e "${GREEN}🚀 ProjectHub is now running!${NC}" 