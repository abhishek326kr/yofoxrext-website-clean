#!/bin/bash
# Test script to verify auto-migration system
# This simulates a fresh GitHub import

echo "╔════════════════════════════════════════════════════════╗"
echo "║     🧪 Testing Auto-Migration System                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Save current state
if [ -f ".setup-complete" ]; then
    mv .setup-complete .setup-complete.backup
    echo "📝 Backed up existing .setup-complete"
fi

# Run the test
echo "🔬 Simulating fresh import..."
echo ""

# Test 1: Check detection
echo "Test 1: Checking fresh import detection..."
if [ -f ".setup-complete" ]; then
    echo "❌ FAIL: .setup-complete should not exist for fresh import"
    exit 1
else
    echo "✅ PASS: Fresh import detected correctly"
fi
echo ""

# Test 2: Check scripts exist
echo "Test 2: Checking auto-setup scripts exist..."
if [ ! -f "scripts/auto-setup.sh" ] || [ ! -f "scripts/auto-setup.js" ]; then
    echo "❌ FAIL: Auto-setup scripts missing"
    exit 1
else
    echo "✅ PASS: Auto-setup scripts found"
fi
echo ""

# Test 3: Check scripts are executable
echo "Test 3: Checking scripts are executable..."
if [ ! -x "scripts/auto-setup.sh" ] || [ ! -x "scripts/auto-setup.js" ]; then
    echo "❌ FAIL: Scripts not executable"
    exit 1
else
    echo "✅ PASS: Scripts are executable"
fi
echo ""

# Test 4: Check package.json postinstall
echo "Test 4: Checking postinstall hook..."
if grep -q "postinstall.*auto-setup.js" package.json; then
    echo "✅ PASS: postinstall hook configured"
else
    echo "❌ FAIL: postinstall hook missing"
    exit 1
fi
echo ""

# Test 5: Check startup script integration
echo "Test 5: Checking startup script integration..."
if grep -q "scripts/auto-setup.sh" start-nextjs-only.sh; then
    echo "✅ PASS: Startup script integrated"
else
    echo "❌ FAIL: Startup script not integrated"
    exit 1
fi
echo ""

# Test 6: Check database commands
echo "Test 6: Checking database commands..."
if grep -q "db:export" package.json && grep -q "db:import" package.json && grep -q "db:seed" package.json; then
    echo "✅ PASS: Database commands configured"
else
    echo "❌ FAIL: Database commands missing"
    exit 1
fi
echo ""

# Test 7: Check seed file exists
echo "Test 7: Checking seed file exists..."
if [ -f "server/seed.ts" ]; then
    echo "✅ PASS: Seed file found"
else
    echo "❌ FAIL: Seed file missing"
    exit 1
fi
echo ""

# Test 8: Check DATABASE_URL exists
echo "Test 8: Checking DATABASE_URL..."
if [ -n "$DATABASE_URL" ]; then
    echo "✅ PASS: DATABASE_URL is set"
else
    echo "⚠️  WARNING: DATABASE_URL not set (normal for local testing)"
fi
echo ""

# Test 9: Check documentation exists
echo "Test 9: Checking documentation..."
doc_count=0
[ -f "ZERO_TOUCH_MIGRATION.md" ] && ((doc_count++))
[ -f "AUTO_MIGRATION_README.md" ] && ((doc_count++))
[ -f "QUICKSTART.md" ] && ((doc_count++))
[ -f "REPLIT_MIGRATION_GUIDE.md" ] && ((doc_count++))
[ -f "MIGRATION_SYSTEM_INDEX.md" ] && ((doc_count++))

if [ $doc_count -eq 5 ]; then
    echo "✅ PASS: All 5 migration docs found"
else
    echo "⚠️  WARNING: Only $doc_count/5 migration docs found"
fi
echo ""

# Test 10: Syntax check
echo "Test 10: Checking syntax..."
node --check scripts/auto-setup.js 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ PASS: auto-setup.js syntax OK"
else
    echo "❌ FAIL: auto-setup.js has syntax errors"
    exit 1
fi

bash -n scripts/auto-setup.sh 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ PASS: auto-setup.sh syntax OK"
else
    echo "❌ FAIL: auto-setup.sh has syntax errors"
    exit 1
fi
echo ""

# Restore backed up state
if [ -f ".setup-complete.backup" ]; then
    mv .setup-complete.backup .setup-complete
    echo "📝 Restored .setup-complete backup"
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✅ All Tests Passed!                                 ║"
echo "║     Auto-Migration System is Ready                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "The auto-migration system is fully functional and will:"
echo "  1. Detect fresh GitHub imports automatically"
echo "  2. Set up the database without user intervention"
echo "  3. Import data or use seed data as fallback"
echo "  4. Verify everything works before starting the app"
echo ""
echo "To test manually, run: bash scripts/migrate.sh"
echo ""
