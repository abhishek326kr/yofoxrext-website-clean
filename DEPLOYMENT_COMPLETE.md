# YoForex Complete Deployment Guide

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [AWS EC2 Setup](#aws-ec2-setup)
4. [One-Command Deployment](#one-command-deployment)
5. [Local Development Setup](#local-development-setup)
6. [Configuration Details](#configuration-details)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)
9. [Backup and Restore](#backup-and-restore)
10. [Monitoring and Maintenance](#monitoring-and-maintenance)
11. [Advanced Configuration](#advanced-configuration)
12. [Support](#support)

---

## 🚀 Quick Start

Deploy YoForex on AWS EC2 with a single command:

```bash
# SSH into your EC2 instance and run:
curl -sSL https://raw.githubusercontent.com/yourusername/yoforex/main/deploy/master-deploy.sh | sudo bash -s -- --domain your-domain.com --email your-email@domain.com
```

---

## 📝 Prerequisites

### AWS Requirements
- AWS Account with EC2 access
- EC2 instance (minimum t3.medium recommended)
- Ubuntu 22.04 or 24.04 LTS
- Elastic IP (for stable public IP)
- Security Group with ports 22, 80, 443 open
- RDS PostgreSQL instance (optional, can use local)
- Route 53 domain (or any domain pointing to your EC2)

### Local Development Requirements
- Node.js 20+
- PostgreSQL 15+
- Git
- VS Code / WebStorm (optional)
- 4GB RAM minimum
- 20GB free disk space

---

## 🖥️ AWS EC2 Setup

### Step 1: Launch EC2 Instance

1. **Login to AWS Console**
   ```
   https://console.aws.amazon.com/ec2/
   ```

2. **Launch Instance**
   - Click "Launch Instance"
   - Choose "Ubuntu Server 22.04 LTS" or "24.04 LTS"
   - Select instance type (t3.medium or better)
   - Configure instance details:
     - Enable "Auto-assign Public IP"
     - Select your VPC and subnet
   - Add storage: 30GB minimum (gp3 recommended)
   - Configure Security Group:
     ```
     SSH (22) - Your IP
     HTTP (80) - Anywhere
     HTTPS (443) - Anywhere
     ```
   - Create or select key pair

3. **Allocate Elastic IP**
   ```bash
   # In AWS Console: EC2 > Elastic IPs > Allocate
   # Associate with your instance
   ```

### Step 2: Initial Server Access

```bash
# Connect to your EC2 instance
ssh -i your-key.pem ubuntu@your-elastic-ip

# Switch to root for deployment
sudo su -
```

### Step 3: Clone Repository (Optional)

```bash
# If you have a private repository
git clone https://github.com/yourusername/yoforex.git /var/www/yoforex
cd /var/www/yoforex
```

---

## 🎯 One-Command Deployment

### Full Deployment (Fresh Server)

```bash
# Navigate to deployment directory
cd /var/www/yoforex

# Make scripts executable
chmod +x deploy/*.sh

# Run master deployment
sudo ./deploy/master-deploy.sh \
  --domain yoforex.com \
  --email admin@yoforex.com \
  --repo https://github.com/yourusername/yoforex.git
```

### Deployment Options

```bash
# Basic deployment (no SSL)
sudo ./deploy/master-deploy.sh --skip-ssl

# Deployment without backup
sudo ./deploy/master-deploy.sh --no-backup

# Rollback to previous deployment
sudo ./deploy/master-deploy.sh --rollback

# Custom domain and email
sudo ./deploy/master-deploy.sh \
  --domain your-domain.com \
  --email your-email@domain.com
```

### What the Script Does

1. ✅ Detects Ubuntu version
2. ✅ Updates system packages
3. ✅ Configures firewall (UFW)
4. ✅ Sets up swap file if needed
5. ✅ Installs Node.js 20, PostgreSQL 15
6. ✅ Installs PM2, Nginx, Redis
7. ✅ Configures SSL with Let's Encrypt
8. ✅ Sets up environment variables
9. ✅ Builds and starts application
10. ✅ Configures automatic backups
11. ✅ Sets up monitoring
12. ✅ Runs health checks

---

## 💻 Local Development Setup

### VS Code Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/yoforex.git
   cd yoforex
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment**
   ```bash
   cp .env.development.example .env.local
   # Edit .env.local with your settings
   ```

4. **Setup Database**
   ```bash
   # Install PostgreSQL locally
   sudo apt install postgresql-15
   
   # Create database
   sudo -u postgres createdb yoforex_dev
   sudo -u postgres createuser yoforex
   
   # Run migrations
   npm run db:push
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

6. **VS Code Extensions**
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - PostgreSQL
   - GitLens

### WebStorm Setup

1. **Open Project**
   - File > Open > Select yoforex directory

2. **Configure Node.js**
   - Settings > Languages & Frameworks > Node.js
   - Select Node 20 interpreter

3. **Configure Database**
   - View > Tool Windows > Database
   - Add PostgreSQL data source

4. **Run Configurations**
   - Add Configuration > npm
   - Script: dev
   - Environment variables: Load from .env.local

---

## ⚙️ Configuration Details

### Environment Variables

#### Production (.env.production)

```bash
# Critical variables
NODE_ENV=production
DOMAIN=yoforex.com
NEXT_PUBLIC_SITE_URL=https://yoforex.com
EXPRESS_URL=http://127.0.0.1:3001
PORT=5000
API_PORT=3001

# Database (AWS RDS)
DATABASE_URL=postgresql://user:pass@rds-endpoint.amazonaws.com:5432/yoforex?sslmode=require

# Security
SESSION_SECRET=generate-with-openssl-rand-base64-32
JWT_SECRET=generate-with-openssl-rand-base64-32

# Email (Brevo/SendInBlue)
BREVO_API_KEY=your-api-key
BREVO_SENDER_EMAIL=noreply@yoforex.com

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_live_xxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxx
```

#### Development (.env.development)

```bash
NODE_ENV=development
PORT=5000
API_PORT=3001
NEXT_PUBLIC_SITE_URL=http://localhost:5000
EXPRESS_URL=http://localhost:3001
DATABASE_URL=postgresql://yoforex:password@localhost:5432/yoforex_dev
SESSION_SECRET=development-secret
```

### Nginx Configuration

Located at: `/etc/nginx/sites-available/yoforex`

Key features:
- Reverse proxy for Next.js (port 5000) and Express (port 3001)
- SSL/TLS with A+ rating
- Gzip compression
- Security headers (HSTS, CSP, X-Frame-Options)
- Rate limiting
- Static asset caching

### PM2 Configuration

Located at: `/var/www/yoforex/ecosystem.config.js`

Features:
- Cluster mode with auto-scaling
- Automatic restarts on failure
- Log rotation
- Memory limits
- Graceful reloads

---

## 🔧 Troubleshooting

### Automatic Troubleshooting

Run the troubleshooting script:

```bash
sudo /var/www/yoforex/deploy/troubleshoot.sh
```

This automatically checks and fixes:
- Port conflicts
- Permission issues
- Database connections
- SSL certificates
- PM2 processes
- Nginx configuration
- Memory/disk issues

### Common Issues and Solutions

#### 1. Next.js Not Starting

```bash
# Check PM2 logs
pm2 logs yoforex-nextjs

# Rebuild application
cd /var/www/yoforex
npm run build
pm2 restart yoforex-nextjs
```

#### 2. Database Connection Failed

```bash
# Check PostgreSQL status
systemctl status postgresql

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Ensure: local all all md5

# Restart PostgreSQL
systemctl restart postgresql
```

#### 3. 502 Bad Gateway

```bash
# Check if services are running
pm2 status
systemctl status nginx

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Restart services
pm2 restart all
systemctl restart nginx
```

#### 4. SSL Certificate Issues

```bash
# Renew certificate
certbot renew --nginx

# Test SSL
openssl s_client -connect your-domain.com:443
```

#### 5. High Memory Usage

```bash
# Check memory
free -h
pm2 monit

# Restart PM2 with lower instances
pm2 scale yoforex-nextjs 1
pm2 scale yoforex-express 1

# Clear caches
sync && echo 3 > /proc/sys/vm/drop_caches
pm2 flush
```

### Viewing Logs

```bash
# PM2 logs
pm2 logs              # All logs
pm2 logs yoforex-nextjs   # Frontend logs
pm2 logs yoforex-express  # API logs

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Application logs
tail -f /var/log/yoforex/*.log

# System logs
journalctl -u nginx
journalctl -u postgresql
```

---

## 🔒 Security Best Practices

### 1. Server Hardening

```bash
# Already configured by setup script:
- UFW firewall enabled
- SSH key-only authentication
- Fail2ban installed
- Automatic security updates
- Kernel hardening via sysctl
```

### 2. Application Security

```bash
# Environment variables
chmod 600 .env.production
chown www-data:www-data .env.production

# SSL/TLS
# A+ rating configuration included
# HSTS enabled
# Perfect forward secrecy
```

### 3. Database Security

```bash
# Use strong passwords
openssl rand -base64 32

# Enable SSL for RDS
# Use connection pooling
# Regular backups
```

### 4. Monitoring

```bash
# Setup monitoring
pm2 install pm2-logrotate
pm2 install pm2-auto-pull

# External monitoring (optional)
# - New Relic
# - Datadog
# - CloudWatch
```

### 5. Regular Updates

```bash
# Update system packages
apt update && apt upgrade

# Update Node packages
npm audit
npm audit fix

# Update PM2
npm install -g pm2@latest
pm2 update
```

---

## 💾 Backup and Restore

### Automatic Backups

The deployment script sets up automatic backups:

```bash
# Backup location
/var/backups/yoforex/

# Backup schedule (cron)
0 3 * * * /usr/local/bin/yoforex-backup
```

### Manual Backup

```bash
# Full backup
sudo /var/www/yoforex/deploy/master-deploy.sh --backup-only

# Database only
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Application files
tar -czf yoforex-backup-$(date +%Y%m%d).tar.gz /var/www/yoforex
```

### Restore from Backup

```bash
# Automatic rollback
sudo /var/www/yoforex/deploy/master-deploy.sh --rollback

# Manual restore database
psql $DATABASE_URL < backup-20240101.sql

# Manual restore files
tar -xzf yoforex-backup-20240101.tar.gz -C /
```

### S3 Backup (Recommended)

```bash
# Install AWS CLI
apt install awscli

# Configure AWS
aws configure

# Backup to S3
aws s3 cp /var/backups/yoforex/ s3://your-backup-bucket/ --recursive

# Restore from S3
aws s3 cp s3://your-backup-bucket/ /var/backups/yoforex/ --recursive
```

---

## 📊 Monitoring and Maintenance

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process list
pm2 status

# Process info
pm2 info yoforex-nextjs
pm2 info yoforex-express

# Reset metrics
pm2 reset all
```

### Health Checks

```bash
# Application health
curl http://localhost:5000/
curl http://localhost:3001/api/health

# Nginx status
curl http://localhost:8080/nginx_status

# Database health
psql $DATABASE_URL -c "SELECT 1"
```

### Performance Monitoring

```bash
# System resources
htop
iotop
nethogs

# PM2 metrics
pm2 web  # Opens web dashboard on port 9615

# Nginx metrics
tail -f /var/log/nginx/access.log | goaccess
```

### Log Management

```bash
# Log rotation configured automatically
# Logs kept for 30 days
# Compressed after 1 day

# View log rotation config
cat /etc/logrotate.d/yoforex

# Manual log rotation
logrotate -f /etc/logrotate.d/yoforex
```

### Maintenance Tasks

#### Weekly
```bash
# Check disk usage
df -h

# Check for security updates
apt list --upgradable

# Review error logs
grep ERROR /var/log/yoforex/*.log | tail -20
```

#### Monthly
```bash
# Update dependencies
npm audit
npm update

# Clean old logs
find /var/log -name "*.log" -mtime +30 -delete

# Database maintenance
psql $DATABASE_URL -c "VACUUM ANALYZE;"
```

---

## 🛠️ Advanced Configuration

### Scaling

#### Horizontal Scaling (Multiple Servers)

```bash
# Load Balancer Setup (AWS ALB)
# 1. Create Application Load Balancer
# 2. Add EC2 instances to target group
# 3. Configure health checks
# 4. Update DNS to point to ALB

# Session Management
# Use Redis for shared sessions
REDIS_URL=redis://your-redis-endpoint:6379
```

#### Vertical Scaling

```bash
# Increase PM2 instances
pm2 scale yoforex-nextjs 4
pm2 scale yoforex-express 8

# Adjust memory limits in ecosystem.config.js
max_memory_restart: '1G'
```

### CDN Setup

```bash
# CloudFront Configuration
# 1. Create CloudFront distribution
# 2. Origin: your-domain.com
# 3. Cache behaviors:
#    - /_next/static/* (Cache: 1 year)
#    - /api/* (No cache)
#    - /* (Cache: 1 hour)

# Update environment
CDN_URL=https://d1234567.cloudfront.net
```

### Database Optimization

```bash
# Connection pooling (already configured)
DB_POOL_MAX=20
DB_POOL_MIN=2

# Read replicas (AWS RDS)
DATABASE_READ_URL=postgresql://user:pass@read-replica.amazonaws.com:5432/yoforex
```

### Custom Domain Email

```bash
# Setup AWS SES
# 1. Verify domain in SES
# 2. Create SMTP credentials
# 3. Update environment variables

SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-user
SMTP_PASS=your-ses-smtp-password
```

---

## 🆘 Support

### Getting Help

1. **Check Logs First**
   ```bash
   pm2 logs
   tail -f /var/log/yoforex/*.log
   sudo ./deploy/troubleshoot.sh
   ```

2. **Documentation**
   - This guide: `/var/www/yoforex/DEPLOYMENT_COMPLETE.md`
   - Scripts: `/var/www/yoforex/deploy/*.sh`
   - Configuration: `/var/www/yoforex/.env.production.example`

3. **Common Commands Reference**
   ```bash
   # Service Management
   pm2 status            # Check processes
   pm2 restart all       # Restart everything
   systemctl status nginx # Check Nginx
   
   # Deployment
   ./deploy/master-deploy.sh --rollback  # Rollback
   ./deploy/troubleshoot.sh              # Fix issues
   
   # Monitoring
   pm2 monit            # Real-time monitoring
   htop                 # System resources
   tail -f /var/log/... # Live logs
   ```

### Emergency Procedures

#### Site is Down
```bash
# 1. Check services
pm2 status
systemctl status nginx postgresql

# 2. Restart services
pm2 restart all
systemctl restart nginx

# 3. Check logs for errors
pm2 logs --lines 100
tail -100 /var/log/nginx/error.log

# 4. Run troubleshooter
sudo ./deploy/troubleshoot.sh
```

#### Database Issues
```bash
# 1. Check connection
psql $DATABASE_URL -c "SELECT 1"

# 2. Restart PostgreSQL
systemctl restart postgresql

# 3. Check disk space
df -h

# 4. Emergency backup
pg_dump $DATABASE_URL > emergency-backup.sql
```

#### Rollback Deployment
```bash
# Automatic rollback
sudo ./deploy/master-deploy.sh --rollback

# Manual rollback
pm2 stop all
cd /var/www/yoforex.backup
pm2 start ecosystem.config.js
```

---

## 📚 Additional Resources

### AWS Documentation
- [EC2 User Guide](https://docs.aws.amazon.com/ec2/)
- [RDS PostgreSQL](https://docs.aws.amazon.com/rds/)
- [Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/)

### Technology Documentation
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Performance Tools
- [GTmetrix](https://gtmetrix.com/) - Page speed testing
- [SSL Labs](https://www.ssllabs.com/ssltest/) - SSL configuration testing
- [WebPageTest](https://www.webpagetest.org/) - Performance analysis

---

## 📝 Changelog

### Version 1.0.0 (Current)
- Initial deployment automation
- Ubuntu 22.04/24.04 support
- Automated troubleshooting
- SSL/TLS automation
- Backup and rollback system
- PM2 cluster mode
- Nginx optimization
- Security hardening

---

## 📄 License

This deployment system is provided as-is for the YoForex platform.

---

## 🎉 Deployment Complete!

Your YoForex platform should now be fully deployed and accessible at:

- **Production URL**: https://your-domain.com
- **API Endpoint**: https://your-domain.com/api
- **PM2 Monitor**: http://your-server:9615 (if enabled)

Remember to:
1. ✅ Update your DNS records
2. ✅ Configure your environment variables
3. ✅ Set up regular backups
4. ✅ Monitor your application
5. ✅ Keep your system updated

Happy Trading! 🚀