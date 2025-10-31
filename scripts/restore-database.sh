#!/bin/bash
# RESTORE DATABASE AUTOMATION
# Run this in your NEW Replit after importing from Git

set -e

echo "📥 YoForex Migration: Database Restore"
echo "======================================"
echo ""

# Configuration
BACKUP_DIR="migration_backup"

# Step 1: Check for database backup
echo "🔍 Step 1/4: Looking for database backup..."
BACKUP_FILE=$(ls -t "$BACKUP_DIR"/database_backup_*.sql.gz 2>/dev/null | head -1)

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ ERROR: No database backup found!"
    echo "   Expected location: $BACKUP_DIR/database_backup_*.sql.gz"
    echo "   Did you import the full repository from Git?"
    exit 1
fi

echo "✅ Found backup: $BACKUP_FILE"
echo "   Size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""

# Step 2: Check database connection
echo "🔌 Step 2/4: Checking database connection..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not found!"
    echo "   Please create a PostgreSQL database in this Replit:"
    echo "   1. Click 'Tools' → 'Database'"
    echo "   2. Create a PostgreSQL database"
    echo "   3. Run this script again"
    exit 1
fi

echo "✅ Database connection available"
echo ""

# Step 3: Decompress backup
echo "📦 Step 3/4: Decompressing backup..."
DECOMPRESSED="${BACKUP_FILE%.gz}"
gunzip -c "$BACKUP_FILE" > "$DECOMPRESSED"
echo "✅ Backup decompressed: $DECOMPRESSED"
echo ""

# Step 4: Restore database
echo "💾 Step 4/4: Restoring database..."
echo "   ⚠️  This will replace all data in the current database!"
read -p "   Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore cancelled"
    rm "$DECOMPRESSED"  # Clean up
    exit 0
fi

echo "   - Restoring data..."
psql "$DATABASE_URL" < "$DECOMPRESSED"

# Clean up decompressed file
rm "$DECOMPRESSED"

echo "✅ Database restored successfully!"
echo ""

# Step 5: Verify restoration
echo "🔍 Verifying restoration..."
echo ""
echo "📊 Database Statistics:"
echo "   Forum Threads: $(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM forum_threads;" | tr -d ' ')"
echo "   Forum Replies: $(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM forum_replies;" | tr -d ' ')"
echo "   Users: $(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')"
echo "   Brokers: $(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM brokers;" | tr -d ' ')"
echo ""

echo "🎯 NEXT STEPS:"
echo "   1. Review environment variables (Secrets tab)"
echo "   2. Add any missing API keys (see $BACKUP_DIR/env_template.txt)"
echo "   3. Run verification: ./scripts/verify-migration.sh"
echo "   4. Start application: npm run dev"
echo ""
echo "✅ Database restore complete!"
