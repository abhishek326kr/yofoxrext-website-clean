# YoForex Production Deployment Guide

## ✅ Pre-Deployment Checklist

Your application is **READY TO DEPLOY** with the following configuration:

### Production Build Configuration
- ✅ Build command: `npm run build` (builds Next.js + Express API)
- ✅ Start command: `npm run start` (runs production servers)
- ✅ Deployment type: **Autoscale** (automatically scales with traffic)
- ✅ Port configuration: Port 5000 (Next.js frontend)

### Database & Backend
- ✅ PostgreSQL database connected (DATABASE_URL set)
- ✅ 17 users loaded
- ✅ 59 categories loaded
- ✅ Session secret configured
- ✅ Express API server ready (port 3001 internal)

---

## 🚀 How to Deploy to Production

### Step 1: Add Production Environment Variables

Before deploying, add these secrets in the Replit Secrets panel:

1. Click on **"Secrets"** in the left sidebar (🔒 icon)
2. Add the following secrets:

```
BASE_URL=https://your-repl-name.repl.co
NEXT_PUBLIC_BASE_URL=https://your-repl-name.repl.co
```

**Note:** Replace `your-repl-name.repl.co` with your actual Replit deployment URL (you'll get this after first deployment).

### Optional Secrets (for full functionality):
```
REPLIT_CLIENT_ID=your_client_id
REPLIT_CLIENT_SECRET=your_client_secret
```

---

### Step 2: Click Deploy

1. In the Replit workspace header, click **"Deploy"** button
2. Your deployment is already configured with:
   - **Type:** Autoscale Deployment
   - **Build:** `npm run build`
   - **Run:** `npm run start`
3. Click **"Deploy"** to publish your application

---

### Step 3: Monitor Deployment

Replit will:
1. ✅ Build your Next.js frontend (~30-60 seconds)
2. ✅ Build your Express API server (~10 seconds)
3. ✅ Start both servers in production mode
4. ✅ Provide you with a live URL (e.g., `https://your-app.repl.co`)

---

## 📊 What Runs in Production

Your production deployment runs:

1. **Next.js Frontend** (Port 5000)
   - Server-Side Rendering (SSR)
   - Optimized static assets
   - SEO-friendly pages

2. **Express API Server** (Port 3001 - Internal)
   - RESTful API endpoints
   - Database queries
   - Authentication handling

---

## 🔧 Production Architecture

```
User Request → Replit Load Balancer
                    ↓
            Next.js (Port 5000)
                    ↓
            Express API (Port 3001)
                    ↓
            PostgreSQL Database
```

---

## ⚙️ Post-Deployment Configuration

### Update Base URLs (After First Deployment)

After your first deployment, you'll receive a production URL like:
`https://your-app-name-username.replit.app`

Update your Secrets with the actual URL:
```
BASE_URL=https://your-app-name-username.replit.app
NEXT_PUBLIC_BASE_URL=https://your-app-name-username.replit.app
```

Then redeploy to apply the changes.

---

## 🎯 Custom Domain (Optional)

To use a custom domain:

1. Go to your deployment settings
2. Click **"Custom Domain"**
3. Follow instructions to point your domain to Replit
4. Update your BASE_URL secrets to your custom domain

---

## 📈 Monitoring & Scaling

### Autoscale Configuration
Your deployment automatically scales based on:
- Traffic volume
- Resource usage
- Active user count

**Default Configuration:**
- **Machine:** 1 vCPU, 2 GiB RAM
- **Max Machines:** 3 (adjustable)

### Performance Monitoring
Access monitoring via:
1. Click on your deployment
2. View **"Metrics"** tab for:
   - Request count
   - Response times
   - Error rates
   - Resource usage

---

## 🔐 Security Checklist

Before going live, ensure:

- ✅ All secrets are properly configured
- ✅ DATABASE_URL points to production database
- ✅ SESSION_SECRET is strong and unique
- ✅ CORS is properly configured (if needed)
- ✅ Rate limiting is enabled (already configured)
- ✅ Input validation is in place (already configured)

---

## 🐛 Troubleshooting

### Deployment Fails to Build
**Solution:** Check build logs for errors. Common issues:
- Missing dependencies (run `npm install`)
- TypeScript errors (run `npm run check`)
- Environment variables not set

### Application Won't Start
**Solution:** Check runtime logs for errors. Common issues:
- DATABASE_URL not set
- Port conflicts
- Missing environment variables

### Database Connection Errors
**Solution:**
1. Verify DATABASE_URL is set in production secrets
2. Check database is accessible from Replit
3. Run `npm run db:push` to ensure schema is up to date

---

## 📚 Additional Resources

- [Replit Deployment Docs](https://docs.replit.com/hosting/deployments/about-deployments)
- [Next.js Production Best Practices](https://nextjs.org/docs/deployment)
- [YoForex Documentation](./docs/README.md)

---

## 🎉 You're Ready to Deploy!

Your YoForex platform is production-ready. Click the **Deploy** button to go live!

**Support:** Check `docs/` folder for comprehensive platform documentation.

---

**Last Updated:** October 29, 2025  
**Status:** ✅ Production Ready
