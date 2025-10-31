# YoForex Deployment Guide

Complete deployment guide for YoForex platform covering Replit Autoscale, AWS EC2/VPS, and Docker deployments.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Replit Autoscale Deployment](#replit-autoscale-deployment)
3. [AWS EC2/VPS Deployment](#aws-ecvps-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Environment Variables](#environment-variables)
6. [SSL/DNS Configuration](#ssldns-configuration)
7. [Production Checklist](#production-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Deployment Options

| Method | Best For | Difficulty | Time |
|--------|----------|------------|------|
| **Replit Autoscale** | Simple deployment, auto-scaling | Easy | 5 min |
| **AWS EC2/VPS** | Full control, custom setup | Medium | 30 min |
| **Docker** | Containerized deployment | Medium | 15 min |

---

## Replit Autoscale Deployment

### Prerequisites

- Replit account
- Database (automatically created)
- Custom domain (optional)

### Step 1: Configure Environment Variables

Add these secrets in Replit Secrets panel (🔒 icon):

```bash
# Required
BASE_URL=https://your-app.repl.co
NEXT_PUBLIC_BASE_URL=https://your-app.repl.co
DATABASE_URL=postgresql://... # Auto-created by Replit
SESSION_SECRET=your_secret_here

# Optional (for full features)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=your_email@domain.com
SMTP_PASSWORD=your_smtp_password
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

### Step 2: Deploy

1. Click **"Deploy"** button in Replit workspace
2. Select **"Autoscale Deployment"**
3. Configure deployment settings:
   - **Build command:** `npm run build`
   - **Run command:** `npm run start`
   - **Port:** 5000
4. Click **"Deploy"**

### Step 3: Post-Deployment

1. Update `BASE_URL` with your actual deployment URL
2. Run database migrations (if needed):
   ```bash
   npm run db:push
   ```
3. Verify deployment:
   ```bash
   curl https://your-app.repl.co/api/health
   ```

### Custom Domain Setup

1. Go to deployment settings
2. Click **"Custom Domain"**
3. Add your domain (e.g., `yoforex.com`)
4. Update DNS records as instructed
5. Update environment variables with new domain

---

## AWS EC2/VPS Deployment

### Prerequisites

- AWS EC2 instance (t3.medium minimum)
- Ubuntu 22.04 or 24.04 LTS
- Elastic IP address
- Security Group (ports 22, 80, 443 open)
- Domain name pointing to server

### Step 1: Launch EC2 Instance

1. **Create Instance:**
   - AMI: Ubuntu Server 22.04 LTS
   - Instance type: t3.medium (2 vCPU, 4 GB RAM)
   - Storage: 30 GB GP3 SSD
   - Security Group:
     - SSH (22): Your IP
     - HTTP (80): 0.0.0.0/0
     - HTTPS (443): 0.0.0.0/0

2. **Allocate Elastic IP:**
   - EC2 Console → Elastic IPs → Allocate
   - Associate with your instance

3. **Connect to Server:**
   ```bash
   ssh -i your-key.pem ubuntu@your-elastic-ip
   ```

### Step 2: Run One-Command Deployment

```bash
# Download and execute deployment script
curl -sSL https://raw.githubusercontent.com/your-repo/yoforex/main/deploy/master-deploy.sh | sudo bash -s -- --domain your-domain.com --email your-email@domain.com
```

**This script will:**
- ✅ Install Node.js 20, PostgreSQL 15, Nginx, PM2
- ✅ Configure firewall (UFW)
- ✅ Set up SSL certificates (Let's Encrypt)
- ✅ Clone repository and install dependencies
- ✅ Build application
- ✅ Configure PM2 processes
- ✅ Set up automatic backups
- ✅ Start application

### Step 3: Manual Setup (Alternative)

If you prefer manual setup:

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install PostgreSQL 15
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo tee /etc/apt/trusted.gpg.d/pgdg.asc
sudo apt update
sudo apt install -y postgresql-15

# 4. Install PM2 and Nginx
sudo npm install -g pm2
sudo apt install -y nginx

# 5. Clone repository
cd /var/www
sudo git clone https://github.com/your-repo/yoforex.git
cd yoforex

# 6. Install dependencies and build
npm install
npm run build

# 7. Configure environment
sudo nano .env.production
# Add your environment variables

# 8. Setup database
npm run db:push

# 9. Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 10. Configure Nginx (see SSL/DNS Configuration section)
```

### Step 4: Verify Deployment

```bash
# Check PM2 processes
pm2 status

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check application
curl http://localhost:5000/api/health

# Check logs
pm2 logs
```

---

## Docker Deployment

### Development with Docker Compose

1. **Create `docker-compose.yml`:**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "5000:5000"
         - "3001:3001"
       environment:
         - NODE_ENV=development
         - DATABASE_URL=postgresql://postgres:password@db:5432/yoforex
       depends_on:
         - db
       volumes:
         - .:/app
         - /app/node_modules

     db:
       image: postgres:15
       environment:
         - POSTGRES_PASSWORD=password
         - POSTGRES_DB=yoforex
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data

   volumes:
     postgres_data:
   ```

2. **Start Development:**
   ```bash
   docker-compose up -d
   ```

3. **Access:**
   - Frontend: http://localhost:5000
   - API: http://localhost:3001

### Production with Docker

1. **Build Image:**
   ```bash
   docker build -t yoforex:latest .
   ```

2. **Run Container:**
   ```bash
   docker run -d \
     --name yoforex \
     -p 5000:5000 \
     -p 3001:3001 \
     -e DATABASE_URL=your_db_url \
     -e SESSION_SECRET=your_secret \
     yoforex:latest
   ```

3. **Use Docker Compose for Production:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

---

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/database?sslmode=require

# Security
SESSION_SECRET=generate_with_openssl_rand_base64_32
JWT_SECRET=generate_with_openssl_rand_base64_32

# URLs
BASE_URL=https://your-domain.com
NEXT_PUBLIC_BASE_URL=https://your-domain.com
EXPRESS_URL=http://127.0.0.1:3001
```

### Optional Variables

```bash
# Email (SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=your_email@domain.com
SMTP_PASSWORD=your_smtp_password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=YoForex

# Firebase (Google OAuth)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Analytics
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Features
ENABLE_BACKGROUND_JOBS=true
NODE_ENV=production
PORT=5000
API_PORT=3001
```

### Generate Secrets

```bash
# Session secret
openssl rand -base64 32

# JWT secret
openssl rand -base64 32
```

---

## SSL/DNS Configuration

### Nginx Configuration

Create `/etc/nginx/sites-available/yoforex`:

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS - Main configuration
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Next.js frontend
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Express API
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal (runs twice daily)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

### DNS Configuration

Add these DNS records at your domain registrar:

```
Type    Name    Value                   TTL
A       @       your-elastic-ip         300
A       www     your-elastic-ip         300
CNAME   api     your-domain.com         300
```

---

## Production Checklist

### Pre-Deployment

- [ ] Set `NODE_ENV=production`
- [ ] Configure `DATABASE_URL` with production database
- [ ] Set strong `SESSION_SECRET` (32+ characters)
- [ ] Configure SMTP for email notifications
- [ ] Set up Google OAuth credentials
- [ ] Configure analytics (GTM, GA4)
- [ ] Verify all environment variables
- [ ] Test database connection

### Build & Deploy

- [ ] Run production build: `npm run build`
- [ ] No TypeScript errors
- [ ] No build warnings
- [ ] Push database schema: `npm run db:push`
- [ ] Start production servers
- [ ] Verify PM2 processes running
- [ ] Verify Nginx configuration

### Post-Deployment

- [ ] Homepage loads correctly
- [ ] API endpoints responding (200 OK)
- [ ] Authentication working
- [ ] Database connections stable
- [ ] SSL certificate valid
- [ ] No console errors
- [ ] Analytics tracking active
- [ ] Email system functional

### Performance

- [ ] Page load time < 2s
- [ ] API response time < 200ms
- [ ] Memory usage < 512MB
- [ ] CPU usage < 50%
- [ ] No memory leaks

### Security

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] XSS protection enabled
- [ ] SQL injection protection verified
- [ ] Session security configured

---

## Troubleshooting

### Application Won't Start

**Check PM2 logs:**
```bash
pm2 logs
pm2 status
```

**Common issues:**
- Missing environment variables
- Database connection failed
- Port already in use

**Solutions:**
```bash
# Check environment
cat .env.production

# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check port usage
sudo lsof -i :5000
sudo lsof -i :3001

# Restart services
pm2 restart all
```

### 502 Bad Gateway

**Cause:** Nginx can't connect to application

**Check:**
```bash
# Application running?
pm2 status

# Nginx running?
sudo systemctl status nginx

# Test Nginx config
sudo nginx -t
```

**Fix:**
```bash
# Restart application
pm2 restart all

# Restart Nginx
sudo systemctl restart nginx
```

### Database Connection Errors

**Check PostgreSQL:**
```bash
sudo systemctl status postgresql

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

**Fix connection issues:**
```bash
# Restart PostgreSQL
sudo systemctl restart postgresql

# Check pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Ensure: local all all md5
```

### SSL Certificate Issues

**Renew certificate:**
```bash
sudo certbot renew --nginx

# Force renewal
sudo certbot renew --force-renewal

# Check expiration
sudo certbot certificates
```

### High Memory Usage

**Monitor:**
```bash
pm2 monit
htop
free -h
```

**Reduce memory:**
```bash
# Scale down PM2 instances
pm2 scale yoforex-nextjs 1
pm2 scale yoforex-express 1

# Clear caches
pm2 flush
sync && sudo sh -c "echo 3 > /proc/sys/vm/drop_caches"
```

### Performance Issues

**Check metrics:**
```bash
# Application metrics
pm2 monit

# System resources
htop
iotop
nethogs

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

**Optimize:**
```bash
# Enable Nginx caching
# Enable gzip compression
# Use CDN for static assets
# Optimize database queries
# Enable database connection pooling
```

---

## Backup & Restore

### Automatic Backups

Set up daily backups:

```bash
# Create backup script
sudo nano /usr/local/bin/backup-yoforex

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/yoforex"
mkdir -p $BACKUP_DIR

# Backup database
pg_dump $DATABASE_URL > $BACKUP_DIR/db_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/yoforex

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

# Make executable
sudo chmod +x /usr/local/bin/backup-yoforex

# Add to cron (daily at 3 AM)
sudo crontab -e
0 3 * * * /usr/local/bin/backup-yoforex
```

### Manual Backup

```bash
# Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Backup files
tar -czf backup_$(date +%Y%m%d).tar.gz /var/www/yoforex
```

### Restore

```bash
# Restore database
psql $DATABASE_URL < backup_20250101.sql

# Restore files
tar -xzf backup_20250101.tar.gz -C /
```

---

## Monitoring

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process status
pm2 status

# Logs
pm2 logs
pm2 logs yoforex-nextjs
pm2 logs yoforex-express

# Web dashboard (port 9615)
pm2 web
```

### System Monitoring

```bash
# Resource usage
htop
top

# Disk usage
df -h
du -sh /var/www/yoforex

# Network
nethogs
iftop
```

### Health Checks

```bash
# Application health
curl http://localhost:5000/
curl http://localhost:3001/api/health

# Database health
psql $DATABASE_URL -c "SELECT 1"

# Nginx status
curl http://localhost/nginx_status
```

---

## Support

- **Documentation**: This file
- **Scripts**: `/deploy` directory
- **Logs**: `pm2 logs`, `/var/log/nginx/`
- **Health Check**: `/api/health`

---

**Deployment complete!** Your YoForex platform should now be live and accessible.
