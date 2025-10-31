#!/bin/bash

#============================================================================
# YoForex Troubleshooting Script
# Automatic error detection and resolution for common deployment issues
#============================================================================

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
APP_DIR="/var/www/yoforex"
LOG_DIR="/var/log/yoforex"
NGINX_LOG="/var/log/nginx"
PM2_USER="www-data"

# Issue tracking
ISSUES_FOUND=0
ISSUES_FIXED=0

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_fix() {
    echo -e "${MAGENTA}[FIX]${NC} $1"
}

log_section() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}▶ $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

#============================================================================
# System Health Check
#============================================================================

check_system_resources() {
    log_section "System Resources Check"
    
    # Check memory
    local mem_total=$(free -m | awk 'NR==2{print $2}')
    local mem_used=$(free -m | awk 'NR==2{print $3}')
    local mem_percent=$((mem_used * 100 / mem_total))
    
    if [ $mem_percent -gt 90 ]; then
        log_error "High memory usage: ${mem_percent}%"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        
        log_fix "Attempting to free memory..."
        sync && echo 3 > /proc/sys/vm/drop_caches
        pm2 flush
        systemctl restart nginx
        
        ISSUES_FIXED=$((ISSUES_FIXED + 1))
    else
        log_info "Memory usage: ${mem_percent}% (${mem_used}MB / ${mem_total}MB)"
    fi
    
    # Check disk space
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ $disk_usage -gt 90 ]; then
        log_error "High disk usage: ${disk_usage}%"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        
        log_fix "Cleaning up disk space..."
        # Clean package cache
        apt-get clean
        apt-get autoremove -y
        
        # Clean old logs
        find /var/log -type f -name "*.log" -mtime +30 -delete
        find "$LOG_DIR" -type f -name "*.log" -mtime +7 -delete
        
        # Clean PM2 logs
        sudo -u "$PM2_USER" pm2 flush
        
        # Clean npm cache
        npm cache clean --force
        
        ISSUES_FIXED=$((ISSUES_FIXED + 1))
    else
        log_info "Disk usage: ${disk_usage}%"
    fi
    
    # Check load average
    local load=$(uptime | awk -F'load average:' '{print $2}')
    local cpu_count=$(nproc)
    local load_1min=$(echo "$load" | cut -d, -f1 | xargs)
    
    if (( $(echo "$load_1min > $cpu_count * 2" | bc -l) )); then
        log_warn "High system load: $load_1min (CPUs: $cpu_count)"
    else
        log_info "System load: $load_1min (CPUs: $cpu_count)"
    fi
}

#============================================================================
# Port Conflicts Check
#============================================================================

check_port_conflicts() {
    log_section "Port Conflicts Check"
    
    local ports=(5000 3001 80 443 5432 6379)
    
    for port in "${ports[@]}"; do
        local pid=$(lsof -t -i:$port 2>/dev/null || true)
        
        if [ -n "$pid" ]; then
            local process=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
            log_info "Port $port is in use by process: $process (PID: $pid)"
            
            # Check if it's the expected service
            case $port in
                5000)
                    if [[ "$process" != *"node"* ]] && [[ "$process" != *"next"* ]]; then
                        log_error "Port 5000 conflict: Used by unexpected process"
                        ISSUES_FOUND=$((ISSUES_FOUND + 1))
                        
                        log_fix "Killing conflicting process on port 5000"
                        kill -9 "$pid" 2>/dev/null || true
                        ISSUES_FIXED=$((ISSUES_FIXED + 1))
                    fi
                    ;;
                3001)
                    if [[ "$process" != *"node"* ]]; then
                        log_error "Port 3001 conflict: Used by unexpected process"
                        ISSUES_FOUND=$((ISSUES_FOUND + 1))
                        
                        log_fix "Killing conflicting process on port 3001"
                        kill -9 "$pid" 2>/dev/null || true
                        ISSUES_FIXED=$((ISSUES_FIXED + 1))
                    fi
                    ;;
            esac
        else
            if [ $port -eq 5000 ] || [ $port -eq 3001 ]; then
                log_warn "Port $port is not in use (service may be down)"
            fi
        fi
    done
}

#============================================================================
# Permission Issues Check
#============================================================================

check_permissions() {
    log_section "File Permissions Check"
    
    local dirs=("$APP_DIR" "$LOG_DIR" "/var/cache/nginx")
    
    for dir in "${dirs[@]}"; do
        if [ -d "$dir" ]; then
            local owner=$(stat -c '%U' "$dir")
            
            if [ "$owner" != "www-data" ]; then
                log_error "Incorrect ownership for $dir (owner: $owner)"
                ISSUES_FOUND=$((ISSUES_FOUND + 1))
                
                log_fix "Fixing ownership for $dir"
                chown -R www-data:www-data "$dir"
                ISSUES_FIXED=$((ISSUES_FIXED + 1))
            else
                log_info "Correct ownership for $dir"
            fi
            
            # Check write permissions
            if ! sudo -u www-data test -w "$dir"; then
                log_error "No write permission for www-data in $dir"
                ISSUES_FOUND=$((ISSUES_FOUND + 1))
                
                log_fix "Fixing permissions for $dir"
                chmod -R 755 "$dir"
                ISSUES_FIXED=$((ISSUES_FIXED + 1))
            fi
        else
            log_warn "Directory does not exist: $dir"
        fi
    done
    
    # Check .env.production file
    if [ -f "$APP_DIR/.env.production" ]; then
        local env_perms=$(stat -c '%a' "$APP_DIR/.env.production")
        if [ "$env_perms" != "600" ] && [ "$env_perms" != "640" ]; then
            log_error "Insecure permissions on .env.production: $env_perms"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
            
            log_fix "Securing .env.production"
            chmod 640 "$APP_DIR/.env.production"
            chown www-data:www-data "$APP_DIR/.env.production"
            ISSUES_FIXED=$((ISSUES_FIXED + 1))
        fi
    fi
}

#============================================================================
# Database Connection Check
#============================================================================

check_database() {
    log_section "Database Connection Check"
    
    # Check if PostgreSQL is running
    if ! systemctl is-active --quiet postgresql; then
        log_error "PostgreSQL is not running"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        
        log_fix "Starting PostgreSQL"
        systemctl start postgresql
        systemctl enable postgresql
        ISSUES_FIXED=$((ISSUES_FIXED + 1))
    else
        log_info "PostgreSQL is running"
    fi
    
    # Check database connection
    if [ -f "$APP_DIR/.env.production" ]; then
        source "$APP_DIR/.env.production"
        
        if [ -n "$DATABASE_URL" ]; then
            if ! psql "$DATABASE_URL" -c "SELECT 1" &>/dev/null; then
                log_error "Cannot connect to database"
                ISSUES_FOUND=$((ISSUES_FOUND + 1))
                
                # Try to diagnose the issue
                log_fix "Attempting to fix database connection..."
                
                # Extract connection details
                DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\).*/\1/p')
                DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
                DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
                
                # Check if it's a network issue
                if ! nc -zv "$DB_HOST" "$DB_PORT" &>/dev/null; then
                    log_error "Cannot reach database host: $DB_HOST:$DB_PORT"
                    log_warn "Check your firewall settings and database host"
                else
                    log_info "Database host is reachable"
                    
                    # Check pg_hba.conf
                    PG_VERSION=$(psql --version | awk '{print $3}' | sed 's/\..*//')
                    PG_HBA="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"
                    
                    if [ -f "$PG_HBA" ]; then
                        log_fix "Updating PostgreSQL authentication settings"
                        sed -i 's/local   all             all                                     peer/local   all             all                                     md5/' "$PG_HBA"
                        systemctl reload postgresql
                        ISSUES_FIXED=$((ISSUES_FIXED + 1))
                    fi
                fi
            else
                log_info "Database connection successful"
            fi
        else
            log_error "DATABASE_URL not set in .env.production"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        fi
    else
        log_error ".env.production file not found"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
}

#============================================================================
# PM2 Process Check
#============================================================================

check_pm2_processes() {
    log_section "PM2 Process Check"
    
    # Check PM2 process list
    local pm2_status=$(sudo -u "$PM2_USER" pm2 jlist 2>/dev/null || echo "[]")
    
    if [ "$pm2_status" = "[]" ]; then
        log_error "No PM2 processes running"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        
        log_fix "Starting PM2 processes"
        cd "$APP_DIR"
        sudo -u "$PM2_USER" pm2 start ecosystem.config.js
        sudo -u "$PM2_USER" pm2 save
        ISSUES_FIXED=$((ISSUES_FIXED + 1))
    else
        # Check each process
        local frontend_status=$(echo "$pm2_status" | jq -r '.[] | select(.name=="yoforex-nextjs") | .pm2_env.status' 2>/dev/null || echo "")
        local api_status=$(echo "$pm2_status" | jq -r '.[] | select(.name=="yoforex-express") | .pm2_env.status' 2>/dev/null || echo "")
        
        if [ "$frontend_status" != "online" ]; then
            log_error "Frontend process not online (status: ${frontend_status:-not found})"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
            
            log_fix "Restarting frontend process"
            sudo -u "$PM2_USER" pm2 restart yoforex-nextjs || sudo -u "$PM2_USER" pm2 start ecosystem.config.js --only yoforex-nextjs
            ISSUES_FIXED=$((ISSUES_FIXED + 1))
        else
            log_info "Frontend process is online"
        fi
        
        if [ "$api_status" != "online" ]; then
            log_error "API process not online (status: ${api_status:-not found})"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
            
            log_fix "Restarting API process"
            sudo -u "$PM2_USER" pm2 restart yoforex-express || sudo -u "$PM2_USER" pm2 start ecosystem.config.js --only yoforex-express
            ISSUES_FIXED=$((ISSUES_FIXED + 1))
        else
            log_info "API process is online"
        fi
    fi
    
    # Check PM2 logs for errors
    local error_count=$(sudo -u "$PM2_USER" pm2 logs --nostream --lines 100 2>&1 | grep -c "ERROR" || true)
    
    if [ "$error_count" -gt 10 ]; then
        log_warn "High error count in PM2 logs: $error_count errors in last 100 lines"
        log_info "Run 'pm2 logs' to investigate"
    fi
}

#============================================================================
# Nginx Configuration Check
#============================================================================

check_nginx() {
    log_section "Nginx Configuration Check"
    
    # Check if Nginx is running
    if ! systemctl is-active --quiet nginx; then
        log_error "Nginx is not running"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        
        log_fix "Starting Nginx"
        systemctl start nginx
        systemctl enable nginx
        ISSUES_FIXED=$((ISSUES_FIXED + 1))
    else
        log_info "Nginx is running"
    fi
    
    # Test Nginx configuration
    if ! nginx -t &>/dev/null; then
        log_error "Nginx configuration test failed"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        
        log_fix "Checking Nginx configuration syntax"
        nginx -t
        
        # Common fixes
        if [ ! -f /etc/nginx/sites-enabled/yoforex ]; then
            log_fix "Enabling YoForex site"
            ln -sf /etc/nginx/sites-available/yoforex /etc/nginx/sites-enabled/yoforex
            systemctl reload nginx
            ISSUES_FIXED=$((ISSUES_FIXED + 1))
        fi
    else
        log_info "Nginx configuration is valid"
    fi
    
    # Check Nginx error logs
    if [ -f "$NGINX_LOG/error.log" ]; then
        local recent_errors=$(tail -n 100 "$NGINX_LOG/error.log" | grep -c "error" || true)
        
        if [ "$recent_errors" -gt 20 ]; then
            log_warn "High error count in Nginx logs: $recent_errors errors"
            log_info "Recent errors:"
            tail -n 10 "$NGINX_LOG/error.log" | grep "error"
        fi
    fi
}

#============================================================================
# SSL Certificate Check
#============================================================================

check_ssl() {
    log_section "SSL Certificate Check"
    
    # Check if certificates exist
    local domain=$(grep "server_name" /etc/nginx/sites-available/yoforex 2>/dev/null | head -n1 | awk '{print $2}' | sed 's/;//')
    
    if [ -n "$domain" ] && [ "$domain" != "your-domain.com" ]; then
        local cert_path="/etc/letsencrypt/live/$domain/fullchain.pem"
        
        if [ -f "$cert_path" ]; then
            # Check certificate expiration
            local expiry_date=$(openssl x509 -enddate -noout -in "$cert_path" | cut -d= -f2)
            local expiry_epoch=$(date -d "$expiry_date" +%s)
            local current_epoch=$(date +%s)
            local days_left=$(( (expiry_epoch - current_epoch) / 86400 ))
            
            if [ $days_left -lt 30 ]; then
                log_warn "SSL certificate expires in $days_left days"
                
                if [ $days_left -lt 7 ]; then
                    log_error "SSL certificate expires soon!"
                    ISSUES_FOUND=$((ISSUES_FOUND + 1))
                    
                    log_fix "Attempting to renew SSL certificate"
                    certbot renew --nginx --quiet
                    systemctl reload nginx
                    ISSUES_FIXED=$((ISSUES_FIXED + 1))
                fi
            else
                log_info "SSL certificate valid for $days_left days"
            fi
        else
            log_warn "SSL certificate not found for $domain"
        fi
    else
        log_info "SSL not configured (using default domain)"
    fi
}

#============================================================================
# Node Modules Check
#============================================================================

check_node_modules() {
    log_section "Node Modules Check"
    
    if [ ! -d "$APP_DIR/node_modules" ]; then
        log_error "Node modules not installed"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        
        log_fix "Installing node modules"
        cd "$APP_DIR"
        npm ci --production=false
        ISSUES_FIXED=$((ISSUES_FIXED + 1))
    else
        log_info "Node modules installed"
    fi
    
    # Check for outdated modules with security issues
    cd "$APP_DIR"
    local audit_result=$(npm audit --json 2>/dev/null || echo '{"vulnerabilities":{}}')
    local vuln_count=$(echo "$audit_result" | jq '.metadata.vulnerabilities.total' 2>/dev/null || echo "0")
    
    if [ "$vuln_count" -gt 0 ]; then
        log_warn "Found $vuln_count npm vulnerabilities"
        
        local critical=$(echo "$audit_result" | jq '.metadata.vulnerabilities.critical' 2>/dev/null || echo "0")
        local high=$(echo "$audit_result" | jq '.metadata.vulnerabilities.high' 2>/dev/null || echo "0")
        
        if [ "$critical" -gt 0 ] || [ "$high" -gt 0 ]; then
            log_error "Critical/High severity vulnerabilities found"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
            
            log_fix "Attempting to fix npm vulnerabilities"
            npm audit fix --force
            ISSUES_FIXED=$((ISSUES_FIXED + 1))
        fi
    else
        log_info "No npm vulnerabilities found"
    fi
}

#============================================================================
# Build Check
#============================================================================

check_build() {
    log_section "Application Build Check"
    
    # Check if Next.js build exists
    if [ ! -d "$APP_DIR/.next" ]; then
        log_error "Next.js build not found"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        
        log_fix "Building Next.js application"
        cd "$APP_DIR"
        npm run build
        ISSUES_FIXED=$((ISSUES_FIXED + 1))
    else
        log_info "Next.js build exists"
    fi
    
    # Check if Express build exists
    if [ ! -f "$APP_DIR/dist/index.js" ]; then
        log_error "Express build not found"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        
        log_fix "Building Express application"
        cd "$APP_DIR"
        npm run build
        ISSUES_FIXED=$((ISSUES_FIXED + 1))
    else
        log_info "Express build exists"
    fi
}

#============================================================================
# Service Health Checks
#============================================================================

check_service_health() {
    log_section "Service Health Check"
    
    # Check Next.js health
    if ! curl -f -s -o /dev/null -w "%{http_code}" http://localhost:5000 | grep -q "200\|301\|302"; then
        log_error "Next.js service not responding"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    else
        log_info "Next.js service is healthy"
    fi
    
    # Check Express API health
    if ! curl -f -s http://localhost:3001/api/health &>/dev/null; then
        log_error "Express API not responding"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    else
        log_info "Express API is healthy"
    fi
}

#============================================================================
# Log Analysis
#============================================================================

analyze_logs() {
    log_section "Log Analysis"
    
    # Analyze PM2 logs
    if [ -d "/home/$PM2_USER/.pm2/logs" ]; then
        local pm2_errors=$(find "/home/$PM2_USER/.pm2/logs" -name "*-error.log" -exec grep -l "ERROR\|FATAL" {} \; | wc -l)
        
        if [ "$pm2_errors" -gt 0 ]; then
            log_warn "Errors found in $pm2_errors PM2 log files"
            log_info "Recent PM2 errors:"
            find "/home/$PM2_USER/.pm2/logs" -name "*-error.log" -exec tail -n 5 {} \; | head -n 20
        fi
    fi
    
    # Analyze application logs
    if [ -d "$LOG_DIR" ]; then
        local app_errors=$(find "$LOG_DIR" -name "*.log" -exec grep -c "ERROR\|FATAL" {} \; | awk '{s+=$1} END {print s}')
        
        if [ "$app_errors" -gt 100 ]; then
            log_warn "High error count in application logs: $app_errors errors"
        fi
    fi
}

#============================================================================
# Generate Report
#============================================================================

generate_report() {
    log_section "Troubleshooting Report"
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Summary:${NC}"
    echo -e "  Issues Found: ${ISSUES_FOUND}"
    echo -e "  Issues Fixed: ${ISSUES_FIXED}"
    echo -e "  Issues Remaining: $((ISSUES_FOUND - ISSUES_FIXED))"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ $((ISSUES_FOUND - ISSUES_FIXED)) -gt 0 ]; then
        echo -e "\n${YELLOW}Some issues could not be automatically fixed.${NC}"
        echo -e "${YELLOW}Please review the logs above and take manual action.${NC}"
        
        # Save detailed report
        local report_file="$LOG_DIR/troubleshoot-$(date +%Y%m%d-%H%M%S).log"
        {
            echo "YoForex Troubleshooting Report"
            echo "Generated: $(date)"
            echo "Issues Found: $ISSUES_FOUND"
            echo "Issues Fixed: $ISSUES_FIXED"
            echo "========================================="
            
            # Add system info
            echo "System Information:"
            uname -a
            echo ""
            
            echo "Service Status:"
            systemctl status nginx --no-pager | head -n 10
            systemctl status postgresql --no-pager | head -n 10
            sudo -u "$PM2_USER" pm2 status
            
        } > "$report_file"
        
        echo -e "\nDetailed report saved to: ${BLUE}$report_file${NC}"
    else
        echo -e "\n${GREEN}All issues have been resolved!${NC}"
    fi
}

#============================================================================
# Main Function
#============================================================================

main() {
    log_info "Starting YoForex troubleshooting..."
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then 
        log_error "This script must be run as root"
        exit 1
    fi
    
    # Run all checks
    check_system_resources
    check_port_conflicts
    check_permissions
    check_database
    check_pm2_processes
    check_nginx
    check_ssl
    check_node_modules
    check_build
    check_service_health
    analyze_logs
    
    # Generate final report
    generate_report
    
    # Exit with appropriate code
    if [ $((ISSUES_FOUND - ISSUES_FIXED)) -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main "$@"