# YoForex VPS Deployment Guide

Complete guide for deploying YoForex platform to a production VPS with NGINX, PM2, and PostgreSQL.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [VPS Initial Setup](#vps-initial-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [SSL Certificate Setup](#ssl-certificate-setup)
7. [NGINX Configuration](#nginx-configuration)
8. [Application Deployment](#application-deployment)
9. [PM2 Process Management](#pm2-process-management)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)
12. [Scaling](#scaling)
13. [Security Best Practices](#security-best-practices)

---

## Prerequisites

### Required Resources

- **VPS Specifications** (minimum):
  - 2 CPU cores
  - 4 GB RAM
  - 40 GB SSD storage
  - Ubuntu 22.04 LTS or later
  - Root or sudo access

- **Domain Name**:
  - Registered domain (e.g., `yoforex.com`)
  - DNS configured to point to your VPS IP address
  - Both A records: `@` and `www`

- **External Services**:
  - PostgreSQL database (Neon, AWS RDS, or local)
  - Stripe account (for payments)
  - Brevo/SendinBlue account (for emails)
  - Replit account (for OAuth)

- **Local Development**:
  - Git repository with YoForex code
  - SSH key for passwordless deployment (recommended)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    NGINX (Port 80/443)                       │
│  - SSL Termination                                           │
│  - Rate Limiting                                             │
│  - Compression                                               │
│  - Static Asset Caching                                      │
└─────────────┬──────────────────┬────────────────────────────┘
              │                  │
              │ /api/*           │ /* (everything else)
              ▼                  ▼
┌─────────────────────┐  ┌─────────────────────┐
│  Express API        │  │  Next.js Frontend   │
│  (Port 3001)        │  │  (Port 3000)        │
│  - Authentication   │  │  - SSR Pages        │
│  - API Endpoints    │  │  - Static Assets    │
│  - Database Queries │  │  - Image Optimization│
└─────────┬───────────┘  └───────────┬─────────┘
          │                          │
          │        PM2 Manager       │
          │   (Process Management)   │
          └──────────┬───────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  PostgreSQL Database  │
          │  (Neon / AWS RDS)    │
          └──────────────────────┘
```

### Key Components

1. **NGINX**: Reverse proxy, SSL termination, load balancing
2. **Next.js (Port 3000)**: Frontend application with SSR/SSG
3. **Express (Port 3001)**: Backend API for authentication and data
4. **PM2**: Process manager for zero-downtime deployments
5. **PostgreSQL**: Primary database for all data storage

---

## VPS Initial Setup

### Step 1: Access Your VPS

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Or with key-based authentication
ssh -i ~/.ssh/your-key.pem root@your-vps-ip
```

### Step 2: Run Automated Setup Script

```bash
# Download the setup script
wget https://raw.githubusercontent.com/yourusername/yoforex/main/scripts/setup-vps.sh

# Or clone the repository
git clone https://github.com/yourusername/yoforex.git
cd yoforex

# Run the setup script
sudo bash scripts/setup-vps.sh
```

This script will:
- Update system packages
- Install Node.js 20
- Install NGINX
- Install PM2
- Install Certbot (Let's Encrypt)
- Configure firewall (UFW)
- Create deployment user
- Optionally install PostgreSQL

**Script Duration**: 5-10 minutes

### Step 3: Manual Setup (Alternative)

If you prefer manual setup or the script fails:

#### Install Node.js 20

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -

# Install Node.js and npm
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be v20.x.x
npm --version   # Should be 10.x.x
```

#### Install PM2

```bash
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command it outputs
```

#### Install NGINX

```bash
sudo apt-get update
sudo apt-get install -y nginx

sudo systemctl enable nginx
sudo systemctl start nginx
```

#### Install Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

#### Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Environment Configuration

### Step 1: Create Deployment User

```bash
# Create deployer user
sudo useradd -m -s /bin/bash deployer
sudo usermod -aG sudo deployer

# Set password
sudo passwd deployer

# Setup SSH key
sudo mkdir -p /home/deployer/.ssh
sudo chmod 700 /home/deployer/.ssh

# Add your public SSH key
sudo nano /home/deployer/.ssh/authorized_keys
# Paste your SSH public key, save and exit

sudo chmod 600 /home/deployer/.ssh/authorized_keys
sudo chown -R deployer:deployer /home/deployer/.ssh
```

### Step 2: Clone Repository

```bash
# Switch to deployer user
su - deployer

# Create application directory
sudo mkdir -p /var/www/yoforex
sudo chown deployer:deployer /var/www/yoforex

# Clone repository
cd /var/www/yoforex
git clone https://github.com/yourusername/yoforex.git .
```

### Step 3: Configure Environment Variables

```bash
# Copy environment template
cp .env.production.example .env.production

# Edit environment file
nano .env.production
```

**Required Variables**:

```bash
# Node Environment
NODE_ENV=production

# Server Ports
PORT=3000
API_PORT=3001

# Public URLs
NEXT_PUBLIC_SITE_URL=https://yoforex.com
EXPRESS_URL=http://127.0.0.1:3001
ALLOWED_ORIGINS=yoforex.com,www.yoforex.com

# Database
DATABASE_URL=postgresql://username:password@your-db-host:5432/yoforex?sslmode=require

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your-super-secret-session-key-here

# Replit Auth
REPLIT_CLIENT_ID=your-replit-client-id
REPLIT_CLIENT_SECRET=your-replit-client-secret

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Brevo Email
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxx
BREVO_SENDER_EMAIL=noreply@yoforex.com
BREVO_SENDER_NAME=YoForex
```

**Security Note**: Ensure `.env.production` has restricted permissions:

```bash
chmod 600 .env.production
```

### ⚠️ CRITICAL: Required Environment Variables

**DEPLOYMENT WILL FAIL WITHOUT THESE VARIABLES**

The following environment variables are **MANDATORY** in production. The application has been configured to fail fast with clear error messages if these are missing, preventing silent failures.

#### Critical Variables (Application will NOT start without these)

1. **EXPRESS_URL** (CRITICAL - Server-side API communication)
   - **Purpose**: Internal URL for Next.js → Express API communication
   - **Required**: YES - Application throws error on startup if missing in production
   - **VPS Value**: `http://127.0.0.1:3001` (internal localhost)
   - **Example**: `EXPRESS_URL=http://127.0.0.1:3001`
   - **Error if missing**: `🚨 CRITICAL: EXPRESS_URL environment variable is required in production`

2. **NEXT_PUBLIC_SITE_URL** (CRITICAL - SEO and metadata)
   - **Purpose**: Public-facing domain for SEO, canonical URLs, Open Graph tags
   - **Required**: YES - Application throws error on startup if missing in production
   - **Value**: Your domain (e.g., `https://yoforex.com`)
   - **Example**: `NEXT_PUBLIC_SITE_URL=https://yoforex.com`
   - **Error if missing**: `🚨 CRITICAL: NEXT_PUBLIC_SITE_URL is required in production`

3. **DATABASE_URL** (CRITICAL - Data persistence)
   - **Purpose**: PostgreSQL connection string
   - **Required**: YES - Application cannot function without database
   - **Format**: `postgresql://user:password@host:port/database?sslmode=require`
   - **Example**: `DATABASE_URL=postgresql://user:pass@db.example.com:5432/yoforex?sslmode=require`

4. **SESSION_SECRET** (CRITICAL - Security)
   - **Purpose**: Session encryption and authentication security
   - **Required**: YES - Sessions will not work without this
   - **Generate**: `openssl rand -base64 32`
   - **Example**: `SESSION_SECRET=your-super-secret-random-string-here`

#### Important Variables (Application may start but features will be broken)

- **REPLIT_CLIENT_ID** & **REPLIT_CLIENT_SECRET**: Required for user authentication
- **STRIPE_SECRET_KEY** & **STRIPE_PUBLIC_KEY**: Required for payment processing
- **BREVO_API_KEY**: Required for email notifications

### Development vs Production Behavior

The application has different behavior in development versus production to balance developer convenience with production safety:

#### Development Mode (`NODE_ENV=development`)

- **Fallback Behavior**: Uses `http://127.0.0.1:3001` if `EXPRESS_URL` not set
- **Console Warnings**: Displays warnings like "⚠️ EXPRESS_URL not set, using development fallback"
- **Flexible Configuration**: Missing variables trigger warnings but allow the app to continue
- **Purpose**: Enables quick local development without requiring full environment setup
- **When to use**: Local development, testing, debugging

**Example development behavior**:
```
⚠️  EXPRESS_URL not set, using development fallback: http://127.0.0.1:3001
⚠️  NEXT_PUBLIC_SITE_URL not set, using development fallback: http://localhost:3000
```

#### Production Mode (`NODE_ENV=production`)

- **No Fallbacks**: Application will **NOT** start without required environment variables
- **Fail Fast**: Throws clear, actionable errors immediately on startup
- **No Silent Failures**: Missing variables cause immediate crash with helpful error messages
- **Purpose**: Prevents deployment issues, configuration mistakes, and runtime failures on VPS
- **When to use**: VPS deployment, production servers, staging environments

**Example production behavior**:
```
🚨 CRITICAL: EXPRESS_URL environment variable is required in production.
Please set it in your .env.production file.
Example: EXPRESS_URL=http://127.0.0.1:3001
For VPS deployment, see: VPS_DEPLOYMENT_GUIDE.md
```

#### Why This Design?

This two-mode approach provides:
- **Developer Productivity**: Developers can run the app locally without complex setup
- **Production Safety**: Deployments fail fast with clear errors instead of running with wrong configuration
- **Debugging Clarity**: Console warnings in dev help identify missing configuration
- **Deployment Confidence**: Production refuses to start unless fully configured

#### Fallback Consistency

All fallback URLs use `127.0.0.1` instead of `localhost` for consistency:
- **next.config.js**: `http://127.0.0.1:3001` (development fallback)
- **api-config.ts**: `http://127.0.0.1:3001` (development fallback)
- **Reason**: `127.0.0.1` is more explicit and avoids potential IPv6 issues with `localhost`

### Troubleshooting Missing Environment Variables

#### Error: "EXPRESS_URL environment variable is required in production"

**Cause**: EXPRESS_URL is not set in `.env.production`

**Solution**:
```bash
cd /var/www/yoforex
nano .env.production

# Add this line:
EXPRESS_URL=http://127.0.0.1:3001

# Save and restart
pm2 restart all
```

#### Error: "NEXT_PUBLIC_SITE_URL is required in production"

**Cause**: NEXT_PUBLIC_SITE_URL is not set in `.env.production`

**Solution**:
```bash
cd /var/www/yoforex
nano .env.production

# Add this line (replace with your actual domain):
NEXT_PUBLIC_SITE_URL=https://yoforex.com

# Save and restart
pm2 restart all
```

#### Application starts but shows "Cannot connect to API" errors

**Cause**: EXPRESS_URL is set incorrectly or Express server is not running

**Solution**:
```bash
# Check if Express is running
pm2 list

# If Express is not running
pm2 start ecosystem.config.js --only yoforex-express

# Verify EXPRESS_URL is correct
cat .env.production | grep EXPRESS_URL

# For VPS, it should be:
# EXPRESS_URL=http://127.0.0.1:3001

# Restart both services
pm2 restart all
```

#### Next.js build fails during deployment

**Cause**: Missing NEXT_PUBLIC_SITE_URL during build process

**Solution**:
```bash
# Ensure .env.production exists and is readable
ls -la .env.production
chmod 600 .env.production

# Verify NEXT_PUBLIC_SITE_URL is set
cat .env.production | grep NEXT_PUBLIC_SITE_URL

# If missing, add it:
echo "NEXT_PUBLIC_SITE_URL=https://yoforex.com" >> .env.production

# Rebuild
npm run build:next
```

### Quick Validation Checklist

Before deploying, verify your `.env.production` file:

```bash
# Run this command to check critical variables
cd /var/www/yoforex

# Check all critical variables are present
grep -E "(EXPRESS_URL|NEXT_PUBLIC_SITE_URL|DATABASE_URL|SESSION_SECRET)" .env.production

# Expected output (with your actual values):
# EXPRESS_URL=http://127.0.0.1:3001
# NEXT_PUBLIC_SITE_URL=https://yoforex.com
# DATABASE_URL=postgresql://...
# SESSION_SECRET=...
```

If any of these lines are missing or empty, **deployment will fail**.

---

## Database Setup

### Option 1: External PostgreSQL (Recommended)

Use a managed PostgreSQL service:

- **Neon**: https://neon.tech (Recommended - serverless PostgreSQL)
- **AWS RDS**: https://aws.amazon.com/rds/
- **DigitalOcean Managed Databases**: https://www.digitalocean.com/products/managed-databases

**Steps**:
1. Create database instance
2. Note connection string
3. Add to `.env.production` as `DATABASE_URL`

### Option 2: Local PostgreSQL

If you installed PostgreSQL locally during VPS setup:

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE yoforex;
CREATE USER yoforex_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE yoforex TO yoforex_user;
\q

# Update .env.production
DATABASE_URL=postgresql://yoforex_user:secure_password_here@localhost:5432/yoforex
```

### Initialize Database Schema

```bash
cd /var/www/yoforex

# Push schema to database
npm run db:push
```

---

## SSL Certificate Setup

### Automatic SSL with Certbot (Recommended)

```bash
# Obtain SSL certificate for your domain
sudo certbot --nginx -d yoforex.com -d www.yoforex.com

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect option (2 - redirect HTTP to HTTPS)
```

**Certificate Auto-Renewal**:

Certbot automatically sets up a cron job for renewal. Verify:

```bash
sudo systemctl status certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

### Manual SSL Certificate

If using a custom certificate:

```bash
# Copy certificate files
sudo cp fullchain.pem /etc/ssl/certs/yoforex.com.crt
sudo cp privkey.pem /etc/ssl/private/yoforex.com.key

# Update NGINX config paths accordingly
```

---

## NGINX Configuration

### Step 1: Deploy NGINX Config

```bash
# Copy NGINX configuration
sudo cp /var/www/yoforex/nginx/yoforex.conf /etc/nginx/sites-available/yoforex.conf

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/yoforex.conf /etc/nginx/sites-enabled/yoforex.conf

# Remove default config
sudo rm /etc/nginx/sites-enabled/default
```

### Step 2: Update Domain in Config

Edit the NGINX config if your domain differs:

```bash
sudo nano /etc/nginx/sites-available/yoforex.conf

# Update server_name directives:
server_name yoforex.com www.yoforex.com;

# Update SSL certificate paths if needed:
ssl_certificate /etc/letsencrypt/live/yoforex.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yoforex.com/privkey.pem;
```

### Step 3: Test and Reload NGINX

```bash
# Test configuration
sudo nginx -t

# If test passes, reload NGINX
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

### NGINX Logs

```bash
# Access log
sudo tail -f /var/log/nginx/yoforex_access.log

# Error log
sudo tail -f /var/log/nginx/yoforex_error.log
```

---

## Application Deployment

### Step 1: Install Dependencies

```bash
cd /var/www/yoforex

# Install production dependencies
npm ci --production
```

### Step 2: Build Application

```bash
# Build Express backend
npm run build

# Build Next.js frontend
npm run build:next
```

### Step 3: Update PM2 Config

Edit `ecosystem.config.js` if needed:

```bash
nano ecosystem.config.js

# Update working directory
cwd: '/var/www/yoforex',

# Update environment variables if needed
```

### Step 4: Start PM2 Processes

```bash
# Start PM2 processes
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs
```

### Step 5: Verify Deployment

```bash
# Check PM2 status
pm2 list

# View logs
pm2 logs

# Run health check
bash scripts/health-check.sh

# Test application
curl https://yoforex.com
```

---

## PM2 Process Management

### Basic Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs
pm2 logs yoforex-nextjs
pm2 logs yoforex-express

# Monitor processes
pm2 monit

# Restart processes
pm2 restart yoforex-nextjs
pm2 restart yoforex-express
pm2 restart all

# Reload (zero-downtime)
pm2 reload yoforex-nextjs
pm2 reload all

# Stop processes
pm2 stop yoforex-nextjs
pm2 stop all

# Delete processes
pm2 delete yoforex-nextjs
pm2 delete all

# Save configuration
pm2 save

# Resurrect saved processes
pm2 resurrect
```

### npm Scripts

For convenience, use npm scripts defined in `package.json`:

```bash
# Start PM2 processes
npm run pm2:start

# Stop processes
npm run pm2:stop

# Restart processes
npm run pm2:restart

# Reload (zero-downtime)
npm run pm2:reload

# View logs
npm run pm2:logs

# Monitor processes
npm run pm2:monit
```

### PM2 Logs

```bash
# View all logs
pm2 logs

# View specific app logs
pm2 logs yoforex-nextjs
pm2 logs yoforex-express

# Flush logs
pm2 flush

# Log file locations (configured in ecosystem.config.js)
/var/log/pm2/yoforex-nextjs-error.log
/var/log/pm2/yoforex-nextjs-out.log
/var/log/pm2/yoforex-express-error.log
/var/log/pm2/yoforex-express-out.log
```

---

## Monitoring & Maintenance

### Health Checks

Run automated health checks:

```bash
cd /var/www/yoforex
bash scripts/health-check.sh
```

Setup cron job for automated health checks:

```bash
crontab -e

# Add this line (runs every 15 minutes)
*/15 * * * * /var/www/yoforex/scripts/health-check.sh >> /var/log/health-check.log 2>&1
```

### Monitoring Resources

```bash
# System resources
htop

# Disk usage
df -h

# Memory usage
free -h

# PM2 monitoring
pm2 monit

# NGINX status
sudo systemctl status nginx
```

### Log Rotation

Configure log rotation for PM2 logs:

```bash
# Install PM2 log rotate module
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

---

## Troubleshooting

### Common Issues

#### 1. 502 Bad Gateway

**Symptoms**: NGINX shows 502 error

**Causes**:
- Next.js or Express not running
- Wrong port configuration
- Firewall blocking internal communication

**Solutions**:

```bash
# Check PM2 processes
pm2 list

# Check if ports are listening
sudo netstat -tlnp | grep -E '3000|3001'

# Restart PM2 processes
pm2 restart all

# Check NGINX logs
sudo tail -f /var/log/nginx/yoforex_error.log

# Check application logs
pm2 logs
```

#### 2. Cannot Connect to Database

**Symptoms**: API endpoints return 500 errors

**Solutions**:

```bash
# Verify DATABASE_URL in .env.production
cat .env.production | grep DATABASE_URL

# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check PM2 logs for database errors
pm2 logs yoforex-express | grep -i database
```

#### 3. SSL Certificate Issues

**Symptoms**: Browser shows SSL warning

**Solutions**:

```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check NGINX SSL configuration
sudo nginx -t
```

#### 4. High Memory Usage

**Symptoms**: PM2 processes consuming too much RAM

**Solutions**:

```bash
# Check PM2 memory usage
pm2 list

# Reduce PM2 instances in ecosystem.config.js
# Change: instances: 2
# To: instances: 1

# Restart PM2
pm2 reload ecosystem.config.js

# Or set memory limits
# Already configured in ecosystem.config.js:
# max_memory_restart: '500M'
```

#### 5. Next.js Build Failures

**Symptoms**: `npm run build:next` fails

**Solutions**:

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Build again
npm run build:next

# Check Node.js version
node --version  # Should be v20.x.x
```

### Debug Mode

Enable verbose logging:

```bash
# In .env.production
LOG_LEVEL=debug

# Restart processes
pm2 restart all

# View detailed logs
pm2 logs
```

---

## Scaling

### Horizontal Scaling (Multiple Servers)

#### Load Balancer Setup

Add multiple VPS servers behind a load balancer:

```nginx
# NGINX load balancer configuration
upstream nextjs_cluster {
    least_conn;
    server 192.168.1.10:3000 max_fails=3 fail_timeout=30s;
    server 192.168.1.11:3000 max_fails=3 fail_timeout=30s;
    server 192.168.1.12:3000 max_fails=3 fail_timeout=30s;
}

upstream express_cluster {
    least_conn;
    server 192.168.1.10:3001 max_fails=3 fail_timeout=30s;
    server 192.168.1.11:3001 max_fails=3 fail_timeout=30s;
    server 192.168.1.12:3001 max_fails=3 fail_timeout=30s;
}
```

### Vertical Scaling (Bigger Server)

#### Increase PM2 Instances

Edit `ecosystem.config.js`:

```javascript
instances: 'max',  // Use all available CPU cores
// Or specify a number:
instances: 4,
```

#### Optimize Memory

```javascript
max_memory_restart: '1G',  // Increase memory limit
```

### Database Scaling

#### Read Replicas

For heavy read workloads, add PostgreSQL read replicas:

```javascript
// In server/db.ts
const readPool = new Pool({
  connectionString: process.env.DATABASE_READ_URL,
  max: 20,
});

const writePool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});
```

#### Connection Pooling

Optimize database connections:

```bash
# In .env.production
DATABASE_URL=postgresql://user:pass@host:5432/db?max=20&idle_timeout=30
```

### CDN Integration

Use a CDN for static assets:

1. **Cloudflare**: Free tier includes CDN
2. **AWS CloudFront**: Paid CDN service
3. **Vercel Edge Network**: For Next.js static assets

---

## Security Best Practices

### 1. Firewall Configuration

```bash
# Only allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw default deny incoming
sudo ufw enable
```

### 2. SSH Hardening

Edit `/etc/ssh/sshd_config`:

```bash
# Disable root login
PermitRootLogin no

# Use SSH keys only
PasswordAuthentication no

# Change default port (optional)
Port 2222

# Restart SSH
sudo systemctl restart sshd
```

### 3. Fail2Ban

Protect against brute-force attacks:

```bash
# Install Fail2Ban
sudo apt-get install fail2ban

# Configure NGINX jail
sudo nano /etc/fail2ban/jail.local

# Add:
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/yoforex_error.log

# Restart Fail2Ban
sudo systemctl restart fail2ban
```

### 4. Environment Variables

Never commit `.env.production` to Git:

```bash
# Add to .gitignore
echo ".env.production" >> .gitignore

# Set restrictive permissions
chmod 600 .env.production
```

### 5. Regular Updates

```bash
# System updates
sudo apt-get update && sudo apt-get upgrade -y

# Node.js security updates
npm audit fix

# Renew SSL certificates (automatic with Certbot)
sudo certbot renew
```

### 6. Database Security

```bash
# Use strong passwords
# Enable SSL connections
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Restrict network access
# Only allow connections from application server IP
```

### 7. Rate Limiting

NGINX rate limiting is already configured in `nginx/yoforex.conf`:

- General API: 30 requests/second
- Authentication: 5 requests/second
- Per-IP connection limit: 10 concurrent connections

### 8. Security Headers

Already configured in NGINX:
- Strict-Transport-Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- Content-Security-Policy
- Referrer-Policy

---

## Continuous Deployment

### Automated Deployment Script

Use the provided deployment script:

```bash
cd /var/www/yoforex
bash scripts/deploy.sh
```

This script:
1. Creates backup
2. Pulls latest code
3. Installs dependencies
4. Builds application
5. Runs migrations
6. Restarts PM2 (zero-downtime)
7. Runs health checks
8. Rolls back on failure

### CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: deployer
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/yoforex
            bash scripts/deploy.sh
```

---

## Backup & Recovery

### Database Backups

```bash
# Create backup script
nano /home/deployer/backup-db.sh

#!/bin/bash
pg_dump $DATABASE_URL > /var/backups/yoforex-db-$(date +%Y%m%d_%H%M%S).sql

# Make executable
chmod +x /home/deployer/backup-db.sh

# Setup cron job (daily at 2 AM)
crontab -e
0 2 * * * /home/deployer/backup-db.sh
```

### Application Backups

Already handled by `scripts/deploy.sh` - creates backup before each deployment.

### Recovery

```bash
# Restore database
psql $DATABASE_URL < /var/backups/yoforex-db-20250127_020000.sql

# Restore application
cd /var/backups/yoforex
ls -lt  # Find latest backup
rsync -av backup_20250127_120000/ /var/www/yoforex/
cd /var/www/yoforex
pm2 restart all
```

---

## Support & Resources

### Documentation

- **YoForex Platform Guide**: `/docs/PLATFORM_GUIDE.md`
- **API Reference**: `/docs/API_REFERENCE.md`
- **Architecture**: `/docs/ARCHITECTURE.md`

### External Resources

- **NGINX Docs**: https://nginx.org/en/docs/
- **PM2 Docs**: https://pm2.keymetrics.io/docs/
- **Next.js Docs**: https://nextjs.org/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

### Community

- **GitHub Issues**: https://github.com/yourusername/yoforex/issues
- **Discord**: https://discord.gg/yoforex

---

## Checklist

Use this checklist to ensure complete deployment:

- [ ] VPS provisioned with required specs
- [ ] DNS configured (A records for @ and www)
- [ ] SSH access configured
- [ ] Node.js 20 installed
- [ ] NGINX installed and configured
- [ ] PM2 installed
- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] Firewall (UFW) configured
- [ ] PostgreSQL database created
- [ ] Repository cloned to `/var/www/yoforex`
- [ ] `.env.production` configured with all variables
- [ ] Dependencies installed (`npm ci`)
- [ ] Application built (Express + Next.js)
- [ ] Database schema pushed (`npm run db:push`)
- [ ] PM2 processes started
- [ ] NGINX configuration deployed
- [ ] NGINX reloaded
- [ ] Health check passed
- [ ] Application accessible via HTTPS
- [ ] Monitoring setup (optional)
- [ ] Backup scripts configured (optional)
- [ ] CI/CD pipeline configured (optional)

---

## Quick Reference

### Essential Commands

```bash
# Application
cd /var/www/yoforex
bash scripts/deploy.sh           # Deploy updates
bash scripts/health-check.sh     # Run health checks

# PM2
pm2 list                         # List processes
pm2 logs                         # View logs
pm2 restart all                  # Restart all
pm2 reload all                   # Zero-downtime reload

# NGINX
sudo nginx -t                    # Test config
sudo systemctl reload nginx      # Reload config
sudo tail -f /var/log/nginx/yoforex_error.log

# System
sudo ufw status                  # Firewall status
df -h                            # Disk usage
free -h                          # Memory usage
htop                             # System monitor
```

### Emergency Procedures

**Application Down**:
```bash
pm2 restart all
sudo systemctl restart nginx
bash scripts/health-check.sh
```

**Database Connection Lost**:
```bash
# Check DATABASE_URL
cat .env.production | grep DATABASE_URL
# Restart application
pm2 restart all
```

**Out of Disk Space**:
```bash
# Clean logs
pm2 flush
sudo journalctl --vacuum-time=3d
# Clean build cache
rm -rf .next/cache
```

---

**End of VPS Deployment Guide**

For additional support, consult the documentation or open an issue on GitHub.
