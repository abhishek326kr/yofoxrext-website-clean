#!/bin/bash

#============================================================================
# YoForex Nginx Configuration Script
# Sets up Nginx as reverse proxy for Next.js and Express API
# Includes SSL, security headers, caching, and rate limiting
#============================================================================

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN=${1:-"your-domain.com"}
NGINX_DIR="/etc/nginx"
SITES_AVAILABLE="$NGINX_DIR/sites-available"
SITES_ENABLED="$NGINX_DIR/sites-enabled"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"

log_info() {
    echo -e "${GREEN}[NGINX]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

#============================================================================
# Create Nginx Site Configuration
#============================================================================

create_nginx_config() {
    log_info "Creating Nginx configuration for $DOMAIN..."
    
    # Create sites directories if they don't exist
    mkdir -p "$SITES_AVAILABLE" "$SITES_ENABLED"
    
    # Create the main configuration
    cat > "$SITES_AVAILABLE/yoforex" <<'EOF'
# Upstream definitions
upstream nextjs_upstream {
    least_conn;
    server 127.0.0.1:5000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

upstream express_upstream {
    least_conn;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# Rate limiting and connection zones
limit_req_status 429;
limit_conn_status 503;

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    
    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Main HTTPS server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    
    # SSL Configuration (will be managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/chain.pem;
    
    # SSL Security Settings for A+ Rating
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # DNS Resolver
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; media-src 'self' https:; object-src 'none'; frame-ancestors 'self'; base-uri 'self'; form-action 'self' https:;" always;
    add_header Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" always;
    
    # Remove server header
    more_clear_headers Server;
    
    # Logging
    access_log /var/log/nginx/yoforex_access.log main;
    error_log /var/log/nginx/yoforex_error.log warn;
    
    # Root directory for static files
    root /var/www/yoforex/public;
    
    # API Routes (Express Backend)
    location /api {
        # Rate limiting for API
        limit_req zone=api burst=20 nodelay;
        limit_conn addr 10;
        
        # Proxy settings
        proxy_pass http://express_upstream;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
        
        # Cache bypass
        proxy_cache_bypass $http_upgrade;
        
        # Error handling
        proxy_intercept_errors off;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://express_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
    
    # Next.js Static Files (_next/static)
    location /_next/static {
        alias /var/www/yoforex/.next/static;
        
        # Cache static assets
        expires 365d;
        add_header Cache-Control "public, immutable";
        add_header X-Cache-Status $upstream_cache_status;
        
        # Gzip
        gzip_static on;
    }
    
    # Public static files
    location ~* \.(js|css|png|jpg|jpeg|gif|webp|ico|svg|woff|woff2|ttf|otf|eot)$ {
        # Cache control
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header X-Cache-Status $upstream_cache_status;
        
        # Security
        add_header X-Content-Type-Options "nosniff" always;
        
        # Gzip
        gzip_static on;
        
        # Try files
        try_files $uri @nextjs;
    }
    
    # Authentication endpoints (stricter rate limiting)
    location ~ ^/api/(login|register|auth) {
        limit_req zone=auth burst=2 nodelay;
        
        proxy_pass http://express_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check endpoints (no rate limiting)
    location ~ ^/(api/)?health {
        access_log off;
        proxy_pass http://express_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    # Next.js App (everything else)
    location / {
        # Rate limiting for general requests
        limit_req zone=general burst=10 nodelay;
        limit_conn addr 20;
        
        # Try serving static file first, then proxy to Next.js
        try_files $uri @nextjs;
    }
    
    # Named location for Next.js
    location @nextjs {
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Cache settings for Next.js pages
        proxy_cache static_cache;
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_revalidate on;
        proxy_cache_min_uses 1;
        proxy_cache_lock on;
        proxy_cache_bypass $cookie_session $http_authorization;
        
        add_header X-Cache-Status $upstream_cache_status;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 8k;
        proxy_buffers 16 8k;
        proxy_busy_buffers_size 16k;
    }
    
    # Security: Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Security: Deny access to backup and config files
    location ~* \.(bak|conf|dist|fla|in[ci]|log|orig|psd|sh|sql|sw[op])$ {
        deny all;
    }
    
    # robots.txt and sitemap.xml
    location = /robots.txt {
        allow all;
        log_not_found off;
        access_log off;
    }
    
    location = /sitemap.xml {
        allow all;
        log_not_found off;
        access_log off;
    }
    
    # Custom error pages
    error_page 404 /404;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}

# Redirect www to non-www (or vice versa)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.DOMAIN_PLACEHOLDER;
    
    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    
    return 301 https://DOMAIN_PLACEHOLDER$request_uri;
}
EOF
    
    # Replace domain placeholder
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" "$SITES_AVAILABLE/yoforex"
    
    log_info "Nginx configuration created"
}

#============================================================================
# Create Additional Security Configuration
#============================================================================

create_security_config() {
    log_info "Creating additional security configuration..."
    
    # Create DH parameters for better SSL security
    if [ ! -f "$NGINX_DIR/dhparam.pem" ]; then
        log_info "Generating DH parameters (this may take a while)..."
        openssl dhparam -out "$NGINX_DIR/dhparam.pem" 2048
    fi
    
    # Add DH parameters to config
    if [ -f "$NGINX_DIR/dhparam.pem" ]; then
        sed -i '/ssl_prefer_server_ciphers/a \    ssl_dhparam /etc/nginx/dhparam.pem;' "$SITES_AVAILABLE/yoforex"
    fi
    
    log_info "Security configuration completed"
}

#============================================================================
# Create Monitoring Configuration
#============================================================================

create_monitoring_config() {
    log_info "Creating monitoring endpoint..."
    
    cat > "$SITES_AVAILABLE/monitoring" <<'EOF'
# Monitoring and status endpoint (localhost only)
server {
    listen 127.0.0.1:8080;
    server_name localhost;
    
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
    
    location /ping {
        access_log off;
        return 200 "pong\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Enable monitoring
    ln -sf "$SITES_AVAILABLE/monitoring" "$SITES_ENABLED/monitoring"
    
    log_info "Monitoring configuration created"
}

#============================================================================
# Enable Site
#============================================================================

enable_site() {
    log_info "Enabling YoForex site..."
    
    # Remove default site if exists
    rm -f "$SITES_ENABLED/default"
    
    # Enable YoForex site
    ln -sf "$SITES_AVAILABLE/yoforex" "$SITES_ENABLED/yoforex"
    
    log_info "Site enabled"
}

#============================================================================
# Test and Reload Nginx
#============================================================================

test_and_reload() {
    log_info "Testing Nginx configuration..."
    
    if nginx -t; then
        log_info "Configuration test passed"
        
        # Reload Nginx
        systemctl reload nginx
        log_info "Nginx reloaded successfully"
    else
        log_error "Nginx configuration test failed!"
        exit 1
    fi
}

#============================================================================
# Setup Log Rotation
#============================================================================

setup_log_rotation() {
    log_info "Setting up log rotation..."
    
    cat > /etc/logrotate.d/nginx-yoforex <<'EOF'
/var/log/nginx/yoforex_*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    prerotate
        if [ -d /etc/logrotate.d/httpd-prerotate ]; then \
            run-parts /etc/logrotate.d/httpd-prerotate; \
        fi
    endscript
    postrotate
        invoke-rc.d nginx rotate >/dev/null 2>&1
    endscript
}
EOF
    
    log_info "Log rotation configured"
}

#============================================================================
# Main Function
#============================================================================

main() {
    log_info "Configuring Nginx for YoForex..."
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then 
        log_error "This script must be run as root"
        exit 1
    fi
    
    # Check if domain is set
    if [ "$DOMAIN" = "your-domain.com" ]; then
        log_warn "Using default domain. Please set your actual domain!"
        log_warn "Usage: $0 <your-domain.com>"
    fi
    
    # Create configurations
    create_nginx_config
    create_security_config
    create_monitoring_config
    enable_site
    setup_log_rotation
    test_and_reload
    
    log_info "Nginx configuration completed successfully!"
    log_info ""
    log_info "Next steps:"
    log_info "1. Ensure your domain DNS points to this server"
    log_info "2. Run certbot to get SSL certificate:"
    log_info "   certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    log_info "3. Test your configuration:"
    log_info "   curl -I https://$DOMAIN"
    log_info ""
    log_info "Monitor Nginx:"
    log_info "- Access log: /var/log/nginx/yoforex_access.log"
    log_info "- Error log: /var/log/nginx/yoforex_error.log"
    log_info "- Status: systemctl status nginx"
}

# Run main function
main "$@"