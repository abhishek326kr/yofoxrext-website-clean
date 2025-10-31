# 🚀 YoForex AWS EC2 Deployment - Quick Start Guide

## ⚡ ONE-COMMAND DEPLOYMENT (Copy & Paste)

### Step 1: Launch AWS EC2 Ubuntu Instance
1. Go to AWS Console → EC2 → Launch Instance
2. Choose: **Ubuntu Server 22.04 LTS** 
3. Instance type: **t3.medium** (minimum) or **t3.large** (recommended)
4. Storage: **30 GB** minimum
5. Security Group: Allow ports **22, 80, 443, 5000, 3001**

### Step 2: Connect to Your EC2 Instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Step 3: Deploy YoForex (One Command!)
```bash
# Download and run the master deployment script
curl -o master-deploy.sh https://raw.githubusercontent.com/yourusername/yoforex/main/deploy/master-deploy.sh && \
chmod +x master-deploy.sh && \
sudo ./master-deploy.sh
```

**That's it!** The script will:
- ✅ Install all dependencies (Node.js, PostgreSQL, Nginx, PM2)
- ✅ Configure your database
- ✅ Set up SSL certificates automatically
- ✅ Start your application
- ✅ Configure firewall and security
- ✅ Set up automatic backups

Your site will be live at: `https://your-domain.com`

---

## 🖥️ LOCAL DEVELOPMENT (Outside Replit)

### Option 1: Docker (Easiest)
```bash
# Clone the repository
git clone https://github.com/yourusername/yoforex.git
cd yoforex

# Start with Docker
docker-compose up

# Access at http://localhost:5000
```

### Option 2: Manual Setup (VS Code, WebStorm, etc.)
```bash
# Clone repository
git clone https://github.com/yourusername/yoforex.git
cd yoforex

# Install dependencies
npm install

# Copy environment template
cp .env.development.example .env

# Start PostgreSQL (if not using Docker)
sudo service postgresql start

# Run database setup
npm run db:push

# Start development servers
npm run dev

# Access at http://localhost:5000
```

---

## 🔧 TROUBLESHOOTING

### If Deployment Fails
```bash
# Run the troubleshoot script
sudo ./deploy/troubleshoot.sh

# Or check specific service
pm2 status
pm2 logs
sudo nginx -t
sudo systemctl status postgresql
```

### Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Port 5000 in use | `sudo lsof -i :5000` then `kill -9 PID` |
| Database connection failed | Check `.env` for correct `DATABASE_URL` |
| SSL certificate error | `sudo certbot renew --force-renewal` |
| Build fails | Ensure 2GB+ RAM or add swap: `sudo ./deploy/setup-ubuntu.sh` |

---

## 📱 QUICK COMMANDS

```bash
# Check application status
pm2 status

# View logs
pm2 logs

# Restart application
pm2 restart all

# Update application
git pull && npm install && npm run build && pm2 restart all

# Backup database
./deploy/backup-restore.sh backup

# Restore database
./deploy/backup-restore.sh restore
```

---

## 🔒 SECURITY CHECKLIST

- [x] SSL/TLS enabled automatically
- [x] Firewall configured (UFW)
- [x] Rate limiting enabled
- [x] SQL injection protection
- [x] XSS protection
- [x] CORS configured
- [x] Secure session management

---

## 📞 SUPPORT

- **Documentation**: See `DEPLOYMENT_COMPLETE.md` for detailed instructions
- **Verification**: Run `./deploy/verify-deployment.sh` to check system health
- **Testing**: Run `npm run test:production` to verify all features

---

## 🎉 SUCCESS INDICATORS

Your deployment is successful when:
1. ✅ `https://your-domain.com` loads without errors
2. ✅ SSL padlock shows in browser
3. ✅ `pm2 status` shows all services "online"
4. ✅ `./deploy/verify-deployment.sh` shows all green checks
5. ✅ Database connection successful

**Congratulations! Your YoForex platform is now live!** 🚀