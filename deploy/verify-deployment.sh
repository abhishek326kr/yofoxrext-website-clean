#!/bin/bash

# YoForex Deployment Verification Script
# This script performs comprehensive health checks on the deployed application
# Usage: ./verify-deployment.sh [environment] [notification_webhook]

set -euo pipefail

# Configuration
ENVIRONMENT="${1:-production}"
NOTIFICATION_WEBHOOK="${2:-}"
DOMAIN="${NEXT_PUBLIC_SITE_URL:-https://yoforex.net}"
API_URL="${EXPRESS_URL:-http://127.0.0.1:3001}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
REPORT_FILE="/var/log/yoforex/deployment-verification-$(date '+%Y%m%d-%H%M%S').log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize report
echo "========================================" | tee -a "$REPORT_FILE"
echo "YoForex Deployment Verification Report" | tee -a "$REPORT_FILE"
echo "Environment: $ENVIRONMENT" | tee -a "$REPORT_FILE"
echo "Timestamp: $TIMESTAMP" | tee -a "$REPORT_FILE"
echo "Domain: $DOMAIN" | tee -a "$REPORT_FILE"
echo "========================================" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# Track overall status
OVERALL_STATUS="SUCCESS"
FAILED_CHECKS=()

# Function to log with color
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$REPORT_FILE"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1" | tee -a "$REPORT_FILE"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1" | tee -a "$REPORT_FILE"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1" | tee -a "$REPORT_FILE"
    OVERALL_STATUS="FAILED"
    FAILED_CHECKS+=("$1")
}

# Function to check service status
check_service() {
    local service_name=$1
    log_info "Checking $service_name status..."
    
    if systemctl is-active --quiet "$service_name"; then
        log_success "$service_name is running"
        return 0
    elif pm2 list | grep -q "$service_name"; then
        if pm2 list | grep "$service_name" | grep -q "online"; then
            log_success "$service_name is running (PM2)"
            return 0
        fi
    elif docker ps | grep -q "$service_name"; then
        log_success "$service_name is running (Docker)"
        return 0
    else
        log_error "$service_name is not running"
        return 1
    fi
}

# 1. Check all services
echo "1. CHECKING SERVICES" | tee -a "$REPORT_FILE"
echo "--------------------" | tee -a "$REPORT_FILE"

# Check Next.js
check_service "yoforex-nextjs" || check_service "nextjs"

# Check Express API
check_service "yoforex-express" || check_service "express"

# Check NGINX
check_service "nginx"

# Check PostgreSQL connectivity (if local)
if [ "$ENVIRONMENT" == "development" ]; then
    check_service "postgresql"
    check_service "redis"
fi

echo "" | tee -a "$REPORT_FILE"

# 2. Database Connectivity
echo "2. DATABASE CONNECTIVITY" | tee -a "$REPORT_FILE"
echo "------------------------" | tee -a "$REPORT_FILE"

log_info "Testing database connection..."
if [ -n "${DATABASE_URL:-}" ]; then
    if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        log_success "Database connection successful"
        
        # Check table count
        TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
        log_info "Database has $TABLE_COUNT tables"
        
        # Check user count
        USER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
        log_info "Database has $USER_COUNT users"
    else
        log_error "Database connection failed"
    fi
else
    log_warning "DATABASE_URL not set, skipping database checks"
fi

echo "" | tee -a "$REPORT_FILE"

# 3. API Endpoints Testing
echo "3. API ENDPOINTS" | tee -a "$REPORT_FILE"
echo "----------------" | tee -a "$REPORT_FILE"

# Health check endpoint
log_info "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health" || echo "000")
if [ "$HEALTH_RESPONSE" == "200" ]; then
    log_success "Health endpoint responding (HTTP $HEALTH_RESPONSE)"
else
    log_error "Health endpoint failed (HTTP $HEALTH_RESPONSE)"
fi

# Liveness check
log_info "Testing liveness endpoint..."
LIVE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health/live" || echo "000")
if [ "$LIVE_RESPONSE" == "200" ]; then
    log_success "Liveness endpoint responding (HTTP $LIVE_RESPONSE)"
else
    log_warning "Liveness endpoint not responding (HTTP $LIVE_RESPONSE)"
fi

# Readiness check
log_info "Testing readiness endpoint..."
READY_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health/ready" || echo "000")
if [ "$READY_RESPONSE" == "200" ]; then
    log_success "Readiness endpoint responding (HTTP $READY_RESPONSE)"
else
    log_warning "Readiness endpoint not responding (HTTP $READY_RESPONSE)"
fi

# Test critical API endpoints
ENDPOINTS=(
    "/api/threads"
    "/api/categories"
    "/api/users/session"
    "/api/marketplace/listings"
    "/api/brokers"
)

for endpoint in "${ENDPOINTS[@]}"; do
    log_info "Testing $endpoint..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL$endpoint" || echo "000")
    if [[ "$RESPONSE" =~ ^(200|304|401)$ ]]; then
        log_success "$endpoint responding (HTTP $RESPONSE)"
    else
        log_warning "$endpoint returned HTTP $RESPONSE"
    fi
done

echo "" | tee -a "$REPORT_FILE"

# 4. SSL Certificate Check
echo "4. SSL CERTIFICATE" | tee -a "$REPORT_FILE"
echo "------------------" | tee -a "$REPORT_FILE"

if [[ "$DOMAIN" == https://* ]]; then
    log_info "Checking SSL certificate..."
    
    # Extract domain name from URL
    DOMAIN_NAME=$(echo "$DOMAIN" | sed -e 's|^https://||' -e 's|/.*||')
    
    # Check certificate expiration
    CERT_INFO=$(echo | openssl s_client -servername "$DOMAIN_NAME" -connect "$DOMAIN_NAME:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")
    
    if [ -n "$CERT_INFO" ]; then
        EXPIRY_DATE=$(echo "$CERT_INFO" | grep "notAfter" | cut -d= -f2)
        EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s 2>/dev/null || echo "0")
        CURRENT_EPOCH=$(date +%s)
        DAYS_REMAINING=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
        
        if [ "$DAYS_REMAINING" -gt 30 ]; then
            log_success "SSL certificate valid for $DAYS_REMAINING days"
        elif [ "$DAYS_REMAINING" -gt 7 ]; then
            log_warning "SSL certificate expires in $DAYS_REMAINING days"
        else
            log_error "SSL certificate expires in $DAYS_REMAINING days - URGENT RENEWAL NEEDED"
        fi
    else
        log_warning "Could not verify SSL certificate"
    fi
else
    log_info "Skipping SSL check (not HTTPS)"
fi

echo "" | tee -a "$REPORT_FILE"

# 5. System Resources
echo "5. SYSTEM RESOURCES" | tee -a "$REPORT_FILE"
echo "-------------------" | tee -a "$REPORT_FILE"

# CPU Usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
log_info "CPU Usage: ${CPU_USAGE}%"
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    log_warning "High CPU usage detected"
fi

# Memory Usage
MEM_INFO=$(free -m | awk 'NR==2{printf "%.2f%% (Used: %sMB / Total: %sMB)", $3*100/$2, $3, $2 }')
log_info "Memory Usage: $MEM_INFO"

# Disk Usage
DISK_USAGE=$(df -h / | awk 'NR==2{print $5}')
log_info "Disk Usage: $DISK_USAGE"
if [ "${DISK_USAGE%\%}" -gt 80 ]; then
    log_warning "High disk usage detected"
fi

# Check for swap usage
SWAP_INFO=$(free -m | awk 'NR==3{printf "%.2f%% (Used: %sMB / Total: %sMB)", $3*100/$2, $3, $2 }')
log_info "Swap Usage: $SWAP_INFO"

echo "" | tee -a "$REPORT_FILE"

# 6. Process Status
echo "6. PROCESS STATUS" | tee -a "$REPORT_FILE"
echo "-----------------" | tee -a "$REPORT_FILE"

# Check PM2 processes if PM2 is installed
if command -v pm2 &> /dev/null; then
    log_info "PM2 Process Status:"
    pm2 list --no-color | tee -a "$REPORT_FILE"
    
    # Check for errored processes
    if pm2 list | grep -q "errored"; then
        log_error "Some PM2 processes are in error state"
    fi
fi

# Check Docker containers if Docker is installed
if command -v docker &> /dev/null; then
    log_info "Docker Container Status:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | tee -a "$REPORT_FILE"
    
    # Check for unhealthy containers
    UNHEALTHY_COUNT=$(docker ps --filter health=unhealthy --format "{{.Names}}" | wc -l)
    if [ "$UNHEALTHY_COUNT" -gt 0 ]; then
        log_error "$UNHEALTHY_COUNT unhealthy Docker containers detected"
    fi
fi

echo "" | tee -a "$REPORT_FILE"

# 7. Log File Analysis
echo "7. LOG FILE ANALYSIS" | tee -a "$REPORT_FILE"
echo "--------------------" | tee -a "$REPORT_FILE"

# Check for recent errors in logs
LOG_DIRS=(
    "/var/log/pm2"
    "/var/log/nginx"
    "/var/log/yoforex"
    "/app/logs"
)

for log_dir in "${LOG_DIRS[@]}"; do
    if [ -d "$log_dir" ]; then
        log_info "Checking $log_dir for recent errors..."
        ERROR_COUNT=$(find "$log_dir" -name "*.log" -type f -mtime -1 -exec grep -i "error\|exception\|fatal" {} \; 2>/dev/null | wc -l || echo "0")
        if [ "$ERROR_COUNT" -gt 0 ]; then
            log_warning "Found $ERROR_COUNT error entries in recent logs"
        else
            log_success "No recent errors in $log_dir"
        fi
    fi
done

echo "" | tee -a "$REPORT_FILE"

# 8. Network Connectivity
echo "8. NETWORK CONNECTIVITY" | tee -a "$REPORT_FILE"
echo "-----------------------" | tee -a "$REPORT_FILE"

# Check DNS resolution
log_info "Testing DNS resolution..."
if nslookup "${DOMAIN_NAME:-google.com}" > /dev/null 2>&1; then
    log_success "DNS resolution working"
else
    log_error "DNS resolution failed"
fi

# Check external connectivity
log_info "Testing external connectivity..."
if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
    log_success "External connectivity working"
else
    log_error "No external connectivity"
fi

echo "" | tee -a "$REPORT_FILE"

# 9. Response Time Testing
echo "9. RESPONSE TIME TESTING" | tee -a "$REPORT_FILE"
echo "------------------------" | tee -a "$REPORT_FILE"

log_info "Measuring response times..."

# Test homepage response time
HOME_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$DOMAIN" || echo "999")
log_info "Homepage response time: ${HOME_TIME}s"
if (( $(echo "$HOME_TIME > 3" | bc -l) )); then
    log_warning "Homepage response time is slow (>3s)"
fi

# Test API response time
API_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$API_URL/api/health" || echo "999")
log_info "API health endpoint response time: ${API_TIME}s"
if (( $(echo "$API_TIME > 1" | bc -l) )); then
    log_warning "API response time is slow (>1s)"
fi

echo "" | tee -a "$REPORT_FILE"

# Summary
echo "========================================" | tee -a "$REPORT_FILE"
echo "VERIFICATION SUMMARY" | tee -a "$REPORT_FILE"
echo "========================================" | tee -a "$REPORT_FILE"

if [ "$OVERALL_STATUS" == "SUCCESS" ]; then
    log_success "Deployment verification completed successfully!"
    EXIT_CODE=0
else
    log_error "Deployment verification failed!"
    echo "" | tee -a "$REPORT_FILE"
    echo "Failed checks:" | tee -a "$REPORT_FILE"
    for check in "${FAILED_CHECKS[@]}"; do
        echo "  - $check" | tee -a "$REPORT_FILE"
    done
    EXIT_CODE=1
fi

echo "" | tee -a "$REPORT_FILE"
echo "Full report saved to: $REPORT_FILE" | tee -a "$REPORT_FILE"

# Send notification if webhook is provided
if [ -n "$NOTIFICATION_WEBHOOK" ]; then
    log_info "Sending notification..."
    
    PAYLOAD=$(cat <<EOF
{
  "text": "YoForex Deployment Verification - $ENVIRONMENT",
  "attachments": [{
    "color": $([ "$OVERALL_STATUS" == "SUCCESS" ] && echo "\"good\"" || echo "\"danger\""),
    "fields": [
      {"title": "Environment", "value": "$ENVIRONMENT", "short": true},
      {"title": "Status", "value": "$OVERALL_STATUS", "short": true},
      {"title": "Timestamp", "value": "$TIMESTAMP", "short": false},
      {"title": "Report", "value": "$REPORT_FILE", "short": false}
    ]
  }]
}
EOF
)
    
    curl -X POST -H 'Content-type: application/json' --data "$PAYLOAD" "$NOTIFICATION_WEBHOOK" > /dev/null 2>&1
fi

exit $EXIT_CODE