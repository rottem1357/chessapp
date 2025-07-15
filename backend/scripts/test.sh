#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Chess App Backend Test Suite${NC}"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Set environment variables for testing
export NODE_ENV=test
export DB_NAME=chess_test
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=password
export JWT_SECRET=test-jwt-secret-for-testing-only
export LOG_LEVEL=error

echo -e "${YELLOW}🏗️  Setting up test database...${NC}"

# Create test database if it doesn't exist (PostgreSQL)
createdb $DB_NAME 2>/dev/null || echo "Database already exists"

echo -e "${YELLOW}🧪 Running tests...${NC}"

# Run different test suites based on argument
case "${1:-all}" in
    "auth")
        echo -e "${YELLOW}Testing Authentication...${NC}"
        npm run test:auth
        ;;
    "games")
        echo -e "${YELLOW}Testing Game Management...${NC}"
        npm run test:games
        ;;
    "users")
        echo -e "${YELLOW}Testing User Management...${NC}"
        npm run test:users
        ;;
    "integration")
        echo -e "${YELLOW}Testing Integration Flows...${NC}"
        npm test tests/integration
        ;;
    "coverage")
        echo -e "${YELLOW}Running tests with coverage...${NC}"
        npm run test:coverage
        ;;
    "all"|*)
        echo -e "${YELLOW}Running all tests...${NC}"
        npm test
        ;;
esac

echo -e "${GREEN}✅ Tests completed!${NC}"
