# Deployment Secrets Configuration

## Required Secrets for Production Deployment

Before deploying to production, you must configure the following secrets in Replit's Secrets panel:

### 1. Core Environment Variables

```
EXPRESS_URL=http://127.0.0.1:3001
NODE_ENV=production
```

### 2. Site URL (After First Deployment)

After your first successful deployment, add:
```
NEXT_PUBLIC_SITE_URL=https://your-app-name.repl.co
```

### How to Add Secrets in Replit

1. Open the **Secrets** panel (lock icon in the left sidebar)
2. Click **+ New Secret**
3. Add each secret with its name and value
4. These will be automatically available during deployment

### Important Notes

- `EXPRESS_URL` must be set to `http://127.0.0.1:3001` (internal communication)
- `NODE_ENV` must be set to `production` for optimized builds
- `NEXT_PUBLIC_SITE_URL` should be your actual deployment URL
- Database secrets (`DATABASE_URL`, etc.) are automatically managed by Replit

### Deployment Configuration

The deployment is configured to run on port 5000 with:
- **Build**: Compiles Next.js and Express for production
- **Run**: Starts both servers (Express on 3001, Next.js on 5000)
- **Port**: Main HTTP traffic on port 5000 (Next.js frontend)

### Troubleshooting

If deployment fails with "EXPRESS_URL not set":
1. Go to Secrets panel
2. Add `EXPRESS_URL` with value `http://127.0.0.1:3001`
3. Add `NODE_ENV` with value `production`
4. Retry deployment

The deployment configuration automatically injects these during build and runtime, but they must exist in Secrets first.