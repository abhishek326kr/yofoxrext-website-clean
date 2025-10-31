#!/bin/bash
#
# YoForex Health Check Script
# 
# This script verifies that the YoForex platform is running correctly.
# It checks both Next.js frontend and Express API backend.
#
# Usage: bash scripts/health-check.sh
#
# Exit codes:
#   0 - All checks passed
#   1 - One or more checks failed
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NEXTJS_PORT=3000
EXPRESS_PORT=3001
DOMAIN="yoforex.com"
MAX_RETRIES=3
RETRY_DELAY=5

# Counter for failed checks
FAILED_CHECKS=0

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}YoForex Health Check${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# Helper function to check HTTP endpoint
check_http() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    echo -e "${YELLOW}Checking ${name}...${NC}"
    echo "  URL: ${url}"
    
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null); then
            if [ "$response" -eq "$expected_status" ]; then
                echo -e "${GREEN}  ✓ ${name} is healthy (HTTP ${response})${NC}"
                return 0
            else
                echo -e "${RED}  ✗ ${name} returned HTTP ${response} (expected ${expected_status})${NC}"
                ((FAILED_CHECKS++))
                return 1
            fi
        else
            ((retries++))
            if [ $retries -lt $MAX_RETRIES ]; then
                echo -e "${YELLOW}  ⚠ Retry ${retries}/${MAX_RETRIES} in ${RETRY_DELAY}s...${NC}"
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    echo -e "${RED}  ✗ ${name} is not responding after ${MAX_RETRIES} retries${NC}"
    ((FAILED_CHECKS++))
    return 1
}

# Helper function to check port
check_port() {
    local port=$1
    local name=$2
    
    echo -e "${YELLOW}Checking ${name} port ${port}...${NC}"
    
    if nc -z 127.0.0.1 $port 2>/dev/null; then
        echo -e "${GREEN}  ✓ Port ${port} is open${NC}"
        return 0
    else
        echo -e "${RED}  ✗ Port ${port} is not accessible${NC}"
        ((FAILED_CHECKS++))
        return 1
    fi
}

# Check 1: PM2 Processes
echo -e "${YELLOW}Check 1: PM2 Processes${NC}"
if pm2 list | grep -q "online"; then
    echo -e "${GREEN}  ✓ PM2 processes are running${NC}"
    pm2 list | grep -E "yoforex|online" || true
else
    echo -e "${RED}  ✗ No PM2 processes are online${NC}"
    ((FAILED_CHECKS++))
fi
echo ""

# Check 2: Next.js Frontend Port
echo -e "${YELLOW}Check 2: Next.js Frontend Port${NC}"
check_port $NEXTJS_PORT "Next.js"
echo ""

# Check 3: Express API Port
echo -e "${YELLOW}Check 3: Express API Port${NC}"
check_port $EXPRESS_PORT "Express API"
echo ""

# Check 4: Next.js Frontend HTTP
echo -e "${YELLOW}Check 4: Next.js Frontend HTTP${NC}"
check_http "http://127.0.0.1:${NEXTJS_PORT}" "Next.js Frontend" 200
echo ""

# Check 5: Express API HTTP
echo -e "${YELLOW}Check 5: Express API Health Endpoint${NC}"
# Try common health endpoints
if check_http "http://127.0.0.1:${EXPRESS_PORT}/api/health" "Express Health Endpoint" 200; then
    echo ""
elif check_http "http://127.0.0.1:${EXPRESS_PORT}/api/stats" "Express Stats Endpoint" 200; then
    echo ""
else
    echo -e "${YELLOW}  ⚠ No health endpoint found, but port is accessible${NC}"
fi
echo ""

# Check 6: Database Connection
echo -e "${YELLOW}Check 6: Database Connection${NC}"
if check_http "http://127.0.0.1:${EXPRESS_PORT}/api/stats" "Database Query (Stats)" 200; then
    echo -e "${GREEN}  ✓ Database is accessible${NC}"
else
    echo -e "${RED}  ✗ Database connection may be failing${NC}"
fi
echo ""

# Check 7: NGINX Configuration (if running)
echo -e "${YELLOW}Check 7: NGINX Status${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}  ✓ NGINX is running${NC}"
    
    # Test NGINX config
    if nginx -t 2>/dev/null; then
        echo -e "${GREEN}  ✓ NGINX configuration is valid${NC}"
    else
        echo -e "${RED}  ✗ NGINX configuration has errors${NC}"
        ((FAILED_CHECKS++))
    fi
else
    echo -e "${YELLOW}  ⚠ NGINX is not running (may be expected in development)${NC}"
fi
echo ""

# Check 8: SSL Certificate (if HTTPS)
echo -e "${YELLOW}Check 8: SSL Certificate${NC}"
if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    # Check certificate expiry
    expiry=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/${DOMAIN}/fullchain.pem | cut -d= -f2)
    expiry_epoch=$(date -d "$expiry" +%s)
    now_epoch=$(date +%s)
    days_left=$(( ($expiry_epoch - $now_epoch) / 86400 ))
    
    if [ $days_left -gt 30 ]; then
        echo -e "${GREEN}  ✓ SSL certificate is valid (${days_left} days remaining)${NC}"
    elif [ $days_left -gt 0 ]; then
        echo -e "${YELLOW}  ⚠ SSL certificate expires soon (${days_left} days remaining)${NC}"
    else
        echo -e "${RED}  ✗ SSL certificate has expired${NC}"
        ((FAILED_CHECKS++))
    fi
else
    echo -e "${YELLOW}  ⚠ SSL certificate not found (may be expected in development)${NC}"
fi
echo ""

# Check 9: Disk Space
echo -e "${YELLOW}Check 9: Disk Space${NC}"
disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $disk_usage -lt 80 ]; then
    echo -e "${GREEN}  ✓ Disk space is healthy (${disk_usage}% used)${NC}"
elif [ $disk_usage -lt 90 ]; then
    echo -e "${YELLOW}  ⚠ Disk space is getting low (${disk_usage}% used)${NC}"
else
    echo -e "${RED}  ✗ Disk space is critically low (${disk_usage}% used)${NC}"
    ((FAILED_CHECKS++))
fi
echo ""

# Check 10: Memory Usage
echo -e "${YELLOW}Check 10: Memory Usage${NC}"
mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $mem_usage -lt 80 ]; then
    echo -e "${GREEN}  ✓ Memory usage is healthy (${mem_usage}% used)${NC}"
elif [ $mem_usage -lt 90 ]; then
    echo -e "${YELLOW}  ⚠ Memory usage is high (${mem_usage}% used)${NC}"
else
    echo -e "${RED}  ✗ Memory usage is critically high (${mem_usage}% used)${NC}"
    ((FAILED_CHECKS++))
fi
echo ""

# Summary
echo -e "${GREEN}======================================${NC}"
if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}All Health Checks Passed! ✓${NC}"
    echo -e "${GREEN}======================================${NC}"
    exit 0
else
    echo -e "${RED}Health Check Failed!${NC}"
    echo -e "${RED}Failed Checks: ${FAILED_CHECKS}${NC}"
    echo -e "${RED}======================================${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "  - Check PM2 logs: pm2 logs"
    echo "  - Check NGINX logs: sudo tail -f /var/log/nginx/yoforex_error.log"
    echo "  - Check system logs: sudo journalctl -xe"
    echo "  - Restart services: pm2 restart all && sudo systemctl restart nginx"
    echo ""
    exit 1
fi
