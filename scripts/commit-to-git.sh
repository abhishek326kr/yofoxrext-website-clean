#!/bin/bash
# COMMIT TO GIT AUTOMATION
# Run this after backup-and-export.sh

set -e

echo "📤 YoForex Migration: Git Commit & Push"
echo "========================================"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "⚠️  Git not initialized. Initializing now..."
    git init
    echo "✅ Git initialized"
fi

# Check if remote is set
if ! git remote | grep -q origin; then
    echo "⚠️  No Git remote found."
    echo "   Please add your Git remote URL:"
    read -p "   Git Remote URL (e.g., https://github.com/user/repo.git): " REMOTE_URL
    git remote add origin "$REMOTE_URL"
    echo "✅ Remote added: origin"
fi

# Step 1: Stage all files
echo "📝 Step 1/4: Staging files..."
git add .
echo "✅ Files staged"
echo ""

# Step 2: Show what's being committed
echo "📋 Step 2/4: Files to be committed:"
git diff --cached --name-status | head -20
FILE_COUNT=$(git diff --cached --name-only | wc -l)
if [ $FILE_COUNT -gt 20 ]; then
    echo "   ... and $(($FILE_COUNT - 20)) more files"
fi
echo ""

# Step 3: Commit
echo "💾 Step 3/4: Committing changes..."
COMMIT_MSG="Migration backup $(date +%Y-%m-%d) - Code + Database"
git commit -m "$COMMIT_MSG"
echo "✅ Committed: $COMMIT_MSG"
echo ""

# Step 4: Push to Git
echo "🚀 Step 4/4: Pushing to Git..."
BRANCH=$(git branch --show-current)
git push -u origin "$BRANCH"
echo "✅ Pushed to origin/$BRANCH"
echo ""

echo "🎯 NEXT STEPS:"
echo "   1. Go to Replit.com"
echo "   2. Click 'Create Repl' → 'Import from Git'"
echo "   3. Paste your Git repository URL"
echo "   4. Wait for import to complete"
echo "   5. In new Replit, run: ./scripts/restore-database.sh"
echo ""
echo "✅ Git commit & push complete!"
