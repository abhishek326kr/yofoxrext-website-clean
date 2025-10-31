#!/bin/bash

#============================================================================
# YoForex Master Deployment Script
# Production-ready deployment for AWS EC2 Ubuntu 22.04/24.04
# Version: 1.0.0
# Author: YoForex DevOps Team
#============================================================================

set -euo pipefail
IFS=$'\n\t'

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="/var/www/yoforex"
BACKUP_DIR="/var/backups/yoforex"
LOG_DIR="/var/log/yoforex"
DOMAIN=${DOMAIN:-"your-domain.com"}
EMAIL=${EMAIL:-"admin@your-domain.com"}
NODE_VERSION="20"
POSTGRES_VERSION="15"

# Deployment state file for rollback
STATE_FILE="/var/lib/yoforex-deploy-state.json"
ROLLBACK_ENABLED=${ROLLBACK_ENABLED:-true}

#============================================================================
# Helper Functions
#============================================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_section() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Check if running with sudo
check_sudo() {
    if [ "$EUID" -ne 0 ]; then 
        log_error "This script must be run with sudo"
        exit 1
    fi
}

# Detect Ubuntu version
detect_ubuntu_version() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
        if [[ "$OS" != "Ubuntu" ]]; then
            log_error "This script is designed for Ubuntu only. Detected: $OS"
            exit 1
        fi
        if [[ "$VER" != "22.04" && "$VER" != "24.04" ]]; then
            log_warn "This script is tested on Ubuntu 22.04 and 24.04. Detected: $VER"
        fi
        log_info "Detected Ubuntu $VER"
    else
        log_error "Cannot detect OS version. /etc/os-release not found."
        exit 1
    fi
}

# Create required directories
create_directories() {
    log_section "Creating Required Directories"
    
    directories=(
        "$DEPLOY_DIR"
        "$BACKUP_DIR"
        "$LOG_DIR"
        "/etc/yoforex"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_info "Created directory: $dir"
        else
            log_info "Directory exists: $dir"
        fi
    done
    
    # Set proper permissions
    chown -R www-data:www-data "$DEPLOY_DIR"
    chown -R www-data:www-data "$LOG_DIR"
}

# Save deployment state for rollback
save_state() {
    local step=$1
    local data=$2
    
    if [ ! -f "$STATE_FILE" ]; then
        echo '{"deployments":[]}' > "$STATE_FILE"
    fi
    
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local state_entry="{\"timestamp\":\"$timestamp\",\"step\":\"$step\",\"data\":$data}"
    
    # Add to state file using jq if available, otherwise append manually
    if command -v jq &> /dev/null; then
        jq ".deployments += [$state_entry]" "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
    else
        echo "$state_entry" >> "${STATE_FILE}.log"
    fi
    
    log_info "State saved: $step"
}

# Backup current deployment
backup_deployment() {
    log_section "Creating Backup"
    
    local backup_name="yoforex-backup-$(date +%Y%m%d-%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    if [ -d "$DEPLOY_DIR" ] && [ "$(ls -A $DEPLOY_DIR 2>/dev/null)" ]; then
        log_info "Creating backup at $backup_path"
        
        # Create backup directory
        mkdir -p "$backup_path"
        
        # Backup application files
        if [ -d "$DEPLOY_DIR" ]; then
            cp -r "$DEPLOY_DIR" "$backup_path/app" 2>/dev/null || true
        fi
        
        # Backup database
        if systemctl is-active --quiet postgresql; then
            sudo -u postgres pg_dumpall > "$backup_path/database.sql" 2>/dev/null || true
        fi
        
        # Backup nginx config
        if [ -d /etc/nginx ]; then
            cp -r /etc/nginx "$backup_path/nginx" 2>/dev/null || true
        fi
        
        # Backup environment files
        if [ -f "$DEPLOY_DIR/.env.production" ]; then
            cp "$DEPLOY_DIR/.env.production" "$backup_path/env.production" 2>/dev/null || true
        fi
        
        # Compress backup
        tar -czf "$backup_path.tar.gz" -C "$BACKUP_DIR" "$backup_name" 2>/dev/null || true
        rm -rf "$backup_path"
        
        log_info "Backup created: $backup_path.tar.gz"
        save_state "backup" "{\"path\":\"$backup_path.tar.gz\"}"
        
        # Keep only last 5 backups
        ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
    else
        log_info "No existing deployment to backup"
    fi
}

# Rollback to previous deployment
rollback_deployment() {
    log_section "Rolling Back Deployment"
    
    # Find latest backup
    local latest_backup=$(ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | head -n 1)
    
    if [ -z "$latest_backup" ]; then
        log_error "No backup found for rollback"
        exit 1
    fi
    
    log_info "Rolling back to: $latest_backup"
    
    # Stop services
    systemctl stop nginx || true
    pm2 stop all || true
    
    # Extract backup
    local temp_dir="/tmp/yoforex-rollback-$(date +%s)"
    mkdir -p "$temp_dir"
    tar -xzf "$latest_backup" -C "$temp_dir"
    
    # Restore application
    if [ -d "$temp_dir/*/app" ]; then
        rm -rf "$DEPLOY_DIR"
        mv "$temp_dir/*/app" "$DEPLOY_DIR"
    fi
    
    # Restore database
    if [ -f "$temp_dir/*/database.sql" ]; then
        sudo -u postgres psql < "$temp_dir/*/database.sql"
    fi
    
    # Restore nginx config
    if [ -d "$temp_dir/*/nginx" ]; then
        rm -rf /etc/nginx
        mv "$temp_dir/*/nginx" /etc/nginx
    fi
    
    # Restore environment
    if [ -f "$temp_dir/*/env.production" ]; then
        cp "$temp_dir/*/env.production" "$DEPLOY_DIR/.env.production"
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
    
    # Restart services
    systemctl start nginx
    cd "$DEPLOY_DIR" && pm2 start ecosystem.config.js
    
    log_info "Rollback completed successfully"
}

# Check system requirements
check_requirements() {
    log_section "Checking System Requirements"
    
    # Check available memory
    local mem_total=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    local mem_gb=$((mem_total / 1024 / 1024))
    
    if [ $mem_gb -lt 1 ]; then
        log_warn "Low memory detected: ${mem_gb}GB. Minimum 2GB recommended."
        log_info "Will configure swap file..."
    fi
    
    # Check available disk space
    local disk_available=$(df / | awk 'NR==2 {print $4}')
    local disk_gb=$((disk_available / 1024 / 1024))
    
    if [ $disk_gb -lt 5 ]; then
        log_error "Insufficient disk space: ${disk_gb}GB available. Minimum 5GB required."
        exit 1
    fi
    
    log_info "Memory: ${mem_gb}GB, Disk: ${disk_gb}GB available"
}

# Setup environment variables
setup_environment() {
    log_section "Setting Up Environment Variables"
    
    # Check if .env.production exists
    if [ ! -f "$DEPLOY_DIR/.env.production" ]; then
        if [ -f "$DEPLOY_DIR/.env.production.example" ]; then
            log_info "Creating .env.production from template"
            cp "$DEPLOY_DIR/.env.production.example" "$DEPLOY_DIR/.env.production"
            
            log_warn "Please edit $DEPLOY_DIR/.env.production with your actual values"
            log_warn "Press Enter to continue after editing (in another terminal)..."
            read -r
        else
            log_error "No .env.production or .env.production.example found"
            exit 1
        fi
    else
        log_info "Using existing .env.production"
    fi
    
    # Load environment variables
    export $(grep -v '^#' "$DEPLOY_DIR/.env.production" | xargs)
}

# Clone or update repository
setup_repository() {
    log_section "Setting Up Repository"
    
    local repo_url=${REPO_URL:-""}
    
    if [ -z "$repo_url" ]; then
        log_warn "No REPO_URL provided. Assuming files are already in place."
        return
    fi
    
    if [ ! -d "$DEPLOY_DIR/.git" ]; then
        log_info "Cloning repository..."
        git clone "$repo_url" "$DEPLOY_DIR"
    else
        log_info "Updating repository..."
        cd "$DEPLOY_DIR"
        git fetch --all
        git reset --hard origin/main
    fi
    
    # Set proper permissions
    chown -R www-data:www-data "$DEPLOY_DIR"
}

# Build application
build_application() {
    log_section "Building Application"
    
    cd "$DEPLOY_DIR"
    
    # Install dependencies
    log_info "Installing dependencies..."
    sudo -u www-data npm ci --production=false
    
    # Run database migrations
    log_info "Running database migrations..."
    sudo -u www-data npm run db:push || {
        log_warn "Database migration failed. Attempting force push..."
        sudo -u www-data npm run db:push -- --force
    }
    
    # Build Next.js application
    log_info "Building Next.js application..."
    sudo -u www-data npm run build
    
    log_info "Build completed successfully"
    save_state "build" "{\"status\":\"completed\"}"
}

# Start services
start_services() {
    log_section "Starting Services"
    
    cd "$DEPLOY_DIR"
    
    # Start PM2 services
    log_info "Starting PM2 services..."
    sudo -u www-data pm2 delete all 2>/dev/null || true
    sudo -u www-data pm2 start ecosystem.config.js
    sudo -u www-data pm2 save
    
    # Setup PM2 startup script
    pm2 startup systemd -u www-data --hp /home/www-data
    
    # Start Nginx
    log_info "Starting Nginx..."
    systemctl restart nginx
    systemctl enable nginx
    
    log_info "All services started successfully"
}

# Health check
health_check() {
    log_section "Running Health Checks"
    
    local checks_passed=true
    
    # Check Next.js
    if curl -f -s -o /dev/null -w "%{http_code}" http://localhost:5000 | grep -q "200\|301\|302"; then
        log_info "✓ Next.js is responding"
    else
        log_error "✗ Next.js is not responding"
        checks_passed=false
    fi
    
    # Check Express API
    if curl -f -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health | grep -q "200"; then
        log_info "✓ Express API is responding"
    else
        log_error "✗ Express API is not responding"
        checks_passed=false
    fi
    
    # Check Nginx
    if systemctl is-active --quiet nginx; then
        log_info "✓ Nginx is running"
    else
        log_error "✗ Nginx is not running"
        checks_passed=false
    fi
    
    # Check PM2
    if pm2 list | grep -q "online"; then
        log_info "✓ PM2 processes are online"
    else
        log_error "✗ PM2 processes are not online"
        checks_passed=false
    fi
    
    # Check PostgreSQL
    if systemctl is-active --quiet postgresql; then
        log_info "✓ PostgreSQL is running"
    else
        log_error "✗ PostgreSQL is not running"
        checks_passed=false
    fi
    
    if [ "$checks_passed" = false ]; then
        log_error "Some health checks failed. Running troubleshoot script..."
        if [ -f "deploy/troubleshoot.sh" ]; then
            bash deploy/troubleshoot.sh
        fi
        return 1
    fi
    
    log_info "All health checks passed!"
    return 0
}

# Main deployment function
main() {
    log_section "YoForex Master Deployment Script"
    log_info "Starting deployment at $(date)"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --rollback)
                rollback_deployment
                exit 0
                ;;
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --email)
                EMAIL="$2"
                shift 2
                ;;
            --repo)
                REPO_URL="$2"
                shift 2
                ;;
            --no-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --skip-ssl)
                SKIP_SSL=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Usage: $0 [--rollback] [--domain <domain>] [--email <email>] [--repo <git-url>] [--no-backup] [--skip-ssl]"
                exit 1
                ;;
        esac
    done
    
    # Run deployment steps
    check_sudo
    detect_ubuntu_version
    check_requirements
    create_directories
    
    # Create backup unless skipped
    if [ "${SKIP_BACKUP:-false}" != "true" ]; then
        backup_deployment
    fi
    
    # Run sub-scripts
    log_info "Running setup scripts..."
    
    # Make scripts executable
    chmod +x deploy/*.sh
    
    # Run setup scripts in order
    bash deploy/setup-ubuntu.sh
    bash deploy/install-deps.sh
    
    # Setup repository and environment
    setup_repository
    setup_environment
    
    # Configure services
    bash deploy/configure-nginx.sh "$DOMAIN"
    bash deploy/configure-pm2.sh
    
    # Build and deploy
    build_application
    start_services
    
    # Configure SSL unless skipped
    if [ "${SKIP_SSL:-false}" != "true" ] && [ "$DOMAIN" != "your-domain.com" ]; then
        log_section "Configuring SSL"
        certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect
    fi
    
    # Run health checks
    if health_check; then
        log_section "Deployment Completed Successfully!"
        log_info "Your application is now running at:"
        log_info "  - https://$DOMAIN (with SSL)"
        log_info "  - http://$DOMAIN (redirects to HTTPS)"
        log_info ""
        log_info "Access logs at: $LOG_DIR"
        log_info "PM2 status: pm2 status"
        log_info "PM2 logs: pm2 logs"
        log_info ""
        log_info "To rollback: sudo $0 --rollback"
    else
        log_error "Deployment completed with issues. Please check the logs."
        exit 1
    fi
    
    save_state "deployment_complete" "{\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}"
}

# Handle errors
trap 'log_error "Deployment failed at line $LINENO. Exit code: $?"' ERR

# Run main function
main "$@"