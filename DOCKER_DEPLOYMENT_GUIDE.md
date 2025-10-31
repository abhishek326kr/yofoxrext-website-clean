# YoForex Docker & Deployment Infrastructure Guide

## Overview

This guide covers the complete Docker and deployment infrastructure for YoForex, including local development with Docker Compose, production deployment, automated testing, and backup/restore capabilities.

## 📋 Table of Contents

1. [Local Development with Docker](#local-development)
2. [Production Deployment](#production-deployment)
3. [Deployment Verification](#deployment-verification)
4. [Backup & Restore](#backup--restore)
5. [Production Testing](#production-testing)
6. [Quick Start Commands](#quick-start-commands)

---

## 🚀 Local Development

### Using Docker Compose for Development

The `docker-compose.yml` file provides a complete development environment with PostgreSQL, Redis, and the application with hot reload.

#### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB+ RAM available for Docker
- 10GB+ free disk space

#### Quick Start

```bash
# 1. Copy environment template
cp .env.production.example .env

# 2. Start all services
docker-compose up -d

# 3. View logs
docker-compose logs -f app

# 4. Access the application
# Frontend: http://localhost:5000
# API: http://localhost:3001
# Adminer (DB UI): http://localhost:8080
# Redis Commander: http://localhost:8081
```

#### Development Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose build app

# View logs
docker-compose logs -f [service-name]

# Execute commands in container
docker-compose exec app npm run db:push
docker-compose exec app npm run db:seed

# Reset everything (including volumes)
docker-compose down -v
```

#### Development Features

- **Hot Reload**: Code changes automatically restart the application
- **PostgreSQL**: Local database with Adminer UI at `http://localhost:8080`
- **Redis**: Caching layer with Redis Commander at `http://localhost:8081`
- **Volume Mounts**: Source code mounted for live editing
- **Debug Port**: Node.js debugger available on port 9229

---

## 🏭 Production Deployment

### Using Docker Compose for Production

The `docker-compose.prod.yml` file is optimized for production deployment with external databases.

#### Prerequisites

- Docker Engine 20.10+
- External PostgreSQL (RDS/Neon)
- SSL certificates (Let's Encrypt)
- Domain configured

#### Production Setup

```bash
# 1. Create production environment file
cp .env.production.example .env.production
# Edit .env.production with your production values

# 2. Build production image
docker build -t yoforex:latest .

# 3. Start production services
docker-compose -f docker-compose.prod.yml up -d

# 4. Check health
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs --tail=100
```

#### Production Commands

```bash
# Start production
docker-compose -f docker-compose.prod.yml up -d

# Stop production
docker-compose -f docker-compose.prod.yml down

# Update production
docker pull yoforex:latest
docker-compose -f docker-compose.prod.yml up -d --no-deps app

# View production logs
docker-compose -f docker-compose.prod.yml logs -f app

# Scale horizontally
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

#### Production Features

- **Health Checks**: Automatic health monitoring
- **Resource Limits**: CPU and memory constraints
- **Restart Policies**: Automatic recovery from failures
- **Log Rotation**: Prevents disk space issues
- **Security**: Read-only filesystem where possible
- **NGINX**: Optional reverse proxy with SSL

---

## ✅ Deployment Verification

### Using verify-deployment.sh

The deployment verification script performs comprehensive health checks after deployment.

#### Usage

```bash
# Basic verification
./deploy/verify-deployment.sh

# Verify production with Slack notification
./deploy/verify-deployment.sh production https://hooks.slack.com/your-webhook

# Verify development environment
./deploy/verify-deployment.sh development
```

#### What It Checks

1. **Service Status**: All services are running
2. **Database**: Connection and table integrity
3. **API Endpoints**: All critical endpoints responding
4. **SSL Certificate**: Valid and not expiring
5. **System Resources**: CPU, memory, disk usage
6. **Process Health**: PM2/Docker container status
7. **Log Analysis**: Recent errors in logs
8. **Network**: DNS and external connectivity
9. **Performance**: Response time measurements

#### Example Output

```
========================================
YoForex Deployment Verification Report
Environment: production
Timestamp: 2024-01-15 10:30:00
Domain: https://yoforex.net
========================================

1. CHECKING SERVICES
--------------------
[✓] yoforex-nextjs is running (PM2)
[✓] yoforex-express is running (PM2)
[✓] nginx is running

2. DATABASE CONNECTIVITY
------------------------
[✓] Database connection successful
[INFO] Database has 42 tables
[INFO] Database has 1523 users

3. API ENDPOINTS
----------------
[✓] Health endpoint responding (HTTP 200)
[✓] All critical endpoints operational

[✓] Deployment verification completed successfully!
```

---

## 💾 Backup & Restore

### Using backup-restore.sh

The backup and restore script handles complete system backups including database and files.

#### Backup Operations

```bash
# Create local backup
./deploy/backup-restore.sh backup

# Create backup and upload to S3
./deploy/backup-restore.sh backup s3

# List available backups
./deploy/backup-restore.sh list

# Schedule automatic daily backups
./deploy/backup-restore.sh schedule
```

#### Restore Operations

```bash
# List available backups first
./deploy/backup-restore.sh list

# Restore from specific backup
./deploy/backup-restore.sh restore yoforex-backup-20240115-103000

# Restore from S3 backup
AWS_PROFILE=production ./deploy/backup-restore.sh restore yoforex-backup-20240115-103000
```

#### What Gets Backed Up

- **Database**: Complete PostgreSQL dump
- **Uploads**: All user-uploaded files
- **Configuration**: Environment files, NGINX config
- **Metadata**: Backup information and checksums

#### Automated Backups

After running `./deploy/backup-restore.sh schedule`:
- Daily backups at 3:00 AM
- Weekly full backups on Sunday at 2:00 AM
- Automatic upload to S3
- 30-day retention (moves to Glacier)
- 90-day total retention

---

## 🧪 Production Testing

### Using test-production.js

The production testing script runs comprehensive automated tests against the live environment.

#### Running Tests

```bash
# Run all tests
node scripts/test-production.js

# Run with custom environment
NEXT_PUBLIC_SITE_URL=https://staging.yoforex.net node scripts/test-production.js

# Run with test user credentials
TEST_USER_EMAIL=test@yoforex.net \
TEST_USER_PASSWORD=TestPass123! \
node scripts/test-production.js
```

#### Test Suites

1. **API Health**: Health, liveness, readiness checks
2. **Public Endpoints**: All public API endpoints
3. **Authentication**: Registration, login, session, logout
4. **Database**: CRUD operations, search, pagination
5. **File Upload**: Upload functionality and storage
6. **Performance**: Load times, concurrent requests
7. **Security**: CORS, rate limiting, injection protection
8. **SEO**: Sitemap, robots.txt, meta tags

#### Test Reports

Tests generate two report formats:

1. **JSON Report**: `test-report-[timestamp].json`
2. **Markdown Report**: `test-report-[timestamp].md`

Example report summary:
```
TEST SUMMARY
============
Total Tests: 28
Passed: 26 ✅
Failed: 2 ❌
Duration: 15.34s
```

---

## 🚦 Quick Start Commands

### Development

```bash
# Start development environment
docker-compose up -d

# Stop development environment
docker-compose down

# Reset development database
docker-compose exec app npm run db:push
docker-compose exec app npm run db:seed

# View development logs
docker-compose logs -f app
```

### Production

```bash
# Deploy to production
docker build -t yoforex:latest .
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
./deploy/verify-deployment.sh production

# Create backup
./deploy/backup-restore.sh backup s3

# Run production tests
node scripts/test-production.js
```

### Troubleshooting

```bash
# Check service status
docker-compose ps
docker-compose logs --tail=100

# Inspect container
docker-compose exec app bash

# Check resource usage
docker stats

# Clean up everything
docker system prune -a
docker volume prune
```

---

## 📊 Monitoring

### Health Endpoints

- `/api/health` - General health check
- `/api/health/live` - Liveness probe
- `/api/health/ready` - Readiness probe

### Metrics to Monitor

1. **Response Times**: API < 1s, Homepage < 3s
2. **Error Rate**: < 1% of requests
3. **Database Connections**: Pool usage < 80%
4. **Memory Usage**: < 80% of allocated
5. **CPU Usage**: < 70% sustained
6. **Disk Space**: > 20% free

### Recommended Monitoring Tools

- **Uptime**: UptimeRobot, Pingdom
- **APM**: New Relic, DataDog
- **Logs**: CloudWatch, Papertrail
- **Errors**: Sentry, Rollbar

---

## 🔒 Security Considerations

### Production Checklist

- [ ] Environment variables properly set
- [ ] Database credentials secure
- [ ] SSL certificates valid
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] File upload restrictions
- [ ] SQL injection protection
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Security headers configured

### Regular Maintenance

1. **Daily**: Check logs for errors
2. **Weekly**: Review performance metrics
3. **Monthly**: Update dependencies
4. **Quarterly**: Security audit
5. **Annually**: Disaster recovery test

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [PostgreSQL Backup Guide](https://www.postgresql.org/docs/current/backup.html)
- [NGINX Configuration](https://nginx.org/en/docs/)

---

## 🆘 Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Run verification: `./deploy/verify-deployment.sh`
3. Run tests: `node scripts/test-production.js`
4. Review this guide
5. Contact DevOps team

---

*Last Updated: January 2025*
*Version: 1.0.0*