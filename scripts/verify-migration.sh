#!/bin/bash
# VERIFY MIGRATION
# Run this after restore-database.sh to verify everything migrated

set -e

echo "✅ YoForex Migration: Verification"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARN++))
}

# Test 1: Database Connection
echo "🔍 Test 1/8: Database Connection"
if [ -n "$DATABASE_URL" ]; then
    if psql "$DATABASE_URL" -c "SELECT 1" &>/dev/null; then
        check_pass "Database connection working"
    else
        check_fail "Cannot connect to database"
    fi
else
    check_fail "DATABASE_URL not set"
fi
echo ""

# Test 2: Database Tables
echo "🔍 Test 2/8: Database Schema"
EXPECTED_TABLES=("users" "forum_threads" "forum_replies" "forum_categories" "brokers" "content_items")
for table in "${EXPECTED_TABLES[@]}"; do
    if psql "$DATABASE_URL" -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='$table');" | grep -q t; then
        check_pass "Table exists: $table"
    else
        check_fail "Table missing: $table"
    fi
done
echo ""

# Test 3: Data Counts
echo "🔍 Test 3/8: Data Counts"
THREAD_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM forum_threads;" 2>/dev/null | tr -d ' ' || echo "0")
REPLY_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM forum_replies;" 2>/dev/null | tr -d ' ' || echo "0")
USER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$THREAD_COUNT" -gt 0 ]; then
    check_pass "$THREAD_COUNT forum threads migrated"
else
    check_warn "No forum threads found (expected for fresh install)"
fi

if [ "$REPLY_COUNT" -gt 0 ]; then
    check_pass "$REPLY_COUNT forum replies migrated"
else
    check_warn "No forum replies found"
fi

if [ "$USER_COUNT" -gt 0 ]; then
    check_pass "$USER_COUNT users migrated"
else
    check_warn "No users found"
fi
echo ""

# Test 4: Database Indexes
echo "🔍 Test 4/8: Database Indexes"
INDEX_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
if [ "$INDEX_COUNT" -gt 5 ]; then
    check_pass "$INDEX_COUNT indexes found"
else
    check_warn "Only $INDEX_COUNT indexes (expected 10+)"
fi
echo ""

# Test 5: Files & Directories
echo "🔍 Test 5/8: Project Files"
REQUIRED_FILES=("package.json" "server/index.ts" "shared/schema.ts" "app/page.tsx")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_pass "File exists: $file"
    else
        check_fail "File missing: $file"
    fi
done
echo ""

# Test 6: Dependencies
echo "🔍 Test 6/8: Node Dependencies"
if [ -d "node_modules" ]; then
    MODULE_COUNT=$(ls -d node_modules/* 2>/dev/null | wc -l)
    if [ "$MODULE_COUNT" -gt 50 ]; then
        check_pass "$MODULE_COUNT npm packages installed"
    else
        check_warn "Only $MODULE_COUNT packages (run: npm install)"
    fi
else
    check_fail "node_modules not found (run: npm install)"
fi
echo ""

# Test 7: Environment Variables
echo "🔍 Test 7/8: Environment Variables"
REQUIRED_VARS=("DATABASE_URL" "PGHOST" "PGDATABASE")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        check_pass "Variable set: $var"
    else
        check_fail "Variable missing: $var"
    fi
done
echo ""

# Test 8: Application Status
echo "🔍 Test 8/8: Application Status"
if [ -f "start-nextjs-only.sh" ]; then
    check_pass "Start script exists"
else
    check_warn "Start script not found"
fi

if pgrep -f "node.*next" > /dev/null || pgrep -f "tsx.*server" > /dev/null; then
    check_pass "Application appears to be running"
else
    check_warn "Application not running (start with: npm run dev)"
fi
echo ""

# Summary
echo "===================================="
echo "📊 VERIFICATION SUMMARY"
echo "===================================="
echo -e "${GREEN}Passed${NC}: $PASS tests"
echo -e "${YELLOW}Warnings${NC}: $WARN tests"
echo -e "${RED}Failed${NC}: $FAIL tests"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ MIGRATION SUCCESSFUL!${NC}"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Review warnings (if any)"
    echo "   2. Start application: npm run dev"
    echo "   3. Visit the app in browser"
    echo "   4. Test key functionality"
    echo ""
    exit 0
else
    echo -e "${RED}❌ MIGRATION HAS ISSUES${NC}"
    echo ""
    echo "🔧 Recommended Actions:"
    echo "   1. Review failed tests above"
    echo "   2. Check migration_backup/ directory"
    echo "   3. Verify database restoration completed"
    echo "   4. Run: npm install (if dependencies missing)"
    echo ""
    exit 1
fi
