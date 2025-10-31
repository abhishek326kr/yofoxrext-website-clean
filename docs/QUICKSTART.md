# YoForex - Quick Start Guide

## 🚀 Just Imported from GitHub? Start Here!

If you just imported this project from GitHub to a new Replit account, follow these simple steps to get everything working.

---

## One-Command Setup (Recommended)

The fastest way to get started:

```bash
bash scripts/migrate.sh
```

This automated script will:
- ✅ Install all dependencies
- ✅ Create database tables
- ✅ Import your data (or use seed data)
- ✅ Verify everything is working

**Then just run:**
```bash
npm run dev
```

Done! Open the Webview to see your site.

---

## Manual Setup (If You Prefer)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Database
```bash
# Create all database tables
npm run db:push
```

### Step 3: Add Data

**Option A: Import Your Data** (if you have database-export.sql)
```bash
npm run db:import
```

**Option B: Use Sample Data** (for testing)
```bash
npm run db:seed
```

### Step 4: Start the App
```bash
npm run dev
```

---

## Common Issues & Solutions

### ❌ "Categories Not Showing"
**Problem:** Database is empty  
**Solution:**
```bash
npm run db:push
npm run db:seed
```

### ❌ "Nothing Works / Blank Pages"
**Problem:** Missing database data  
**Solution:**
```bash
npm run db:seed  # Use sample data
# OR
npm run db:import  # If you have database-export.sql
```

### ❌ "Authentication Not Working"
**Problem:** Replit Auth not configured  
**Solution:**
1. Click Tools → Integrations
2. Enable "Replit Auth"
3. Restart the workflow

### ❌ "API Errors (500)"
**Problem:** Database connection issue  
**Solution:**
```bash
# Verify database exists
echo $DATABASE_URL

# If empty, create database via Database pane
# Then run:
npm run db:push
npm run db:seed
```

---

## Before You Export to GitHub

If you're planning to export this Replit to GitHub for backup or migration:

### 1. Export Your Database
```bash
npm run db:export
```

This creates `database-export.sql` with all your data.

### 2. Download the Export File
- Download `database-export.sql` to your computer
- Keep it safe - you'll need it when importing to a new Replit

### 3. Push to GitHub
```bash
git add .
git commit -m "Export with database dump"
git push
```

**Important:** The `database-export.sql` file should be in your repo so it's available after import.

---

## Useful Commands

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run db:push` | Create/update database tables |
| `npm run db:seed` | Fill database with sample data |
| `npm run db:export` | Export database to SQL file |
| `npm run db:import` | Import database from SQL file |
| `bash scripts/migrate.sh` | Automated setup script |

---

## Need More Help?

📚 **Detailed Documentation:**
- [REPLIT_MIGRATION_GUIDE.md](./REPLIT_MIGRATION_GUIDE.md) - Complete migration instructions
- [COMPLETE_PLATFORM_GUIDE.md](./COMPLETE_PLATFORM_GUIDE.md) - Full platform documentation
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference

🤖 **Get Help:**
- Use Replit AI Assistant in the chat
- Check the workflow logs for errors
- Review the migration guide above

---

## What Gets Transferred vs What Doesn't

When you import from GitHub to Replit:

✅ **Transferred:**
- All source code
- Configuration files
- Database schema (structure)
- Static assets

❌ **NOT Transferred:**
- Database data (you need to import it)
- Environment variables (Replit auto-creates database vars)
- Installed packages (reinstall needed)
- API keys/secrets (add manually)

---

## First-Time Setup Checklist

- [ ] Run `bash scripts/migrate.sh` (or manual steps above)
- [ ] Verify database has data: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM categories;"`
- [ ] Add any required API keys via Secrets (🔒 icon)
- [ ] Run `npm run dev`
- [ ] Check Categories page - should show all categories
- [ ] Check Discussions page - should show threads
- [ ] Check Broker Reviews page - should show brokers
- [ ] Test user authentication (login/signup)

✅ If all checks pass, you're ready to go!

---

**Last Updated:** October 28, 2025  
**Version:** 1.0.0
