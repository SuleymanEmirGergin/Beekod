#!/bin/bash

# Beekod Production Deployment Test Script
# Bu script tüm servisleri test eder ve production hazırlığını kontrol eder

set -e  # Exit on error

echo "🚀 Beekod Production Deployment Test"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

echo "📦 1. Checking Dependencies..."
echo "--------------------------------"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "Node.js: $NODE_VERSION"
    test_result 0 "Node.js installed"
else
    test_result 1 "Node.js not found"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "npm: $NPM_VERSION"
    test_result 0 "npm installed"
else
    test_result 1 "npm not found"
fi

# Check MySQL
if command -v mysql &> /dev/null; then
    test_result 0 "MySQL installed"
else
    test_result 1 "MySQL not found"
fi

# Check Redis (optional)
if command -v redis-cli &> /dev/null; then
    test_result 0 "Redis installed (optional)"
else
    echo -e "${YELLOW}⚠ WARNING${NC}: Redis not found (optional, but recommended for caching)"
fi

echo ""
echo "🔧 2. Checking Configuration..."
echo "--------------------------------"

# Check .env file
if [ -f ".env" ]; then
    test_result 0 ".env file exists"
    
    # Check critical env vars
    if grep -q "DB_HOST" .env && grep -q "DB_NAME" .env; then
        test_result 0 "Database config present"
    else
        test_result 1 "Database config missing"
    fi
    
    if grep -q "ADMIN_KEY" .env; then
        test_result 0 "ADMIN_KEY configured"
    else
        test_result 1 "ADMIN_KEY missing"
    fi
else
    test_result 1 ".env file not found"
    echo -e "${YELLOW}⚠ Run: cp .env.example .env${NC}"
fi

echo ""
echo "🏗️  3. Building Backend..."
echo "--------------------------------"

if npm run build > /dev/null 2>&1; then
    test_result 0 "Backend build successful"
else
    test_result 1 "Backend build failed"
fi

echo ""
echo "🎨 4. Building Frontend..."
echo "--------------------------------"

cd BeekodFrontend
if npm run build > /dev/null 2>&1; then
    test_result 0 "Frontend build successful"
else
    test_result 1 "Frontend build failed"
fi
cd ..

echo ""
echo "🐳 5. Docker Configuration..."
echo "--------------------------------"

if [ -f "docker-compose.yml" ]; then
    test_result 0 "docker-compose.yml exists"
else
    test_result 1 "docker-compose.yml not found"
fi

if [ -f "Dockerfile" ]; then
    test_result 0 "Backend Dockerfile exists"
else
    test_result 1 "Backend Dockerfile not found"
fi

if [ -f "BeekodFrontend/Dockerfile" ]; then
    test_result 0 "Frontend Dockerfile exists"
else
    test_result 1 "Frontend Dockerfile not found"
fi

echo ""
echo "📊 Test Summary"
echo "======================================"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Ready for production deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. docker-compose up -d"
    echo "2. Check logs: docker-compose logs -f"
    echo "3. Access: http://localhost"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please fix the issues before deploying.${NC}"
    exit 1
fi
