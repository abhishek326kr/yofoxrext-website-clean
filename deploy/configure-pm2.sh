#!/bin/bash

#============================================================================
# YoForex PM2 Configuration Script
# Sets up PM2 for production with clustering, monitoring, and auto-restart
#============================================================================

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_DIR="/var/www/yoforex"
PM2_USER="www-data"
NODE_ENV="production"

log_info() {
    echo -e "${GREEN}[PM2]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

#============================================================================
# Configure PM2
#============================================================================

configure_pm2() {
    log_info "Configuring PM2 settings..."
    
    # Set PM2 home directory
    export PM2_HOME="/home/$PM2_USER/.pm2"
    
    # Configure PM2
    sudo -u "$PM2_USER" pm2 set pm2:autodump true
    sudo -u "$PM2_USER" pm2 set pm2:autorestart true
    
    # Configure PM2 log rotation
    sudo -u "$PM2_USER" pm2 install pm2-logrotate
    sudo -u "$PM2_USER" pm2 set pm2-logrotate:max_size 100M
    sudo -u "$PM2_USER" pm2 set pm2-logrotate:retain 30
    sudo -u "$PM2_USER" pm2 set pm2-logrotate:compress true
    sudo -u "$PM2_USER" pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
    sudo -u "$PM2_USER" pm2 set pm2-logrotate:workerInterval 3600
    sudo -u "$PM2_USER" pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
    
    # Configure PM2 metrics
    sudo -u "$PM2_USER" pm2 set pm2:metrics true
    
    log_info "PM2 configured successfully"
}

#============================================================================
# Setup PM2 Startup Script
#============================================================================

setup_pm2_startup() {
    log_info "Setting up PM2 startup script..."
    
    # Generate startup script
    pm2 startup systemd -u "$PM2_USER" --hp "/home/$PM2_USER"
    
    # Enable PM2 service
    systemctl enable pm2-"$PM2_USER"
    
    log_info "PM2 startup script configured"
}

#============================================================================
# Create PM2 Ecosystem File
#============================================================================

create_ecosystem_file() {
    log_info "Creating PM2 ecosystem configuration..."
    
    cat > "$APP_DIR/ecosystem.config.js" <<'EOF'
module.exports = {
  apps: [
    {
      // Next.js Frontend Application
      name: 'yoforex-frontend',
      script: 'npm',
      args: 'run start:next',
      cwd: '/var/www/yoforex',
      instances: process.env.NODE_ENV === 'production' ? 2 : 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      error_file: '/var/log/yoforex/frontend-error.log',
      out_file: '/var/log/yoforex/frontend-out.log',
      log_file: '/var/log/yoforex/frontend-combined.log',
      time: true,
      kill_timeout: 5000,
      listen_timeout: 5000,
      shutdown_with_message: true,
    },
    {
      // Express API Backend
      name: 'yoforex-api',
      script: './dist/index.js',
      cwd: '/var/www/yoforex',
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        API_PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        API_PORT: 3001,
      },
      env_development: {
        NODE_ENV: 'development',
        API_PORT: 3001,
      },
      error_file: '/var/log/yoforex/api-error.log',
      out_file: '/var/log/yoforex/api-out.log',
      log_file: '/var/log/yoforex/api-combined.log',
      time: true,
      kill_timeout: 5000,
      listen_timeout: 5000,
      shutdown_with_message: true,
    }
  ],

  // Deploy configuration
  deploy: {
    production: {
      user: 'www-data',
      host: 'localhost',
      ref: 'origin/main',
      repo: process.env.REPO_URL || 'git@github.com:yourusername/yoforex.git',
      path: '/var/www/yoforex',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --production=false && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production'
      }
    },
    staging: {
      user: 'www-data',
      host: 'localhost',
      ref: 'origin/staging',
      repo: process.env.REPO_URL || 'git@github.com:yourusername/yoforex.git',
      path: '/var/www/yoforex-staging',
      'post-deploy': 'npm ci && npm run build && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};
EOF
    
    # Set proper ownership
    chown "$PM2_USER:$PM2_USER" "$APP_DIR/ecosystem.config.js"
    
    log_info "PM2 ecosystem file created"
}

#============================================================================
# Create Monitoring Script
#============================================================================

create_monitoring_script() {
    log_info "Creating PM2 monitoring script..."
    
    cat > /usr/local/bin/pm2-monitor <<'EOF'
#!/bin/bash

# PM2 Health Check and Monitoring Script
PM2_USER="www-data"

# Function to check PM2 process
check_process() {
    local app_name=$1
    local status=$(sudo -u $PM2_USER pm2 jlist | jq -r ".[] | select(.name==\"$app_name\") | .pm2_env.status")
    
    if [ "$status" != "online" ]; then
        echo "Process $app_name is not online (status: $status). Attempting restart..."
        sudo -u $PM2_USER pm2 restart "$app_name"
        sleep 5
        
        # Check again
        status=$(sudo -u $PM2_USER pm2 jlist | jq -r ".[] | select(.name==\"$app_name\") | .pm2_env.status")
        if [ "$status" != "online" ]; then
            echo "Failed to restart $app_name. Manual intervention required."
            return 1
        else
            echo "Successfully restarted $app_name"
        fi
    fi
    return 0
}

# Check both applications
check_process "yoforex-frontend"
check_process "yoforex-api"

# Check memory usage
sudo -u $PM2_USER pm2 jlist | jq -r '.[] | "\(.name): Memory: \(.monit.memory / 1024 / 1024)MB, CPU: \(.monit.cpu)%"'

# Save current state
sudo -u $PM2_USER pm2 save

exit 0
EOF
    
    chmod +x /usr/local/bin/pm2-monitor
    
    # Add to crontab for regular monitoring
    (crontab -l 2>/dev/null | grep -v pm2-monitor; echo "*/5 * * * * /usr/local/bin/pm2-monitor > /var/log/yoforex/pm2-monitor.log 2>&1") | crontab -
    
    log_info "PM2 monitoring script created"
}

#============================================================================
# Create PM2 Commands Helper
#============================================================================

create_pm2_helper() {
    log_info "Creating PM2 helper commands..."
    
    cat > /usr/local/bin/yoforex-pm2 <<'EOF'
#!/bin/bash

# YoForex PM2 Helper Script
PM2_USER="www-data"
APP_DIR="/var/www/yoforex"

case "$1" in
    status)
        sudo -u $PM2_USER pm2 status
        ;;
    logs)
        sudo -u $PM2_USER pm2 logs ${2:-}
        ;;
    restart)
        sudo -u $PM2_USER pm2 restart ${2:-all}
        ;;
    reload)
        sudo -u $PM2_USER pm2 reload ${2:-all}
        ;;
    stop)
        sudo -u $PM2_USER pm2 stop ${2:-all}
        ;;
    start)
        cd $APP_DIR
        sudo -u $PM2_USER pm2 start ecosystem.config.js
        ;;
    save)
        sudo -u $PM2_USER pm2 save
        ;;
    monit)
        sudo -u $PM2_USER pm2 monit
        ;;
    info)
        sudo -u $PM2_USER pm2 info ${2:-}
        ;;
    flush)
        sudo -u $PM2_USER pm2 flush
        ;;
    *)
        echo "Usage: $0 {status|logs|restart|reload|stop|start|save|monit|info|flush} [app-name]"
        exit 1
        ;;
esac
EOF
    
    chmod +x /usr/local/bin/yoforex-pm2
    
    log_info "PM2 helper commands created (use: yoforex-pm2 <command>)"
}

#============================================================================
# Setup PM2 Web Dashboard (Optional)
#============================================================================

setup_pm2_web() {
    log_info "Setting up PM2 web dashboard..."
    
    # Install PM2 web dashboard
    sudo -u "$PM2_USER" npm install -g pm2-web
    
    # Create PM2 web config
    cat > "/home/$PM2_USER/pm2-web-config.json" <<EOF
{
  "host": "127.0.0.1",
  "port": 9615,
  "refresh": 5000,
  "authentication": {
    "enabled": false
  }
}
EOF
    
    chown "$PM2_USER:$PM2_USER" "/home/$PM2_USER/pm2-web-config.json"
    
    # Start PM2 web dashboard
    sudo -u "$PM2_USER" pm2 start pm2-web -- --config "/home/$PM2_USER/pm2-web-config.json"
    sudo -u "$PM2_USER" pm2 save
    
    log_info "PM2 web dashboard started on port 9615"
}

#============================================================================
# Optimize PM2 for Production
#============================================================================

optimize_pm2() {
    log_info "Optimizing PM2 for production..."
    
    # Set cluster mode settings
    sudo -u "$PM2_USER" pm2 set cluster-memory-threshold 80
    
    # Configure graceful shutdown
    sudo -u "$PM2_USER" pm2 set graceful-listen-timeout 3000
    sudo -u "$PM2_USER" pm2 set kill-timeout 5000
    
    # Set process priority
    sudo -u "$PM2_USER" pm2 set pm2:priority -10
    
    log_info "PM2 optimization completed"
}

#============================================================================
# Main Function
#============================================================================

main() {
    log_info "Configuring PM2 for YoForex..."
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then 
        log_error "This script must be run as root"
        exit 1
    fi
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 is not installed. Please run install-deps.sh first."
        exit 1
    fi
    
    # Configure PM2
    configure_pm2
    create_ecosystem_file
    setup_pm2_startup
    create_monitoring_script
    create_pm2_helper
    optimize_pm2
    
    # Optional: Setup web dashboard
    read -p "Do you want to setup PM2 web dashboard? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_pm2_web
    fi
    
    log_info "PM2 configuration completed successfully!"
    log_info ""
    log_info "Useful commands:"
    log_info "- Status: yoforex-pm2 status"
    log_info "- Logs: yoforex-pm2 logs"
    log_info "- Restart: yoforex-pm2 restart"
    log_info "- Monitor: yoforex-pm2 monit"
    log_info ""
    log_info "PM2 will automatically:"
    log_info "- Start on system boot"
    log_info "- Restart crashed processes"
    log_info "- Rotate logs daily"
    log_info "- Monitor memory usage"
}

# Run main function
main "$@"