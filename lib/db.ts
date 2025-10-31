import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '../shared/schema';
import * as relations from '../shared/relations';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Drizzle instance with schema and relations
export const db = drizzle(pool, { schema: { ...schema, ...relations } });

// Helper function to get global stats (for homepage)
export async function getGlobalStats() {
  const { count } = await import('drizzle-orm');
  const { forumThreads, users, forumReplies, content } = schema;

  const [threadCount, userCount, replyCount, contentCount] = await Promise.all([
    db.select({ count: count() }).from(forumThreads),
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(forumReplies),
    db.select({ count: count() }).from(content),
  ]);

  return {
    totalThreads: threadCount[0].count,
    totalMembers: userCount[0].count,
    totalPosts: replyCount[0].count,
    totalContent: contentCount[0].count,
    weeklyActivity: 0, // TODO: Calculate from database
  };
}
