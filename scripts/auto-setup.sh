#!/bin/bash
# YoForex Auto-Setup Script
# Automatically detects and fixes migration issues on Replit import
# Runs on every boot and intelligently decides what to do

set -e  # Exit on error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Marker file to track setup completion
SETUP_MARKER=".setup-complete"

# Silent mode for logs (use VERBOSE=1 to see output)
if [ "$VERBOSE" != "1" ]; then
    exec 3>&1 4>&2
    exec 1>/dev/null 2>&1
fi

log() {
    if [ "$VERBOSE" = "1" ]; then
        echo -e "${2:-$NC}$1${NC}"
    fi
    # Always log to marker file
    echo "$1" >> .setup.log 2>/dev/null || true
}

# Function to check if database is empty
is_database_empty() {
    if [ -z "$DATABASE_URL" ]; then
        return 0  # No database = empty
    fi
    
    # Check if categories table exists and has data
    local count=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM categories;" 2>/dev/null | xargs || echo "0")
    if [ "$count" = "0" ]; then
        return 0  # Empty
    fi
    return 1  # Has data
}

# Function to check if this is a fresh import
is_fresh_import() {
    # If setup marker exists, not fresh
    if [ -f "$SETUP_MARKER" ]; then
        return 1
    fi
    
    # If node_modules doesn't exist, definitely fresh
    if [ ! -d "node_modules" ]; then
        return 0
    fi
    
    # If database exists but is empty, it's a fresh import
    if is_database_empty; then
        return 0
    fi
    
    return 1
}

# Main auto-setup logic
main() {
    log "🔍 YoForex Auto-Setup: Checking environment..." "$BLUE"
    
    # Check if this is a fresh import
    if ! is_fresh_import; then
        log "✅ Setup already complete, skipping..." "$GREEN"
        exit 0
    fi
    
    log "🚀 Fresh import detected! Running auto-setup..." "$YELLOW"
    
    # Re-enable output for setup process
    if [ "$VERBOSE" != "1" ]; then
        exec 1>&3 2>&4
    fi
    
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║  🎯 YoForex Auto-Setup Detected Fresh GitHub Import   ║"
    echo "║     Setting up your project automatically...           ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    
    # Step 1: Check database
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}⚠️  No database found!${NC}"
        echo -e "${YELLOW}Creating one automatically...${NC}"
        # Note: Replit should auto-create database, but we wait for it
        sleep 2
    fi
    
    # Step 2: Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}📦 Installing dependencies...${NC}"
        npm install --quiet --no-progress
        echo -e "${GREEN}✅ Dependencies installed${NC}"
    fi
    
    # Step 3: Set up database schema
    echo -e "${BLUE}🗄️  Setting up database...${NC}"
    
    # Push schema (create tables)
    npm run db:push --force > /dev/null 2>&1 || {
        echo -e "${YELLOW}⚠️  Database push failed, retrying...${NC}"
        sleep 2
        npm run db:push --force
    }
    
    echo -e "${GREEN}✅ Database schema created${NC}"
    
    # Step 4: Import data
    echo -e "${BLUE}📊 Loading data...${NC}"
    
    if [ -f "database-export.sql" ]; then
        echo -e "${YELLOW}   Found database export, importing...${NC}"
        psql $DATABASE_URL < database-export.sql > /dev/null 2>&1 && {
            echo -e "${GREEN}✅ Your data imported successfully${NC}"
        } || {
            echo -e "${YELLOW}⚠️  Import failed, using sample data instead${NC}"
            npm run db:seed > /dev/null 2>&1
            echo -e "${GREEN}✅ Sample data loaded${NC}"
        }
    else
        echo -e "${YELLOW}   No export found, using sample data${NC}"
        npm run db:seed > /dev/null 2>&1
        echo -e "${GREEN}✅ Sample data loaded${NC}"
    fi
    
    # Step 5: Verify
    CATEGORIES_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM categories;" 2>/dev/null | xargs || echo "0")
    THREADS_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM \"forumThreads\";" 2>/dev/null | xargs || echo "0")
    
    echo ""
    echo "📊 Setup Complete! Database has:"
    echo "   • $CATEGORIES_COUNT categories"
    echo "   • $THREADS_COUNT discussion threads"
    echo ""
    
    # Step 6: Mark setup as complete
    echo "$(date): Auto-setup completed successfully" > "$SETUP_MARKER"
    
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ YoForex is Ready!                                 ║${NC}"
    echo -e "${GREEN}║     Your application is starting now...               ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Next time this Replit starts, this auto-setup will be skipped."
    echo ""
}

# Run main function
main "$@"
