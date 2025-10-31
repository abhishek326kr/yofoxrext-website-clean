# Multi-stage Dockerfile for YoForex production deployment

# Stage 1: Build dependencies
FROM node:20-alpine AS deps
LABEL maintainer="YoForex DevOps Team"
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY drizzle.config.ts ./

# Install dependencies (including devDependencies for build)
RUN npm ci --include=dev

# Stage 2: Build Next.js application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ARG NODE_ENV=production
ARG NEXT_PUBLIC_SITE_URL
ARG EXPRESS_URL
ARG DATABASE_URL

ENV NODE_ENV=${NODE_ENV}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV EXPRESS_URL=${EXPRESS_URL}
ENV DATABASE_URL=${DATABASE_URL}

# Build Next.js application
RUN npm run build:next

# Build Express server
RUN npm run build

# Stage 3: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Install PM2 globally
RUN npm install -g pm2

# Copy production dependencies only
COPY --from=deps /app/package*.json ./
RUN npm ci --omit=dev

# Copy built applications and necessary files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/ecosystem.config.js ./
COPY --from=builder /app/start-production.sh ./
COPY --from=builder /app/drizzle.config.ts ./

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads /app/.next/cache && \
    chown -R nextjs:nodejs /app

# Set runtime environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV API_PORT=3001

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1); \
  })" || exit 1

# Switch to non-root user
USER nextjs

# Expose ports (Next.js on 5000, Express API on 3001)
EXPOSE 5000 3001

# Use PM2 to manage both processes
CMD ["pm2-runtime", "start", "ecosystem.config.js"]