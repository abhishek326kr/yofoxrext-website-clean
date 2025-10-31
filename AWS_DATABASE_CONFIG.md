# Production Database Configuration for AWS Deployment

## Overview
The database configuration has been updated to use standard PostgreSQL client (`pg`) with production-ready features for AWS EC2/RDS deployment. This replaces the previous Neon-specific database driver.

## Key Features Implemented

### 1. **Standard PostgreSQL Client**
- Replaced `@neondatabase/serverless` with standard `pg` and `pg-pool` packages
- Compatible with any PostgreSQL instance (AWS RDS, self-hosted, etc.)

### 2. **Connection Pooling**
- Configurable pool size (min: 2, max: 20 connections by default)
- Idle timeout: 30 seconds
- Connection timeout: 5 seconds
- Automatic connection management and recycling

### 3. **SSL/TLS Support for AWS RDS**
- Automatic SSL configuration in production
- Configurable SSL certificates and keys
- Support for custom CA certificates

### 4. **Retry Logic & Connection Recovery**
- Automatic retry on connection failures (up to 5 attempts)
- Exponential backoff with 2-second initial delay
- Connection health checks before query execution
- Automatic pool reinitialization on failure

### 5. **Health Check Endpoints**
- `/api/health` - Complete system health with database status
- `/api/health/live` - Kubernetes liveness probe
- `/api/health/ready` - Kubernetes readiness probe with DB check

### 6. **Graceful Shutdown**
- Proper connection cleanup on SIGTERM/SIGINT
- Database pool closure before process exit

## Configuration Environment Variables

```bash
# Required
DATABASE_URL=postgresql://username:password@host:5432/database

# Optional - Connection Pool Settings
DB_POOL_MAX=20                    # Maximum pool size (default: 20)
DB_POOL_MIN=2                      # Minimum pool size (default: 2)
DB_IDLE_TIMEOUT=30000              # Idle timeout in ms (default: 30000)
DB_CONNECTION_TIMEOUT=5000         # Connection timeout in ms (default: 5000)

# Optional - Query Timeouts
DB_STATEMENT_TIMEOUT=30000         # Statement timeout in ms (default: 30000)
DB_QUERY_TIMEOUT=30000              # Query timeout in ms (default: 30000)

# Optional - SSL/TLS Configuration (for AWS RDS)
DB_SSL_REJECT_UNAUTHORIZED=true    # Verify SSL certificates (default: true in production)
DB_SSL_CA=/path/to/ca.pem          # CA certificate path
DB_SSL_CERT=/path/to/cert.pem      # Client certificate path
DB_SSL_KEY=/path/to/key.pem        # Client key path

# Optional - Application Settings
APP_NAME=yoforex-api               # Application name for monitoring
NODE_ENV=production                # Environment (production enables SSL)
```

## AWS RDS Configuration

### 1. **Enable SSL/TLS on RDS**
```bash
# Download RDS CA certificate
wget https://s3.amazonaws.com/rds-downloads/rds-ca-2019-root.pem

# Set environment variable
export DB_SSL_CA=./rds-ca-2019-root.pem
```

### 2. **Security Group Settings**
- Allow inbound PostgreSQL traffic (port 5432) from EC2 security group
- Use VPC for internal communication

### 3. **Parameter Group Settings**
Recommended RDS parameter group settings:
- `max_connections`: 100-200 (depending on instance size)
- `shared_preload_libraries`: 'pg_stat_statements'
- `log_statement`: 'all' (for debugging, 'none' for production)
- `log_min_duration_statement`: 1000 (log slow queries > 1s)

## Health Check Usage

### AWS ALB/ELB Health Checks
Configure your load balancer to use:
- Health check path: `/api/health/ready`
- Healthy threshold: 2 checks
- Unhealthy threshold: 3 checks
- Interval: 30 seconds
- Timeout: 10 seconds

### Kubernetes Probes
```yaml
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Monitoring & Debugging

### Connection Pool Monitoring
The system logs connection pool events:
- New client connections
- Client acquisitions from pool
- Client releases to pool
- Pool statistics (total, idle, waiting)

### Health Check Response Example
```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T09:51:24.836Z",
  "services": {
    "database": {
      "healthy": true,
      "message": "Database is healthy",
      "details": {
        "poolStats": {
          "total": 20,
          "idle": 15,
          "waiting": 0
        },
        "latency": 46
      }
    }
  },
  "environment": {
    "nodeEnv": "production",
    "appName": "yoforex-api"
  }
}
```

## Error Handling

The database module includes comprehensive error handling:

1. **Connection Errors**: Automatic retry with exponential backoff
2. **Query Errors**: Returned to application layer with proper error messages
3. **Pool Exhaustion**: Requests wait for available connections (configurable timeout)
4. **Network Issues**: Automatic reconnection attempts

## Migration from Neon

No database schema changes required. The migration only affects the connection layer:
1. ✅ Standard PostgreSQL driver installed
2. ✅ Connection pooling configured
3. ✅ SSL/TLS support added
4. ✅ Health checks implemented
5. ✅ Retry logic implemented
6. ✅ Production-ready error handling

## Performance Optimizations

1. **Connection Pooling**: Reduces connection overhead
2. **Prepared Statements**: Drizzle ORM uses prepared statements by default
3. **Query Timeouts**: Prevents long-running queries from blocking
4. **Connection Reuse**: Minimizes connection establishment overhead

## Deployment Checklist

- [ ] Set `DATABASE_URL` environment variable
- [ ] Configure SSL certificates for RDS (if required)
- [ ] Set appropriate pool size based on expected load
- [ ] Configure health check endpoints in load balancer
- [ ] Test database connectivity: `curl http://your-server:3001/api/health`
- [ ] Monitor connection pool metrics in production
- [ ] Set up database backup and recovery procedures

## Support

For issues or questions:
1. Check health endpoint: `/api/health`
2. Review application logs for connection pool events
3. Verify environment variables are correctly set
4. Ensure database server is accessible from EC2 instance