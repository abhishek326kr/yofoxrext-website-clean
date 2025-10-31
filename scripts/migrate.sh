#!/bin/bash
# YoForex Migration Script
# Automates the complete migration process for importing from GitHub

set -e  # Exit on any error

echo "╔════════════════════════════════════════════════════════╗"
echo "║       🚀 YoForex Migration Script v1.0                 ║"
echo "║       Automating Replit GitHub Import Setup            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check environment
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1: Checking Environment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL not found!${NC}"
    echo -e "${YELLOW}   Please create a PostgreSQL database in Replit first.${NC}"
    echo -e "${YELLOW}   1. Open Database pane${NC}"
    echo -e "${YELLOW}   2. Click 'Create Database'${NC}"
    echo -e "${YELLOW}   3. Run this script again${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database connection found${NC}"
echo -e "   Database: $PGDATABASE"
echo ""

# Step 2: Install dependencies
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2: Installing Dependencies${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules exists, reinstalling for clean state...${NC}"
    rm -rf node_modules
fi

echo "📦 Installing packages..."
npm install --quiet

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 3: Set up database schema
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3: Setting Up Database Schema${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo "🗄️  Creating database tables..."
npm run db:push --force > /dev/null 2>&1

echo -e "${GREEN}✅ Database schema created${NC}"
echo ""

# Step 4: Import or seed data
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 4: Populating Database${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -f "database-export.sql" ]; then
    echo -e "${YELLOW}📥 Found database-export.sql, importing data...${NC}"
    psql $DATABASE_URL < database-export.sql > /dev/null 2>&1
    echo -e "${GREEN}✅ Database data imported successfully${NC}"
else
    echo -e "${YELLOW}⚠️  No database-export.sql found${NC}"
    echo -e "${YELLOW}   Using seed data for testing...${NC}"
    npm run db:seed > /dev/null 2>&1
    echo -e "${GREEN}✅ Seed data loaded${NC}"
fi
echo ""

# Step 5: Verify setup
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 5: Verifying Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if tables have data
CATEGORIES_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM categories;" 2>/dev/null | xargs)
THREADS_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM \"forumThreads\";" 2>/dev/null | xargs)
USERS_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)

echo "📊 Database Statistics:"
echo "   Categories: $CATEGORIES_COUNT"
echo "   Threads: $THREADS_COUNT"
echo "   Users: $USERS_COUNT"

if [ "$CATEGORIES_COUNT" -gt "0" ] && [ "$THREADS_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✅ Database verification passed${NC}"
else
    echo -e "${RED}⚠️  Warning: Some tables appear empty${NC}"
    echo -e "${YELLOW}   You may need to manually import data or run: npm run db:seed${NC}"
fi
echo ""

# Step 6: Final summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Migration Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo -e "${GREEN}🎉 YoForex is ready to use!${NC}"
echo ""
echo "Next steps:"
echo "  1. ${YELLOW}Add any required API keys via Replit Secrets (🔒 icon)${NC}"
echo "  2. ${YELLOW}Run: npm run dev${NC}"
echo "  3. ${YELLOW}Open the Webview to see your application${NC}"
echo ""
echo "Useful commands:"
echo "  • Start app:       ${BLUE}npm run dev${NC}"
echo "  • Seed database:   ${BLUE}npm run db:seed${NC}"
echo "  • Export database: ${BLUE}npm run db:export${NC}"
echo "  • Import database: ${BLUE}npm run db:import${NC}"
echo ""
echo -e "${GREEN}📚 For detailed instructions, see REPLIT_MIGRATION_GUIDE.md${NC}"
echo ""
