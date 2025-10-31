# YoForex Deployment Guide
**Last Updated:** October 28, 2025  
**Version:** 3.0 - Complete Deployment Guide

---

## Table of Contents
1. [Deployment Options Overview](#deployment-options-overview)
2. [Replit Deployment](#replit-deployment)
3. [VPS Deployment](#vps-deployment)
4. [Environment Variables](#environment-variables)
5. [SSL/HTTPS Setup](#sslhttps-setup)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Deployment Options Overview

YoForex supports two deployment methods:

| Method | Best For | Difficulty | Cost | Time |
|--------|---------|------------|------|------|
| **Replit** | Quick deployment, testing, demos | Easy | $20/month | 5 min |
| **VPS** | Production, full control, scalability | Medium | $5-50/month | 30 min |

### Architecture Overview

```
YoForex uses a hybrid architecture:

┌─────────────────────────────────────┐
│         Next.js Frontend            │
│         (Port 3000)                 │
│  - SSR pages for SEO                │
│  - Static asset serving             │
│  - Client-side interactivity        │
└───────────────┬─────────────────────┘
                │
                │ API Calls
                ▼
┌─────────────────────────────────────┐
│         Express Backend             │
│         (Port 3001/5000)            │
│  - Authentication (Replit OIDC)     │
│  - REST API (60+ endpoints)         │
│  - Database operations              │
│  - Background jobs                  │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│      PostgreSQL Database            │
│      (Neon/Replit/AWS RDS)          │
└─────────────────────────────────────┘
```

---

## Replit Deployment

### Quick Start (5 Minutes)

**Option 1: Import from GitHub (Recommended)**

1. Go to [Replit.com](https://replit.com)
2. Click **"Create Repl"** → **"Import from Git"**
3. Paste repository URL: `https://github.com/yourusername/yoforex`
4. Click "Import"
5. **Wait 30 seconds** - Zero-touch migration handles everything!
6. Done! App is running ✅

**Option 2: Manual Setup**

1. Create new Repl with Node.js template
2. Upload/clone your code
3. Run:
   ```bash
   npm install
   npm run dev
   ```

### Replit Configuration

#### Workflow Configuration (.replit file)

```toml
run = "bash start-nextjs-only.sh"
entrypoint = "server/index.ts"

[deployment]
run = ["bash", "start-production.sh"]
deploymentTarget = "cloudrun"
```

#### Start Script (start-nextjs-only.sh)

```bash
#!/bin/bash

# Run auto-setup if needed
bash scripts/auto-setup.sh

# Start Next.js server
echo "🚀 Starting YoForex (Next.js Architecture)..."
npm run dev:next
```

### Environment Variables (Replit Secrets)

Add these in the Replit Secrets panel:

```bash
# Database (auto-provided by Replit)
DATABASE_URL=postgresql://...

# Authentication
REPLIT_CLIENT_ID=your_client_id
REPLIT_CLIENT_SECRET=your_client_secret
SESSION_SECRET=random_secure_string_here

# URLs
BASE_URL=https://your-repl-name.replit.app
NEXT_PUBLIC_BASE_URL=https://your-repl-name.replit.app
EXPRESS_URL=http://localhost:3001

# Email (optional)
BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=noreply@yourdomain.com
```

### Replit Deployment Steps

1. **Test Locally**
   - Verify app works in Replit workspace
   - Test all features
   - Check for errors

2. **Configure Deployment**
   - Go to "Deploy" tab
   - Set deployment target: **Autoscale**
   - Set run command: `bash start-production.sh`

3. **Deploy**
   - Click "Deploy"
   - Wait 2-5 minutes
   - Get deployment URL

4. **Post-Deployment**
   - Test deployment URL
   - Verify authentication works
   - Check database connection

---

## VPS Deployment

### Prerequisites

- **VPS Specifications** (minimum):
  - 2 CPU cores
  - 4 GB RAM
  - 40 GB SSD
  - Ubuntu 22.04 LTS or later

- **Domain Name** (optional):
  - Registered domain (e.g., `yoforex.com`)
  - DNS A record pointing to VPS IP

- **External Services**:
  - PostgreSQL database (Neon/AWS RDS)
  - Stripe account (payments)
  - Brevo account (emails)
  - Replit account (OAuth)

### Quick VPS Setup (30 Minutes)

#### Step 1: Initial Server Setup

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Run automated setup script
wget https://raw.githubusercontent.com/yourusername/yoforex/main/scripts/setup-vps.sh
chmod +x setup-vps.sh
sudo bash setup-vps.sh
```

This installs:
- ✅ Node.js 20
- ✅ NGINX
- ✅ PM2
- ✅ Certbot (Let's Encrypt)
- ✅ Firewall (UFW)

**Time:** 5-10 minutes

#### Step 2: Clone Repository

```bash
# Create deployer user
sudo useradd -m -s /bin/bash deployer
sudo usermod -aG sudo deployer

# Create app directory
sudo mkdir -p /var/www/yoforex
sudo chown deployer:deployer /var/www/yoforex

# Switch to deployer
su - deployer

# Clone repository
cd /var/www/yoforex
git clone https://github.com/yourusername/yoforex.git .
```

#### Step 3: Install Dependencies

```bash
# Install Node packages
npm install

# Build Next.js
npm run build:next

# Build Express (TypeScript)
npm run build
```

#### Step 4: Configure Environment

```bash
# Create .env file
nano .env
```

Add configuration:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/database

# Authentication
REPLIT_CLIENT_ID=your_client_id
REPLIT_CLIENT_SECRET=your_client_secret
SESSION_SECRET=your_random_secret_here

# URLs
BASE_URL=https://yourdomain.com
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
EXPRESS_URL=http://localhost:3001
NEXT_PUBLIC_EXPRESS_URL=https://yourdomain.com

# Email
BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=noreply@yourdomain.com
```

#### Step 5: Start with PM2

```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command it outputs
```

#### Step 6: Configure NGINX

```bash
# Copy NGINX config
sudo cp nginx/yoforex.conf /etc/nginx/sites-available/yoforex.conf

# Edit with your domain
sudo nano /etc/nginx/sites-available/yoforex.conf
# Replace yoforex.com with your domain

# Enable site
sudo ln -s /etc/nginx/sites-available/yoforex.conf /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart NGINX
sudo systemctl restart nginx
```

#### Step 7: Setup SSL (Let's Encrypt)

```bash
# Install certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

### VPS Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    NGINX (Port 80/443)                       │
│  - SSL Termination (Let's Encrypt)                           │
│  - Rate Limiting (10 req/s general, 30 req/s API)            │
│  - Gzip Compression                                           │
│  - Static Asset Caching (365 days)                           │
│  - Security Headers (HSTS, CSP, etc.)                        │
└─────────────┬──────────────────┬────────────────────────────┘
              │                  │
              │ /api/*           │ /* (all other routes)
              ▼                  ▼
┌─────────────────────┐  ┌─────────────────────┐
│  Express API        │  │  Next.js Frontend   │
│  (Port 3001)        │  │  (Port 3000)        │
│  PM2 Cluster (2)    │  │  PM2 Cluster (2)    │
│  - Authentication   │  │  - SSR Pages        │
│  - API Endpoints    │  │  - Static Assets    │
│  - Database Queries │  │  - Image Optimization│
└─────────┬───────────┘  └───────────┬─────────┘
          │                          │
          │        PM2 Manager       │
          │   (Auto-restart, logs)   │
          └──────────┬───────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  PostgreSQL Database  │
          │  (Neon / AWS RDS)    │
          └──────────────────────┘
```

### PM2 Configuration (ecosystem.config.js)

```javascript
module.exports = {
  apps: [
    {
      name: 'yoforex-nextjs',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      }
    },
    {
      name: 'yoforex-express',
      script: 'dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        API_PORT: 3001,
      }
    }
  ]
};
```

### NGINX Configuration Highlights

```nginx
# Rate Limiting
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Route /api/* to Express
    location /api/ {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://127.0.0.1:3001;
    }

    # Route everything else to Next.js
    location / {
        limit_req zone=general burst=20 nodelay;
        proxy_pass http://127.0.0.1:3000;
    }

    # Static assets caching (365 days)
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Environment Variables

### Required Variables

```bash
# Database (Required)
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication (Required)
REPLIT_CLIENT_ID=your_replit_client_id
REPLIT_CLIENT_SECRET=your_replit_client_secret
SESSION_SECRET=generate_random_string_min_32_chars

# URLs (Required)
BASE_URL=https://yourdomain.com
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
EXPRESS_URL=http://localhost:3001  # Internal
NEXT_PUBLIC_EXPRESS_URL=https://yourdomain.com  # External
```

### Optional Variables

```bash
# Email (Brevo/SendinBlue)
BREVO_API_KEY=your_api_key
BREVO_FROM_EMAIL=noreply@yourdomain.com

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Feature Flags
ENABLE_CRON_JOBS=true
ENABLE_EMAIL=true
```

### Generating Secrets

```bash
# Generate SESSION_SECRET (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SESSION_SECRET (OpenSSL)
openssl rand -hex 32

# Generate SESSION_SECRET (Linux/Mac)
head -c 32 /dev/urandom | base64
```

---

## SSL/HTTPS Setup

### Replit

SSL is automatically provided by Replit:
- Certificate: Automatic (wildcard *.replit.app)
- HTTPS: Enabled by default
- No configuration needed ✅

### VPS with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate (automatic NGINX config)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Verify auto-renewal
sudo certbot renew --dry-run

# Manual renewal (if needed)
sudo certbot renew
```

Certificate auto-renews every 90 days.

---

## Monitoring & Maintenance

### Replit Monitoring

- **Logs**: Available in Replit Console
- **Metrics**: CPU/Memory usage in Resources tab
- **Uptime**: Monitored by Replit (auto-restart on crash)

### VPS Monitoring

#### PM2 Monitoring

```bash
# View process status
pm2 status

# View logs
pm2 logs

# Real-time monitoring
pm2 monit

# Restart processes
pm2 restart all

# Reload (zero-downtime)
pm2 reload all
```

#### NGINX Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/yoforex_access.log

# Error logs
sudo tail -f /var/log/nginx/yoforex_error.log

# Analyze access logs
sudo cat /var/log/nginx/yoforex_access.log | grep "HTTP/1.1\" 500"
```

#### Database Monitoring

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT version();"

# Check database size
psql $DATABASE_URL -c "SELECT pg_database_size(current_database());"

# Active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

#### Health Check Script

```bash
# Run health check
bash scripts/health-check.sh

# Automated monitoring (cron)
crontab -e
# Add: */5 * * * * /var/www/yoforex/scripts/health-check.sh
```

---

## Troubleshooting

### Common Issues

#### "Cannot connect to database"

**Replit:**
```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Verify in Secrets panel
# Re-create database if needed
```

**VPS:**
```bash
# Test connection
psql $DATABASE_URL -c "\dt"

# Check firewall
sudo ufw status

# Allow PostgreSQL port
sudo ufw allow 5432/tcp
```

#### "NGINX 502 Bad Gateway"

```bash
# Check if Next.js is running
curl http://localhost:3000

# Check if Express is running
curl http://localhost:3001/api/stats

# Restart PM2
pm2 restart all

# Check NGINX error logs
sudo tail -f /var/log/nginx/error.log
```

#### "PM2 processes keep crashing"

```bash
# View error logs
pm2 logs --err

# Check memory usage
pm2 status

# Increase memory limit in ecosystem.config.js
# max_memory_restart: '1G'

# Restart processes
pm2 delete all
pm2 start ecosystem.config.js
```

#### "SSL certificate expired"

```bash
# Renew certificate
sudo certbot renew

# Restart NGINX
sudo systemctl restart nginx

# Check certificate expiry
sudo certbot certificates
```

### Deployment Scripts

```bash
# Automated deployment
bash scripts/deploy.sh

# Health check
bash scripts/health-check.sh

# Database backup
npm run db:export

# Database restore
bash scripts/restore-database.sh
```

---

## Performance Optimization

### Replit

- Use **Autoscale deployment** for production
- Enable **Boosted performance** for larger apps
- Optimize database queries with indexes

### VPS

- **NGINX Caching**: Already configured for static assets
- **PM2 Cluster Mode**: 2 instances per service (4 total)
- **Database Connection Pooling**: Configured in Drizzle
- **CDN**: Use Cloudflare for static assets (optional)
- **Monitoring**: Set up alerts for CPU/memory usage

---

## Cost Breakdown

### Replit

| Plan | Cost | Features |
|------|------|----------|
| Free | $0 | Development, testing |
| Core | $20/month | Production, custom domains, boosted |
| Teams | $40/month | Collaboration, priority support |

### VPS

| Component | Provider | Cost/Month |
|-----------|----------|------------|
| **VPS (2GB)** | DigitalOcean | $12 |
| **VPS (4GB)** | Vultr | $18 |
| **Database** | Neon | $0-50 |
| **Domain** | Namecheap | $1 |
| **SSL** | Let's Encrypt | Free |
| **Total** | | **$13-70** |

---

## Quick Reference

### Start Application

**Replit:**
```bash
npm run dev
```

**VPS:**
```bash
pm2 start ecosystem.config.js
pm2 save
```

### Deploy Updates

**Replit:**
```bash
git push origin main
# Auto-deploys on push
```

**VPS:**
```bash
cd /var/www/yoforex
git pull
npm install
npm run build:next
npm run build
pm2 reload all
```

### View Logs

**Replit:**
- Check Replit Console

**VPS:**
```bash
pm2 logs
sudo tail -f /var/log/nginx/yoforex_access.log
```

### Backup Database

**Both:**
```bash
npm run db:export
```

---

**Last Updated:** October 28, 2025  
**Status:** Production-Ready ✅  
**Tested On:** Replit, DigitalOcean, Vultr, AWS
