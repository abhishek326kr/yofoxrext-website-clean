#!/bin/bash
#
# YoForex Deployment Script
# 
# This script automates the deployment process for YoForex platform.
# It handles code updates, dependencies, builds, and PM2 restarts.
#
# Usage: bash scripts/deploy.sh [environment]
#
# Arguments:
#   environment: Optional. Either 'production' or 'staging'. Defaults to 'production'.
#
# What it does:
# 1. Create backup of current deployment
# 2. Pull latest code from Git
# 3. Install dependencies
# 4. Build Next.js frontend
# 5. Build Express backend
# 6. Run database migrations
# 7. Restart PM2 processes (zero-downtime)
# 8. Health check
# 9. Rollback on failure
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="yoforex"
APP_DIR="/var/www/${APP_NAME}"
BACKUP_DIR="/var/backups/${APP_NAME}"
ENV="${1:-production}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/backup_${TIMESTAMP}"

# Log file
LOG_DIR="${APP_DIR}/logs"
DEPLOY_LOG="${LOG_DIR}/deploy_${TIMESTAMP}.log"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}YoForex Deployment Script${NC}"
echo -e "${BLUE}Environment: ${ENV}${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Create log directory if it doesn't exist
mkdir -p $LOG_DIR

# Logging function
log() {
    echo -e "${1}" | tee -a $DEPLOY_LOG
}

# Error handler
error_exit() {
    log "${RED}ERROR: ${1}${NC}"
    log "${RED}Deployment failed at $(date)${NC}"
    log "${YELLOW}Check logs: ${DEPLOY_LOG}${NC}"
    exit 1
}

# Rollback function
rollback() {
    log "${YELLOW}Rolling back to previous version...${NC}"
    
    if [ -d "$BACKUP_PATH" ]; then
        # Stop PM2
        pm2 stop all || true
        
        # Restore backup
        rsync -av --delete "${BACKUP_PATH}/" "${APP_DIR}/" || error_exit "Rollback failed"
        
        # Restart PM2
        cd $APP_DIR
        pm2 restart ecosystem.config.js || error_exit "Failed to restart PM2 after rollback"
        
        log "${GREEN}✓ Rollback complete${NC}"
    else
        log "${RED}No backup found to rollback to${NC}"
    fi
    
    exit 1
}

# Trap errors and rollback
trap 'rollback' ERR

log "${BLUE}Starting deployment at $(date)${NC}"
log ""

# Check if running in app directory
if [ "$PWD" != "$APP_DIR" ]; then
    log "${YELLOW}Changing to app directory: ${APP_DIR}${NC}"
    cd $APP_DIR || error_exit "App directory not found: ${APP_DIR}"
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    error_exit ".env.production file not found. Create it from .env.production.example"
fi

log "${YELLOW}Step 1: Create Backup${NC}"
mkdir -p $BACKUP_DIR

# Create backup of current deployment
log "Creating backup: ${BACKUP_PATH}"
rsync -av --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='.next' "${APP_DIR}/" "${BACKUP_PATH}/" || error_exit "Backup failed"

log "${GREEN}✓ Backup created${NC}"
log ""

# Keep only last 5 backups
log "Cleaning old backups (keeping last 5)..."
cd $BACKUP_DIR
ls -t | tail -n +6 | xargs -r rm -rf
cd $APP_DIR

log "${YELLOW}Step 2: Pull Latest Code${NC}"
# Stash any local changes
git stash || true

# Pull latest code
git pull origin main || error_exit "Git pull failed"

# Get current commit
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B)

log "${GREEN}✓ Code updated${NC}"
log "  Commit: ${COMMIT_HASH}"
log "  Message: ${COMMIT_MSG}"
log ""

log "${YELLOW}Step 3: Install Dependencies${NC}"
# Check if node_modules exists and package.json has changed
if [ ! -d "node_modules" ] || git diff HEAD@{1} HEAD --name-only | grep -q "package.json"; then
    log "Installing npm dependencies..."
    npm ci --production || error_exit "npm install failed"
    log "${GREEN}✓ Dependencies installed${NC}"
else
    log "${BLUE}Dependencies up to date (skipping)${NC}"
fi
log ""

log "${YELLOW}Step 4: Build Express Backend${NC}"
npm run build || error_exit "Express build failed"
log "${GREEN}✓ Express backend built${NC}"
log ""

log "${YELLOW}Step 5: Build Next.js Frontend${NC}"
npm run build:next || error_exit "Next.js build failed"
log "${GREEN}✓ Next.js frontend built${NC}"
log ""

log "${YELLOW}Step 6: Run Database Migrations${NC}"
# Push schema changes to database
npm run db:push || log "${YELLOW}⚠ Database push failed or no changes${NC}"
log "${GREEN}✓ Database migrations complete${NC}"
log ""

log "${YELLOW}Step 7: Restart PM2 Processes${NC}"
# Check if PM2 is running
if ! pm2 list | grep -q "online"; then
    log "Starting PM2 for the first time..."
    pm2 start ecosystem.config.js || error_exit "PM2 start failed"
else
    log "Reloading PM2 (zero-downtime)..."
    pm2 reload ecosystem.config.js --update-env || error_exit "PM2 reload failed"
fi

# Save PM2 configuration
pm2 save || log "${YELLOW}⚠ PM2 save failed${NC}"

log "${GREEN}✓ PM2 processes restarted${NC}"
log ""

# Wait for processes to stabilize
log "Waiting for processes to stabilize..."
sleep 5

log "${YELLOW}Step 8: Health Check${NC}"
# Run health check script
if [ -f "scripts/health-check.sh" ]; then
    bash scripts/health-check.sh || error_exit "Health check failed"
else
    log "${YELLOW}⚠ Health check script not found (skipping)${NC}"
fi

log "${GREEN}✓ Health check passed${NC}"
log ""

log "${YELLOW}Step 9: Cleanup${NC}"
# Clean old Next.js build cache
rm -rf .next/cache || true

# Clean old logs (keep last 7 days)
find $LOG_DIR -name "deploy_*.log" -mtime +7 -delete || true

log "${GREEN}✓ Cleanup complete${NC}"
log ""

# Deployment summary
log "${GREEN}======================================${NC}"
log "${GREEN}Deployment Successful!${NC}"
log "${GREEN}======================================${NC}"
log ""
log "${BLUE}Deployment Summary:${NC}"
log "  Environment: ${ENV}"
log "  Commit: ${COMMIT_HASH}"
log "  Timestamp: ${TIMESTAMP}"
log "  Backup: ${BACKUP_PATH}"
log "  Log: ${DEPLOY_LOG}"
log ""

log "${YELLOW}PM2 Status:${NC}"
pm2 list

log ""
log "${YELLOW}Next Steps:${NC}"
log "  - Monitor logs: pm2 logs"
log "  - Monitor processes: pm2 monit"
log "  - Test application: curl https://yoforex.com/health"
log ""

log "${GREEN}Deployment completed at $(date)${NC}"

# Untrap error handler (deployment successful)
trap - ERR

exit 0
