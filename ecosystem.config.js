/**
 * PM2 Ecosystem Configuration for YoForex
 * 
 * This configuration manages two separate processes:
 * 1. Next.js frontend (port 3000)
 * 2. Express API backend (port 3001)
 * 
 * Usage:
 *   Start:   pm2 start ecosystem.config.js
 *   Stop:    pm2 stop ecosystem.config.js
 *   Restart: pm2 restart ecosystem.config.js
 *   Reload:  pm2 reload ecosystem.config.js (zero-downtime)
 *   Logs:    pm2 logs
 *   Monitor: pm2 monit
 */

module.exports = {
  apps: [
    {
      name: 'yoforex-nextjs',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/',
      instances: 2,
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: '5000',
        NEXT_PUBLIC_SITE_URL: 'https://yoforex.com',
        NEXT_PUBLIC_EXPRESS_URL: 'https://yoforex.com',
        EXPRESS_URL: 'http://127.0.0.1:3001',
      },

      // Auto-restart configuration
      watch: false,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      
      // Logging
      error_file: '/var/log/pm2/yoforex-nextjs-error.log',
      out_file: '/var/log/pm2/yoforex-nextjs-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Health monitoring
      listen_timeout: 10000,
      kill_timeout: 5000,
      wait_ready: true,
      
      // Instance settings
      instance_var: 'INSTANCE_ID',
      
      // Source maps for better error tracking
      source_map_support: true,
      
      // Time-based restart (optional - restart daily at 3 AM)
      cron_restart: '0 3 * * *',
    },
    
    {
      name: 'yoforex-express',
      script: 'dist/index.js',
      cwd: '/',
      instances: 2,
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        API_PORT: '3001',
        PORT: '3001',
        DATABASE_URL: process.env.DATABASE_URL,
        SESSION_SECRET: process.env.SESSION_SECRET,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASSWORD: process.env.SMTP_PASSWORD,
        SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL,
        SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
        REPLIT_CLIENT_ID: process.env.REPLIT_CLIENT_ID,
        REPLIT_CLIENT_SECRET: process.env.REPLIT_CLIENT_SECRET,
        NEXT_PUBLIC_SITE_URL: 'https://yoforex.com',
      },

      // Auto-restart configuration
      watch: false,
      max_memory_restart: '400M',
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      
      // Logging
      error_file: '/var/log/pm2/yoforex-express-error.log',
      out_file: '/var/log/pm2/yoforex-express-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Health monitoring
      listen_timeout: 10000,
      kill_timeout: 5000,
      
      // Instance settings
      instance_var: 'INSTANCE_ID',
      
      // Source maps
      source_map_support: true,
      
      // Time-based restart (optional - restart daily at 3 AM)
      cron_restart: '0 3 * * *',
    },
  ],

  /**
   * Deployment Configuration (optional)
   * Allows PM2 to deploy code from Git repository
   */
  deploy: {
    production: {
      user: 'deployer',
      host: 'your-vps-ip',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/yoforex.git',
      path: '/var/www/yoforex',
      'post-deploy': 'npm install && npm run build && npm run build:next && pm2 reload ecosystem.config.js',
      'pre-setup': '',
    },
  },
};
