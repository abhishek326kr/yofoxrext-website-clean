import { db } from '../../db';
import { eq, sql, and, desc, asc } from 'drizzle-orm';
import { 
  forumThreads,
  forumReplies,
  forumCategories,
  users,
  activityFeed
} from '@shared/schema';
import type { 
  ForumThread,
  InsertForumThread,
  ForumReply,
  InsertForumReply,
  ForumCategory
} from '@shared/schema';
import { generateThreadSlug, generateReplySlug, generateMetaDescription, randomUUID } from '../utils';

/**
 * ForumStorage - Handles all forum-related database operations
 * Extracted from DrizzleStorage to reduce monolith complexity
 */
export class ForumStorage {
  async createForumThread(insertThread: InsertForumThread, authorId: string): Promise<ForumThread> {
    const [user] = await db.select().from(users).where(eq(users.id, authorId));
    if (!user) throw new Error("User not found");
    
    // Note: Slug, focusKeyword, metaDescription are now passed from routes.ts
    // This method just stores whatever is provided, with fallbacks for required fields
    const [thread] = await db.insert(forumThreads).values({
      ...insertThread,
      authorId,
      // Ensure slug is always defined (generate from title if missing)
      slug: insertThread.slug || generateThreadSlug(insertThread.title),
      // Ensure defaults for optional fields
      isPinned: insertThread.isPinned ?? false,
      isLocked: insertThread.isLocked ?? false,
      isSolved: insertThread.isSolved ?? false,
      engagementScore: insertThread.engagementScore ?? 0,
      status: "approved" as const,
    }).returning();
    
    await this.updateCategoryStats(insertThread.categorySlug);
    
    await db.insert(activityFeed).values({
      userId: authorId,
      activityType: "thread_created",
      entityType: "thread",
      entityId: thread.id,
      title: insertThread.title,
      description: thread.metaDescription || insertThread.body.substring(0, 200),
    });
    
    return thread;
  }
  
  async getForumThreadById(id: string): Promise<ForumThread | undefined> {
    const [thread] = await db.select().from(forumThreads).where(eq(forumThreads.id, id));
    return thread;
  }
  
  async getForumThreadBySlug(slug: string): Promise<ForumThread | undefined> {
    const [result] = await db
      .select({
        thread: forumThreads,
        authorUsername: users.username,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
      })
      .from(forumThreads)
      .leftJoin(users, eq(forumThreads.authorId, users.id))
      .where(eq(forumThreads.slug, slug));
    
    if (!result) return undefined;
    
    const thread = result.thread;
    
    // Get accurate reply count from database
    const [{ count: actualReplyCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(forumReplies)
      .where(eq(forumReplies.threadId, thread.id));
    
    // Increment view count
    if (thread) {
      await db
        .update(forumThreads)
        .set({ views: sql`${forumThreads.views} + 1` })
        .where(eq(forumThreads.id, thread.id));
    }
    
    // Return thread with author data merged in and accurate reply count
    return {
      ...thread,
      replyCount: actualReplyCount,
      authorUsername: result.authorUsername,
      authorFirstName: result.authorFirstName,
      authorLastName: result.authorLastName,
    } as ForumThread;
  }
  
  async listForumThreads(filters?: { categorySlug?: string; status?: string; isPinned?: boolean; limit?: number }): Promise<ForumThread[]> {
    let query = db.select().from(forumThreads);
    
    const conditions = [];
    if (filters?.categorySlug) conditions.push(eq(forumThreads.categorySlug, filters.categorySlug));
    if (filters?.status) conditions.push(eq(forumThreads.status, filters.status as any));
    if (filters?.isPinned !== undefined) conditions.push(eq(forumThreads.isPinned, filters.isPinned));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const threads = await query.orderBy(
      desc(forumThreads.isPinned),
      desc(forumThreads.lastActivityAt)
    );
    
    return filters?.limit ? threads.slice(0, filters.limit) : threads;
  }
  
  async updateForumThreadReplyCount(threadId: string, increment: number): Promise<void> {
    await db
      .update(forumThreads)
      .set({ 
        replyCount: sql`${forumThreads.replyCount} + ${increment}` 
      })
      .where(eq(forumThreads.id, threadId));
  }
  
  async updateForumThreadActivity(threadId: string): Promise<void> {
    await db
      .update(forumThreads)
      .set({ lastActivityAt: sql`NOW()` })
      .where(eq(forumThreads.id, threadId));
  }
  
  async createForumReply(insertReply: InsertForumReply): Promise<ForumReply> {
    // Validate before transaction
    const thread = await this.getForumThreadById(insertReply.threadId);
    if (!thread) throw new Error("Thread not found");
    
    const [user] = await db.select().from(users).where(eq(users.id, insertReply.userId));
    if (!user) throw new Error("User not found");
    
    if (insertReply.parentId) {
      const [parent] = await db.select().from(forumReplies).where(eq(forumReplies.id, insertReply.parentId));
      if (!parent) throw new Error("Parent reply not found");
    }
    
    const metaDescription = generateMetaDescription(insertReply.body);
    const tempId = randomUUID();
    const slug = generateReplySlug(thread.title, user.username, tempId);
    
    // Use transaction for atomic multi-step operation
    return await db.transaction(async (tx) => {
      // 1. Create reply record
      const [reply] = await tx.insert(forumReplies).values({
        threadId: insertReply.threadId,
        userId: insertReply.userId,
        parentId: insertReply.parentId || null,
        body: insertReply.body,
        slug,
        metaDescription,
        imageUrls: insertReply.imageUrls || null,
      }).returning();
      
      // 2. Update thread reply count and activity
      await tx.update(forumThreads)
        .set({ 
          replyCount: sql`${forumThreads.replyCount} + 1`,
          lastActivityAt: new Date()
        })
        .where(eq(forumThreads.id, insertReply.threadId));
      
      // 3. Update category stats
      const category = await tx.select().from(forumCategories).where(eq(forumCategories.slug, thread.categorySlug));
      if (category.length > 0) {
        await tx.update(forumCategories)
          .set({ 
            postCount: sql`${forumCategories.postCount} + 1`,
            updatedAt: new Date()
          })
          .where(eq(forumCategories.slug, thread.categorySlug));
      }
      
      // 4. Create activity record
      await tx.insert(activityFeed).values({
        userId: insertReply.userId,
        activityType: "reply_posted",
        entityType: "reply",
        entityId: reply.id,
        title: `Reply to: ${thread.title}`,
        description: metaDescription,
      });
      
      return reply;
    });
  }
  
  async listForumReplies(threadId: string): Promise<ForumReply[]> {
    const results = await db
      .select({
        reply: forumReplies,
        authorUsername: users.username,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
      })
      .from(forumReplies)
      .leftJoin(users, eq(forumReplies.userId, users.id))
      .where(eq(forumReplies.threadId, threadId))
      .orderBy(forumReplies.createdAt);
    
    // Return replies with author data merged in
    return results.map(result => ({
      ...result.reply,
      authorUsername: result.authorUsername,
      authorFirstName: result.authorFirstName,
      authorLastName: result.authorLastName,
    } as ForumReply));
  }
  
  async markReplyAsAccepted(replyId: string): Promise<ForumReply | null> {
    const [reply] = await db.select().from(forumReplies).where(eq(forumReplies.id, replyId));
    if (!reply) return null;
    
    await db
      .update(forumReplies)
      .set({ isAccepted: false })
      .where(eq(forumReplies.threadId, reply.threadId));
    
    await db
      .update(forumReplies)
      .set({ isAccepted: true })
      .where(eq(forumReplies.id, replyId));
    
    const [updatedReply] = await db.select().from(forumReplies).where(eq(forumReplies.id, replyId));
    return updatedReply || null;
  }
  
  async markReplyAsHelpful(replyId: string): Promise<ForumReply | null> {
    await db
      .update(forumReplies)
      .set({ helpful: sql`${forumReplies.helpful} + 1` })
      .where(eq(forumReplies.id, replyId));
    
    const [updatedReply] = await db.select().from(forumReplies).where(eq(forumReplies.id, replyId));
    return updatedReply || null;
  }
  
  async listForumCategories(): Promise<ForumCategory[]> {
    return await db
      .select()
      .from(forumCategories)
      .where(eq(forumCategories.isActive, true))
      .orderBy(forumCategories.sortOrder);
  }
  
  async getForumCategoryBySlug(slug: string): Promise<ForumCategory | undefined> {
    const [category] = await db.select().from(forumCategories).where(eq(forumCategories.slug, slug));
    return category;
  }
  
  async updateCategoryStats(categorySlug: string): Promise<void> {
    const category = await this.getForumCategoryBySlug(categorySlug);
    if (!category) return;
    
    const threads = await db
      .select()
      .from(forumThreads)
      .where(and(
        eq(forumThreads.categorySlug, categorySlug),
        eq(forumThreads.status, "approved")
      ));
    
    const threadCount = threads.length;
    const totalPosts = threads.reduce((sum, t) => sum + t.replyCount, 0);
    
    await db
      .update(forumCategories)
      .set({
        threadCount,
        postCount: totalPosts + threadCount,
        updatedAt: sql`NOW()`,
      })
      .where(eq(forumCategories.slug, categorySlug));
  }
}
