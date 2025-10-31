#!/bin/bash
#
# YoForex VPS Initial Setup Script
# 
# This script performs the initial setup of a Ubuntu VPS for YoForex deployment.
# Run this script ONCE on a fresh VPS.
#
# Usage: sudo bash scripts/setup-vps.sh
#
# What it does:
# 1. System updates and security
# 2. Install Node.js 20
# 3. Install and configure NGINX
# 4. Install PM2 globally
# 5. Install and configure PostgreSQL (optional)
# 6. Install Certbot for SSL
# 7. Configure firewall (UFW)
# 8. Create deployment user
# 9. Setup application directory
#

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="yoforex"
APP_DIR="/var/www/${APP_NAME}"
DEPLOY_USER="deployer"
DOMAIN="yoforex.com"
NODE_VERSION="20"

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}YoForex VPS Setup Script${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}ERROR: Please run as root (use sudo)${NC}"
   exit 1
fi

echo -e "${YELLOW}Step 1: System Update & Security${NC}"
apt-get update
apt-get upgrade -y
apt-get install -y curl wget git build-essential ufw fail2ban

echo -e "${GREEN}✓ System updated${NC}"
echo ""

echo -e "${YELLOW}Step 2: Install Node.js ${NODE_VERSION}${NC}"
# Remove old Node.js if exists
apt-get remove -y nodejs npm || true

# Install Node.js 20 from NodeSource
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y nodejs

# Verify installation
node_version=$(node --version)
npm_version=$(npm --version)
echo -e "${GREEN}✓ Node.js installed: ${node_version}${NC}"
echo -e "${GREEN}✓ npm installed: ${npm_version}${NC}"
echo ""

echo -e "${YELLOW}Step 3: Install PM2${NC}"
npm install -g pm2
pm2 startup systemd -u $DEPLOY_USER --hp /home/$DEPLOY_USER
echo -e "${GREEN}✓ PM2 installed globally${NC}"
echo ""

echo -e "${YELLOW}Step 4: Install NGINX${NC}"
apt-get install -y nginx

# Stop NGINX (we'll configure it later)
systemctl stop nginx
systemctl enable nginx

echo -e "${GREEN}✓ NGINX installed${NC}"
echo ""

echo -e "${YELLOW}Step 5: Install Certbot (Let's Encrypt)${NC}"
apt-get install -y certbot python3-certbot-nginx

echo -e "${GREEN}✓ Certbot installed${NC}"
echo ""

echo -e "${YELLOW}Step 6: Configure Firewall (UFW)${NC}"
# Reset firewall
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (IMPORTANT - before enabling)
ufw allow OpenSSH
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow PostgreSQL (only from localhost)
# ufw allow from 127.0.0.1 to any port 5432

# Enable firewall
ufw --force enable

echo -e "${GREEN}✓ Firewall configured${NC}"
ufw status
echo ""

echo -e "${YELLOW}Step 7: Create Deployment User${NC}"
# Create deployer user if doesn't exist
if id "$DEPLOY_USER" &>/dev/null; then
    echo -e "${YELLOW}User $DEPLOY_USER already exists${NC}"
else
    useradd -m -s /bin/bash $DEPLOY_USER
    usermod -aG sudo $DEPLOY_USER
    echo -e "${GREEN}✓ User $DEPLOY_USER created${NC}"
fi

# Setup SSH for deployer (optional - for passwordless deployment)
echo ""
echo -e "${YELLOW}Setting up SSH for $DEPLOY_USER...${NC}"
mkdir -p /home/$DEPLOY_USER/.ssh
chmod 700 /home/$DEPLOY_USER/.ssh
touch /home/$DEPLOY_USER/.ssh/authorized_keys
chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys
chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh

echo -e "${GREEN}✓ SSH directory created for $DEPLOY_USER${NC}"
echo -e "${YELLOW}Add your public SSH key to: /home/$DEPLOY_USER/.ssh/authorized_keys${NC}"
echo ""

echo -e "${YELLOW}Step 8: Create Application Directory${NC}"
mkdir -p $APP_DIR
mkdir -p /var/log/pm2
chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR
chown -R $DEPLOY_USER:$DEPLOY_USER /var/log/pm2

echo -e "${GREEN}✓ Application directory created: $APP_DIR${NC}"
echo ""

echo -e "${YELLOW}Step 9: Install PostgreSQL (Optional)${NC}"
read -p "Do you want to install PostgreSQL locally? (y/n): " install_pg

if [[ $install_pg == "y" || $install_pg == "Y" ]]; then
    apt-get install -y postgresql postgresql-contrib
    
    # Start PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    echo -e "${GREEN}✓ PostgreSQL installed${NC}"
    echo ""
    echo -e "${YELLOW}Configure PostgreSQL:${NC}"
    echo "  1. Switch to postgres user: sudo -u postgres psql"
    echo "  2. Create database: CREATE DATABASE yoforex;"
    echo "  3. Create user: CREATE USER yoforex_user WITH PASSWORD 'your_password';"
    echo "  4. Grant privileges: GRANT ALL PRIVILEGES ON DATABASE yoforex TO yoforex_user;"
    echo "  5. Exit: \\q"
    echo ""
else
    echo -e "${YELLOW}Skipping PostgreSQL installation (using external database)${NC}"
fi

echo ""

echo -e "${YELLOW}Step 10: Configure NGINX for ${DOMAIN}${NC}"
# Backup default config
if [ -f /etc/nginx/sites-enabled/default ]; then
    mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak
fi

# Create directory for certbot challenges
mkdir -p /var/www/certbot

# We'll copy the NGINX config later
echo -e "${YELLOW}NGINX config will be deployed with the application${NC}"
echo ""

echo -e "${YELLOW}Step 11: Setup SSL Certificate${NC}"
read -p "Do you want to obtain SSL certificate now? (y/n): " obtain_ssl

if [[ $obtain_ssl == "y" || $obtain_ssl == "Y" ]]; then
    echo -e "${YELLOW}Obtaining SSL certificate for ${DOMAIN}...${NC}"
    
    # Temporarily start NGINX for certbot
    systemctl start nginx
    
    # Obtain certificate
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    echo -e "${GREEN}✓ SSL certificate obtained${NC}"
else
    echo -e "${YELLOW}Skipping SSL certificate (run manually: sudo certbot --nginx -d ${DOMAIN})${NC}"
fi

echo ""

echo -e "${YELLOW}Step 12: Configure Fail2Ban (SSH Protection)${NC}"
systemctl enable fail2ban
systemctl start fail2ban

echo -e "${GREEN}✓ Fail2Ban enabled${NC}"
echo ""

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}VPS Setup Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Add your SSH public key to /home/$DEPLOY_USER/.ssh/authorized_keys"
echo "  2. Set a password for deployer: sudo passwd $DEPLOY_USER"
echo "  3. Configure your .env.production file"
echo "  4. Deploy your application: bash scripts/deploy.sh"
echo "  5. Copy NGINX config: sudo cp nginx/yoforex.conf /etc/nginx/sites-available/yoforex.conf"
echo "  6. Enable NGINX config: sudo ln -s /etc/nginx/sites-available/yoforex.conf /etc/nginx/sites-enabled/"
echo "  7. Test NGINX: sudo nginx -t"
echo "  8. Reload NGINX: sudo systemctl reload nginx"
echo ""
echo -e "${GREEN}VPS is ready for deployment!${NC}"
echo ""

# Display summary
echo -e "${YELLOW}System Summary:${NC}"
echo "  - Node.js: $(node --version)"
echo "  - npm: $(npm --version)"
echo "  - PM2: $(pm2 --version)"
echo "  - NGINX: $(nginx -v 2>&1 | grep -o 'nginx/[0-9.]*')"
echo "  - Certbot: $(certbot --version 2>&1 | head -n 1)"
echo "  - PostgreSQL: $(dpkg -l | grep postgresql | wc -l) packages"
echo "  - Firewall: $(ufw status | grep Status | awk '{print $2}')"
echo "  - App Directory: $APP_DIR"
echo "  - Deploy User: $DEPLOY_USER"
echo ""
