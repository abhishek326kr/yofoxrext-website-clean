#!/bin/bash

#============================================================================
# YoForex Ubuntu Server Setup Script
# Initial server configuration and hardening
# Compatible with Ubuntu 22.04 and 24.04
#============================================================================

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_USER="www-data"
SWAP_SIZE="2G"
TIMEZONE=${TIMEZONE:-"UTC"}
LOCALE="en_US.UTF-8"

log_info() {
    echo -e "${GREEN}[SETUP]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

#============================================================================
# System Updates
#============================================================================

update_system() {
    log_info "Updating system packages..."
    
    # Update package lists
    apt-get update -qq
    
    # Upgrade existing packages
    DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq
    
    # Remove unnecessary packages
    apt-get autoremove -y -qq
    apt-get autoclean -y -qq
    
    log_info "System packages updated"
}

#============================================================================
# Timezone and Locale Configuration
#============================================================================

configure_locale() {
    log_info "Configuring locale and timezone..."
    
    # Set timezone
    timedatectl set-timezone "$TIMEZONE" || {
        log_warn "Failed to set timezone to $TIMEZONE, using UTC"
        timedatectl set-timezone UTC
    }
    
    # Generate and set locale
    locale-gen "$LOCALE"
    update-locale LANG="$LOCALE" LC_ALL="$LOCALE"
    
    # Export for current session
    export LANG="$LOCALE"
    export LC_ALL="$LOCALE"
    
    log_info "Locale set to $LOCALE, Timezone set to $TIMEZONE"
}

#============================================================================
# Swap Configuration
#============================================================================

configure_swap() {
    log_info "Checking swap configuration..."
    
    # Check if swap exists
    if [ $(swapon -s | wc -l) -gt 1 ]; then
        log_info "Swap already configured"
        return
    fi
    
    # Check available memory
    local mem_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    local mem_gb=$((mem_kb / 1024 / 1024))
    
    if [ $mem_gb -ge 4 ]; then
        log_info "System has ${mem_gb}GB RAM, swap may not be necessary"
        return
    fi
    
    log_info "Creating ${SWAP_SIZE} swap file..."
    
    # Create swap file
    fallocate -l "$SWAP_SIZE" /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    
    # Set permissions
    chmod 600 /swapfile
    
    # Setup swap
    mkswap /swapfile
    swapon /swapfile
    
    # Make permanent
    if ! grep -q "/swapfile" /etc/fstab; then
        echo "/swapfile swap swap defaults 0 0" >> /etc/fstab
    fi
    
    # Configure swappiness for better performance
    sysctl vm.swappiness=10
    echo "vm.swappiness=10" >> /etc/sysctl.conf
    
    # Configure cache pressure
    sysctl vm.vfs_cache_pressure=50
    echo "vm.vfs_cache_pressure=50" >> /etc/sysctl.conf
    
    log_info "Swap configured successfully"
}

#============================================================================
# User Configuration
#============================================================================

configure_users() {
    log_info "Configuring users..."
    
    # Ensure www-data user has proper shell
    if [ "$(getent passwd www-data | cut -d: -f7)" = "/usr/sbin/nologin" ]; then
        usermod -s /bin/bash www-data
        log_info "Updated www-data shell to /bin/bash"
    fi
    
    # Create home directory for www-data if it doesn't exist
    if [ ! -d "/home/www-data" ]; then
        mkdir -p /home/www-data
        chown www-data:www-data /home/www-data
        usermod -d /home/www-data www-data
        log_info "Created home directory for www-data"
    fi
    
    # Add www-data to necessary groups
    usermod -aG sudo www-data 2>/dev/null || true
    
    log_info "User configuration completed"
}

#============================================================================
# SSH Configuration
#============================================================================

configure_ssh() {
    log_info "Hardening SSH configuration..."
    
    local ssh_config="/etc/ssh/sshd_config"
    
    # Backup original config
    if [ ! -f "${ssh_config}.original" ]; then
        cp "$ssh_config" "${ssh_config}.original"
    fi
    
    # SSH hardening settings
    local settings=(
        "PermitRootLogin no"
        "PasswordAuthentication no"
        "PubkeyAuthentication yes"
        "PermitEmptyPasswords no"
        "MaxAuthTries 3"
        "ClientAliveInterval 300"
        "ClientAliveCountMax 2"
        "X11Forwarding no"
        "Protocol 2"
        "UsePAM yes"
    )
    
    for setting in "${settings[@]}"; do
        local key=$(echo "$setting" | cut -d' ' -f1)
        
        # Comment out existing setting
        sed -i "s/^${key}/#${key}/g" "$ssh_config"
        
        # Add new setting if not present
        if ! grep -q "^${setting}$" "$ssh_config"; then
            echo "$setting" >> "$ssh_config"
        fi
    done
    
    # Restart SSH service
    systemctl restart sshd
    
    log_info "SSH configuration hardened"
}

#============================================================================
# Firewall Configuration
#============================================================================

configure_firewall() {
    log_info "Configuring UFW firewall..."
    
    # Install UFW if not present
    if ! command -v ufw &> /dev/null; then
        apt-get install -y ufw
    fi
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (rate limited)
    ufw limit 22/tcp comment 'SSH rate limited'
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    
    # Allow Next.js dev port (only for development)
    if [ "${NODE_ENV:-production}" = "development" ]; then
        ufw allow 5000/tcp comment 'Next.js development'
        ufw allow 3001/tcp comment 'Express API development'
    fi
    
    # Enable firewall
    ufw --force enable
    
    # Show status
    ufw status verbose
    
    log_info "Firewall configured and enabled"
}

#============================================================================
# Security Hardening
#============================================================================

security_hardening() {
    log_info "Applying security hardening..."
    
    # Install security tools
    apt-get install -y -qq \
        fail2ban \
        unattended-upgrades \
        apt-listchanges
    
    # Configure fail2ban for SSH
    cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF
    
    # Restart fail2ban
    systemctl restart fail2ban
    systemctl enable fail2ban
    
    # Configure automatic security updates
    cat > /etc/apt/apt.conf.d/50unattended-upgrades <<EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
    
    # Enable automatic updates
    cat > /etc/apt/apt.conf.d/20auto-upgrades <<EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF
    
    # Kernel hardening via sysctl
    cat >> /etc/sysctl.conf <<EOF

# IP Spoofing protection
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0

# Ignore send redirects
net.ipv4.conf.all.send_redirects = 0

# Disable source packet routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# Log Martians
net.ipv4.conf.all.log_martians = 1

# Ignore ICMP ping requests
net.ipv4.icmp_echo_ignore_broadcasts = 1

# SYN flood protection
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_syn_retries = 2
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_max_syn_backlog = 4096

# Increase system file descriptor limit
fs.file-max = 65535

# Increase ephemeral IP ports
net.ipv4.ip_local_port_range = 1024 65535
EOF
    
    # Apply sysctl settings
    sysctl -p
    
    # Set secure permissions on important files
    chmod 644 /etc/passwd
    chmod 640 /etc/shadow
    chmod 644 /etc/group
    chmod 640 /etc/gshadow
    
    log_info "Security hardening completed"
}

#============================================================================
# System Monitoring Setup
#============================================================================

setup_monitoring() {
    log_info "Setting up system monitoring..."
    
    # Install monitoring tools
    apt-get install -y -qq \
        htop \
        iotop \
        nethogs \
        sysstat
    
    # Enable sysstat
    sed -i 's/ENABLED="false"/ENABLED="true"/' /etc/default/sysstat
    systemctl enable sysstat
    systemctl start sysstat
    
    # Create log rotation config for application logs
    cat > /etc/logrotate.d/yoforex <<EOF
/var/log/yoforex/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 644 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs >/dev/null 2>&1 || true
    endscript
}
EOF
    
    log_info "System monitoring configured"
}

#============================================================================
# Essential Tools Installation
#============================================================================

install_essential_tools() {
    log_info "Installing essential tools..."
    
    apt-get install -y -qq \
        curl \
        wget \
        git \
        vim \
        nano \
        build-essential \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        net-tools \
        jq \
        zip \
        unzip
    
    log_info "Essential tools installed"
}

#============================================================================
# Main Function
#============================================================================

main() {
    log_info "Starting Ubuntu server setup..."
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then 
        log_error "This script must be run as root"
        exit 1
    fi
    
    # Run setup steps
    update_system
    configure_locale
    install_essential_tools
    configure_swap
    configure_users
    configure_ssh
    configure_firewall
    security_hardening
    setup_monitoring
    
    log_info "Ubuntu server setup completed successfully!"
    log_info "Server has been hardened and optimized for YoForex deployment"
    
    # Show summary
    echo ""
    echo "========================================"
    echo "Setup Summary:"
    echo "- System updated and upgraded"
    echo "- Timezone: $(timedatectl | grep 'Time zone' | awk '{print $3}')"
    echo "- Swap: $(free -h | grep Swap | awk '{print $2}')"
    echo "- Firewall: Enabled with SSH, HTTP, HTTPS"
    echo "- SSH: Hardened (key-only auth)"
    echo "- Fail2ban: Active"
    echo "- Auto-updates: Enabled for security"
    echo "========================================"
}

# Run main function
main "$@"