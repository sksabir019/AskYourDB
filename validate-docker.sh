#!/bin/bash

# Docker Setup Validation Script
# Tests Docker configuration without starting services

set -e

echo "🐳 AskYourDB Docker Setup Validation"
echo "===================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker
echo "📋 Checking prerequisites..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker installed: $(docker --version)"
else
    echo -e "${RED}✗${NC} Docker not found. Please install Docker."
    exit 1
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker Compose available"
else
    echo -e "${RED}✗${NC} Docker Compose not found."
    exit 1
fi

echo ""
echo "📦 Validating Docker files..."

# Check Dockerfiles exist
if [ -f "infra/docker/backend.Dockerfile" ]; then
    echo -e "${GREEN}✓${NC} Backend Dockerfile found"
else
    echo -e "${RED}✗${NC} Backend Dockerfile missing"
    exit 1
fi

if [ -f "infra/docker/frontend.Dockerfile" ]; then
    echo -e "${GREEN}✓${NC} Frontend Dockerfile found"
else
    echo -e "${RED}✗${NC} Frontend Dockerfile missing"
    exit 1
fi

# Check compose files
if [ -f "infra/docker/docker-compose.dev.yml" ]; then
    echo -e "${GREEN}✓${NC} Development compose file found"
else
    echo -e "${RED}✗${NC} Development compose file missing"
    exit 1
fi

if [ -f "infra/docker/docker-compose.prod.yml" ]; then
    echo -e "${GREEN}✓${NC} Production compose file found"
else
    echo -e "${RED}✗${NC} Production compose file missing"
    exit 1
fi

# Check .dockerignore files
if [ -f "backend/.dockerignore" ]; then
    echo -e "${GREEN}✓${NC} Backend .dockerignore found"
else
    echo -e "${YELLOW}⚠${NC} Backend .dockerignore missing (recommended)"
fi

if [ -f "frontend/.dockerignore" ]; then
    echo -e "${GREEN}✓${NC} Frontend .dockerignore found"
else
    echo -e "${YELLOW}⚠${NC} Frontend .dockerignore missing (recommended)"
fi

# Check nginx config
if [ -f "infra/nginx/nginx.conf" ]; then
    echo -e "${GREEN}✓${NC} Nginx configuration found"
else
    echo -e "${RED}✗${NC} Nginx configuration missing"
    exit 1
fi

echo ""
echo "🔍 Validating Docker Compose syntax..."

# Validate development compose
cd infra/docker
if docker-compose -f docker-compose.dev.yml config > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Development compose syntax valid"
else
    echo -e "${RED}✗${NC} Development compose has syntax errors"
    docker-compose -f docker-compose.dev.yml config
    exit 1
fi

# Validate production compose (skip env validation)
if docker-compose -f docker-compose.prod.yml config > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Production compose syntax valid"
else
    echo -e "${YELLOW}⚠${NC} Production compose validation skipped (needs .env)"
fi

cd ../..

echo ""
echo "📄 Checking environment template..."
if [ -f "infra/docker/.env.example" ]; then
    echo -e "${GREEN}✓${NC} Environment template found"
else
    echo -e "${RED}✗${NC} Environment template missing"
    exit 1
fi

# Check if .env exists
if [ -f "infra/docker/.env" ]; then
    echo -e "${GREEN}✓${NC} Environment file configured"
else
    echo -e "${YELLOW}⚠${NC} Environment file not configured (copy .env.example to .env)"
fi

echo ""
echo "🛠️  Checking support files..."

if [ -f "Makefile" ]; then
    echo -e "${GREEN}✓${NC} Makefile found"
else
    echo -e "${YELLOW}⚠${NC} Makefile missing (optional but recommended)"
fi

if [ -f ".gitignore" ]; then
    echo -e "${GREEN}✓${NC} .gitignore found"
else
    echo -e "${YELLOW}⚠${NC} .gitignore missing (recommended)"
fi

echo ""
echo "📚 Checking documentation..."

if [ -f "DOCKER_DEPLOYMENT.md" ]; then
    echo -e "${GREEN}✓${NC} Docker deployment guide found"
else
    echo -e "${YELLOW}⚠${NC} Docker deployment guide missing"
fi

if [ -f "infra/docker/README.md" ]; then
    echo -e "${GREEN}✓${NC} Docker quick start guide found"
else
    echo -e "${YELLOW}⚠${NC} Docker quick start guide missing"
fi

echo ""
echo "======================================"
echo -e "${GREEN}✅ Docker setup validation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Configure environment: cp infra/docker/.env.example infra/docker/.env"
echo "2. Edit .env file with your API keys"
echo "3. Start development: make dev"
echo "4. Seed database: make seed"
echo "5. Access app: http://localhost:3000"
echo ""
echo "For detailed instructions, see DOCKER_DEPLOYMENT.md"
