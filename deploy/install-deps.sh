#!/bin/bash

#============================================================================
# YoForex Dependencies Installation Script
# Installs all required software for the YoForex platform
# Node.js 20, PostgreSQL 15, PM2, Nginx, Certbot, etc.
#============================================================================

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
NODE_VERSION="20"
POSTGRES_VERSION="15"
UBUNTU_VERSION=$(lsb_release -rs)

log_info() {
    echo -e "${GREEN}[DEPS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

#============================================================================
# Node.js Installation
#============================================================================

install_nodejs() {
    log_info "Installing Node.js ${NODE_VERSION}..."
    
    # Check if Node.js is already installed with correct version
    if command -v node &> /dev/null; then
        local current_version=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
        if [ "$current_version" = "$NODE_VERSION" ]; then
            log_info "Node.js ${NODE_VERSION} already installed"
            return
        fi
    fi
    
    # Install NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    
    # Install Node.js
    apt-get install -y nodejs
    
    # Verify installation
    node_version=$(node -v)
    npm_version=$(npm -v)
    log_info "Installed Node.js ${node_version} with npm ${npm_version}"
    
    # Install global npm packages
    npm install -g npm@latest
    
    # Configure npm for www-data user
    mkdir -p /home/www-data/.npm-global
    npm config set prefix '/home/www-data/.npm-global' -g
    echo 'export PATH=/home/www-data/.npm-global/bin:$PATH' >> /home/www-data/.bashrc
    chown -R www-data:www-data /home/www-data/.npm-global
}

#============================================================================
# PostgreSQL Installation
#============================================================================

install_postgresql() {
    log_info "Installing PostgreSQL ${POSTGRES_VERSION}..."
    
    # Check if PostgreSQL is already installed
    if command -v psql &> /dev/null; then
        local current_version=$(psql --version | awk '{print $3}' | sed 's/\..*//')
        if [ "$current_version" = "$POSTGRES_VERSION" ]; then
            log_info "PostgreSQL ${POSTGRES_VERSION} already installed"
            configure_postgresql
            return
        fi
    fi
    
    # Add PostgreSQL official repository
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
    apt-get update -qq
    
    # Install PostgreSQL
    apt-get install -y \
        postgresql-${POSTGRES_VERSION} \
        postgresql-client-${POSTGRES_VERSION} \
        postgresql-contrib-${POSTGRES_VERSION}
    
    # Start and enable PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    configure_postgresql
}

configure_postgresql() {
    log_info "Configuring PostgreSQL..."
    
    # Configure PostgreSQL for production
    PG_VERSION=$POSTGRES_VERSION
    PG_CONFIG="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"
    PG_HBA="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"
    
    # Backup original configs
    cp "$PG_CONFIG" "${PG_CONFIG}.backup" 2>/dev/null || true
    cp "$PG_HBA" "${PG_HBA}.backup" 2>/dev/null || true
    
    # Calculate shared_buffers (25% of RAM)
    TOTAL_MEM=$(free -m | awk 'NR==2{print $2}')
    SHARED_BUFFERS=$((TOTAL_MEM / 4))
    
    # Production optimizations
    cat >> "$PG_CONFIG" <<EOF

# YoForex Production Settings
shared_buffers = ${SHARED_BUFFERS}MB
effective_cache_size = $((SHARED_BUFFERS * 3))MB
maintenance_work_mem = $((TOTAL_MEM / 16))MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_parallel_maintenance_workers = 4

# Connection settings
max_connections = 200
superuser_reserved_connections = 3

# Logging
log_destination = 'csvlog'
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 1GB
log_line_prefix = '%m [%p] %q%u@%d '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_duration = off
log_error_verbosity = default
log_hostname = on
log_lock_waits = on
log_statement = 'ddl'
log_timezone = 'UTC'
EOF
    
    # Configure authentication
    sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" "$PG_HBA"
    
    # Restart PostgreSQL
    systemctl restart postgresql
    
    # Create yoforex database and user if not exists
    sudo -u postgres psql <<EOF 2>/dev/null || true
CREATE USER yoforex WITH PASSWORD 'changeme_in_production';
CREATE DATABASE yoforex OWNER yoforex;
GRANT ALL PRIVILEGES ON DATABASE yoforex TO yoforex;
EOF
    
    log_info "PostgreSQL configured for production"
}

#============================================================================
# PM2 Installation
#============================================================================

install_pm2() {
    log_info "Installing PM2 process manager..."
    
    # Install PM2 globally
    npm install -g pm2@latest
    
    # Install PM2 log rotate
    pm2 install pm2-logrotate
    
    # Configure PM2 log rotation
    pm2 set pm2-logrotate:max_size 50M
    pm2 set pm2-logrotate:retain 30
    pm2 set pm2-logrotate:compress true
    pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
    pm2 set pm2-logrotate:workerInterval 3600
    pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
    
    # Setup PM2 to start on boot
    pm2 startup systemd -u www-data --hp /home/www-data
    
    log_info "PM2 installed and configured"
}

#============================================================================
# Nginx Installation
#============================================================================

install_nginx() {
    log_info "Installing Nginx..."
    
    # Install Nginx
    apt-get install -y nginx
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    rm -f /etc/nginx/sites-available/default
    
    # Create cache directory
    mkdir -p /var/cache/nginx
    chown www-data:www-data /var/cache/nginx
    
    # Configure Nginx main config for performance
    cat > /etc/nginx/nginx.conf <<'EOF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
error_log /var/log/nginx/error.log warn;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    ##
    # Basic Settings
    ##
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    
    # Buffers
    client_body_buffer_size 128k;
    client_max_body_size 50M;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 8k;
    output_buffers 32 32k;
    postpone_output 1460;
    
    # Timeouts
    client_header_timeout 60s;
    client_body_timeout 60s;
    send_timeout 60s;
    
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    ##
    # SSL Settings
    ##
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    ##
    # Logging Settings
    ##
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';
    
    access_log /var/log/nginx/access.log main;

    ##
    # Gzip Settings
    ##
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml application/atom+xml image/svg+xml 
               text/x-js text/x-cross-domain-policy application/x-font-ttf 
               application/x-font-opentype application/vnd.ms-fontobject 
               image/x-icon;
    gzip_disable "msie6";

    ##
    # Rate Limiting
    ##
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
    limit_conn_zone $binary_remote_addr zone=addr:10m;

    ##
    # Cache Settings
    ##
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=static_cache:10m max_size=1g inactive=60m use_temp_path=off;
    
    ##
    # Virtual Host Configs
    ##
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF
    
    # Test configuration
    nginx -t
    
    # Start and enable Nginx
    systemctl restart nginx
    systemctl enable nginx
    
    log_info "Nginx installed and configured"
}

#============================================================================
# Certbot Installation
#============================================================================

install_certbot() {
    log_info "Installing Certbot for SSL certificates..."
    
    # Install snapd if not present
    if ! command -v snap &> /dev/null; then
        apt-get install -y snapd
        systemctl enable --now snapd.socket
        ln -s /var/lib/snapd/snap /snap 2>/dev/null || true
    fi
    
    # Install certbot via snap
    snap install core
    snap refresh core
    snap install --classic certbot
    ln -s /snap/bin/certbot /usr/bin/certbot 2>/dev/null || true
    
    # Create renewal hook for nginx
    mkdir -p /etc/letsencrypt/renewal-hooks/deploy
    cat > /etc/letsencrypt/renewal-hooks/deploy/nginx <<'EOF'
#!/bin/bash
nginx -t && systemctl reload nginx
EOF
    chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx
    
    log_info "Certbot installed"
}

#============================================================================
# Redis Installation (Optional but recommended for sessions)
#============================================================================

install_redis() {
    log_info "Installing Redis for session management..."
    
    # Install Redis
    apt-get install -y redis-server
    
    # Configure Redis for production
    cat >> /etc/redis/redis.conf <<EOF

# YoForex Production Settings
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
EOF
    
    # Set Redis to use systemd supervision
    sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf
    
    # Start and enable Redis
    systemctl restart redis-server
    systemctl enable redis-server
    
    log_info "Redis installed and configured"
}

#============================================================================
# Build Tools Installation
#============================================================================

install_build_tools() {
    log_info "Installing build tools and dependencies..."
    
    apt-get install -y \
        build-essential \
        g++ \
        make \
        python3 \
        python3-pip \
        git \
        curl \
        wget \
        imagemagick \
        jpegoptim \
        optipng \
        pngquant \
        webp
    
    # Install additional Node.js build tools
    npm install -g \
        node-gyp \
        typescript \
        tsx \
        cross-env
    
    log_info "Build tools installed"
}

#============================================================================
# System Libraries Installation
#============================================================================

install_system_libraries() {
    log_info "Installing system libraries..."
    
    apt-get install -y \
        libssl-dev \
        libcurl4-openssl-dev \
        libxml2-dev \
        libpq-dev \
        libpng-dev \
        libjpeg-dev \
        libwebp-dev \
        libzip-dev \
        libicu-dev
    
    log_info "System libraries installed"
}

#============================================================================
# Main Function
#============================================================================

main() {
    log_info "Starting dependency installation..."
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then 
        log_error "This script must be run as root"
        exit 1
    fi
    
    # Update package lists
    apt-get update -qq
    
    # Install dependencies in order
    install_nodejs
    install_postgresql
    install_pm2
    install_nginx
    install_certbot
    install_redis
    install_build_tools
    install_system_libraries
    
    log_info "All dependencies installed successfully!"
    
    # Show summary
    echo ""
    echo "========================================"
    echo "Installed Software Versions:"
    echo "- Node.js: $(node -v)"
    echo "- npm: $(npm -v)"
    echo "- PostgreSQL: $(psql --version | awk '{print $3}')"
    echo "- PM2: $(pm2 -v)"
    echo "- Nginx: $(nginx -v 2>&1 | cut -d' ' -f3)"
    echo "- Redis: $(redis-server --version | cut -d' ' -f3)"
    echo "========================================"
}

# Run main function
main "$@"