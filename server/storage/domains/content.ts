import { db } from '../../db';
import { eq, sql, and, desc, asc, gt, count } from 'drizzle-orm';
import { 
  content,
  contentPurchases,
  contentReviews,
  contentLikes,
  contentReplies,
  users,
  coinTransactions
} from '@shared/schema';
import type { 
  Content,
  InsertContent,
  ContentPurchase,
  InsertContentPurchase,
  ContentReview,
  InsertContentReview,
  ContentLike,
  InsertContentLike,
  ContentReply,
  InsertContentReply
} from '@shared/schema';
import { applySEOAutomations, generateUniqueSlug } from '../utils';

/**
 * ContentStorage - Handles all content-related database operations
 * Extracted from DrizzleStorage to reduce monolith complexity
 */
export class ContentStorage {
  async createContent(insertContent: InsertContent): Promise<Content> {
    const seo = applySEOAutomations({
      title: insertContent.title,
      description: insertContent.description,
      imageUrls: insertContent.imageUrls || [],
    });

    const existingContent = await db.select({ slug: content.slug }).from(content);
    const existingSlugs = new Set(existingContent.map((c) => c.slug));
    const uniqueSlug = generateUniqueSlug(seo.slug, existingSlugs);

    const [newContent] = await db.insert(content).values({
      authorId: insertContent.authorId,
      type: insertContent.type as "ea" | "indicator" | "article" | "source_code",
      title: insertContent.title,
      description: insertContent.description,
      priceCoins: insertContent.priceCoins,
      isFree: insertContent.isFree ?? (insertContent.priceCoins === 0),
      category: insertContent.category,
      fileUrl: insertContent.fileUrl || null,
      imageUrl: insertContent.imageUrl || null,
      imageUrls: insertContent.imageUrls || null,
      postLogoUrl: insertContent.postLogoUrl || null,
      slug: uniqueSlug,
      focusKeyword: seo.focusKeyword,
      autoMetaDescription: seo.autoMetaDescription,
      autoImageAltTexts: seo.autoImageAltTexts,
    }).returning();

    return newContent;
  }

  async getContent(id: string): Promise<Content | undefined> {
    const [item] = await db.select().from(content).where(eq(content.id, id));
    return item;
  }

  async getContentBySlug(slug: string): Promise<Content | undefined> {
    const [item] = await db.select().from(content).where(eq(content.slug, slug));
    return item;
  }

  async getAllContent(filters?: { type?: string; category?: string; status?: string }): Promise<Content[]> {
    let query = db.select().from(content);
    
    const conditions = [];
    if (filters?.type) conditions.push(eq(content.type, filters.type as any));
    if (filters?.category) conditions.push(eq(content.category, filters.category));
    if (filters?.status) conditions.push(eq(content.status, filters.status as any));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(content.createdAt));
  }

  async getUserContent(userId: string): Promise<Content[]> {
    return await db
      .select()
      .from(content)
      .where(eq(content.authorId, userId))
      .orderBy(desc(content.createdAt));
  }

  async updateContentViews(contentId: string): Promise<void> {
    await db
      .update(content)
      .set({ views: sql`${content.views} + 1` })
      .where(eq(content.id, contentId));
  }

  async updateContentDownloads(contentId: string): Promise<void> {
    await db
      .update(content)
      .set({ downloads: sql`${content.downloads} + 1` })
      .where(eq(content.id, contentId));
  }

  async purchaseContent(contentId: string, buyerId: string, getUserWallet: (userId: string) => Promise<any>, beginLedgerTransaction: (...args: any[]) => Promise<any>): Promise<ContentPurchase> {
    return await db.transaction(async (tx) => {
      // 1. Get content details
      const contentList = await tx.select().from(content).where(eq(content.id, contentId));
      if (contentList.length === 0) throw new Error('Content not found');
      const item = contentList[0];

      // 2. Prevent self-purchase
      if (buyerId === item.authorId) {
        throw new Error('Cannot purchase own content');
      }

      // 3. Check if already purchased
      const alreadyPurchased = await this.hasPurchased(buyerId, contentId);
      if (alreadyPurchased) throw new Error('Already purchased');

      // 4. Handle free content without ledger transaction
      if (item.isFree || item.priceCoins === 0) {
        // Create a zero-value transaction for free content
        const [txRecord] = await tx.insert(coinTransactions).values({
          userId: buyerId,
          type: 'spend',
          amount: 0,
          description: `Free download: ${item.title}`,
          status: 'completed',
        }).returning();

        const [purchase] = await tx.insert(contentPurchases).values({
          contentId,
          buyerId,
          sellerId: item.authorId,
          priceCoins: 0,
          transactionId: txRecord.id,
        }).returning();

        // Update download counter
        await tx.update(content)
          .set({ downloads: sql`${content.downloads} + 1` })
          .where(eq(content.id, contentId));

        return purchase;
      }

      // 5. Get buyer wallet for balance check
      const buyerWallet = await getUserWallet(buyerId);
      if (!buyerWallet) throw new Error('Buyer wallet not found');

      // 6. Validate balance
      if (buyerWallet.balance < item.priceCoins) {
        throw new Error(`Insufficient balance. Need ${item.priceCoins} coins, have ${buyerWallet.balance}`);
      }

      // 7. Calculate amounts (90% to seller, 10% to platform)
      const sellerAmount = Math.floor(item.priceCoins * 0.9);
      const platformAmount = item.priceCoins - sellerAmount;

      // 8. Create balanced ledger transaction
      await beginLedgerTransaction(
        'purchase',
        buyerId,
        [
          {
            userId: buyerId,
            direction: 'debit',
            amount: item.priceCoins,
            memo: `Purchased: ${item.title}`,
          },
          {
            userId: item.authorId,
            direction: 'credit',
            amount: sellerAmount,
            memo: `Sale: ${item.title} (90% of ${item.priceCoins})`,
          },
          {
            userId: 'system',
            direction: 'credit',
            amount: platformAmount,
            memo: `Platform commission: ${item.title} (10%)`,
          },
        ],
        { contentId, buyerId, sellerId: item.authorId, price: item.priceCoins }
      );

      // 9. Create transaction record and purchase record
      const [txRecord] = await tx.insert(coinTransactions).values({
        userId: buyerId,
        type: 'spend',
        amount: item.priceCoins,
        description: `Purchased: ${item.title}`,
        status: 'completed',
      }).returning();

      const [purchase] = await tx.insert(contentPurchases).values({
        contentId,
        buyerId,
        sellerId: item.authorId,
        priceCoins: item.priceCoins,
        transactionId: txRecord.id,
      }).returning();

      // 10. Update download counter
      await tx.update(content)
        .set({ downloads: sql`${content.downloads} + 1` })
        .where(eq(content.id, contentId));

      return purchase;
    });
  }

  async getUserPurchases(userId: string): Promise<ContentPurchase[]> {
    return await db
      .select()
      .from(contentPurchases)
      .where(eq(contentPurchases.buyerId, userId))
      .orderBy(desc(contentPurchases.purchasedAt));
  }

  async hasPurchased(userId: string, contentId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(contentPurchases)
      .where(and(
        eq(contentPurchases.buyerId, userId),
        eq(contentPurchases.contentId, contentId)
      ))
      .limit(1);
    return !!result;
  }

  async createReview(insertReview: InsertContentReview): Promise<ContentReview> {
    const item = await this.getContent(insertReview.contentId);
    if (!item) throw new Error("Content not found");

    const [user] = await db.select().from(users).where(eq(users.id, insertReview.userId));
    if (!user) throw new Error("User not found");

    const [review] = await db.insert(contentReviews).values(insertReview).returning();
    return review;
  }

  async getContentReviews(contentId: string): Promise<ContentReview[]> {
    return await db
      .select()
      .from(contentReviews)
      .where(and(
        eq(contentReviews.contentId, contentId),
        eq(contentReviews.status, "approved")
      ))
      .orderBy(desc(contentReviews.createdAt));
  }

  async getUserReviewCount(userId: string): Promise<number> {
    // Count content reviews only (broker reviews handled by fallback)
    const contentReviewCount = await db
      .select({ count: count() })
      .from(contentReviews)
      .where(eq(contentReviews.userId, userId));
    
    return (contentReviewCount[0]?.count || 0);
  }

  async likeContent(insertLike: InsertContentLike): Promise<ContentLike | null> {
    // Validate before transaction
    const item = await this.getContent(insertLike.contentId);
    if (!item) throw new Error("Content not found");

    const [user] = await db.select().from(users).where(eq(users.id, insertLike.userId));
    if (!user) throw new Error("User not found");

    const alreadyLiked = await this.hasLiked(insertLike.userId, insertLike.contentId);
    if (alreadyLiked) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLikes = await db
      .select()
      .from(contentLikes)
      .where(and(
        eq(contentLikes.userId, insertLike.userId),
        sql`${contentLikes.createdAt} >= ${today}`
      ));

    if (todayLikes.length >= 5) {
      throw new Error("Daily like limit reached (5 per day)");
    }

    // Use transaction for atomic multi-step operation
    return await db.transaction(async (tx) => {
      // 1. Create like record
      const [like] = await tx.insert(contentLikes).values(insertLike).returning();

      // 2. Update content likes counter
      await tx.update(content)
        .set({ likes: sql`${content.likes} + 1` })
        .where(eq(content.id, insertLike.contentId));

      // 3. Create coin transaction for reward
      await tx.insert(coinTransactions).values({
        userId: insertLike.userId,
        type: "earn",
        amount: 1,
        description: `Liked: ${item.title}`,
        status: "completed",
      });

      // 4. Update user coins
      await tx.update(users)
        .set({ 
          totalCoins: sql`${users.totalCoins} + 1`,
          level: sql`FLOOR((${users.totalCoins} + 1) / 1000)`,
          weeklyEarned: sql`${users.weeklyEarned} + 1`
        })
        .where(eq(users.id, insertLike.userId));

      return like;
    });
  }

  async hasLiked(userId: string, contentId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(contentLikes)
      .where(and(
        eq(contentLikes.userId, userId),
        eq(contentLikes.contentId, contentId)
      ))
      .limit(1);
    return !!result;
  }

  async createReply(insertReply: InsertContentReply): Promise<ContentReply> {
    const item = await this.getContent(insertReply.contentId);
    if (!item) throw new Error("Content not found");

    const [user] = await db.select().from(users).where(eq(users.id, insertReply.userId));
    if (!user) throw new Error("User not found");

    if (insertReply.parentId) {
      const [parent] = await db.select().from(contentReplies).where(eq(contentReplies.id, insertReply.parentId));
      if (!parent) throw new Error("Parent reply not found");
    }

    const [reply] = await db.insert(contentReplies).values(insertReply).returning();
    return reply;
  }

  async getContentReplies(contentId: string): Promise<ContentReply[]> {
    return await db
      .select()
      .from(contentReplies)
      .where(eq(contentReplies.contentId, contentId))
      .orderBy(contentReplies.createdAt);
  }

  async updateReplyHelpful(replyId: string): Promise<void> {
    await db
      .update(contentReplies)
      .set({ helpful: sql`${contentReplies.helpful} + 1` })
      .where(eq(contentReplies.id, replyId));
  }
}
