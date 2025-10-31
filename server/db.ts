import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Production database configuration with connection pooling
const getPoolConfig = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  const isProduction = process.env.NODE_ENV === 'production';
  
  // Parse DATABASE_URL for individual components if needed
  const connectionString = process.env.DATABASE_URL;
  
  return {
    connectionString,
    
    // Connection pool configuration
    max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum number of clients in pool
    min: parseInt(process.env.DB_POOL_MIN || '2'),  // Minimum number of clients in pool
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'), // Close idle clients after 30 seconds
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'), // 5 second connection timeout
    
    // AWS RDS SSL/TLS configuration
    ssl: isProduction ? {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false', // Default to true in production
      ca: process.env.DB_SSL_CA, // CA certificate for RDS (optional)
      cert: process.env.DB_SSL_CERT, // Client certificate (optional)
      key: process.env.DB_SSL_KEY, // Client key (optional)
    } : false,
    
    // Connection retry configuration
    allowExitOnIdle: false, // Keep the pool alive even if idle
    
    // Query timeout
    statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'), // 30 second query timeout
    query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'), // 30 second query timeout
    
    // Application name for monitoring
    application_name: process.env.APP_NAME || 'yoforex-api',
  };
};

// Initialize connection pool with retry logic
let globalPool: Pool | null = null;
let retryCount = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

const initializePool = async (): Promise<Pool> => {
  if (globalPool) {
    return globalPool;
  }

  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`Initializing database connection pool (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      
      const newPool = new Pool(getPoolConfig());
      
      // Test the connection
      const client = await newPool.connect();
      await client.query('SELECT 1');
      client.release();
      
      console.log('✅ Database connection pool initialized successfully');
      
      // Set up error handlers
      newPool.on('error', (err: Error, client: any) => {
        console.error('Unexpected error on idle database client:', err);
        // Don't exit the process, let the pool recover
      });

      newPool.on('connect', () => {
        console.log('New client connected to database pool');
      });

      newPool.on('acquire', () => {
        const poolStats = {
          total: newPool.totalCount,
          idle: newPool.idleCount,
          waiting: newPool.waitingCount,
        };
        console.log('Client acquired from pool:', poolStats);
      });

      newPool.on('remove', () => {
        console.log('Client removed from database pool');
      });
      
      globalPool = newPool;
      retryCount = 0; // Reset retry count on successful connection
      return globalPool;
      
    } catch (error) {
      retryCount++;
      console.error(`Failed to initialize database pool (attempt ${retryCount}/${MAX_RETRIES}):`, error);
      
      if (retryCount >= MAX_RETRIES) {
        throw new Error(`Failed to establish database connection after ${MAX_RETRIES} attempts: ${error}`);
      }
      
      console.log(`Retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  
  throw new Error('Failed to initialize database pool');
};

// Connection recovery wrapper
export const getPool = async (): Promise<Pool> => {
  if (!globalPool) {
    return await initializePool();
  }
  
  // Check if pool is healthy
  try {
    const client = await globalPool.connect();
    await client.query('SELECT 1');
    client.release();
    return globalPool;
  } catch (error) {
    console.error('Database pool health check failed, reinitializing:', error);
    
    // Try to end the current pool gracefully
    if (globalPool) {
      try {
        await globalPool.end();
      } catch (endError) {
        console.error('Error ending unhealthy pool:', endError);
      }
      globalPool = null;
    }
    
    // Reinitialize the pool
    return await initializePool();
  }
};

// Database health check function
export const checkDatabaseHealth = async (): Promise<{
  healthy: boolean;
  message: string;
  details?: {
    poolStats?: {
      total: number;
      idle: number;
      waiting: number;
    };
    latency?: number;
    error?: string;
  };
}> => {
  const startTime = Date.now();
  
  try {
    const currentPool = await getPool();
    
    // Get pool statistics
    const poolStats = {
      total: currentPool.totalCount,
      idle: currentPool.idleCount,
      waiting: currentPool.waitingCount,
    };
    
    // Test query execution
    const client = await currentPool.connect();
    const result = await client.query('SELECT NOW() as timestamp, version() as version');
    client.release();
    
    const latency = Date.now() - startTime;
    
    return {
      healthy: true,
      message: 'Database is healthy',
      details: {
        poolStats,
        latency,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      healthy: false,
      message: 'Database health check failed',
      details: {
        error: errorMessage,
        latency: Date.now() - startTime,
      },
    };
  }
};

// Execute query with retry logic
export const executeWithRetry = async <T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Check if error is retryable
      const isRetryable = 
        lastError.message.includes('ECONNREFUSED') ||
        lastError.message.includes('ETIMEDOUT') ||
        lastError.message.includes('ENOTFOUND') ||
        lastError.message.includes('connection terminated unexpectedly') ||
        lastError.message.includes('Connection lost');
      
      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }
      
      console.warn(`Query attempt ${attempt} failed, retrying in ${delayMs}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      // Exponential backoff
      delayMs = Math.min(delayMs * 2, 10000); // Cap at 10 seconds
    }
  }
  
  throw lastError || new Error('Failed to execute query after retries');
};

// Initialize the pool on first import
let dbInstance: ReturnType<typeof drizzle> | null = null;

export const getDb = async () => {
  if (!dbInstance) {
    const currentPool = await getPool();
    dbInstance = drizzle(currentPool, { schema });
  }
  return dbInstance;
};

// Initialize pool and db synchronously for backward compatibility
let initialPool: Pool | null = null;
let initialDb: ReturnType<typeof drizzle> | null = null;

// Initialize immediately on import for backward compatibility
(async () => {
  try {
    initialPool = await initializePool();
    initialDb = drizzle(initialPool, { schema });
    dbInstance = initialDb;
  } catch (error) {
    console.error('Failed to initialize database on startup:', error);
    // Don't exit immediately - allow server to start and retry on first use
  }
})();

// Export the pool for backward compatibility
export const pool = initialPool as unknown as Pool;

// Export the db instance for backward compatibility
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (target, prop) => {
    if (!initialDb) {
      console.error('Database not initialized. Attempting to initialize now...');
      // Try to initialize synchronously (blocking)
      const tempPool = new Pool(getPoolConfig());
      initialDb = drizzle(tempPool, { schema });
      initialPool = tempPool;
    }
    
    return initialDb[prop as keyof typeof initialDb];
  }
});

// Track if pool has been closed
let poolClosed = false;

// Graceful shutdown handler
const gracefulShutdown = async () => {
  // Prevent multiple close calls
  if (poolClosed) {
    console.log('Database pool already closed, skipping...');
    return;
  }
  
  console.log('Gracefully shutting down database connections...');
  
  if (globalPool) {
    try {
      poolClosed = true;
      await globalPool.end();
      console.log('Database pool closed successfully');
      globalPool = null;
    } catch (error) {
      console.error('Error closing database pool:', error);
    }
  }
};

// Register shutdown handlers (only once each)
process.once('SIGTERM', gracefulShutdown);
process.once('SIGINT', gracefulShutdown);
process.once('beforeExit', gracefulShutdown);